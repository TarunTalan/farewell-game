import Phaser from 'phaser'

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

// ── Layout constants (scaled at runtime in create) ────────────────────────────
const BASE_W        = 480
const BASE_H        = 270
const GROUND_Y_FRAC = 0.80       // fraction of H
const LEVEL_WIDTH   = 3000
const PLAYER_SPEED  = 185
const JUMP_VEL      = -410
const DMG_COOLDOWN  = 900        // ms

// ── Year themes ───────────────────────────────────────────────────────────────
const PALETTES = [
  {
    sky: 0x0d1b4b, mid: 0x1a2e6e, ground: 0x2d4a8a,
    accent: 0x5b8cff, fog: 0x0a1235,
    name: 'YEAR 1 — FRESHMAN CONFUSION',
    particleA: 0x5b8cff, particleB: 0xffffff,
    ambientLight: 0x2233aa,
  },
  {
    sky: 0x061206, mid: 0x0e3d0e, ground: 0x1a5c1a,
    accent: 0x39ff14, fog: 0x030803,
    name: 'YEAR 2 — LAB HELL',
    particleA: 0x39ff14, particleB: 0x00cc44,
    ambientLight: 0x112211,
  },
  {
    sky: 0x2a1a00, mid: 0x4a2d00, ground: 0x7a4a00,
    accent: 0xff8800, fog: 0x1a0d00,
    name: 'YEAR 3 — PROJECT PANIC + BOSS',
    particleA: 0xff8800, particleB: 0xffcc00,
    ambientLight: 0x331a00,
  },
]

// ── Enemy definitions per year ────────────────────────────────────────────────
const YEAR_ENEMIES = [
  [
    { label: 'Lost Syllabus',  hp: 2, speed: 55,  color: 0x6688cc, w: 26, h: 26, score: 30 },
    { label: 'Hostel Ragging', hp: 3, speed: 68,  color: 0xcc4466, w: 28, h: 28, score: 40 },
    { label: 'Dean Notice',    hp: 2, speed: 48,  color: 0xccaa00, w: 24, h: 24, score: 30 },
    { label: 'Attendance%',    hp: 4, speed: 75,  color: 0xff6644, w: 30, h: 30, score: 50 },
  ],
  [
    { label: 'Segfault',   hp: 3, speed: 60,  color: 0x44cc44, w: 26, h: 26, score: 50 },
    { label: 'Viva Exam',  hp: 4, speed: 82,  color: 0x88ff44, w: 28, h: 28, score: 60 },
    { label: 'Lab Report', hp: 2, speed: 50,  color: 0x44ffaa, w: 24, h: 24, score: 40 },
    { label: 'Compiler',   hp: 5, speed: 95,  color: 0xff4444, w: 32, h: 32, score: 70 },
  ],
  [
    { label: 'Deadline',     hp: 4, speed: 72,  color: 0xff8800, w: 28, h: 28, score: 70 },
    { label: 'No WiFi',      hp: 3, speed: 62,  color: 0xffaa00, w: 26, h: 26, score: 60 },
    { label: 'Client',       hp: 5, speed: 88,  color: 0xff5500, w: 30, h: 30, score: 80 },
    { label: 'Git Conflict', hp: 6, speed: 98,  color: 0xff3300, w: 34, h: 34, score: 100 },
  ],
]

// ── Powerups ──────────────────────────────────────────────────────────────────
const POWERUPS = [
  { type: 'chai',   color: 0xcc8833, label: 'CHAI BOOST',   duration: 8000,  desc: '50% dmg reduction' },
  { type: 'hack',   color: 0x00ff88, label: 'HACKER MODE',  duration: 6000,  desc: '2× attack range' },
  { type: 'coffee', color: 0xaa6622, label: 'COFFEE RUN',   duration: 10000, desc: '2× speed' },
]

// ── Boss config ───────────────────────────────────────────────────────────────
const BOSS_CFG = {
  hp: 40, w: 80, h: 80,
  phases: [
    { threshold: 1.0,  color: 0xff2222, speed: 60,  shootInterval: 3000, shots: 1 },
    { threshold: 0.65, color: 0xff6600, speed: 90,  shootInterval: 1800, shots: 2 },
    { threshold: 0.35, color: 0xffcc00, speed: 120, shootInterval: 900,  shots: 3 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: hex int → css string
// ─────────────────────────────────────────────────────────────────────────────
function hexStr(v) {
  return `#${v.toString(16).padStart(6, '0')}`
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
  make('player', 22, 32, g => {
    g.fillStyle(0x1a1a4a); g.fillRect(3, 22, 7, 9); g.fillRect(12, 22, 7, 9)   // legs
    g.fillStyle(0x222222); g.fillRect(1, 29, 8, 3); g.fillRect(12, 29, 8, 3)   // shoes
    g.fillStyle(0x2255cc); g.fillRect(2, 11, 18, 13)                             // body
    g.fillStyle(0x1a44aa); g.fillRect(2, 11, 18, 4)                              // collar
    g.fillStyle(0xffcc99); g.fillRect(4, 2, 14, 11)                              // head
    g.fillStyle(0x1a0a00); g.fillRect(3, 2, 16, 5)                               // hair
    g.fillStyle(0x111111); g.fillRect(7, 8, 3, 3); g.fillRect(12, 8, 3, 3)      // eyes
    g.fillStyle(0xffffff); g.fillRect(8, 9, 1, 1); g.fillRect(13, 9, 1, 1)      // pupils
    g.fillStyle(0x994400); g.fillRect(18, 11, 6, 9)                              // arm
  })

  make('player_jump', 22, 32, g => {
    g.fillStyle(0x1a1a4a); g.fillRect(1, 23, 7, 8); g.fillRect(14, 23, 7, 8)
    g.fillStyle(0x222222); g.fillRect(0, 29, 8, 3); g.fillRect(14, 29, 8, 3)
    g.fillStyle(0x2255cc); g.fillRect(2, 11, 18, 13)
    g.fillStyle(0x2255cc); g.fillRect(-1, 8, 4, 10); g.fillRect(19, 8, 4, 10)  // arms up
    g.fillStyle(0xffcc99); g.fillRect(-1, 6, 4, 5); g.fillRect(19, 6, 4, 5)   // hands
    g.fillStyle(0xffcc99); g.fillRect(4, 2, 14, 11)
    g.fillStyle(0x1a0a00); g.fillRect(3, 2, 16, 5)
    g.fillStyle(0x111111); g.fillRect(7, 8, 3, 3); g.fillRect(12, 8, 3, 3)
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

  // ── Enemy sprites (per year × variant) ───────────────────────────────────
  for (let y = 0; y < YEAR_ENEMIES.length; y++) {
    YEAR_ENEMIES[y].forEach((cfg, j) => {
      const s = cfg.w
      make(`enemy_${y}_${j}`, s + 4, s + 4, g => {
        const c = cfg.color
        const dark = Phaser.Display.Color.ValueToColor(c).darken(25).color
        // body
        g.fillStyle(c); g.fillRect(2, 4, s, s)
        g.lineStyle(2, dark); g.strokeRect(2, 4, s, s)
        // face
        g.fillStyle(0xffffff); g.fillRect(5, 8, 7, 6); g.fillRect(s - 10, 8, 7, 6)
        g.fillStyle(0x000000); g.fillRect(7, 9, 3, 4);  g.fillRect(s - 8, 9, 3, 4)
        g.fillStyle(0xff0000); g.fillRect(8, 10, 1, 1); g.fillRect(s - 7, 10, 1, 1)
        // angry brows
        g.lineStyle(2, 0x000000)
        g.lineBetween(5, 7, 13, 9); g.lineBetween(s - 2, 7, s - 10, 9)
        // teeth
        g.fillStyle(0x000000); g.fillRect(6, s - 6, s - 10, 4)
        g.fillStyle(0xffffff)
        for (let t = 0; t < 3; t++) g.fillRect(7 + t * 5, s - 6, 3, 3)
        // legs
        g.fillStyle(c); g.fillRect(3, s + 1, 6, 5); g.fillRect(s - 5, s + 1, 6, 5)
      })
    })
  }

  // ── Backgrounds per year ──────────────────────────────────────────────────
  for (let y = 0; y < 3; y++) {
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
      } else {
        // Sunset + fire city
        g.fillStyle(0xff6600, 0.5); g.fillCircle(240, 135, 50)
        g.fillStyle(0xffaa00, 0.25); g.fillCircle(240, 135, 75)
        g.fillStyle(0x1a0d00)
        ;[[0,55,25],[30,50,20],[60,62,28],[100,45,22],[135,55,32],[180,42,25],[220,58,30],[265,48,28],[305,60,22],[340,42,35],[385,54,25],[420,60,55]].forEach(([x,y2,w]) => g.fillRect(x,y2,w,270))
        // Fire on tops
        g.fillStyle(0xff4400, 0.6)
        g.fillCircle(12, 53, 6); g.fillCircle(48, 48, 5); g.fillCircle(350, 40, 7)
        // Crane
        g.lineStyle(2, 0x1a0d00)
        g.lineBetween(80, 50, 80, 20); g.lineBetween(80, 20, 120, 20); g.lineBetween(120, 20, 120, 40)
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
    ]

    const [yearLabel, subtitle, desc, col] = yearTitles[Math.min(this.nextYear, 2)]

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
    const door = this.add.image(LEVEL_WIDTH - 70, this._groundY - 50, 'exit_door')
      .setDepth(2)
    const glow = this.add.rectangle(LEVEL_WIDTH - 70, this._groundY - 25, 50, 80, 0x44aaff, 0.12)
      .setDepth(1)
    this.tweens.add({ targets: glow, alpha: 0.04, duration: 1100, yoyo: true, repeat: -1 })
  }

  _getZoneLabels() {
    const sets = [
      [{ x: 60,   text: 'ORIENTATION' }, { x: 900,  text: 'SEM 1' },       { x: 1800, text: 'MID-SEMS' },    { x: 2600, text: 'END-SEMS' }],
      [{ x: 60,   text: 'LAB 1'       }, { x: 900,  text: 'LAB 2' },       { x: 1800, text: 'MINI PROJECT' }, { x: 2600, text: 'LAB VIVA' }],
      [{ x: 60,   text: 'IDEATION'    }, { x: 900,  text: 'DEVELOPMENT' }, { x: 1800, text: 'DEADLINES' },   { x: 2600, text: 'BOSS FIGHT' }],
    ]
    return sets[this.year] || []
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
    const configs = [
      [[320,gy-70],[580,gy-105],[870,gy-75],[1120,gy-120],[1380,gy-80],[1650,gy-60],[1920,gy-105],[2200,gy-78],[2480,gy-95],[2750,gy-60]],
      [[290,gy-80],[545,gy-120],[810,gy-70],[1060,gy-140],[1330,gy-90],[1620,gy-65],[1900,gy-115],[2180,gy-58],[2450,gy-95],[2720,gy-110]],
      [[310,gy-75],[570,gy-115],[860,gy-145],[1060,gy-80],[1340,gy-105],[1640,gy-60],[1940,gy-90],[2200,gy-130],[2480,gy-70],[2760,gy-100]],
    ]
    this.platforms = this.physics.add.staticGroup()
    ;(configs[this.year] || configs[0]).forEach(([x, y]) => {
      const p = this.platforms.create(x, y, 'platform')
      p.setTint(pal.ground).refreshBody()
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
    const cfgs   = YEAR_ENEMIES[this.year]
    const count  = 11

    for (let i = 0; i < count; i++) {
      const cfg  = cfgs[i % cfgs.length]
      const x    = 320 + i * 240 + Phaser.Math.Between(-30, 30)
      const key  = `enemy_${this.year}_${i % cfgs.length}`
      this._spawnEnemy(x, gy - cfg.h / 2 - 2, cfg, key)
    }

    // Pickups — alternating score / hp
    ;[480, 950, 1430, 1910, 2380].forEach((x, i) => {
      this._spawnPickup(x, gy - 52, i % 2 === 0 ? 'pickup' : 'pickup_hp')
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
      const dmg    = isBoss ? 1 : Phaser.Math.Between(1, 2)
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
    this._takeDamage(10 + this.year * 2)
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
        GS.health = Math.min(GS.maxHealth, GS.health + 25)
        this._showFloat(player.x, player.y - 35, '+25 HP', '#44ff88', 12)
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
    this._takeDamage(14 + this.year * 4)
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

    const W = this.scale.width, H = this.scale.height
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setScrollFactor(0).setDepth(90)

    const yearNames = ['YEAR 1 CLEARED!', 'YEAR 2 CLEARED!', 'YEAR 3 + BOSS CLEARED!']
    this.add.text(W / 2, H / 2 - 25, yearNames[this.year] || 'CLEARED!', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 20)}px`, color: '#ffcc44',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.add.text(W / 2, H / 2 + 14, `score: ${GS.score}   cgpa: ${GS.cgpa.toFixed(1)}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 42)}px`, color: '#aabbff',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.time.delayedCall(2600, () => {
      if (this.year < 2) {
        this.scene.pause('GameScene')
        this.scene.launch('YearTransition', { year: this.year + 1, score: GS.score })
      } else {
        this._finishGame()
      }
    })
  }

  _finishGame() {
    this.scene.stop()
    this.scene.start('BTechEnding')
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