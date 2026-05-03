import Phaser from 'phaser'
import { PALETTES } from '../palettes.js'
import { YEAR_ENEMIES } from '../enemyConfig.js'

export function buildTextures(scene) {
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
          // Year 1: Hacker Phantoms — more menacing skulls
          g.fillStyle(c, 0.25); g.fillCircle(hs+4, hs+4, hs+6) // bigger aura
          g.fillStyle(c); g.fillRoundedRect(4, 8, s, s-8, 6) // blocky head
          
          // Horns / Spikes
          g.fillStyle(c)
          g.fillTriangle(6, 8, 2, 0, 12, 8) // left spike
          g.fillTriangle(s-2, 8, s+2, 0, s-8, 8) // right spike
          
          // Skeletal details
          g.fillStyle(Phaser.Display.Color.ValueToColor(c).darken(40).color, 0.8)
          g.fillCircle(hs+4, hs+6, hs-3) 

          // Eyes — Triple glowing red LEDs
          g.fillStyle(0xff0000); 
          g.fillCircle(hs-4, hs+2, 3); g.fillCircle(hs+4, hs+2, 3); g.fillCircle(hs+12, hs+2, 3)
          g.fillStyle(0xffffff, 0.7); g.fillCircle(hs-3, hs+1, 1); g.fillCircle(hs+5, hs+1, 1); g.fillCircle(hs+13, hs+1, 1)

          // Sinister Grin
          g.fillStyle(0x000000); g.fillRect(hs-2, hs+10, 14, 4)
          g.fillStyle(0x00ff44, 0.9) // green digital teeth
          for (let t = 0; t < 4; t++) g.fillRect(hs-1+t*3, hs+10, 2, 2)
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

  // ── Memory Game Nodes (Year 2) ───────────────────────────────────────────
  const colors = [0xff4444, 0x44ff44, 0x4488ff]
  const names  = ['node_red', 'node_green', 'node_blue']
  
  names.forEach((name, i) => {
    make(name, 32, 32, g => {
      const c = colors[i]
      g.fillStyle(c, 0.2); g.fillCircle(16, 16, 16)
      g.fillStyle(c, 0.5); g.fillCircle(16, 16, 12)
      g.fillStyle(c); g.fillCircle(16, 16, 8)
      g.fillStyle(0xffffff, 0.7); g.fillCircle(14, 14, 3)
      g.lineStyle(2, 0xffffff, 0.3); g.strokeCircle(16, 16, 14)
    })
  })
}
