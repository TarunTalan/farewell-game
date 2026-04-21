import Phaser from 'phaser'
import { W, H, GROUND_Y, LEVEL_WIDTH, PLAYER_SPEED, JUMP_VEL, DMG_COOLDOWN } from '../constants.js'
import { PALETTES } from '../palettes.js'
import { gameState } from '../data/GameState.js'
import { SENIORS } from '../data/seniors.js'
import { YEAR_ENEMIES } from '../enemyConfig.js'
import { POWERUPS } from '../powerupConfig.js'
import { ZONE_LABELS, PLATFORM_CONFIGS, generateEnemyPositions, PICKUP_POSITIONS } from '../gameUtils.js'

// ─────────────────────────────────────────────────────────────────────────────
// GameScene.js — Mobile-first | Landscape | 3 Phases + Boss | Max Graphics
// ─────────────────────────────────────────────────────────────────────────────

// ── Persistent cross-level state ──────────────────────────────────────────────
const GS = {
  health: 100,
  maxHealth: 100,
  score: 0,
  cgpa: 10.0,
  year: 0,
  totalKills: 0,
  powerupType: null,
  powerupTimer: 0,
  hasResumeBoost: false,
}
const GROUND_Y_FRAC = GROUND_Y / H

const YEAR_VARIANTS = [
  {
    enemyCount: 10,
    pickupXs: [480, 950, 1430, 1910, 2380],
    powerupX: 750,
    speedMul: 1.0,
    movingPlatforms: false,
    surgeEvery: 0,
    surgeMul: 1.0,
  },
  {
    enemyCount: 12,
    pickupXs: [430, 870, 1320, 1770, 2230, 2670],
    powerupX: 980,
    speedMul: 1.05,
    movingPlatforms: true,
    surgeEvery: 0,
    surgeMul: 1.0,
  },
  {
    enemyCount: 13,
    pickupXs: [460, 910, 1360, 1810, 2260, 2700],
    powerupX: 1310,
    speedMul: 1.12,
    movingPlatforms: false,
    surgeEvery: 7000,
    surgeMul: 1.25,
  },
  {
    enemyCount: 15,
    pickupXs: [420, 760, 1110, 1490, 1890, 2290, 2690],
    powerupX: 1590,
    speedMul: 1.18,
    movingPlatforms: true,
    surgeEvery: 5200,
    surgeMul: 1.35,
  },
]

// ── Boss config ───────────────────────────────────────────────────────────────
const BOSS_CFG = {
  hp: 25, w: 80, h: 80,
  phases: [
    { threshold: 1.0,  color: 0xff2222, speed: 55,  shootInterval: 3200, shots: 1 },
    { threshold: 0.65, color: 0xff6600, speed: 80,  shootInterval: 2200, shots: 2 },
    { threshold: 0.35, color: 0xffcc00, speed: 105, shootInterval: 1200, shots: 3 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Texture factory — called once per scene create
// ─────────────────────────────────────────────────────────────────────────────
function buildTextures(scene) {
  const make = (key, w, h, fn) => {
    if (scene.textures.exists(key)) scene.textures.remove(key)
    const g = scene.make.graphics({ add: false })
    fn(g)
    g.generateTexture(key, w, h)
    g.destroy()
  }

  // ── Player ────────────────────────────────────────────────────────────────
  make('player', 32, 48, g => {
    // Shadow
    g.fillStyle(0x000000, 0.25); g.fillEllipse(16, 46, 24, 6)
    // Legs
    g.fillStyle(0x1a1a4a); g.fillRoundedRect(7, 34, 8, 12, 2); g.fillRoundedRect(17, 34, 8, 12, 2)
    // Shoes
    g.fillStyle(0xeeeeee); g.fillRoundedRect(5, 43, 10, 5, 2); g.fillRoundedRect(17, 43, 10, 5, 2)
    g.fillStyle(0x4466ff, 0.6); g.fillRect(5, 45, 10, 1); g.fillRect(17, 45, 10, 1)
    // Body (hoodie)
    g.fillStyle(0x2255cc); g.fillRoundedRect(5, 18, 22, 18, 4)
    g.fillStyle(0x1a44aa, 0.6); g.fillRoundedRect(5, 18, 8, 18, 4) // shadow side
    g.fillStyle(0x4477ee, 0.4); g.fillRect(15, 20, 2, 14) // zipper
    // Hoodie strings
    g.fillStyle(0xffffff, 0.3); g.fillRect(14, 18, 1, 6); g.fillRect(17, 18, 1, 6)
    // Backpack
    g.fillStyle(0x8B4513); g.fillRoundedRect(0, 16, 7, 16, 3)
    g.fillStyle(0x654321); g.fillRoundedRect(1, 17, 5, 14, 2)
    g.fillStyle(0xDAA520); g.fillRect(2, 20, 3, 2) // buckle
    // Arms
    g.fillStyle(0x2255cc); g.fillRoundedRect(1, 20, 6, 12, 2); g.fillRoundedRect(25, 20, 6, 12, 2)
    // Hands
    g.fillStyle(0xd4905a); g.fillCircle(4, 33, 3); g.fillCircle(28, 33, 3)
    // Neck
    g.fillStyle(0xd4905a); g.fillRect(13, 14, 6, 6)
    // Head
    g.fillStyle(0xe8a870); g.fillRoundedRect(7, 2, 18, 16, 4)
    // Head shadow
    g.fillStyle(0xc4885a, 0.4); g.fillRoundedRect(7, 2, 7, 16, 4)
    // Hair
    g.fillStyle(0x1a0a00); g.fillEllipse(16, 3, 20, 10)
    g.fillRect(7, 2, 5, 8) // side hair
    // Eyes
    g.fillStyle(0xffffff); g.fillRoundedRect(10, 8, 5, 4, 1); g.fillRoundedRect(17, 8, 5, 4, 1)
    g.fillStyle(0x1a1a1a); g.fillCircle(12, 10, 1.5); g.fillCircle(19, 10, 1.5)
    g.fillStyle(0xffffff, 0.9); g.fillCircle(13, 9, 0.8); g.fillCircle(20, 9, 0.8)
    // Glasses
    g.lineStyle(1.5, 0x333355, 0.8)
    g.strokeRoundedRect(9, 7, 6, 5, 1); g.strokeRoundedRect(17, 7, 6, 5, 1)
    g.lineBetween(15, 9, 17, 9)
    // Nose + mouth
    g.fillStyle(0xc4885a, 0.5); g.fillRect(14, 12, 3, 2)
    g.fillStyle(0x8b3a1a, 0.6); g.fillRect(13, 15, 6, 1)
    // Cheek blush
    g.fillStyle(0xff8888, 0.15); g.fillCircle(10, 13, 3); g.fillCircle(22, 13, 3)
  })

  make('player_jump', 32, 48, g => {
    // Shadow (smaller when jumping)
    g.fillStyle(0x000000, 0.15); g.fillEllipse(16, 46, 16, 4)
    // Legs (bent)
    g.fillStyle(0x1a1a4a); g.fillRoundedRect(5, 36, 8, 10, 2); g.fillRoundedRect(19, 36, 8, 10, 2)
    // Shoes
    g.fillStyle(0xeeeeee); g.fillRoundedRect(4, 43, 10, 5, 2); g.fillRoundedRect(18, 43, 10, 5, 2)
    g.fillStyle(0x4466ff, 0.6); g.fillRect(4, 45, 10, 1); g.fillRect(18, 45, 10, 1)
    // Body (hoodie)
    g.fillStyle(0x2255cc); g.fillRoundedRect(5, 18, 22, 18, 4)
    g.fillStyle(0x1a44aa, 0.6); g.fillRoundedRect(5, 18, 8, 18, 4)
    g.fillStyle(0x4477ee, 0.4); g.fillRect(15, 20, 2, 14)
    // Backpack
    g.fillStyle(0x8B4513); g.fillRoundedRect(0, 16, 7, 16, 3)
    g.fillStyle(0x654321); g.fillRoundedRect(1, 17, 5, 14, 2)
    g.fillStyle(0xDAA520); g.fillRect(2, 20, 3, 2)
    // Arms (raised for jump)
    g.fillStyle(0x2255cc); g.fillRoundedRect(0, 14, 6, 14, 2); g.fillRoundedRect(26, 14, 6, 14, 2)
    // Hands (up)
    g.fillStyle(0xd4905a); g.fillCircle(3, 14, 3); g.fillCircle(29, 14, 3)
    // Neck
    g.fillStyle(0xd4905a); g.fillRect(13, 14, 6, 6)
    // Head
    g.fillStyle(0xe8a870); g.fillRoundedRect(7, 2, 18, 16, 4)
    g.fillStyle(0xc4885a, 0.4); g.fillRoundedRect(7, 2, 7, 16, 4)
    // Hair (flowing up from jump)
    g.fillStyle(0x1a0a00); g.fillEllipse(16, 1, 22, 10)
    g.fillRect(7, 1, 5, 7)
    // Eyes (excited - bigger)
    g.fillStyle(0xffffff); g.fillRoundedRect(10, 7, 5, 5, 1); g.fillRoundedRect(17, 7, 5, 5, 1)
    g.fillStyle(0x1a1a1a); g.fillCircle(12, 9, 1.5); g.fillCircle(19, 9, 1.5)
    g.fillStyle(0xffffff, 0.9); g.fillCircle(13, 8, 0.8); g.fillCircle(20, 8, 0.8)
    // Glasses
    g.lineStyle(1.5, 0x333355, 0.8)
    g.strokeRoundedRect(9, 6, 6, 6, 1); g.strokeRoundedRect(17, 6, 6, 6, 1)
    g.lineBetween(15, 9, 17, 9)
    // Mouth (open smile)
    g.fillStyle(0x8b3a1a); g.fillRoundedRect(12, 14, 8, 3, 1)
    g.fillStyle(0xffffff, 0.5); g.fillRect(14, 14, 4, 1) // teeth
  })

  // ── Ground tile ───────────────────────────────────────────────────────────
  make('ground', 32, 20, g => {
    g.fillStyle(0x334455); g.fillRect(0, 0, 32, 20)
    g.fillStyle(0x4466aa, 0.6); g.fillRect(0, 0, 32, 3)          // top glow edge
    g.fillStyle(0x2a3a48); g.fillRect(1, 5, 30, 1); g.fillRect(1, 11, 30, 1)
    g.fillStyle(0x1e2e3a); g.fillRect(0, 16, 32, 4)
    g.fillStyle(0x55779a, 0.3)
    for (let i = 0; i < 32; i += 8) { g.fillRect(i, 0, 4, 20) }
  })

  // ── Platform ──────────────────────────────────────────────────────────────
  make('platform', 96, 14, g => {
    g.fillStyle(0x445566); g.fillRect(0, 0, 96, 14)
    g.fillStyle(0x6688bb, 0.7); g.fillRect(3, 0, 90, 3)   // top highlight
    g.fillStyle(0x223344); g.fillRect(0, 10, 96, 4)
    g.fillStyle(0x334455); g.fillRect(0, 0, 4, 14); g.fillRect(92, 0, 4, 14)
  })

  // ── Pickup star ───────────────────────────────────────────────────────────
  make('pickup', 28, 28, g => {
    const pts = []
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? 13 : 6
      pts.push(new Phaser.Geom.Point(14 + Math.cos(a) * r, 14 + Math.sin(a) * r))
    }
    g.fillStyle(0xffdd00); g.fillPoints(pts, true)
    g.fillStyle(0xffffff, 0.5); g.fillCircle(14, 14, 4)
  })

  // ── HP pickup cross ───────────────────────────────────────────────────────
  make('pickup_hp', 28, 28, g => {
    g.fillStyle(0xff3333); g.fillRect(11, 3, 6, 22); g.fillRect(3, 11, 22, 6)
    g.fillStyle(0xffffff, 0.6); g.fillRect(13, 5, 2, 18); g.fillRect(5, 13, 18, 2)
  })

  // ── Powerup orb ───────────────────────────────────────────────────────────
  make('powerup', 32, 32, g => {
    g.fillStyle(0x0088ff, 0.25); g.fillCircle(16, 16, 16)
    g.fillStyle(0x0077ee); g.fillCircle(16, 16, 12)
    g.fillStyle(0x44aaff, 0.85); g.fillCircle(14, 13, 8)
    g.fillStyle(0xffffff, 0.7); g.fillCircle(12, 11, 4)
    g.fillStyle(0xffffff, 0.9); g.fillCircle(11, 10, 2)
  })

  // ── Projectile ────────────────────────────────────────────────────────────
  make('projectile', 16, 10, g => {
    g.fillStyle(0xff0000, 0.3); g.fillEllipse(8, 5, 18, 10)
    g.fillStyle(0xff3300); g.fillCircle(8, 5, 5)
    g.fillStyle(0xffbb44, 0.95); g.fillCircle(8, 5, 2)
    g.fillStyle(0xffffff, 0.8); g.fillCircle(7, 4, 1)
  })

  make('boss_proj', 18, 18, g => {
    g.fillStyle(0xff0000, 0.3); g.fillCircle(9, 9, 9)
    g.fillStyle(0xff2200); g.fillCircle(9, 9, 7)
    g.fillStyle(0xff8800, 0.9); g.fillCircle(9, 9, 4)
    g.fillStyle(0xffff00, 0.95); g.fillCircle(9, 9, 2)
  })

  // ── Particle ──────────────────────────────────────────────────────────────
  make('particle', 8, 8, g => {
    g.fillStyle(0xffffff); g.fillCircle(4, 4, 4)
  })

  // ── Boss sprite ───────────────────────────────────────────────────────────
  make('boss', 80, 88, g => {
    // body suit
    g.fillStyle(0x111111); g.fillRect(10, 26, 60, 50)
    g.fillStyle(0xdd0000); g.fillRect(36, 26, 8, 32)  // tie
    g.fillStyle(0x880000); g.fillRect(38, 36, 4, 18)
    // head
    g.fillStyle(0xffcc88); g.fillRect(16, 5, 48, 22)
    g.fillStyle(0x111111); g.fillRect(16, 5, 48, 6)   // hair
    // eyes
    g.fillStyle(0xff0000); g.fillRect(21, 13, 10, 7); g.fillRect(49, 13, 10, 7)
    g.fillStyle(0x000000); g.fillRect(24, 14, 4, 5);  g.fillRect(52, 14, 4, 5)
    // brows
    g.fillStyle(0x111111); g.fillRect(19, 11, 14, 3); g.fillRect(47, 11, 14, 3)
    // mouth
    g.fillStyle(0x222222); g.fillRect(25, 22, 30, 3)
    g.fillStyle(0xffffff); g.fillRect(26, 22, 4, 2); g.fillRect(31, 22, 4, 2)
    g.fillRect(36, 22, 4, 2); g.fillRect(41, 22, 4, 2)
    // hands
    g.fillStyle(0xffcc88); g.fillRect(0, 60, 12, 8); g.fillRect(68, 60, 12, 8)
    // arms
    g.fillStyle(0x111111); g.fillRect(0, 30, 12, 35); g.fillRect(68, 30, 12, 35)
    // legs
    g.fillStyle(0x111111); g.fillRect(10, 74, 24, 12); g.fillRect(46, 74, 24, 12)
    g.fillStyle(0x000000); g.fillRect(8, 82, 28, 6);  g.fillRect(44, 82, 28, 6)
  })

  // ── Enemy sprites (per year × variant) — MONSTERS not students ─────────
  for (let y = 0; y < YEAR_ENEMIES.length; y++) {
    YEAR_ENEMIES[y].forEach((cfg, j) => {
      const s = cfg.w
      const hs = Math.floor(s / 2)
      make(`enemy_${y}_${j}`, s + 8, s + 8, g => {
        const c = cfg.color

        if (y === 0) {
          // Year 1: Ghost skulls — floating spooky shapes
          g.fillStyle(c, 0.2); g.fillCircle(hs+4, hs+4, hs+3) // aura
          g.fillStyle(c); g.fillCircle(hs+4, hs+2, hs) // head
          g.fillStyle(Phaser.Display.Color.ValueToColor(c).darken(30).color, 0.6)
          g.fillCircle(hs+4, hs+5, hs-2) // shadow
          // Wavy bottom (ghostly)
          for (let i = 0; i < 4; i++) {
            g.fillStyle(c, 0.8)
            g.fillCircle(2 + i * (s/3.5), s+2, 4)
          }
          // Eyes — glowing red
          g.fillStyle(0xff0000); g.fillCircle(hs-1, hs, 3); g.fillCircle(hs+9, hs, 3)
          g.fillStyle(0xff4444, 0.6); g.fillCircle(hs-1, hs, 5); g.fillCircle(hs+9, hs, 5)
          g.fillStyle(0xffffff); g.fillCircle(hs, hs-1, 1); g.fillCircle(hs+10, hs-1, 1)
          // Mouth
          g.fillStyle(0x000000); g.fillRect(hs-2, hs+5, 12, 3)
          g.fillStyle(0xffffff)
          for (let t = 0; t < 3; t++) g.fillTriangle(hs-1+t*4, hs+5, hs+1+t*4, hs+8, hs+3+t*4, hs+5)
        } else if (y === 1) {
          // Year 2: Glitch bugs — digital creatures with static
          g.fillStyle(c, 0.15); g.fillRect(0, 0, s+8, s+8) // glitch field
          g.fillStyle(c); g.fillRoundedRect(2, 2, s+4, s+4, 4) // body
          g.fillStyle(Phaser.Display.Color.ValueToColor(c).darken(40).color)
          g.fillRoundedRect(2, 2, s+4, Math.floor(s/2), 4) // head section
          // Antennae
          g.lineStyle(2, c); g.lineBetween(hs-2, 2, hs-6, -4); g.lineBetween(hs+6, 2, hs+10, -4)
          g.fillStyle(0xff0000); g.fillCircle(hs-6, -4, 2); g.fillCircle(hs+10, -4, 2)
          // Eyes — red LED
          g.fillStyle(0x000000); g.fillRect(hs-4, hs-2, 6, 5); g.fillRect(hs+4, hs-2, 6, 5)
          g.fillStyle(0xff0000); g.fillRect(hs-3, hs-1, 4, 3); g.fillRect(hs+5, hs-1, 4, 3)
          g.fillStyle(0xffaa00, 0.8); g.fillRect(hs-2, hs-1, 2, 1); g.fillRect(hs+6, hs-1, 2, 1)
          // Jagged mouth
          g.fillStyle(0x000000); g.fillRect(hs-4, hs+6, 14, 4)
          g.fillStyle(0x00ff00)
          for (let t = 0; t < 4; t++) g.fillRect(hs-3+t*3, hs+6, 2, 2)
          // Glitch lines
          g.fillStyle(0xffffff, 0.3)
          g.fillRect(2, hs+1, s+4, 1); g.fillRect(2, hs+3, s+4, 1)
          // Legs
          g.fillStyle(c); g.fillRect(hs-4, s+3, 3, 5); g.fillRect(hs+5, s+3, 3, 5)
        } else if (y === 2) {
          // Year 3: Fire demons — horned burning creatures
          g.fillStyle(0xff4400, 0.15); g.fillCircle(hs+4, hs+4, hs+4) // fire aura
          g.fillStyle(c); g.fillRoundedRect(2, 6, s+4, s, 5) // body
          g.fillStyle(Phaser.Display.Color.ValueToColor(c).darken(30).color)
          g.fillRoundedRect(2, s-2, s+4, 8, 3) // lower body
          // Horns
          g.fillStyle(0x440000)
          g.fillTriangle(hs-2, 6, hs-6, -6, hs+2, 6) // left horn
          g.fillTriangle(hs+6, 6, hs+10, -6, hs+2, 6) // right horn
          g.fillStyle(0x880000, 0.6)
          g.fillTriangle(hs-1, 6, hs-4, -2, hs+1, 6)
          g.fillTriangle(hs+5, 6, hs+8, -2, hs+3, 6)
          // Eyes — burning yellow-red
          g.fillStyle(0xffaa00); g.fillCircle(hs-2, hs+2, 4); g.fillCircle(hs+8, hs+2, 4)
          g.fillStyle(0xff0000); g.fillCircle(hs-2, hs+2, 2); g.fillCircle(hs+8, hs+2, 2)
          g.fillStyle(0xffffff, 0.8); g.fillCircle(hs-1, hs+1, 1); g.fillCircle(hs+9, hs+1, 1)
          // Mouth with fangs
          g.fillStyle(0x220000); g.fillRect(hs-4, hs+8, 14, 5)
          g.fillStyle(0xffffff)
          g.fillTriangle(hs-3, hs+8, hs-1, hs+12, hs+1, hs+8) // fang L
          g.fillTriangle(hs+5, hs+8, hs+7, hs+12, hs+9, hs+8) // fang R
          // Flame wisps on top
          g.fillStyle(0xff6600, 0.5); g.fillCircle(hs, 4, 3); g.fillCircle(hs+6, 3, 2)
          g.fillStyle(0xffcc00, 0.4); g.fillCircle(hs+3, 2, 2)
        } else {
          // Year 4: Golden memory wisps (peaceful)
          g.fillStyle(c, 0.2); g.fillCircle(hs+4, hs+4, hs+3)
          g.fillStyle(c, 0.7); g.fillCircle(hs+4, hs+4, hs)
          g.fillStyle(0xffffff, 0.4); g.fillCircle(hs+2, hs+2, hs-3)
          g.fillStyle(0xffffff, 0.7); g.fillCircle(hs+2, hs, 2)
        }
      })
    })
  }

  // ── Backgrounds per year ──────────────────────────────────────────────────
  for (let y = 0; y < 4; y++) {
    const pal = PALETTES[y]
    make(`bg_${y}`, 480, 270, g => {
      // Sky gradient approximated with bands
      const bands = 12
      for (let i = 0; i < bands; i++) {
        const t = i / bands
        const skyR = ((pal.sky >> 16) & 0xff)
        const skyG = ((pal.sky >>  8) & 0xff)
        const skyB = ( pal.sky        & 0xff)
        const midR = ((pal.mid >> 16) & 0xff)
        const midG = ((pal.mid >>  8) & 0xff)
        const midB = ( pal.mid        & 0xff)
        const r = Math.round(skyR + (midR - skyR) * t)
        const gr = Math.round(skyG + (midG - skyG) * t)
        const b = Math.round(skyB + (midB - skyB) * t)
        const col = (r << 16) | (gr << 8) | b
        g.fillStyle(col); g.fillRect(0, i * (270 / bands), 480, 270 / bands + 1)
      }

      // Year-specific scenery
      if (y === 0) {
        // Stars + city silhouette
        g.fillStyle(0xffffff, 0.7)
        for (let i = 0; i < 50; i++) {
          g.fillRect((Math.random() * 460) | 0, (Math.random() * 100) | 0, 1, 1)
        }
        // Moon
        g.fillStyle(0xeeeebb); g.fillCircle(400, 30, 18)
        g.fillStyle(pal.sky); g.fillCircle(406, 26, 14)
        // Buildings
        g.fillStyle(pal.fog)
        const blds = [[0,55,35,215],[40,68,30,202],[80,52,25,218],[115,65,40,205],[165,45,30,225],[205,58,35,212],[250,48,28,222],[290,62,32,208],[335,40,38,230],[385,55,30,215],[425,62,50,208]]
        blds.forEach(([x,y2,w,h]) => g.fillRect(x, y2, w, h))
        // Windows
        g.fillStyle(0xffee88, 0.4)
        blds.forEach(([x,y2,w]) => {
          for(let wy=y2+4;wy<200;wy+=12){
            for(let wx=x+4;wx<x+w-4;wx+=8){
              if(Math.random()>0.4) g.fillRect(wx,wy,5,7)
            }
          }
        })
      } else if (y === 1) {
        // Matrix rain effect
        g.lineStyle(1, 0x003300, 0.5)
        for (let i = 0; i < 480; i += 20) g.lineBetween(i, 0, i, 270)
        for (let i = 0; i < 270; i += 20) g.lineBetween(0, i, 480, i)
        g.fillStyle(0x00ff00, 0.05); g.fillRect(0, 0, 480, 270)
        // Buildings
        g.fillStyle(0x061806)
        ;[[0,62,40],[45,70,30],[85,55,35],[130,68,28],[170,48,40],[220,60,32],[262,52,38],[310,65,30],[350,44,45],[405,58,30],[445,65,35]].forEach(([x,y2,w]) => g.fillRect(x,y2,w,270))
        // Green glows on screens
        g.fillStyle(0x003300)
        ;[[5,40,28,18],[50,45,22,15],[92,38,26,16],[135,42,20,14]].forEach(([x,y2,w,h]) => g.fillRect(x,y2,w,h))
        g.fillStyle(0x00ff00, 0.25)
        ;[[6,41,26,16],[51,46,20,13],[93,39,24,14],[136,43,18,12]].forEach(([x,y2,w,h]) => g.fillRect(x,y2,w,h))
      } else if (y === 2) {
        // Sunset + fire city
        g.fillStyle(0xff6600, 0.5); g.fillCircle(240, 135, 50)
        g.fillStyle(0xffaa00, 0.25); g.fillCircle(240, 135, 75)
        g.fillStyle(0x1a0d00)
        ;[[0,55,25],[30,50,20],[60,62,28],[100,45,22],[135,55,32],[180,42,25],[220,58,30],[265,48,28],[305,60,22],[340,42,35],[385,54,25],[420,60,55]].forEach(([x,y2,w]) => g.fillRect(x,y2,w,270))
        g.fillStyle(0xff4400, 0.6)
        g.fillCircle(12, 53, 6); g.fillCircle(48, 48, 5); g.fillCircle(350, 40, 7)
        g.lineStyle(2, 0x1a0d00)
        g.lineBetween(80, 50, 80, 20); g.lineBetween(80, 20, 120, 20); g.lineBetween(120, 20, 120, 40)
      } else {
        // Year 4: Golden sunset campus
        g.fillStyle(0xffcc44, 0.3); g.fillCircle(380, 100, 60)
        g.fillStyle(0xffaa22, 0.5); g.fillCircle(380, 100, 35)
        g.fillStyle(0xffdd66, 0.8); g.fillCircle(380, 100, 18)
        g.fillStyle(0xffddaa, 0.15)
        g.fillEllipse(100, 40, 120, 30); g.fillEllipse(300, 55, 90, 25)
        g.fillStyle(0x1a0800)
        ;[[20,70],[80,60],[160,65],[260,55],[350,68],[430,58]].forEach(([tx,ty]) => {
          g.fillCircle(tx, ty, 22); g.fillRect(tx-3, ty, 6, 270-ty)
        })
        g.fillStyle(0x1a0a00)
        g.fillRect(100, 80, 60, 190); g.fillRect(200, 75, 80, 195); g.fillRect(320, 85, 50, 185)
        g.fillStyle(0xffcc66, 0.3)
        for(let wx2=105;wx2<155;wx2+=10) for(let wy2=85;wy2<200;wy2+=14) g.fillRect(wx2,wy2,6,8)
        g.fillStyle(0xff8844, 0.2)
        for(let i2=0;i2<30;i2++) g.fillCircle(Math.random()*480, 210+Math.random()*60, 2)
      }
    })
  }

  // ── SI-Lab exit door (year 2 only) ────────────────────────────────────────
  make('exit_door', 60, 90, g => {
    g.fillStyle(0x1a3a5a); g.fillRect(0, 0, 60, 90)
    g.fillStyle(0x2255aa); g.fillRect(4, 4, 52, 82)
    g.lineStyle(3, 0x44aaff); g.strokeRect(12, 25, 36, 65)
    g.fillStyle(0x44aaff, 0.25); g.fillRect(13, 26, 34, 63)
    g.fillStyle(0x00ffff); g.fillRect(16, 8, 28, 12)
    g.fillStyle(0x001133); g.fillRect(18, 10, 24, 8)
    g.fillStyle(0xffcc00); g.fillCircle(44, 58, 3)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Support Scenes
// ─────────────────────────────────────────────────────────────────────────────

class YearTransitionScene extends Phaser.Scene {
  constructor() { super('YearTransition') }

  init(data) {
    this.nextYear  = data.year
    this.prevScore = data.score
  }

  create() {
    const W   = this.scale.width
    const H   = this.scale.height
    const pal = PALETTES[Math.min(this.nextYear, PALETTES.length - 1)]

    const yearTitles = [
      ['YEAR 1', 'FRESHMAN CONFUSION', 'You arrive with dreams, a bag,\nand zero idea what you\'re doing.', '#5b8cff'],
      ['YEAR 2', 'LAB HELL',           'The VMs crash. The viva examiner\nhas never smiled in their life.',   '#39ff14'],
      ['YEAR 3', 'PROJECT PANIC',      'Three deadlines. One missing teammate.\nThe boss awaits at the end.',   '#ff8800'],
      ['YEAR 4', 'THE FINAL WALK',     'No more exams. No more deadlines.\nJust memories... and the SI Lab gate.', '#ffdd66'],
    ]

    const [yearLabel, subtitle, desc, col] = yearTitles[Math.min(this.nextYear, 3)]

    // BG
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
    this.add.rectangle(W / 2, H / 2, W, H, pal.sky, 0.75)

    // Particle rain
    const ptimer = this.time.addEvent({
      delay: 80, loop: true,
      callback: () => {
        const p = this.add.circle(
          Phaser.Math.Between(0, W),
          0,
          Phaser.Math.Between(1, 3),
          pal.accent,
          Phaser.Math.FloatBetween(0.3, 0.8)
        )
        this.tweens.add({ targets: p, y: H + 10, alpha: 0, duration: Phaser.Math.Between(1200, 2400), onComplete: () => p.destroy() })
      }
    })

    const fs = n => Math.floor(W / n)

    const yearTxt = this.add.text(W / 2, H / 2 - H * 0.28, yearLabel, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${fs(8)}px`,
      color: col, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0)

    const subTxt = this.add.text(W / 2, H / 2 - H * 0.10, subtitle, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${fs(18)}px`,
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0)

    const descTxt = this.add.text(W / 2, H / 2 + H * 0.08, desc, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${fs(36)}px`,
      color: '#aaaaaa', align: 'center',
    }).setOrigin(0.5).setAlpha(0)

    this.add.text(W / 2, H / 2 + H * 0.30, `score so far: ${this.prevScore}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${fs(50)}px`,
      color: '#555577',
    }).setOrigin(0.5)

    ;[yearTxt, subTxt, descTxt].forEach((item, i) => {
      this.tweens.add({ targets: item, alpha: 1, delay: i * 280, duration: 420 })
    })

    this.time.delayedCall(3200, () => {
      ptimer.remove()
      this.scene.stop('GameScene')
      this.scene.start('GameScene', { year: this.nextYear })
      this.scene.stop()
    })
  }
}

class EndingScene extends Phaser.Scene {
  constructor() { super('BTechEnding') }

  create() {
    this._step  = 0
    this._cards = this._buildCards()
    this._showCard()
  }

  _buildCards() {
    const W = this.scale.width
    const H = this.scale.height
    const fs = n => `${Math.floor(W / n)}px`

    return [
      () => {
        this.add.rectangle(W/2, H/2, W, H, 0x050510)
        // Confetti
        for (let i = 0; i < 60; i++) {
          const colors = [0xffcc00, 0xff6600, 0x44aaff, 0xff44aa, 0x44ff88]
          const dot = this.add.rectangle(
            Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0),
            Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10),
            Phaser.Utils.Array.GetRandom(colors), 0.8
          )
          this.tweens.add({ targets: dot, y: H + 20, duration: Phaser.Math.Between(1500, 3500), delay: Phaser.Math.Between(0, 1500), repeat: -1 })
        }
        this.add.text(W/2, H*0.18, 'CONVOCATION DAY', { fontFamily: '"Nunito",sans-serif', fontSize: fs(18), color: '#ffdd88', stroke: '#221100', strokeThickness: 2 }).setOrigin(0.5)
        this.add.text(W/2, H*0.34, 'Four years ago you arrived\nwith a dream and a hostel key.', { fontFamily: '"Nunito",sans-serif', fontSize: fs(38), color: '#aa9977', align: 'center' }).setOrigin(0.5)
        this.add.text(W/2, H*0.58, 'Today you walk out a\nBachelor of Technology.', { fontFamily: '"Nunito",sans-serif', fontSize: fs(32), color: '#ccbbaa', align: 'center' }).setOrigin(0.5)
      },
      () => {
        this.add.rectangle(W/2, H/2, W, H, 0x000000)
        const cert = this.add.rectangle(W/2, H/2, W*0.78, H*0.82, 0xfff8e8)
        cert.setStrokeStyle(4, 0xaa8800)
        const i2 = this.add.rectangle(W/2, H/2, W*0.72, H*0.74, 0xfff8e8)
        i2.setStrokeStyle(1, 0xcc9900)
        this.add.text(W/2, H*0.16, 'BACHELOR OF TECHNOLOGY', { fontFamily: '"Nunito",sans-serif', fontSize: fs(30), color: '#553300' }).setOrigin(0.5)
        this.add.text(W/2, H*0.30, 'This certifies that', { fontFamily: '"Nunito",sans-serif', fontSize: fs(50), color: '#887755' }).setOrigin(0.5)
        this.add.text(W/2, H*0.44, 'YOU', { fontFamily: '"Nunito",sans-serif', fontSize: fs(14), color: '#220000', stroke: '#aa6600', strokeThickness: 1 }).setOrigin(0.5)
        this.add.text(W/2, H*0.57, 'has survived 3 years +\nthe final boss: PLACEMENTS', { fontFamily: '"Nunito",sans-serif', fontSize: fs(42), color: '#666644', align: 'center' }).setOrigin(0.5)
        this.add.text(W/2, H*0.74, `CGPA: ${GS.cgpa.toFixed(2)}  |  SCORE: ${GS.score}  |  KILLS: ${GS.totalKills}`, { fontFamily: '"Nunito",sans-serif', fontSize: fs(46), color: '#997744' }).setOrigin(0.5)
        this.add.text(W/2, H*0.84, '★ ★ ★', { fontFamily: '"Nunito",sans-serif', fontSize: fs(22), color: '#ccaa00' }).setOrigin(0.5)
      },
      () => {
        this.add.rectangle(W/2, H/2, W, H, 0x000810)
        const g = this.add.graphics()
        g.lineStyle(0.5, 0x001133, 0.4)
        for (let x = 0; x < W; x += 18) g.lineBetween(x, 0, x, H)
        for (let y = 0; y < H; y += 18) g.lineBetween(0, y, W, y)
        this.add.text(W/2, H*0.08, '[ CAREER STATS ]', { fontFamily: '"Nunito",sans-serif', fontSize: fs(24), color: '#44aaff' }).setOrigin(0.5)
        const stats = [
          ['enemies defeated', `${GS.totalKills}`],
          ['final cgpa',       `${GS.cgpa.toFixed(2)}`],
          ['final score',      `${GS.score}`],
          ['all-nighters (est)', '47'],
          ['cups of chai',     '∞'],
          ['rejection letters',`${Math.max(0, 12 - Math.floor(GS.cgpa))}`],
          ['placement status', GS.cgpa >= 7.5 ? '✓ PLACED' : 'try harder lol'],
        ]
        stats.forEach(([k, v], i) => {
          const y2 = H * 0.20 + i * H * 0.10
          this.add.text(W * 0.10, y2, k, { fontFamily: '"Nunito",sans-serif', fontSize: fs(48), color: '#336688' })
          this.add.text(W * 0.90, y2, v, { fontFamily: '"Nunito",sans-serif', fontSize: fs(48), color: '#44ddff' }).setOrigin(1, 0)
        })
        this.time.delayedCall(5500, () => {
          const replay = this.add.text(W/2, H - H*0.08, '[ tap to play again ]', { fontFamily: '"Nunito",sans-serif', fontSize: fs(52), color: '#334455' }).setOrigin(0.5).setAlpha(0)
          this.tweens.add({ targets: replay, alpha: 0.9, duration: 600 })
          this.tweens.add({ targets: replay, alpha: 0.15, delay: 600, duration: 500, yoyo: true, repeat: -1 })
          this.input.once('pointerdown', () => this.scene.start('GameScene', { year: 0, resetState: true }))
          this.input.keyboard.once('keydown', () => this.scene.start('GameScene', { year: 0, resetState: true }))
        })
      },
    ]
  }

  _showCard() {
    if (this._step >= this._cards.length) return
    this.children.removeAll(true)
    this._cards[this._step]?.()
    this._step++
    if (this._step < this._cards.length) {
      const timer = this.time.delayedCall(5000, () => this._showCard())
      this.input.once('pointerdown', () => { timer.remove(); this._showCard() })
    }
  }
}

class SIFinaleBridgeScene extends Phaser.Scene {
  constructor() { super('SIFinaleBridge') }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const fs = n => `${Math.floor(W / n)}px`

    this.cameras.main.fadeIn(1200, 0, 0, 0)

    // Deep space background
    this.add.rectangle(W / 2, H / 2, W, H, 0x020810)

    // Stars
    for (let i = 0; i < 80; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.7),
        Phaser.Math.FloatBetween(0.5, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.9)
      )
      this.tweens.add({ targets: s, alpha: 0.05, duration: Phaser.Math.Between(500, 2000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) })
    }

    // Floating light motes
    this.time.addEvent({
      delay: 150, loop: true,
      callback: () => {
        const colors = [0x44aaff, 0x88ddff, 0xffcc44, 0xffffff, 0x66eeff]
        const mote = this.add.circle(
          Phaser.Math.Between(W * 0.2, W * 0.8),
          H + 10,
          Phaser.Math.FloatBetween(1, 4),
          Phaser.Utils.Array.GetRandom(colors),
          Phaser.Math.FloatBetween(0.3, 0.8)
        )
        this.tweens.add({
          targets: mote, y: -20, x: mote.x + Phaser.Math.Between(-60, 60),
          alpha: 0, duration: Phaser.Math.Between(2500, 5000),
          onComplete: () => mote.destroy()
        })
      }
    })

    // Gate outer glow
    const glow = this.add.graphics()
    for (let r = 120; r > 0; r -= 6) {
      glow.fillStyle(0x2266cc, 0.01 * (1 - r/120))
      glow.fillEllipse(W / 2, H * 0.45, r * 3, r * 2.5)
    }

    // Gate frame — ornate
    const gate = this.add.graphics()
    // Outer frame
    gate.fillStyle(0x0a2244); gate.fillRoundedRect(W * 0.22, H * 0.12, W * 0.56, H * 0.72, 16)
    gate.lineStyle(4, 0x44aaff, 0.8); gate.strokeRoundedRect(W * 0.22, H * 0.12, W * 0.56, H * 0.72, 16)
    // Inner frame
    gate.fillStyle(0x081830, 0.9); gate.fillRoundedRect(W * 0.26, H * 0.16, W * 0.48, H * 0.64, 12)
    gate.lineStyle(2, 0x88ddff, 0.5); gate.strokeRoundedRect(W * 0.26, H * 0.16, W * 0.48, H * 0.64, 12)
    // Energy field inside gate
    gate.fillStyle(0x1144aa, 0.15); gate.fillRoundedRect(W * 0.28, H * 0.18, W * 0.44, H * 0.60, 8)
    // Gold accent lines
    gate.lineStyle(2, 0xffcc44, 0.6)
    gate.strokeRoundedRect(W * 0.24, H * 0.14, W * 0.52, H * 0.68, 14)
    // Corner decorations
    const corners = [[W*0.24, H*0.14], [W*0.76, H*0.14], [W*0.24, H*0.82], [W*0.76, H*0.82]]
    corners.forEach(([cx, cy]) => {
      gate.fillStyle(0xffcc44, 0.8); gate.fillCircle(cx, cy, 5)
      gate.fillStyle(0xffffff, 0.4); gate.fillCircle(cx, cy, 2)
    })
    // Door handle
    gate.fillStyle(0xffcc44); gate.fillCircle(W * 0.62, H * 0.5, 5)
    gate.fillStyle(0xffffff, 0.5); gate.fillCircle(W * 0.62, H * 0.49, 2)

    // Pulsing energy field
    const energy = this.add.rectangle(W / 2, H * 0.48, W * 0.40, H * 0.55, 0x2288ff, 0.08)
    this.tweens.add({ targets: energy, alpha: 0.02, duration: 1500, yoyo: true, repeat: -1 })

    // SI text — large neon glow
    const siGlow = this.add.text(W / 2, H * 0.32, 'SI', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(3.5),
      color: '#44aaff', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.3)
    this.tweens.add({ targets: siGlow, alpha: 0.15, duration: 1200, yoyo: true, repeat: -1 })

    this.add.text(W / 2, H * 0.32, 'SI', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(4),
      color: '#dff6ff', fontStyle: 'bold',
      stroke: '#44aaff', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(W / 2, H * 0.44, 'L A B', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(14),
      color: '#88ccff', letterSpacing: 8,
    }).setOrigin(0.5)

    // Message
    const msg = this.add.text(W / 2, H * 0.58, 'You walk through the\nglorious gates of SI Lab.', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(22),
      color: '#c0ddff', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: msg, alpha: 1, duration: 800, delay: 1500 })

    const msg2 = this.add.text(W / 2, H * 0.70, 'Welcome home, engineer. 🎓', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(26),
      color: '#ffdd88',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: msg2, alpha: 1, duration: 800, delay: 2800 })

    // Stats
    this.add.text(W / 2, H * 0.78, `SCORE: ${GS.score}  |  CGPA: ${GS.cgpa.toFixed(1)}  |  KILLS: ${GS.totalKills}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(48),
      color: '#556688',
    }).setOrigin(0.5).setAlpha(0.7)

    // Continue prompt
    const cont = this.add.text(W / 2, H * 0.90, '▼ tap to continue ▼', {
      fontFamily: '"Nunito", sans-serif', fontSize: fs(50),
      color: '#445566',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: cont, alpha: 0.8, duration: 600, delay: 4000 })
    this.tweens.add({ targets: cont, alpha: 0.2, duration: 500, delay: 4600, yoyo: true, repeat: -1 })

    // Confetti
    for (let i = 0; i < 40; i++) {
      const colors = [0xffcc00, 0xff6600, 0x44aaff, 0xff44aa, 0x44ff88, 0xffffff]
      const dot = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0),
        Phaser.Math.Between(3, 8), Phaser.Math.Between(3, 8),
        Phaser.Utils.Array.GetRandom(colors), 0.7
      )
      this.tweens.add({ targets: dot, y: H + 20, rotation: Math.PI * 2, duration: Phaser.Math.Between(2000, 5000), delay: Phaser.Math.Between(0, 3000), repeat: -1 })
    }

    // Transition to ending
    const goToEnding = () => {
      this.cameras.main.fadeOut(800)
      this.time.delayedCall(900, () => this.scene.start('BTechEnding'))
    }
    this.time.delayedCall(8000, goToEnding)
    this.input.once('pointerdown', () => { this.time.removeAllEvents(); goToEnding() })
    this.input.keyboard.once('keydown', () => { this.time.removeAllEvents(); goToEnding() })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GameScene
// ─────────────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  // ── init ──────────────────────────────────────────────────────────────────
  init(data = {}) {
    this.year = data.year ?? 0

    if (data.resetState) {
      GS.health    = 100; GS.maxHealth = 100
      GS.score     = 0;   GS.cgpa      = 10.0
      GS.year      = 0;   GS.totalKills = 0
      GS.powerupType = null; GS.powerupTimer = 0
      GS.hasResumeBoost = false
    }

    // Per-level state
    this._lastDmgTime    = 0
    this._jumpCount      = 0
    this._bossSpawned    = false
    this._levelComplete  = false
    this._transitioning  = false
    this._killedThisLevel = 0
    this._powerupActive  = false
    this._powerupEndTime = 0
    this._powerupType    = null
    this._bossEntity     = null
    this._bossHpBar      = null
    this._bossPhaseLabel = null
    this._bossPhase      = 0
    this._lowHpWarning   = null
    this._bgTile         = null
    this._particles      = null
    this._scanlineOverlay = null
    this._seniorTag      = null
    this._selectedSenior = SENIORS.find(senior => senior.id === gameState.selectedSenior) || null
    this._yearVariant    = YEAR_VARIANTS[this.year] || YEAR_VARIANTS[0]
    this._surgeActive    = false
    this._surgeEndTime   = 0
    this._nextSurgeTime  = this._yearVariant.surgeEvery || Infinity
    this._doorSequenceStarted = false
    this._exitDoor       = null
    this._exitDoorGlow   = null

    // Mobile button zones (set in _buildMobileControls)
    this._btnLeft   = null
    this._btnRight  = null
    this._btnJump   = null
    this._btnAttack = null

    // Touch tracking
    this._touchLeft   = false
    this._touchRight  = false
    this._touchJump   = false
    this._touchAttack = false
  }

  // ── create ────────────────────────────────────────────────────────────────
  create() {
    const W   = this.scale.width
    const H   = this.scale.height
    const pal = PALETTES[this.year]

    buildTextures(this)
    this._ensureSupportScenes()

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, H)
    this.physics.world.gravity.y = 750

    this._groundY = H * GROUND_Y_FRAC

    this._buildBackground(pal, W, H)
    this._buildGround(pal, H)
    this._buildPlatforms(pal, H)
    this._buildAtmosphere(pal, W, H)

    // Physics groups
    this.enemies     = this.physics.add.group()
    this.pickups     = this.physics.add.group()
    this.bossProjs   = this.physics.add.group()

    // Particle emitter (Phaser 3.60+ API)
    this._particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 220 },
      scale: { start: 0.9, end: 0 },
      lifespan: { min: 250, max: 600 },
      gravityY: 280,
      emitting: false,
      quantity: 0,
    })

    // Player
    this.player = this.physics.add.image(70, this._groundY - 40, 'player')
    this.player
      .setCollideWorldBounds(true)
      .setBounce(0.02)
      .setDragX(900)
      .setMaxVelocity(400, 700)
      .setDepth(10)

    this._createSeniorTag(W, H)

    this._populateLevel(H)

    // Camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, H)
    this.cameras.main.startFollow(this.player, true, 0.10, 0.10)

    // Colliders
    this.physics.add.collider(this.player, this.groundTiles)
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.groundTiles)
    this.physics.add.collider(this.enemies, this.platforms)

    // Overlaps
    this.physics.add.overlap(this.player, this.enemies,   this._onTouchEnemy, null, this)
    this.physics.add.overlap(this.player, this.pickups,   this._onPickup,     null, this)
    this.physics.add.overlap(this.player, this.bossProjs, this._onProjHit,    null, this)

    // Input — keyboard
    this.cursors   = this.input.keyboard.createCursorKeys()
    this.wasd      = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' })
    this.atkKey    = this.input.keyboard.addKey('Z')
    this.atkKey2   = this.input.keyboard.addKey('X')

    // Mobile
    this._buildMobileControls(W, H)

    // HUD
    this._buildHUD(W, H, pal)

    // Post-processing scanline overlay (fixed, over everything)
    this._buildScanlines(W, H)

    // Screen fade in
    this.cameras.main.fadeIn(350)

    // Cleanup on shutdown
    this.events.once('shutdown', () => {
      this.input.off('pointerdown')
      this.input.off('pointermove')
      this.input.off('pointerup')
    })
  }

  // ── Support scene registration ─────────────────────────────────────────────
  _ensureSupportScenes() {
    if (!this.scene.manager.keys['YearTransition']) this.scene.add('YearTransition', YearTransitionScene, false)
    if (!this.scene.manager.keys['BTechEnding'])    this.scene.add('BTechEnding',    EndingScene,         false)
    if (!this.scene.manager.keys['SIFinaleBridge']) this.scene.add('SIFinaleBridge', SIFinaleBridgeScene, false)
  }

  // ── Background ────────────────────────────────────────────────────────────
  _buildBackground(pal, W, H) {
    // Tiling city bg (parallax)
    this._bgTile = this.add.tileSprite(W / 2, H / 2, W, H, `bg_${this.year}`)
      .setScrollFactor(0)
      .setDepth(-5)

    // Fog gradient overlay (bottom)
    const fog = this.add.graphics().setScrollFactor(0).setDepth(-3)
    fog.fillGradientStyle(pal.fog, pal.fog, pal.sky, pal.sky, 0.8, 0.8, 0, 0)
    fog.fillRect(0, 0, W, H)

    // Accent light strip at horizon
    const strip = this.add.graphics().setScrollFactor(0).setDepth(-2)
    strip.fillGradientStyle(pal.accent, pal.accent, 0x000000, 0x000000, 0.12, 0.12, 0, 0)
    strip.fillRect(0, H * GROUND_Y_FRAC - 6, W, 14)

    // Zone labels
    this._getZoneLabels().forEach(({ x, text }) => {
      this.add.text(x, 18, text, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: `${Math.floor(W / 60)}px`,
        color: `#${pal.accent.toString(16).padStart(6, '0')}`,
      }).setAlpha(0.28).setDepth(0)
    })

    // Exit door
    this._exitDoor = this.add.image(LEVEL_WIDTH - 70, this._groundY - 50, 'exit_door')
      .setDepth(2)
    this._exitDoorGlow = this.add.rectangle(
      LEVEL_WIDTH - 70,
      this._groundY - 25,
      50,
      80,
      this.year === 3 ? 0xffdd66 : 0x44aaff,
      this.year === 3 ? 0.2 : 0.12
    ).setDepth(1)
    this.tweens.add({
      targets: this._exitDoorGlow,
      alpha: this.year === 3 ? 0.08 : 0.04,
      duration: 1100,
      yoyo: true,
      repeat: -1
    })
  }

  _getZoneLabels() {
    const fallback = [
      [{ x: 60, text: 'ORIENTATION' }, { x: 900, text: 'SEM 1' }, { x: 1800, text: 'MID-SEMS' }, { x: 2600, text: 'END-SEMS' }],
      [{ x: 60, text: 'LAB 1' }, { x: 900, text: 'LAB 2' }, { x: 1800, text: 'MINI PROJECT' }, { x: 2600, text: 'LAB VIVA' }],
      [{ x: 60, text: 'IDEATION' }, { x: 900, text: 'DEVELOPMENT' }, { x: 1800, text: 'DEADLINES' }, { x: 2600, text: 'BOSS FIGHT' }],
      [{ x: 60, text: 'RESUME' }, { x: 900, text: 'APTITUDE' }, { x: 1800, text: 'TECH ROUND' }, { x: 2600, text: 'GLORIOUS SI DOOR' }],
    ]
    return ZONE_LABELS[this.year] || fallback[this.year] || fallback[0]
  }

  _createSeniorTag(W, H) {
    if (!this._selectedSenior) return
    this._seniorTag = this.add.text(W - 10, 8, `🎓 ${this._selectedSenior.name.split(' ')[0].toUpperCase()}`, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: `${Math.floor(W / 60)}px`,
      color: '#f0c040'
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0)
  }

  // ── Ground ────────────────────────────────────────────────────────────────
  _buildGround(pal, H) {
    this.groundTiles = this.physics.add.staticGroup()
    const tileW = 32, tileH = 20
    for (let x = 0; x < LEVEL_WIDTH; x += tileW) {
      const t = this.groundTiles.create(x + tileW / 2, H * GROUND_Y_FRAC + tileH / 2, 'ground')
      t.setTint(pal.ground).refreshBody()
    }
  }

  // ── Platforms ─────────────────────────────────────────────────────────────
  _buildPlatforms(pal, H) {
    const gy = H * GROUND_Y_FRAC
    const fallback = [
      [[320,gy-70],[580,gy-105],[870,gy-75],[1120,gy-120],[1380,gy-80],[1650,gy-60],[1920,gy-105],[2200,gy-78],[2480,gy-95],[2750,gy-60]],
      [[290,gy-80],[545,gy-120],[810,gy-70],[1060,gy-140],[1330,gy-90],[1620,gy-65],[1900,gy-115],[2180,gy-58],[2450,gy-95],[2720,gy-110]],
      [[310,gy-75],[570,gy-115],[860,gy-145],[1060,gy-80],[1340,gy-105],[1640,gy-60],[1940,gy-90],[2200,gy-130],[2480,gy-70],[2760,gy-100]],
      [[280,gy-95],[510,gy-135],[760,gy-78],[1030,gy-148],[1290,gy-88],[1570,gy-124],[1880,gy-92],[2140,gy-140],[2430,gy-100],[2720,gy-128]],
    ]
    const configs = PLATFORM_CONFIGS[this.year] || fallback[this.year] || fallback[0]
    this.platforms = this.physics.add.group({ allowGravity: false, immovable: true })
    configs.forEach(([x, y], index) => {
      const p = this.platforms.create(x, y, 'platform')
      p.setTint(pal.ground)
      p.body.allowGravity = false
      p.body.moves = false

      if (this._yearVariant.movingPlatforms && index % 2 === 1) {
        const startX = x
        const travel = this.year === 3 ? 90 : 60
        this.tweens.add({
          targets: p,
          x: startX + travel,
          duration: 2200 + index * 90,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: () => p.body.updateFromGameObject(),
        })
      }
    })
  }

  // ── Atmosphere effects ────────────────────────────────────────────────────
  _buildAtmosphere(pal, W, H) {
    if (this.year === 0) {
      // Twinkling stars
      for (let i = 0; i < 60; i++) {
        const s = this.add.circle(
          Phaser.Math.Between(0, LEVEL_WIDTH),
          Phaser.Math.Between(0, H * 0.55),
          Phaser.Math.Between(1, 2), 0xffffff,
          Phaser.Math.FloatBetween(0.2, 0.9)
        ).setDepth(-4)
        this.tweens.add({
          targets: s, alpha: 0.05,
          duration: Phaser.Math.Between(600, 2200),
          yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000)
        })
      }
    } else if (this.year === 1) {
      // Matrix rain
      this._matrixTimer = this.time.addEvent({
        delay: 120, loop: true,
        callback: () => {
          const chars = ['0','1','#','$','@','!','?','{','}','<','>']
          const c = this.add.text(
            Phaser.Math.Between(0, LEVEL_WIDTH), -10,
            Phaser.Utils.Array.GetRandom(chars),
            { fontFamily: 'monospace', fontSize: '8px', color: '#00ff00' }
          ).setAlpha(0.35).setDepth(-2)
          this.tweens.add({ targets: c, y: H + 10, duration: Phaser.Math.Between(1200, 2800), alpha: 0, onComplete: () => c.destroy() })
        }
      })
    } else if (this.year === 2) {
      // Flying debris + ember
      this._debrisTimer = this.time.addEvent({
        delay: 600, loop: true,
        callback: () => {
          const y = Phaser.Math.Between(20, H * 0.65)
          const d = this.add.rectangle(
            LEVEL_WIDTH + 20, y,
            Phaser.Math.Between(4, 14), Phaser.Math.Between(4, 14),
            0xff8800, 0.65
          ).setDepth(-1)
          this.tweens.add({
            targets: d, x: -60, angle: 360,
            duration: Phaser.Math.Between(1800, 3600),
            onComplete: () => d.destroy()
          })
        }
      })
    } else if (this.year === 3) {
      // Year 4: Floating golden leaves + warm light motes
      this._leafTimer = this.time.addEvent({
        delay: 400, loop: true,
        callback: () => {
          const colors = [0xff8844, 0xffcc44, 0xffaa22, 0xddaa44, 0xffdd88]
          const leaf = this.add.circle(
            LEVEL_WIDTH + 20,
            Phaser.Math.Between(10, H * 0.7),
            Phaser.Math.Between(2, 5),
            Phaser.Utils.Array.GetRandom(colors),
            Phaser.Math.FloatBetween(0.3, 0.7)
          ).setDepth(-1)
          this.tweens.add({
            targets: leaf, x: -30,
            y: leaf.y + Phaser.Math.Between(20, 80),
            angle: Phaser.Math.Between(180, 720),
            duration: Phaser.Math.Between(3000, 6000),
            onComplete: () => leaf.destroy()
          })
        }
      })
      // Warm light particles rising
      this.time.addEvent({
        delay: 250, loop: true,
        callback: () => {
          const mote = this.add.circle(
            Phaser.Math.Between(0, LEVEL_WIDTH),
            H,
            Phaser.Math.FloatBetween(1, 3),
            0xffdd88,
            Phaser.Math.FloatBetween(0.1, 0.4)
          ).setDepth(-2)
          this.tweens.add({
            targets: mote, y: -20, alpha: 0,
            duration: Phaser.Math.Between(3000, 6000),
            onComplete: () => mote.destroy()
          })
        }
      })
    }
  }

  // ── Scanline post-process ─────────────────────────────────────────────────
  _buildScanlines(W, H) {
    const scan = this.add.graphics().setScrollFactor(0).setDepth(200)
    scan.fillStyle(0x000000, 0.07)
    for (let y = 0; y < H; y += 3) {
      scan.fillRect(0, y, W, 1)
    }
    // Vignette edges
    const vig = this.add.graphics().setScrollFactor(0).setDepth(199)
    const edgeW = W * 0.10
    for (let x = 0; x < edgeW; x++) {
      const a = 0.45 * (1 - x / edgeW)
      vig.fillStyle(0x000000, a)
      vig.fillRect(x, 0, 1, H)
      vig.fillRect(W - x - 1, 0, 1, H)
    }
    const edgeH = H * 0.14
    for (let y = 0; y < edgeH; y++) {
      const a = 0.35 * (1 - y / edgeH)
      vig.fillStyle(0x000000, a)
      vig.fillRect(0, y, W, 1)
      vig.fillRect(0, H - y - 1, W, 1)
    }
  }

  // ── Populate level entities ────────────────────────────────────────────────
  _populateLevel(H) {
    const gy     = this._groundY
    this._isMemoryWalk = (this.year === 3)

    if (this._isMemoryWalk) {
      // Year 4: Memory Walk — no enemies, just collectible memories
      const memoryXs = [200, 450, 700, 950, 1200, 1450, 1700, 1950, 2200, 2500, 2800]
      memoryXs.forEach((x, i) => {
        const p = this._spawnPickup(x, gy - 55, 'pickup')
        // Add floating label
        const labels = ['☕ Chai', '🔑 Lab Key', '📸 Photo', '🎵 Music', '📖 Notes', '🎓 Cap', '☕ Chai', '🏆 Trophy', '📸 Selfie', '🎵 Song', '💡 Idea']
        this.add.text(x, gy - 78, labels[i] || '✨', {
          fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(this.scale.width / 55)}px`,
          color: '#ffdd88',
        }).setOrigin(0.5).setDepth(9)
      })
      // Extra HP pickups along the walk
      ;[350, 850, 1350, 1850, 2350].forEach(x => {
        this._spawnPickup(x, gy - 48, 'pickup_hp')
      })
      return
    }

    const cfgs   = YEAR_ENEMIES[this.year]
    const count  = 11

    for (let i = 0; i < count; i++) {
      const cfg  = cfgs[i % cfgs.length]
      const x    = 320 + i * 240 + Phaser.Math.Between(-30, 30)
      const key  = `enemy_${this.year}_${i % cfgs.length}`
      this._spawnEnemy(x, gy - cfg.h / 2 - 2, cfg, key)
    }

    // Pickups — alternating score / hp (more HP pickups now)
    YEAR_VARIANTS[this.year].pickupXs.forEach((x, i) => {
      this._spawnPickup(x, gy - 52, i % 3 === 0 ? 'pickup' : 'pickup_hp')
    })

    // Powerup
    const puCfg = POWERUPS[this.year]
    this._spawnPowerupPickup(750 + this.year * 280, gy - 60, puCfg)

    // Boss on year 2 (year index 2 = "Year 3 — Project Panic")
    if (this.year === 2) {
      this.time.delayedCall(300, () => this._spawnBoss(H))
    }
  }

  _spawnEnemy(x, y, cfg, key) {
    const e = this.enemies.create(x, y, key)
    e.setCollideWorldBounds(true).setBounce(0.08).setDepth(8)
    e.setData('hp',    cfg.hp)
    e.setData('maxHp', cfg.hp)
    e.setData('speed', cfg.speed + Phaser.Math.Between(-8, 8))
    e.setData('label', cfg.label)
    e.setData('score', cfg.score)
    e.setData('isBoss', false)
    e.setData('jumpTimer', Phaser.Math.FloatBetween(0, 2))

    // HP bar
    const barBg = this.add.rectangle(x, y - cfg.h / 2 - 10, cfg.w + 4, 5, 0x330000).setDepth(9)
    const barFg = this.add.rectangle(x - 2, y - cfg.h / 2 - 10, cfg.w, 3, 0xff3333).setOrigin(0, 0.5).setDepth(10)
    const lbl   = this.add.text(x, y - cfg.h / 2 - 18, cfg.label, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(this.scale.width / 65)}px`, color: '#ffaaaa',
    }).setOrigin(0.5).setDepth(10)

    e.setData('barBg', barBg)
    e.setData('barFg', barFg)
    e.setData('lbl',   lbl)
    return e
  }

  _spawnPickup(x, y, key) {
    const p = this.pickups.create(x, y, key)
    p.body.allowGravity = false
    p.setDepth(7)
    p.setData('pickupKey', key)
    p.setData('isPowerup', false)
    this.tweens.add({ targets: p, y: y - 10, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' })
    return p
  }

  _spawnPowerupPickup(x, y, puCfg) {
    const p = this.pickups.create(x, y, 'powerup')
    p.body.allowGravity = false
    p.setDepth(7).setScale(1.3).setTint(puCfg.color)
    p.setData('isPowerup', true)
    p.setData('puCfg', puCfg)
    this.tweens.add({ targets: p, angle: 360, duration: 2200, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: p, y: y - 12, yoyo: true, repeat: -1, duration: 750 })

    this.add.text(x, y - 30, puCfg.label, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(this.scale.width / 65)}px`, color: '#ffff88',
    }).setOrigin(0.5).setDepth(9)
    return p
  }

  _spawnBoss(H) {
    const gy = this._groundY
    const e  = this.enemies.create(LEVEL_WIDTH - 360, gy - BOSS_CFG.h / 2 - 2, 'boss')
    e.setCollideWorldBounds(true).setDepth(9)
    e.setData('hp',        BOSS_CFG.hp)
    e.setData('maxHp',     BOSS_CFG.hp)
    e.setData('isBoss',    true)
    e.setData('phase',     0)
    e.setData('lastShot',  0)
    e.setData('speed',     BOSS_CFG.phases[0].speed)
    e.setData('jumpTimer', 0)

    this.physics.add.collider(e, this.groundTiles)
    this.physics.add.collider(e, this.platforms)

    const W    = this.scale.width
    const bHud = this.add.container(0, 0).setScrollFactor(0).setDepth(60)

    const barBg = this.add.rectangle(W / 2, 22, 220, 12, 0x220000).setScrollFactor(0)
    this._bossHpBar = this.add.rectangle(W / 2 - 108, 22, 216, 8, 0xff0000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61)
    const barLabel  = this.add.text(W / 2, 12, 'PLACEMENTS BOSS', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 56)}px`, color: '#ff4444',
    }).setScrollFactor(0).setDepth(61).setOrigin(0.5)
    this._bossPhaseLabel = this.add.text(W / 2, 32, 'PHASE 1', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 70)}px`, color: '#ff9999',
    }).setScrollFactor(0).setDepth(61).setOrigin(0.5)

    this._bossEntity  = e
    this._bossSpawned = true

    // Warning flash
    this.cameras.main.shake(700, 0.022)
    const warn = this.add.text(W / 2, H / 2, '⚠ PLACEMENTS INCOMING ⚠', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 22)}px`, color: '#ff0000',
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5)
    this.tweens.add({ targets: warn, alpha: 0, delay: 600, duration: 2200, onComplete: () => warn.destroy() })
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD(W, H, pal) {
    // Top bar bg
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(50)
    hudBg.fillStyle(0x000000, 0.70)
    hudBg.fillRect(0, 0, W, 28)

    // HP bar
    this._hudHpBg  = this.add.rectangle(10,  14, 90, 8, 0x330000).setScrollFactor(0).setDepth(51).setOrigin(0, 0.5)
    this._hudHpBar = this.add.rectangle(10,  14, 90, 6, 0xff3333).setScrollFactor(0).setDepth(52).setOrigin(0, 0.5)
    this._hudHpTxt = this.add.text(14, 10, 'HP 100', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 65)}px`, color: '#ff9999',
    }).setScrollFactor(0).setDepth(52)

    // Score (center)
    this._hudScore = this.add.text(W / 2, 4, 'SCORE: 0', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 52)}px`, color: '#aabbff',
    }).setScrollFactor(0).setDepth(51).setOrigin(0.5, 0)

    // Year / CGPA (right)
    this._hudYear  = this.add.text(W - 8, 4, `YEAR ${this.year + 1}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 60)}px`, color: '#ffcc44',
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    this._hudCgpa  = this.add.text(W - 8, 14, `CGPA ${GS.cgpa.toFixed(1)}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 72)}px`, color: '#88aacc',
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    this._hudKills = this.add.text(W - 8, 22, `K: 0`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 80)}px`, color: '#ff8888',
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    // Powerup indicator
    this._hudPowerup = this.add.text(10, 30, '', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 72)}px`, color: '#ffcc00',
    }).setScrollFactor(0).setDepth(51)

    // Year banner (fades after 3 seconds)
    const bannerTxt = this.add.text(W / 2, H / 2 - 30, PALETTES[this.year].name, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 26)}px`,
      color: `#${pal.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(90).setOrigin(0.5)
    this.tweens.add({ targets: bannerTxt, alpha: 0, delay: 2200, duration: 800, onComplete: () => bannerTxt.destroy() })
  }

  _updateHUD() {
    const hp = Math.max(0, GS.health)
    this._hudHpTxt?.setText(`HP ${hp}`)
    if (this._hudHpBar) {
      this._hudHpBar.width = (hp / GS.maxHealth) * 90
      this._hudHpBar.setFillStyle(hp < 30 ? 0xff0000 : hp < 60 ? 0xff8800 : 0xff3333)
    }
    this._hudScore?.setText(`SCORE: ${GS.score}`)
    this._hudCgpa?.setText(`CGPA ${GS.cgpa.toFixed(1)}`)
    this._hudKills?.setText(`K: ${this._killedThisLevel}`)

    if (this._powerupActive) {
      const remain = Math.ceil(this._powerupEndTime - this.time.now)
      this._hudPowerup?.setText(`⚡ ${this._powerupType?.toUpperCase()} ${(remain / 1000).toFixed(1)}s`)
    } else {
      this._hudPowerup?.setText('')
    }
  }

  // ── Mobile controls ───────────────────────────────────────────────────────
  _buildMobileControls(W, H) {
    const bw = Math.min(W * 0.12, 52)
    const bh = Math.min(H * 0.16, 44)
    const gap = bw * 0.22
    const pad = 10
    const by  = H - bh - pad

    // Left cluster
    const lx = pad
    const rx = pad + bw + gap

    // Right cluster
    const jx = W - bw * 2 - gap - pad
    const ax = W - bw - pad

    this._btnLeft   = { x: lx, y: by, w: bw, h: bh }
    this._btnRight  = { x: rx, y: by, w: bw, h: bh }
    this._btnJump   = { x: jx, y: by, w: bw, h: bh }
    this._btnAttack = { x: ax, y: by, w: bw, h: bh }

    this._drawMobileButtons(W, H)
    this._setupTouchInput(W, H)
  }

  _drawMobileButtons(W, H) {
    // D-pad BG disc left
    const lBase = this.add.circle(
      this._btnLeft.x + this._btnLeft.w + (this._btnRight.x - this._btnLeft.x - this._btnLeft.w) / 2,
      this._btnLeft.y + this._btnLeft.h / 2,
      this._btnLeft.w * 1.1, 0x000000, 0.2
    ).setScrollFactor(0).setDepth(98)

    const makeBtn = (rect, label, bgColor) => {
      const btn = this.add.graphics().setScrollFactor(0).setDepth(99)
      btn.fillStyle(bgColor, 0.40)
      btn.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 8)
      btn.lineStyle(1.5, bgColor, 0.7)
      btn.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 8)
      this.add.text(
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        label, {
          fontFamily: '"Nunito", sans-serif',
          fontSize: `${Math.floor(rect.w * 0.40)}px`,
          color: '#ffffff',
        }
      ).setScrollFactor(0).setDepth(100).setOrigin(0.5)
      return btn
    }

    this._gfxLeft   = makeBtn(this._btnLeft,   '◀', 0x4466ff)
    this._gfxRight  = makeBtn(this._btnRight,  '▶', 0x4466ff)
    this._gfxJump   = makeBtn(this._btnJump,   '▲', 0x44cc88)
    this._gfxAttack = makeBtn(this._btnAttack, '⚔', 0xff4433)
  }

  _setupTouchInput(W, H) {
    const inRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h

    const processPointers = () => {
      this._touchLeft   = false
      this._touchRight  = false
      this._touchJump   = false
      this._touchAttack = false
      this.input.manager.pointers.forEach(ptr => {
        if (!ptr.isDown) return
        const px = ptr.x, py = ptr.y
        if (inRect(px, py, this._btnLeft))   this._touchLeft   = true
        if (inRect(px, py, this._btnRight))  this._touchRight  = true
        if (inRect(px, py, this._btnJump))   this._touchJump   = true
        if (inRect(px, py, this._btnAttack)) this._touchAttack = true
      })
    }

    this.input.on('pointerdown',  processPointers)
    this.input.on('pointermove',  processPointers)
    this.input.on('pointerup',    processPointers)
  }

  // ── Update loop ───────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.player?.active || !this.player.body) return
    if (this._levelComplete) return

    // Parallax BG scroll
    if (this._bgTile) this._bgTile.tilePositionX = this.cameras.main.scrollX * 0.07

    this._updatePlayer(time, delta)
    this._updateEnemies(time)
    this._updateBossProjectiles()
    this._updatePickupLabels()
    this._updateHUD()
    this._checkLevelEnd(time)
  }

  _updatePlayer(time, delta) {
    const onGround = this.player.body.blocked.down
    if (onGround) this._jumpCount = 0

    // Speed modifier
    let speed = PLAYER_SPEED
    if (this._powerupActive && this._powerupType === 'coffee') speed *= 1.9

    // Horizontal movement
    const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._touchLeft
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || this._touchRight

    if (goLeft)       this.player.setVelocityX(-speed)
    else if (goRight) this.player.setVelocityX(speed)
    else {
      const vx = this.player.body.velocity.x
      this.player.setVelocityX(vx * 0.78)  // smooth stop
    }

    // Facing
    if (goLeft)       this.player.setFlipX(true)
    else if (goRight) this.player.setFlipX(false)

    // Texture
    this.player.setTexture(onGround ? 'player' : 'player_jump')

    // Jump
    const wantJump = Phaser.Input.Keyboard.JustDown(this.cursors.up)
                  || Phaser.Input.Keyboard.JustDown(this.cursors.space)
                  || Phaser.Input.Keyboard.JustDown(this.wasd.up)
                  || this._touchJump

    if (wantJump && this._jumpCount < 2) {
      this.player.setVelocityY(JUMP_VEL)
      this._jumpCount++
      // Jump dust
      this._particles.setPosition(this.player.x, this.player.y + this.player.height / 2)
      this._particles.setParticleTint(0xffffff)
      this._particles.explode(8)
    }

    // Attack
    const wantAttack = Phaser.Input.Keyboard.JustDown(this.atkKey)
                    || Phaser.Input.Keyboard.JustDown(this.atkKey2)
                    || this._touchAttack

    if (wantAttack && time - (this._lastAttackTime || 0) > 280) {
      this._lastAttackTime = time
      this._doAttack(time)
    }

    // Powerup expiry
    if (this._powerupActive && time > this._powerupEndTime) {
      this._powerupActive = false
      this._powerupType   = null
      this._showFloat(this.player.x, this.player.y - 35, 'powerup expired', '#888888')
    }
  }

  _doAttack(time) {
    const pal   = PALETTES[this.year]
    const range = this._powerupActive && this._powerupType === 'hack' ? 140 : 85
    const dir   = this.player.flipX ? -1 : 1

    // Slash VFX
    const slash = this.add.graphics().setDepth(15)
    slash.lineStyle(3.5, pal.accent, 0.9)
    slash.lineBetween(
      this.player.x, this.player.y - 8,
      this.player.x + dir * range, this.player.y + 12
    )
    slash.lineStyle(1.5, 0xffffff, 0.5)
    slash.lineBetween(
      this.player.x + dir * 10, this.player.y - 5,
      this.player.x + dir * range * 0.9, this.player.y + 8
    )
    this.tweens.add({ targets: slash, alpha: 0, duration: 140, onComplete: () => slash.destroy() })

    // Particle burst from fist
    this._particles.setPosition(this.player.x + dir * 30, this.player.y)
    this._particles.setParticleTint(pal.accent)
    this._particles.explode(10)

    let hitAny = false
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('hp') <= 0) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
      const inArc = Math.sign(e.x - this.player.x) === dir || dist < 40
      if (dist > range + e.width / 2 || !inArc) return

      hitAny = true
      const isBoss = e.getData('isBoss')
      const dmg    = isBoss ? 2 : Phaser.Math.Between(1, 2)
      const newHp  = e.getData('hp') - dmg
      e.setData('hp', newHp)

      // Hit flash
      e.setTint(0xffffff)
      this.time.delayedCall(90, () => { if (e.active) e.clearTint() })
      e.setVelocityX(dir * 240)

      this._showFloat(e.x, e.y - 25, `-${dmg}`, '#ff5555')
      GS.score += 10

      // Update HP bar
      if (!isBoss) {
        const maxHp = e.getData('maxHp')
        const frac  = Math.max(0, newHp / maxHp)
        const barFg = e.getData('barFg')
        if (barFg) barFg.width = (e.width + 4) * frac
      } else {
        if (this._bossHpBar) {
          const frac = Math.max(0, newHp / BOSS_CFG.hp)
          this._bossHpBar.width = 216 * frac
        }
      }

      if (newHp <= 0) this._killEnemy(e)
    })

    if (!hitAny) this._showFloat(this.player.x + dir * 50, this.player.y - 10, 'miss!', '#556688')
  }

  _killEnemy(e) {
    const isBoss = e.getData('isBoss')
    const pal    = PALETTES[this.year]

    // Destroy HUD elements
    ;['barBg', 'barFg', 'lbl'].forEach(k => {
      const obj = e.getData(k)
      if (obj) obj.destroy()
    })

    // Explosion particles
    this._particles.setPosition(e.x, e.y)
    this._particles.setParticleTint(pal.particleA)
    this._particles.explode(22)

    // Coin burst VFX
    const colors = [0xff8800, 0xffcc00, 0xff4444, 0xffffff, 0x44ffcc]
    for (let i = 0; i < 10; i++) {
      const dot = this.add.circle(e.x, e.y, Phaser.Math.Between(2, 6), Phaser.Utils.Array.GetRandom(colors)).setDepth(20)
      this.tweens.add({
        targets: dot,
        x: e.x + Phaser.Math.Between(-70, 70),
        y: e.y - Phaser.Math.Between(20, 70),
        alpha: 0, duration: Phaser.Math.Between(350, 650),
        onComplete: () => dot.destroy()
      })
    }

    if (isBoss) {
      this._onBossDefeated()
    } else {
      const pts = e.getData('score') || 50
      this._showFloat(e.x, e.y - 35, `+${pts} pts`, '#ffcc44')
      GS.score += pts
      GS.totalKills++
      this._killedThisLevel++
      GS.cgpa = Math.min(10.0, GS.cgpa + 0.05)
      e.destroy()
    }
  }

  _onBossDefeated() {
    if (this._levelComplete) return
    this._levelComplete = true

    this._bossEntity?.destroy()
    this._bossEntity = null
    if (this._bossHpBar) this._bossHpBar.setDisplaySize(0, 8)

    GS.score += 500
    GS.totalKills++
    this._killedThisLevel++

    this.cameras.main.shake(900, 0.03)
    this.cameras.main.flash(1100, 255, 180, 50)

    const W = this.scale.width, H = this.scale.height
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(90)
    this.tweens.add({ targets: overlay, alpha: 0.60, duration: 800 })

    this.add.text(W / 2, H / 2 - 30, '🎓 BOSS DEFEATED!', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 16)}px`,
      color: '#ffcc00', stroke: '#884400', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.add.text(W / 2, H / 2 + 12, '"Placements Conquered"\n+500 score!', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 38)}px`,
      color: '#ffffff', align: 'center',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.time.delayedCall(3200, () => this._finishGame())
  }

  // ── Enemy AI ──────────────────────────────────────────────────────────────
  _updateEnemies(time) {
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('hp') <= 0) return

      // Sync UI elements
      const barBg = e.getData('barBg'), barFg = e.getData('barFg'), lbl = e.getData('lbl')
      if (barBg) barBg.setPosition(e.x, e.y - e.height / 2 - 8)
      if (barFg) barFg.setPosition(e.x - (e.width + 4) / 2, e.y - e.height / 2 - 8)
      if (lbl)   lbl.setPosition(e.x, e.y - e.height / 2 - 18)

      if (e.getData('isBoss')) {
        this._updateBoss(e, time)
      } else {
        const dx  = this.player.x - e.x
        const spd = e.getData('speed') || 60

        if (Math.abs(dx) < 450) e.setVelocityX(dx > 0 ? spd : -spd)
        else e.setVelocityX(0)

        // Occasional jump
        let jt = e.getData('jumpTimer') - this.game.loop.delta / 1000
        e.setData('jumpTimer', jt)
        if (jt <= 0 && e.body.blocked.down) {
          e.setVelocityY(-320 - Math.random() * 80)
          e.setData('jumpTimer', Phaser.Math.FloatBetween(1.5, 3.5))
        }
      }
    })
  }

  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const frac  = hp / BOSS_CFG.hp
    const phase = frac > 0.65 ? 0 : frac > 0.35 ? 1 : 2
    const ph    = BOSS_CFG.phases[phase]

    // Phase change effects
    if (phase !== this._bossPhase) {
      this._bossPhase = phase
      this.cameras.main.shake(400, 0.018)
      this.cameras.main.flash(500, 255, 100, 0)
      boss.setTint(ph.color)
      this._bossPhaseLabel?.setText(`PHASE ${phase + 1}`)
      this._particles.setPosition(boss.x, boss.y)
      this._particles.setParticleTint(ph.color)
      this._particles.explode(30)
    }

    boss.setTint(ph.color)

    // Move toward player
    const dx = this.player.x - boss.x
    if (Math.abs(dx) > 70) boss.setVelocityX(dx > 0 ? ph.speed : -ph.speed)
    else boss.setVelocityX(0)

    // Boss jump
    let jt = boss.getData('jumpTimer') - this.game.loop.delta / 1000
    boss.setData('jumpTimer', jt)
    if (jt <= 0 && boss.body.blocked.down) {
      boss.setVelocityY(-400)
      boss.setData('jumpTimer', Phaser.Math.FloatBetween(1.2, 2.5))
    }

    // Shoot
    const lastShot = boss.getData('lastShot') || 0
    if (time - lastShot > ph.shootInterval) {
      boss.setData('lastShot', time)
      this._bossShoot(boss, phase)
    }

    // Update HP bar
    if (this._bossHpBar) {
      const pct = Math.max(0, hp / BOSS_CFG.hp)
      this._bossHpBar.width = 216 * pct
    }
  }

  _bossShoot(boss, phase) {
    const dir = this.player.x < boss.x ? -1 : 1
    const ph  = BOSS_CFG.phases[phase]
    const spd = 250

    const shoot = (vx, vy) => {
      const p = this.bossProjs.create(boss.x + dir * 45, boss.y - 10, 'boss_proj')
      if (!p) return
      p.setVelocity(vx, vy)
      p.body.allowGravity = false
      p.setDepth(9)
      this.time.delayedCall(5000, () => { if (p?.active) p.destroy() })
    }

    // Phase 0: single
    shoot(dir * spd, -20)
    // Phase 1: arc
    if (phase >= 1) shoot(dir * (spd - 60), -130)
    // Phase 2: fan
    if (phase >= 2) shoot(dir * (spd - 120), -220)
  }

  _updateBossProjectiles() {
    this.bossProjs.getChildren().forEach(p => {
      if (!p.active) return
      // Off-screen cleanup
      if (p.y > this.scale.height + 50) p.destroy()
    })
  }

  _updatePickupLabels() {
    // nothing to do — labels are positioned at spawn
  }

  // ── Collision callbacks ────────────────────────────────────────────────────
  _onTouchEnemy(player, enemy) {
    if (!enemy.active || enemy.getData('hp') <= 0) return
    if (enemy.getData('isBoss')) return   // boss uses ranged only
    const now = this.time.now
    if (now - this._lastDmgTime < DMG_COOLDOWN) return
    this._lastDmgTime = now
    this._takeDamage(4 + Math.floor(this.year * 0.5))
    const dir = player.x < enemy.x ? -1 : 1
    player.setVelocityX(dir * 320).setVelocityY(-170)
  }

  _onPickup(player, pickup) {
    if (!pickup?.active) return
    pickup.destroy()

    const isPowerup = pickup.getData('isPowerup')
    if (isPowerup) {
      const pu = pickup.getData('puCfg')
      this._powerupActive  = true
      this._powerupEndTime = this.time.now + pu.duration
      this._powerupType    = pu.type
      GS.powerupType       = pu.type
      GS.score            += 200
      this._showFloat(player.x, player.y - 40, `${pu.label}!`, '#ffff44', 12)
      this._showFloat(player.x, player.y - 58, pu.desc, '#ffdd88', 9)
      this.cameras.main.flash(300, 255, 210, 50)
      this._particles.setPosition(player.x, player.y)
      this._particles.setParticleTint(pu.color)
      this._particles.explode(20)
    } else {
      const key = pickup.getData('pickupKey')
      if (key === 'pickup_hp') {
        GS.health = Math.min(GS.maxHealth, GS.health + 35)
        this._showFloat(player.x, player.y - 35, '+35 HP', '#44ff88', 12)
        this._particles.setPosition(player.x, player.y)
        this._particles.setParticleTint(0x44ff88)
        this._particles.explode(10)
      } else {
        GS.score += 100
        this._showFloat(player.x, player.y - 35, '+100 pts', '#ffcc44', 12)
      }
      this.cameras.main.flash(120, 80, 255, 120)
    }
  }

  _onProjHit(player, proj) {
    if (!proj?.active) return
    const now = this.time.now
    if (now - this._lastDmgTime < DMG_COOLDOWN) return
    if (this._powerupActive && this._powerupType === 'offer') {
      proj.destroy()
      this._showFloat(player.x, player.y - 30, 'BLOCKED!', '#ffcc00')
      return
    }
    this._lastDmgTime = now
    proj.destroy()
    this._takeDamage(5)
    this._particles.setPosition(player.x, player.y)
    this._particles.setParticleTint(0xff4444)
    this._particles.explode(12)
  }

  // ── Damage ────────────────────────────────────────────────────────────────
  _takeDamage(amount) {
    if (this._powerupActive && this._powerupType === 'chai') amount = Math.floor(amount * 0.40)
    GS.health = Math.max(0, GS.health - amount)
    GS.cgpa   = Math.max(4.0, GS.cgpa - 0.04)

    this._showFloat(this.player.x, this.player.y - 28, `-${amount}`, '#ff4444')
    this.cameras.main.shake(110, 0.014)
    this.cameras.main.flash(70, 255, 30, 30)

    this.tweens.add({
      targets: this.player, alpha: 0.15,
      duration: 70, repeat: 5, yoyo: true,
      onComplete: () => { if (this.player?.active) this.player.setAlpha(1) }
    })

    // Low HP warning
    if (GS.health <= 20 && !this._lowHpWarning) {
      this._lowHpWarning = this.add.text(
        this.scale.width / 2, this.scale.height / 2 - 20,
        '⚠ LOW HP ⚠', {
          fontFamily: '"Nunito", sans-serif',
          fontSize: `${Math.floor(this.scale.width / 22)}px`,
          color: '#ff0000',
        }
      ).setScrollFactor(0).setDepth(80).setOrigin(0.5)
      this.tweens.add({ targets: this._lowHpWarning, alpha: 0.1, duration: 280, yoyo: true, repeat: -1 })
    }
    if (GS.health > 20 && this._lowHpWarning) {
      this._lowHpWarning.destroy()
      this._lowHpWarning = null
    }

    // Death
    if (GS.health <= 0) {
      this._levelComplete = true
      this.cameras.main.shake(500, 0.04)
      this.cameras.main.fadeOut(1200)
      this.time.delayedCall(1400, () => {
        // Restart with reset
        this.scene.start('GameScene', { year: 0, resetState: true })
      })
    }
  }

  // ── Level end ─────────────────────────────────────────────────────────────
  _checkLevelEnd(time) {
    if (this._transitioning || !this.player) return
    if (this.player.x > LEVEL_WIDTH - 120) {
      if (this.year === 2 && this._bossEntity?.active) {
        this._showFloat(this.player.x, this.player.y - 40, 'Defeat the boss first!', '#ff4444')
        return
      }
      this._completeYear()
    }
  }

  _completeYear() {
    if (this._transitioning) return
    this._transitioning = true
    this._levelComplete = true

    GS.score += 300 + this._killedThisLevel * 20
    GS.cgpa   = Math.min(10.0, GS.cgpa + 0.3)
    GS.year   = this.year + 1
    GS.health = Math.min(GS.maxHealth, GS.health + 40)

    const W = this.scale.width, H = this.scale.height
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setScrollFactor(0).setDepth(90)

    const yearNames = ['YEAR 1 CLEARED!', 'YEAR 2 CLEARED!', 'YEAR 3 + BOSS CLEARED!', 'THE JOURNEY ENDS...']
    this.add.text(W / 2, H / 2 - 25, yearNames[this.year] || 'CLEARED!', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 20)}px`, color: '#ffcc44',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.add.text(W / 2, H / 2 + 14, `score: ${GS.score}   cgpa: ${GS.cgpa.toFixed(1)}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 42)}px`, color: '#aabbff',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.time.delayedCall(2600, () => {
      if (this.year < 3) {
        this.scene.pause('GameScene')
        this.scene.launch('YearTransition', { year: this.year + 1, score: GS.score })
      } else {
        this._finishGame()
      }
    })
  }

  _finishGame() {
    this.scene.stop()
    if (this.year >= 3) {
      this.scene.start('SIFinaleBridge')
    } else {
      this.scene.start('BTechEnding')
    }
  }

  // ── Floating text ─────────────────────────────────────────────────────────
  _showFloat(x, y, text, color = '#ffffff', size) {
    const W   = this.scale.width
    const sz  = size ?? Math.floor(W / 46)
    const t   = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${sz}px`, color,
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(30)
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0, duration: 850, ease: 'Power2',
      onComplete: () => t.destroy(),
    })
  }
}
