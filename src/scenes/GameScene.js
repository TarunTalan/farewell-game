import Phaser from 'phaser'

// ─────────────────────────────────────────────────────────────────────────────
// GameScene.js — Fixed & cleaned up
// ─────────────────────────────────────────────────────────────────────────────

const GS = {
  health: 100,
  maxHealth: 100,
  score: 0,
  year: 0,
  powerupType: null,
  powerupTimer: 0,
  cgpa: 10.0,
  hasResumeBoost: false,
  totalEnemiesKilled: 0,
}

const W            = 480
const H            = 270
const GROUND_Y     = H - 48
const LEVEL_WIDTH  = 3200
const PLAYER_SPEED = 180
const JUMP_VEL     = -400
const DMG_COOLDOWN = 1000

const PALETTES = [
  { sky: 0x0d1b4b, mid: 0x1a2e6e, ground: 0x2d4a8a, accent: 0x5b8cff, fog: 0x0a1235, name: 'YEAR 1 - CONFUSION'      },
  { sky: 0x0a2a0a, mid: 0x0e3d0e, ground: 0x1a5c1a, accent: 0x39ff14, fog: 0x061806, name: 'YEAR 2 - LAB HELL'        },
  { sky: 0x2a1a00, mid: 0x4a2d00, ground: 0x7a4a00, accent: 0xff8800, fog: 0x1a0d00, name: 'YEAR 3 - PROJECT PANIC'   },
  { sky: 0x1a0000, mid: 0x3d0000, ground: 0x660000, accent: 0xff2222, fog: 0x0d0000, name: 'YEAR 4 - PLACEMENT HELL'  },
]

const YEAR_ENEMIES = [
  [
    { label: 'Lost Syllabus',  hp: 2, speed: 50,  color: 0x6688cc, size: 18 },
    { label: 'Hostel Ragging', hp: 3, speed: 65,  color: 0xcc4466, size: 22 },
    { label: 'Dean Notice',    hp: 2, speed: 45,  color: 0xccaa00, size: 20 },
    { label: 'Attendance%',    hp: 4, speed: 70,  color: 0xff6644, size: 24 },
  ],
  [
    { label: 'Segfault',   hp: 3, speed: 55,  color: 0x44cc44, size: 20 },
    { label: 'Viva',       hp: 4, speed: 80,  color: 0x88ff44, size: 22 },
    { label: 'Lab Report', hp: 2, speed: 45,  color: 0x44ffaa, size: 18 },
    { label: 'Compiler',   hp: 5, speed: 90,  color: 0xff4444, size: 26 },
  ],
  [
    { label: 'Deadline',     hp: 4, speed: 70,  color: 0xff8800, size: 22 },
    { label: 'No WiFi',      hp: 3, speed: 60,  color: 0xffaa00, size: 20 },
    { label: 'Client',       hp: 5, speed: 85,  color: 0xff5500, size: 24 },
    { label: 'Git Conflict', hp: 6, speed: 95,  color: 0xff3300, size: 28 },
  ],
  [
    { label: 'HR Round',    hp: 5, speed: 75,  color: 0xdd0000, size: 22 },
    { label: 'DSA Sheet',   hp: 6, speed: 90,  color: 0xbb0000, size: 24 },
    { label: 'Resume Gap',  hp: 4, speed: 65,  color: 0xff2200, size: 20 },
    { label: 'Ghosted',     hp: 7, speed: 100, color: 0x880022, size: 28 },
  ],
]

const POWERUPS = [
  { type: 'chai',           color: 0xcc8833, label: 'CHAI BOOST',   duration: 8000  },
  { type: 'ragging_senior', color: 0x8833cc, label: 'SENIOR HELP',  duration: 6000  },
  { type: 'coffee',         color: 0x442211, label: 'COFFEE RUN',   duration: 10000 },
  { type: 'offer',          color: 0xffcc00, label: 'OFFER LETTER', duration: 12000 },
]

function colorHex(value) {
  return `#${value.toString(16).padStart(6, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Texture helpers
// ─────────────────────────────────────────────────────────────────────────────

function replaceTexture(scene, key, drawFn) {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const g = scene.make.graphics({ add: false })
  drawFn(g)
  g.destroy()
}

function ensureTextures(scene) {
  replaceTexture(scene, 'player', (g) => {
    g.fillStyle(0x2255cc); g.fillRect(2, 10, 12, 10)
    g.fillStyle(0xffcc99); g.fillRect(3, 2, 10, 9)
    g.fillStyle(0x222222); g.fillRect(3, 2, 10, 3)
    g.fillStyle(0x111111); g.fillRect(5, 7, 2, 2); g.fillRect(9, 7, 2, 2)
    g.fillStyle(0x1a1a4a); g.fillRect(2, 20, 5, 6); g.fillRect(9, 20, 5, 6)
    g.fillStyle(0x222222); g.fillRect(1, 24, 6, 3); g.fillRect(9, 24, 6, 3)
    g.fillStyle(0x994400); g.fillRect(13, 10, 5, 8)
    g.generateTexture('player', 20, 28)
  })

  replaceTexture(scene, 'player_jump', (g) => {
    g.fillStyle(0x2255cc); g.fillRect(2, 10, 12, 10)
    g.fillStyle(0xffcc99); g.fillRect(3, 2, 10, 9)
    g.fillStyle(0x222222); g.fillRect(3, 2, 10, 3)
    g.fillStyle(0x111111); g.fillRect(5, 7, 2, 2); g.fillRect(9, 7, 2, 2)
    g.fillStyle(0x2255cc); g.fillRect(0, 6, 3, 8); g.fillRect(13, 6, 3, 8)
    g.fillStyle(0xffcc99); g.fillRect(0, 4, 3, 4); g.fillRect(13, 4, 3, 4)
    g.fillStyle(0x1a1a4a); g.fillRect(2, 20, 5, 6); g.fillRect(9, 20, 5, 6)
    g.fillStyle(0x222222); g.fillRect(1, 24, 6, 3); g.fillRect(9, 24, 6, 3)
    g.fillStyle(0x994400); g.fillRect(13, 10, 5, 8)
    g.generateTexture('player_jump', 20, 28)
  })

  replaceTexture(scene, 'ground', (g) => {
    g.fillStyle(0x334455); g.fillRect(0, 0, 32, 16)
    g.fillStyle(0x3d5566); g.fillRect(0, 0, 32, 4)
    g.fillStyle(0x2a3a48); g.fillRect(1, 5, 30, 1); g.fillRect(1, 9, 30, 1)
    g.fillStyle(0x4a6677, 0.5)
    for (let i = 0; i < 32; i += 4) g.fillRect(i, 0, 2, 16)
    g.generateTexture('ground', 32, 16)
  })

  replaceTexture(scene, 'platform', (g) => {
    g.fillStyle(0x445566); g.fillRect(0, 0, 64, 12)
    g.fillStyle(0x556677); g.fillRect(0, 0, 64, 4)
    g.fillStyle(0x334455); g.fillRect(0, 8, 64, 4)
    g.generateTexture('platform', 64, 12)
  })

  replaceTexture(scene, 'pickup', (g) => {
    const pts = []
    for (let i = 0; i < 10; i++) {
      const angle  = (i * Math.PI) / 5 - Math.PI / 2
      const radius = i % 2 === 0 ? 12 : 6
      pts.push(new Phaser.Geom.Point(16 + Math.cos(angle) * radius, 16 + Math.sin(angle) * radius))
    }
    g.fillStyle(0xffdd00)
    g.fillPoints(pts, true)
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(16, 16, 4)
    g.generateTexture('pickup', 32, 32)
  })

  replaceTexture(scene, 'pickup_hp', (g) => {
    g.fillStyle(0xff3333); g.fillRect(12, 4, 8, 24)
    g.fillStyle(0xff3333); g.fillRect(4, 12, 24, 8)
    g.fillStyle(0xffffff, 0.6); g.fillRect(14, 6, 4, 20); g.fillRect(6, 14, 20, 4)
    g.generateTexture('pickup_hp', 32, 32)
  })

  replaceTexture(scene, 'projectile', (g) => {
    g.fillStyle(0xff4444); g.fillEllipse(6, 3, 12, 6)
    g.fillStyle(0xffaaaa, 0.7); g.fillEllipse(5, 3, 7, 3)
    g.generateTexture('projectile', 12, 6)
  })

  replaceTexture(scene, 'boss_proj', (g) => {
    g.fillStyle(0xff0000); g.fillCircle(8, 8, 8)
    g.fillStyle(0xff8800, 0.7); g.fillCircle(8, 8, 5)
    g.fillStyle(0xffff00, 0.9); g.fillCircle(8, 8, 2)
    g.generateTexture('boss_proj', 16, 16)
  })

  replaceTexture(scene, 'particle', (g) => {
    g.fillStyle(0xffffff); g.fillCircle(4, 4, 4)
    g.generateTexture('particle', 8, 8)
  })

  for (let y = 0; y < 4; y++) {
    replaceTexture(scene, `bg_${y}`, (g) => {
      const pal = PALETTES[y]
      g.fillStyle(pal.sky); g.fillRect(0, 0, 160, 100)

      if (y === 0) {
        g.fillStyle(0xffffff, 0.8)
        for (let i = 0; i < 30; i++) g.fillRect((Math.random() * 160) | 0, (Math.random() * 60) | 0, 1, 1)
        g.fillStyle(0xeeeebb); g.fillCircle(130, 15, 8)
        g.fillStyle(pal.sky); g.fillCircle(134, 13, 6)
        g.fillStyle(0x0a1235)
        g.fillRect(0, 55, 30, 45); g.fillRect(35, 60, 25, 40); g.fillRect(65, 50, 20, 50)
        g.fillRect(90, 58, 28, 42); g.fillRect(125, 52, 35, 48)
        g.fillStyle(0x0a1538); g.fillRect(67, 40, 26, 30)
        g.fillStyle(0xffffff, 0.15); g.fillRect(75, 42, 10, 5)
      } else if (y === 1) {
        g.lineStyle(1, 0x003300, 0.5)
        for (let i = 0; i < 160; i += 16) g.lineBetween(i, 0, i, 100)
        for (let i = 0; i < 100; i += 16) g.lineBetween(0, i, 160, i)
        g.fillStyle(0x00ff00, 0.04); g.fillRect(0, 0, 160, 100)
        g.fillStyle(0x061806)
        g.fillRect(0, 60, 40, 40); g.fillRect(50, 65, 30, 35); g.fillRect(90, 55, 35, 45); g.fillRect(130, 62, 30, 38)
        g.fillStyle(0x003300); g.fillRect(5, 40, 25, 18); g.fillRect(55, 45, 20, 15); g.fillRect(95, 38, 25, 16)
        g.fillStyle(0x00ff00, 0.3); g.fillRect(6, 41, 23, 16); g.fillRect(56, 46, 18, 13); g.fillRect(96, 39, 23, 14)
      } else if (y === 2) {
        g.fillGradientStyle(0x2a1a00, 0x2a1a00, 0x7a3300, 0x7a3300)
        g.fillRect(0, 0, 160, 60)
        g.fillStyle(0xff6600, 0.8); g.fillCircle(80, 50, 18)
        g.fillStyle(0xffaa00, 0.5); g.fillCircle(80, 50, 28)
        g.fillStyle(0x1a0d00)
        g.fillRect(0, 55, 20, 45); g.fillRect(25, 48, 15, 52); g.fillRect(45, 60, 30, 40); g.fillRect(85, 52, 20, 48); g.fillRect(115, 58, 45, 42)
        g.lineStyle(2, 0x1a0d00)
        g.lineBetween(30, 48, 30, 20); g.lineBetween(30, 20, 60, 20); g.lineBetween(60, 20, 60, 35)
      } else {
        g.fillGradientStyle(0x1a0000, 0x1a0000, 0x550000, 0x550000)
        g.fillRect(0, 0, 160, 100)
        g.fillStyle(0x330000, 0.7); g.fillEllipse(30, 20, 50, 20); g.fillEllipse(80, 15, 60, 22); g.fillEllipse(140, 22, 40, 18)
        g.lineStyle(2, 0xff4400, 0.6)
        g.lineBetween(60, 20, 55, 35); g.lineBetween(55, 35, 63, 35); g.lineBetween(63, 35, 58, 50)
        g.fillStyle(0x0d0000)
        g.fillRect(0, 45, 25, 55); g.fillRect(30, 38, 20, 62); g.fillRect(55, 50, 30, 50); g.fillRect(90, 35, 25, 65); g.fillRect(120, 42, 40, 58)
        g.fillStyle(0xff8800, 0.4)
        for (let bx = 2; bx < 160; bx += 8) {
          for (let by = 40; by < 100; by += 8) {
            if (Math.random() > 0.6) g.fillRect(bx, by, 3, 3)
          }
        }
      }

      g.generateTexture(`bg_${y}`, 160, 100)
    })
  }

  for (let i = 0; i < YEAR_ENEMIES.length; i++) {
    YEAR_ENEMIES[i].forEach((cfg, j) => {
      replaceTexture(scene, `enemy_${i}_${j}`, (g) => {
        const s = cfg.size
        const c = cfg.color
        g.fillStyle(c); g.fillRect(2, 4, s - 4, s - 4)
        g.lineStyle(2, Phaser.Display.Color.ValueToColor(c).darken(30).color)
        g.strokeRect(2, 4, s - 4, s - 4)
        g.fillStyle(0xffffff); g.fillRect(4, 7, 5, 4); g.fillRect(s - 9, 7, 5, 4)
        g.fillStyle(0x000000); g.fillRect(5, 8, 3, 3); g.fillRect(s - 8, 8, 3, 3)
        g.fillStyle(0xff0000); g.fillRect(6, 9, 1, 1); g.fillRect(s - 7, 9, 1, 1)
        g.fillStyle(0x000000); g.fillRect(5, s - 7, s - 10, 2)
        g.fillStyle(0xffffff); g.fillRect(6, s - 7, 2, 2); g.fillRect(9, s - 7, 2, 2); g.fillRect(12, s - 7, 2, 2)
        g.fillStyle(c); g.fillRect(2, s - 2, 5, 5); g.fillRect(s - 7, s - 2, 5, 5)
        g.generateTexture(`enemy_${i}_${j}`, s + 2, s + 2)
      })
    })
  }

  replaceTexture(scene, 'boss', (g) => {
    g.fillStyle(0x111111); g.fillRect(10, 25, 60, 50)
    g.fillStyle(0xdd0000); g.fillRect(35, 25, 10, 35)
    g.fillStyle(0x990000); g.fillRect(37, 40, 6, 20)
    g.fillStyle(0xffcc88); g.fillRect(15, 4, 50, 22)
    g.fillStyle(0x111111); g.fillRect(15, 4, 50, 5)
    g.fillStyle(0xff0000); g.fillRect(20, 12, 10, 7); g.fillRect(50, 12, 10, 7)
    g.fillStyle(0x000000); g.fillRect(23, 13, 4, 5); g.fillRect(53, 13, 4, 5)
    g.fillStyle(0x111111); g.fillRect(18, 10, 14, 3); g.fillRect(48, 10, 14, 3)
    g.fillStyle(0x222222); g.fillRect(25, 22, 30, 3)
    g.fillStyle(0xffffff); g.fillRect(26, 22, 5, 2); g.fillRect(32, 22, 5, 2); g.fillRect(38, 22, 5, 2); g.fillRect(44, 22, 5, 2)
    g.fillStyle(0xffffff); g.fillRect(25, 24, 12, 6); g.fillRect(43, 24, 12, 6)
    g.fillStyle(0x111111); g.fillRect(0, 28, 12, 35); g.fillRect(68, 28, 12, 35)
    g.fillStyle(0xffcc88); g.fillRect(0, 60, 12, 8); g.fillRect(68, 60, 12, 8)
    g.fillStyle(0x884400); g.fillRect(66, 50, 16, 22)
    g.fillStyle(0xaa6600); g.fillRect(67, 51, 14, 4)
    g.lineStyle(1, 0x664400); g.strokeRect(66, 50, 16, 22)
    g.fillStyle(0x111111); g.fillRect(10, 73, 25, 10); g.fillRect(45, 73, 25, 10)
    g.fillStyle(0x000000); g.fillRect(8, 80, 28, 5); g.fillRect(44, 80, 28, 5)
    g.generateTexture('boss', 80, 88)
  })

  replaceTexture(scene, 'si_door', (g) => {
    g.fillStyle(0x1a3a5a); g.fillRect(0, 0, 80, 100)
    g.fillStyle(0x2255aa); g.fillRect(4, 4, 72, 92)
    g.lineStyle(3, 0x44aaff); g.strokeRect(15, 30, 50, 70)
    g.fillStyle(0x44aaff, 0.3); g.fillRect(16, 31, 48, 68)
    g.fillStyle(0x00ffff); g.fillRect(20, 10, 40, 14)
    g.fillStyle(0x001133); g.fillRect(22, 12, 36, 10)
    g.fillStyle(0xffcc00); g.fillCircle(57, 65, 4)
    g.generateTexture('si_door', 80, 100)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Support scenes (self-contained, no external imports needed)
// ─────────────────────────────────────────────────────────────────────────────

class TransitionScene extends Phaser.Scene {
  constructor() { super('BTechTransition') }

  init(data) {
    this.nextYear  = data.year
    this.prevScore = data.score
  }

  create() {
    const pal      = PALETTES[this.nextYear]
    const messages = [
      ['FRESHMAN YEAR BEGINS',  'You arrive with dreams, a backpack,\nand absolutely no idea what you are doing.', '#5b8cff'],
      ['SOPHOMORE YEAR',        'The labs are dark. The VMs crash.\nYour viva examiner has never smiled.',           '#39ff14'],
      ['JUNIOR YEAR',           'Three projects due. One teammate missing.\nThe client wants "minor changes."',       '#ff8800'],
      ['FINAL YEAR',            'This is it. PLACEMENTS.\nDSA. Aptitude. HR Rounds.\nThe final boss awaits.',        '#ff2222'],
    ]

    const [title, sub, color] = messages[this.nextYear]
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
    this.add.rectangle(W / 2, H / 2, W, H, pal.sky, 0.7)

    const yearTxt = this.add.text(W / 2, H / 2 - 55, `YEAR ${this.nextYear + 1}`, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 10)}px`,
      color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0)

    const titleTxt = this.add.text(W / 2, H / 2 - 20, title, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 28)}px`,
      color:      '#ffffff',
    }).setOrigin(0.5).setAlpha(0)

    const subTxt = this.add.text(W / 2, H / 2 + 20, sub, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 50)}px`,
      color:      '#aaaaaa',
      align:      'center',
    }).setOrigin(0.5).setAlpha(0)

    this.add.text(W / 2, H / 2 + 70, `score so far: ${this.prevScore}`, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 55)}px`,
      color:      '#666688',
    }).setOrigin(0.5)

    ;[yearTxt, titleTxt, subTxt].forEach((item, index) => {
      this.tweens.add({ targets: item, alpha: 1, delay: index * 250, duration: 400 })
    })

    this.time.delayedCall(3000, () => {
      const gameScene = this.scene.get('GameScene')
      if (gameScene) {
        gameScene.year = this.nextYear
        this.scene.resume('GameScene')
      }
      this.scene.stop()
    })
  }
}

class SILabScene extends Phaser.Scene {
  constructor() { super('BTechSILab') }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000d1a)

    const g = this.add.graphics()
    g.lineStyle(0.5, 0x0044aa, 0.3)
    for (let x = 0; x < W; x += 20) g.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += 20) g.lineBetween(0, y, W, y)

    const signBg = this.add.rectangle(W / 2, H / 2 - 40, W * 0.8, 50, 0x001133)
    signBg.setStrokeStyle(2, 0x0088ff)

    this.add.text(W / 2, H / 2 - 52, 'S  I  L  A  B', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 12)}px`,
      color:      '#44aaff',
    }).setOrigin(0.5)

    this.add.text(W / 2, H / 2 - 28, 'SYSTEMS & INNOVATION LABORATORY', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 55)}px`,
      color:      '#336699',
    }).setOrigin(0.5)

    const lines = [
      { y: H / 2 + 10, text: 'you push open the lab door.',           color: '#88aacc', delay: 600  },
      { y: H / 2 + 25, text: 'the hum of servers fills the air.',     color: '#88aacc', delay: 1400 },
      { y: H / 2 + 40, text: 'a professor nods - "you made it."',     color: '#aaccff', delay: 2400 },
      { y: H / 2 + 55, text: '"4 years. now the real work begins."',  color: '#ccddff', delay: 3400 },
    ]

    lines.forEach(({ y, text, color, delay }) => {
      const t = this.add.text(W / 2, y, '', {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(W / 55)}px`,
        color,
      }).setOrigin(0.5).setAlpha(0)

      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: 400 })
        let i = 0
        this.time.addEvent({
          delay: 45, repeat: text.length - 1,
          callback: () => t.setText(text.substring(0, ++i)),
        })
      })
    })

    const cont = this.add.text(W / 2, H - 20, '[ tap to continue ]', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 55)}px`,
      color:      '#334455',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: cont, alpha: 0.8, delay: 5000, duration: 800 })
    this.tweens.add({ targets: cont, alpha: 0.2, delay: 5800, duration: 600, yoyo: true, repeat: -1 })

    this.time.delayedCall(5000, () => {
      this.input.once('pointerdown', () => {
        this.scene.stop()
        this.scene.start('BTechEnding')
      })
    })
  }
}

class EndingScene extends Phaser.Scene {
  constructor() { super('BTechEnding') }

  create() {
    this._step  = 0
    this._lines = this._buildStory()
    this._showNext()
  }

  _buildStory() {
    const fs = (n) => `${Math.floor(W / n)}px`
    const cx = W / 2

    return [
      () => {
        this.add.rectangle(cx, H / 2, W, H, 0x0a0a1a)
        const g = this.add.graphics()
        g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0xff6600, 0xff3300, 0.8)
        g.fillRect(0, H * 0.5, W, H * 0.5)
        g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0xffaa00, 0xff6600, 0.4)
        g.fillRect(0, H * 0.35, W, H * 0.3)
        g.fillStyle(0xffcc44); g.fillCircle(cx, H * 0.52, W * 0.12)
        g.fillStyle(0xffaa00, 0.3); g.fillCircle(cx, H * 0.52, W * 0.2)
        g.fillStyle(0x050510)
        g.fillRect(0, H * 0.65, W * 0.3, H * 0.4); g.fillRect(W * 0.65, H * 0.62, W * 0.4, H * 0.4)
        g.fillRect(W * 0.35, H * 0.58, W * 0.3, H * 0.45)
        g.fillStyle(0x0a0a1a); g.fillRect(W * 0.43, H * 0.65, W * 0.14, H * 0.4)
        this.add.text(cx, H * 0.2, '"CONVOCATION DAY"', { fontFamily: '"Nunito", sans-serif', fontSize: fs(20), color: '#ffdd88', stroke: '#221100', strokeThickness: 2 }).setOrigin(0.5)
        this.add.text(cx, H * 0.32, 'four years ago, you arrived here\nwith a dream and a hostel room key.', { fontFamily: '"Nunito", sans-serif', fontSize: fs(50), color: '#aa9977', align: 'center' }).setOrigin(0.5)
      },
      () => {
        this.add.rectangle(cx, H / 2, W, H, 0x000000)
        const cert = this.add.rectangle(cx, H / 2, W * 0.75, H * 0.6, 0xfff8e8)
        cert.setStrokeStyle(4, 0xaa8800)
        const i2 = this.add.rectangle(cx, H / 2, W * 0.68, H * 0.52, 0xfff8e8)
        i2.setStrokeStyle(1, 0xcc9900)
        this.add.text(cx, H * 0.2, 'BACHELOR OF TECHNOLOGY', { fontFamily: '"Nunito", sans-serif', fontSize: fs(38), color: '#553300' }).setOrigin(0.5)
        this.add.text(cx, H * 0.34, 'This is to certify that', { fontFamily: '"Nunito", sans-serif', fontSize: fs(55), color: '#887755' }).setOrigin(0.5)
        this.add.text(cx, H * 0.46, 'YOU', { fontFamily: '"Nunito", sans-serif', fontSize: fs(18), color: '#220000', stroke: '#aa6600', strokeThickness: 1 }).setOrigin(0.5)
        this.add.text(cx, H * 0.58, 'has successfully survived\n4 years of B.Tech', { fontFamily: '"Nunito", sans-serif', fontSize: fs(52), color: '#666644', align: 'center' }).setOrigin(0.5)
        this.add.text(cx, H * 0.74, `CGPA: ${GS.cgpa.toFixed(1)}  |  SCORE: ${GS.score}`, { fontFamily: '"Nunito", sans-serif', fontSize: fs(55), color: '#997744' }).setOrigin(0.5)
        this.add.text(cx, H * 0.84, '* * *', { fontFamily: '"Nunito", sans-serif', fontSize: fs(30), color: '#ccaa00' }).setOrigin(0.5)
      },
      () => {
        this.add.rectangle(cx, H / 2, W, H, 0x000810)
        const g = this.add.graphics()
        g.lineStyle(0.5, 0x001133, 0.4)
        for (let x = 0; x < W; x += 16) g.lineBetween(x, 0, x, H)
        for (let y = 0; y < H; y += 16) g.lineBetween(0, y, W, y)
        this.add.text(cx, H * 0.1, '[ CAREER STATS ]', { fontFamily: '"Nunito", sans-serif', fontSize: fs(28), color: '#44aaff' }).setOrigin(0.5)
        const stats = [
          ['enemies defeated:', `${GS.totalEnemiesKilled}`],
          ['final cgpa:', `${GS.cgpa.toFixed(2)}`],
          ['final score:', `${GS.score}`],
          ['all-nighters (est):', '47'],
          ['cups of chai:', 'INF'],
          ['rejection letters:', `${Math.max(0, 12 - Math.floor(GS.cgpa))}`],
          ['placement status:', GS.cgpa >= 7.5 ? 'PLACED' : 'TRIES AGAIN'],
        ]
        stats.forEach(([k, v], i) => {
          const y2 = H * 0.22 + i * H * 0.1
          this.add.text(W * 0.12, y2, k, { fontFamily: '"Nunito", sans-serif', fontSize: fs(52), color: '#336688' })
          this.add.text(W * 0.88, y2, v, { fontFamily: '"Nunito", sans-serif', fontSize: fs(52), color: '#44ddff' }).setOrigin(1, 0)
        })
      },
      () => {
        this.add.rectangle(cx, H / 2, W, H, 0x000000)
        for (let i = 0; i < 50; i++) {
          const x = Phaser.Math.Between(0, W)
          const c = [0xffcc00, 0xff6600, 0x44aaff, 0xff44aa, 0x44ff88][i % 5]
          const dot = this.add.rectangle(x, Phaser.Math.Between(-H, 0), Phaser.Math.Between(3, 8), Phaser.Math.Between(3, 8), c, 0.8)
          this.tweens.add({ targets: dot, y: H + 20, duration: Phaser.Math.Between(1500, 3500), delay: Phaser.Math.Between(0, 1500), repeat: -1 })
        }
        this.add.text(cx, H * 0.2, '"THE JOURNEY ENDS.\nTHE STORY BEGINS."', {
          fontFamily: '"Nunito", sans-serif', fontSize: fs(28), color: '#ffffff', align: 'center',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5)
        const credits = [
          'you survived the lost syllabi,',
          'the midnight segfaults,',
          'the impossible deadlines,',
          'and the final boss: placements.',
          '',
          'it was never just about the degree.',
          'it was about who you became.',
          '',
          `enemies defeated: ${GS.totalEnemiesKilled}`,
          `score achieved: ${GS.score}`,
        ]
        credits.forEach((line, i) => {
          const t = this.add.text(cx, H * 0.42 + i * H * 0.057, line, {
            fontFamily: '"Nunito", sans-serif', fontSize: fs(55),
            color: i > 6 ? '#ffcc44' : '#778899', align: 'center',
          }).setOrigin(0.5).setAlpha(0)
          this.tweens.add({ targets: t, alpha: 1, delay: 400 + i * 250, duration: 500 })
        })
        this.time.delayedCall(6000, () => {
          const replay = this.add.text(cx, H - 18, '[ tap to play again ]', {
            fontFamily: '"Nunito", sans-serif', fontSize: fs(60), color: '#334455',
          }).setOrigin(0.5).setAlpha(0)
          this.tweens.add({ targets: replay, alpha: 0.8, duration: 600 })
          this.tweens.add({ targets: replay, alpha: 0.2, delay: 600, duration: 500, yoyo: true, repeat: -1 })
          this.input.once('pointerdown', () => this.scene.start('GameScene', { year: 0, resetState: true }))
        })
      },
    ]
  }

  _showNext() {
    if (this._step >= this._lines.length) return
    this.children.removeAll(true)
    this._lines[this._step]?.()
    this._step++
    if (this._step < this._lines.length) {
      this.time.delayedCall(5200, () => this._showNext())
      this.input.once('pointerdown', () => {
        this.time.removeAllEvents()
        this._showNext()
      })
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
      GS.health          = 100
      GS.maxHealth       = 100
      GS.score           = 0
      GS.year            = 0
      GS.powerupType     = null
      GS.powerupTimer    = 0
      GS.cgpa            = 10.0
      GS.hasResumeBoost  = false
      GS.totalEnemiesKilled = 0
    }
    this._lastDmgTime    = 0
    this._jumpCount      = 0
    this._bossSpawned    = false
    this._levelComplete  = false
    this._transitioning  = false
    this._killedEnemies  = 0
    this._powerupActive  = false
    this._powerupEndTime = 0
    this._powerupType    = null
    this._bgTile         = null
    this._lowHpWarn      = null
    this._boss           = null
    this._bossBar        = null
    this._bossPhaseText  = null
  }

  // ── create ────────────────────────────────────────────────────────────────
  create() {
    ensureTextures(this)
    this._ensureSupportScenes()

    const pal = PALETTES[this.year]

    this.scale.resize(W, H)
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, H)
    this.physics.world.gravity.y = 700

    this._buildBackground()
    this._buildGround(pal)
    this._buildPlatforms(pal)

    // physics groups
    this.enemies     = this.physics.add.group()
    this.pickups     = this.physics.add.group()
    this.projectiles = this.physics.add.group()  // player projectiles (unused for now)
    this.bossProjs   = this.physics.add.group()  // boss projectiles — separate group

    // player
    this.player = this.physics.add.image(60, GROUND_Y - 30, 'player')
    this.player
      .setCollideWorldBounds(true)
      .setBounce(0.02)
      .setDragX(800)
      .setMaxVelocity(380, 650)
      .setDepth(10)

    this._populateLevel()

    // camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, H)
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09)

    // colliders
    this.physics.add.collider(this.player,  this.groundLayer)
    this.physics.add.collider(this.player,  this.platforms)
    this.physics.add.collider(this.enemies, this.groundLayer)
    this.physics.add.collider(this.enemies, this.platforms)

    // overlaps
    this.physics.add.overlap(this.player, this.enemies,     this._onEnemyHit,  null, this)
    this.physics.add.overlap(this.player, this.pickups,     this._onPickup,    null, this)
    this.physics.add.overlap(this.player, this.bossProjs,   this._onProjHit,   null, this)

    // input
    this.cursors    = this.input.keyboard.createCursorKeys()
    this.wasd       = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' })
    this.attackKey  = this.input.keyboard.addKey('Z')
    this.attackKey2 = this.input.keyboard.addKey('X')

    this._joystick = { active: false, startX: 0, curX: 0 }
    this._buildMobileControls()
    this._buildHUD()
    this._buildAtmosphere()

    this.cameras.main.fadeIn(400)

    // cleanup on shutdown
    this.events.once('shutdown', () => {
      this.input.off('pointerdown')
      this.input.off('pointermove')
      this.input.off('pointerup')
    })
  }

  // ── scene registration ────────────────────────────────────────────────────
  _ensureSupportScenes() {
    if (!this.scene.manager.keys['BTechTransition']) this.scene.add('BTechTransition', TransitionScene, false)
    if (!this.scene.manager.keys['BTechSILab'])      this.scene.add('BTechSILab',      SILabScene,      false)
    if (!this.scene.manager.keys['BTechEnding'])     this.scene.add('BTechEnding',     EndingScene,     false)
  }

  // ── background ────────────────────────────────────────────────────────────
  _buildBackground() {
    const sw = this.scale.width

    this._bgTile = this.add.tileSprite(sw / 2, H / 2, sw, H, `bg_${this.year}`)
      .setScrollFactor(0)
      .setDepth(-3)

    const pal = PALETTES[this.year]
    const fg  = this.add.graphics().setScrollFactor(0).setDepth(-1)
    fg.fillGradientStyle(pal.fog, pal.fog, pal.sky, pal.sky, 0.7, 0.7, 0, 0)
    fg.fillRect(0, 0, sw, H)

    this._getZoneLabels().forEach(({ x, text }) => {
      this.add.text(x, 16, text, {
        fontFamily: '"Nunito", sans-serif', fontSize: '6px', color: colorHex(pal.accent),
      }).setAlpha(0.3).setDepth(0)
    })

    // SI-Lab door on year 3
    if (this.year === 3) {
      this.siDoor = this.add.image(LEVEL_WIDTH - 80, GROUND_Y - 50, 'si_door').setDepth(2)
      const glow  = this.add.rectangle(LEVEL_WIDTH - 80, GROUND_Y - 30, 60, 80, 0x44aaff, 0.15).setDepth(1)
      this.tweens.add({ targets: glow, alpha: 0.05, duration: 1200, yoyo: true, repeat: -1 })
    }
  }

  _getZoneLabels() {
    const names = [
      [{ x: 50, text: 'ORIENTATION' }, { x: 800, text: 'FIRST SEMESTER' }, { x: 1600, text: 'MID SEMS' }, { x: 2400, text: 'END SEMS' }],
      [{ x: 50, text: 'LAB 1'       }, { x: 800, text: 'LAB 2'          }, { x: 1600, text: 'MINI PROJECT' }, { x: 2400, text: 'LAB VIVA' }],
      [{ x: 50, text: 'IDEATION'    }, { x: 800, text: 'DEVELOPMENT'    }, { x: 1600, text: 'DEADLINES' }, { x: 2400, text: 'DEMO DAY' }],
      [{ x: 50, text: 'RESUME'      }, { x: 800, text: 'APTITUDE'       }, { x: 1600, text: 'TECH ROUND' }, { x: 2400, text: 'HR / BOSS' }],
    ]
    return names[this.year] || []
  }

  // ── ground & platforms ────────────────────────────────────────────────────
  _buildGround(pal) {
    pal = pal || PALETTES[this.year]
    this.groundLayer = this.physics.add.staticGroup()
    for (let x = 0; x < LEVEL_WIDTH; x += 32) {
      const t = this.groundLayer.create(x + 16, GROUND_Y + 8, 'ground')
      t.setTint(pal.ground)
      t.refreshBody()
    }
  }

  _buildPlatforms(pal) {
    pal = pal || PALETTES[this.year]
    const configs = [
      [[350,GROUND_Y-55],[600,GROUND_Y-90],[900,GROUND_Y-60],[1100,GROUND_Y-100],[1400,GROUND_Y-70],[1700,GROUND_Y-50],[1900,GROUND_Y-90],[2200,GROUND_Y-65],[2500,GROUND_Y-80],[2800,GROUND_Y-55]],
      [[300,GROUND_Y-60],[550,GROUND_Y-95],[750,GROUND_Y-60],[1000,GROUND_Y-80],[1300,GROUND_Y-105],[1500,GROUND_Y-70],[1800,GROUND_Y-90],[2100,GROUND_Y-55],[2400,GROUND_Y-80],[2700,GROUND_Y-100]],
      [[400,GROUND_Y-50],[650,GROUND_Y-85],[900,GROUND_Y-110],[1050,GROUND_Y-70],[1300,GROUND_Y-90],[1600,GROUND_Y-55],[1900,GROUND_Y-80],[2150,GROUND_Y-100],[2450,GROUND_Y-65],[2750,GROUND_Y-85]],
      [[300,GROUND_Y-65],[500,GROUND_Y-100],[700,GROUND_Y-70],[1000,GROUND_Y-95],[1300,GROUND_Y-60],[1600,GROUND_Y-85],[1900,GROUND_Y-110],[2200,GROUND_Y-70],[2500,GROUND_Y-90],[2800,GROUND_Y-65]],
    ]
    this.platforms = this.physics.add.staticGroup()
    ;(configs[this.year] || []).forEach(([x, y]) => {
      const p = this.platforms.create(x, y, 'platform')
      p.setTint(pal.ground)
      p.refreshBody()
    })
  }

  // ── atmosphere ────────────────────────────────────────────────────────────
  _buildAtmosphere() {
    if (this.year === 0) {
      for (let i = 0; i < 40; i++) {
        const s = this.add.circle(
          Phaser.Math.Between(0, LEVEL_WIDTH),
          Phaser.Math.Between(0, GROUND_Y - 60),
          Phaser.Math.Between(1, 2), 0xffffff,
          Phaser.Math.FloatBetween(0.3, 0.9)
        ).setDepth(-2)
        this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2500), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) })
      }
    } else if (this.year === 1) {
      this._rainTimer = this.time.addEvent({
        delay: 150, loop: true,
        callback: () => {
          const x     = Phaser.Math.Between(0, LEVEL_WIDTH)
          const chars = ['0','1','#','$','@','!','?','{','}']
          const c     = this.add.text(x, 0, Phaser.Utils.Array.GetRandom(chars), {
            fontFamily: '"Nunito", sans-serif', fontSize: '8px', color: '#00ff00',
          }).setAlpha(0.4).setDepth(-1)
          this.tweens.add({ targets: c, y: H, duration: Phaser.Math.Between(1500, 3000), alpha: 0, onComplete: () => c.destroy() })
        },
      })
    } else if (this.year === 2) {
      this._debrisTimer = this.time.addEvent({
        delay: 800, loop: true,
        callback: () => {
          const y = Phaser.Math.Between(20, GROUND_Y - 50)
          const d = this.add.rectangle(LEVEL_WIDTH + 20, y, Phaser.Math.Between(4, 12), Phaser.Math.Between(4, 12), 0xff8800, 0.6).setDepth(-1)
          this.tweens.add({ targets: d, x: -50, duration: Phaser.Math.Between(2000, 4000), angle: 360, onComplete: () => d.destroy() })
        },
      })
    } else if (this.year === 3) {
      this._rejectTimer = this.time.addEvent({
        delay: 400, loop: true,
        callback: () => {
          const msgs = ['REJECTED','NOT SELECTED','MOVED ON','UNSUCCESSFUL']
          const r    = this.add.text(Phaser.Math.Between(0, LEVEL_WIDTH), -10, Phaser.Utils.Array.GetRandom(msgs), {
            fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ff3333',
          }).setAlpha(0.3).setDepth(-1)
          this.tweens.add({ targets: r, y: H + 10, duration: Phaser.Math.Between(3000, 6000), alpha: 0, onComplete: () => r.destroy() })
        },
      })
    }
  }

  // ── level population ──────────────────────────────────────────────────────
  _populateLevel() {
    const cfgs      = YEAR_ENEMIES[this.year]
    const positions = []
    for (let i = 0; i < 12; i++) positions.push(300 + i * 220 + Phaser.Math.Between(-40, 40))

    positions.forEach((x, i) => {
      const cfg = cfgs[i % cfgs.length]
      this._spawnEnemy(x, GROUND_Y - cfg.size / 2 - 2, cfg, i)
    })

    ;[450, 900, 1400, 1900, 2400].forEach((x, i) => {
      this._spawnPickup(x, GROUND_Y - 50, i % 2 === 0 ? 'pickup' : 'pickup_hp')
    })

    this._spawnPowerup(700 + this.year * 300, GROUND_Y - 55)

    // Boss only on year 3; spawn with a small delay so physics is settled
    if (this.year === 3) {
      this.time.delayedCall(200, () => this._spawnBoss())
    }
  }

  _spawnEnemy(x, y, cfg, idx) {
    const key = `enemy_${this.year}_${idx % YEAR_ENEMIES[this.year].length}`
    const e   = this.enemies.create(x, y, key)
    e.setCollideWorldBounds(true).setBounce(0.1).setDepth(8)
    e.setData('hp',    cfg.hp)
    e.setData('maxHp', cfg.hp)
    e.setData('speed', cfg.speed)
    e.setData('label', cfg.label)
    e.setData('isBoss', false)

    const lbl = this.add.text(x, y - cfg.size / 2 - 10, cfg.label, {
      fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ffaaaa',
    }).setOrigin(0.5).setDepth(9)
    e.setData('lbl', lbl)
    return e
  }

  _spawnPickup(x, y, key = 'pickup') {
    const p = this.pickups.create(x, y, key)
    p.setCollideWorldBounds(false).setDepth(7)
    p.body.allowGravity = false
    p.setData('pickupKey', key)
    this.tweens.add({ targets: p, y: y - 10, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut' })
    return p
  }

  _spawnPowerup(x, y) {
    const pu = POWERUPS[this.year]
    const p  = this.pickups.create(x, y, 'pickup')
    p.setTint(pu.color).setDepth(7).setScale(1.2)
    p.body.allowGravity = false
    p.setData('isPowerup', true)
    p.setData('puType', pu.type)
    this.tweens.add({ targets: p, angle: 360, duration: 2000, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: p, y: y - 12, yoyo: true, repeat: -1, duration: 700 })
    this.add.text(x, y - 25, pu.label, {
      fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ffff88',
    }).setOrigin(0.5).setDepth(9)
    return p
  }

  _spawnBoss() {
    const boss = this.enemies.create(LEVEL_WIDTH - 300, GROUND_Y - 50, 'boss')
    boss.setCollideWorldBounds(true).setDepth(9)
    boss.setData('hp',       30)
    boss.setData('maxHp',    30)
    boss.setData('speed',    60)
    boss.setData('isBoss',   true)
    boss.setData('phase',    1)
    boss.setData('lastShot', 0)

    // Boss needs its own colliders because it was added after the group colliders
    this.physics.add.collider(boss, this.groundLayer)
    this.physics.add.collider(boss, this.platforms)

    const sw = this.scale.width
    // Boss HP bar (HUD)
    this.add.rectangle(sw / 2, 20, 200, 10, 0x220000).setScrollFactor(0).setDepth(50)
    this._bossBar = this.add.rectangle(sw / 2 - 99, 20, 198, 8, 0xff0000)
      .setScrollFactor(0).setDepth(51).setOrigin(0, 0.5)
    this.add.text(sw / 2, 10, 'PLACEMENTS', {
      fontFamily: '"Nunito", sans-serif', fontSize: '6px', color: '#ff4444',
    }).setScrollFactor(0).setDepth(51).setOrigin(0.5)

    this._bossPhaseText = this.add.text(sw / 2, 30, 'PHASE 1', {
      fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ff8888',
    }).setScrollFactor(0).setDepth(51).setOrigin(0.5)

    this._bossSpawned = true
    this._boss        = boss

    this.cameras.main.shake(600, 0.02)
    const warning = this.add.text(sw / 2, H / 2, 'PLACEMENTS INCOMING', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(sw / 25)}px`,
      color:      '#ff0000',
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5)
    this.tweens.add({ targets: warning, alpha: 0, duration: 2500, delay: 500, onComplete: () => warning.destroy() })
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    const sw = this.scale.width
    this.add.rectangle(sw / 2, 10, sw, 20, 0x000000, 0.65).setScrollFactor(0).setDepth(40)

    this._hudHp     = this.add.text(8, 4, 'HP 100', { fontFamily: '"Nunito", sans-serif', fontSize: '7px', color: '#ff6666' }).setScrollFactor(0).setDepth(41)
    this._hudScore  = this.add.text(sw / 2, 4, 'SCORE: 0', { fontFamily: '"Nunito", sans-serif', fontSize: '7px', color: '#aabbff' }).setScrollFactor(0).setDepth(41).setOrigin(0.5, 0)
    this._hudYear   = this.add.text(sw - 8, 4, `YEAR ${this.year + 1}`, { fontFamily: '"Nunito", sans-serif', fontSize: '7px', color: '#ffcc44' }).setScrollFactor(0).setDepth(41).setOrigin(1, 0)

    this._hpBarBg   = this.add.rectangle(8, 14, 80, 4, 0x330000).setScrollFactor(0).setDepth(41).setOrigin(0, 0.5)
    this._hpBar     = this.add.rectangle(8, 14, 80, 4, 0xff3333).setScrollFactor(0).setDepth(42).setOrigin(0, 0.5)
    this._hudPowerup = this.add.text(8, 20, '', { fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ffcc00' }).setScrollFactor(0).setDepth(41)
    this._hudKills  = this.add.text(sw - 8, 14, 'K 0', { fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#ff6666' }).setScrollFactor(0).setDepth(41).setOrigin(1, 0)
    this._hudCgpa   = this.add.text(sw / 2, 14, `CGPA: ${GS.cgpa.toFixed(1)}`, { fontFamily: '"Nunito", sans-serif', fontSize: '5px', color: '#88aacc' }).setScrollFactor(0).setDepth(41).setOrigin(0.5, 0)
  }

  _updateHUD() {
    const hp = Math.max(0, GS.health)
    this._hudHp?.setText(`HP ${hp}`)
    if (this._hpBar) this._hpBar.width = (hp / GS.maxHealth) * 80
    this._hpBar?.setFillStyle(hp < 30 ? 0xff0000 : hp < 60 ? 0xff8800 : 0xff3333)
    this._hudScore?.setText(`SCORE: ${GS.score}`)
    this._hudKills?.setText(`K ${this._killedEnemies}`)
    this._hudCgpa?.setText(`CGPA: ${GS.cgpa.toFixed(1)}`)
  }

  // ── mobile controls ───────────────────────────────────────────────────────
  _buildMobileControls() {
    const w       = this.scale.width
    const h       = this.scale.height
    const btnSize = Math.min(w * 0.12, 40)

    this._joyBase = this.add.circle(w * 0.15, h * 0.82, btnSize * 0.9, 0xffffff, 0.08).setScrollFactor(0).setDepth(100)
    this._joyDot  = this.add.circle(w * 0.15, h * 0.82, btnSize * 0.35, 0xffffff, 0.25).setScrollFactor(0).setDepth(101)

    const jumpBtn   = this._makeBtn(w * 0.85, h * 0.72, btnSize, 'UP',  0x2244ff)
    const attackBtn = this._makeBtn(w * 0.72, h * 0.82, btnSize, 'ATK', 0xff3333)

    this.input.on('pointerdown', (p) => {
      if (p.x < w * 0.55 && p.y > h * 0.55) {
        this._joystick.active = true
        this._joystick.startX = p.x
        this._joystick.curX   = p.x
        this._joyBase.setPosition(p.x, p.y).setAlpha(0.2)
        this._joyDot.setPosition(p.x, p.y)
      }
    })

    this.input.on('pointermove', (p) => {
      if (this._joystick.active) {
        this._joystick.curX = p.x
        const dx = Phaser.Math.Clamp(p.x - this._joystick.startX, -30, 30)
        this._joyDot.setPosition(this._joystick.startX + dx, p.y)
      }
    })

    this.input.on('pointerup', (p) => {
      if (p.x < this.scale.width * 0.55) {
        this._joystick.active = false
        this._joystick.curX   = this._joystick.startX
        this._joyBase.setAlpha(0.08)
        this._joyDot.setPosition(w * 0.15, h * 0.82)
      }
    })

    jumpBtn.on('pointerdown',   () => this._tryJump())
    attackBtn.on('pointerdown', () => this._tryAttack())
  }

  _makeBtn(x, y, size, label, bgColor) {
    const btn = this.add.circle(x, y, size, bgColor, 0.35).setScrollFactor(0).setDepth(100).setInteractive()
    this.add.text(x, y, label, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${size * 0.36}px`, color: '#ffffff',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    const g = this.add.graphics().setScrollFactor(0).setDepth(100)
    g.lineStyle(1.5, bgColor, 0.6)
    g.strokeCircle(x, y, size)
    return btn
  }

  // ── update ────────────────────────────────────────────────────────────────
  update(time) {
    if (!this.player?.active || !this.player.body || this._levelComplete) return

    const onGround = this.player.body.blocked.down
    if (onGround) this._jumpCount = 0

    // Scroll background parallax
    if (this._bgTile) this._bgTile.tilePositionX = this.cameras.main.scrollX * 0.08

    // ── movement ──────────────────────────────────────────────────────────
    const speed = PLAYER_SPEED * (this._powerupActive ? 1.5 : 1)
    let moveX   = 0

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  moveX = -1
    if (this.cursors.right.isDown || this.wasd.right.isDown) moveX =  1

    // Joystick override
    if (this._joystick.active) {
      const dx = this._joystick.curX - this._joystick.startX
      if (Math.abs(dx) > 8) moveX = dx > 0 ? 1 : -1
    }

    // FIX: removed the old "else moveX = 0.3" auto-drift bug
    this.player.setVelocityX(moveX * speed)

    if (moveX < 0)      this.player.setFlipX(true)
    else if (moveX > 0) this.player.setFlipX(false)

    this.player.setTexture(onGround ? 'player' : 'player_jump')

    // ── jump ──────────────────────────────────────────────────────────────
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space)  ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up)
    ) {
      this._tryJump()
    }

    // ── attack ────────────────────────────────────────────────────────────
    if (
      Phaser.Input.Keyboard.JustDown(this.attackKey)  ||
      Phaser.Input.Keyboard.JustDown(this.attackKey2)
    ) {
      this._tryAttack()
    }

    // ── enemy AI ──────────────────────────────────────────────────────────
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return
      const lbl = e.getData('lbl')
      if (lbl) lbl.setPosition(e.x, e.y - e.height * 0.7 - 6)

      if (e.getData('isBoss')) {
        this._updateBoss(e, time)
      } else {
        const dx  = this.player.x - e.x
        const spd = e.getData('speed') || 60
        if (Math.abs(dx) < 400) e.setVelocityX(dx > 0 ? spd : -spd)
        else e.setVelocityX(0)
        // Rare jump
        if (e.body.blocked.down && Phaser.Math.Between(0, 200) === 0)
          e.setVelocityY(-300 - Math.random() * 100)
      }
    })

    // ── powerup timer ─────────────────────────────────────────────────────
    if (this._powerupActive && time > this._powerupEndTime) {
      this._powerupActive = false
      this._hudPowerup?.setText('')
      this._showFloatingText(this.player.x, this.player.y - 30, 'powerup ended', '#888888')
    }

    // ── boss HP bar ───────────────────────────────────────────────────────
    if (this.year === 3 && this._bossSpawned && this._boss?.active) {
      const hp = this._boss.getData('hp')
      if (this._bossBar) this._bossBar.setWidth(Math.max(0, (hp / 30) * 198))
    }

    // ── level end trigger ─────────────────────────────────────────────────
    if (!this._transitioning && this.player.x > LEVEL_WIDTH - 150) {
      if (this.year === 3 && this._boss?.active) {
        this._showFloatingText(this.player.x, this.player.y - 40, 'defeat the boss first!', '#ff4444')
      } else {
        this._completeLevel()
      }
    }

    this._updateHUD()
  }

  // ── boss AI ───────────────────────────────────────────────────────────────
  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const maxHp = boss.getData('maxHp') || 30
    const frac  = hp / maxHp
    const phase = frac > 0.65 ? 1 : frac > 0.35 ? 2 : 3

    boss.setData('phase', phase)

    const phaseTints = [0xff0000, 0xff6600, 0xffcc00]
    boss.setTint(phaseTints[phase - 1])
    if (this._bossPhaseText) this._bossPhaseText.setText(`PHASE ${phase}`)

    const speeds = [70, 100, 140]
    const dx     = this.player.x - boss.x
    if (Math.abs(dx) > 60) boss.setVelocityX(dx > 0 ? speeds[phase - 1] : -speeds[phase - 1])
    else boss.setVelocityX(0)

    if (boss.body.blocked.down && Phaser.Math.Between(0, 120) === 0) boss.setVelocityY(-380)

    const intervals = [3000, 1800, 900]
    const lastShot  = boss.getData('lastShot') || 0
    if (time - lastShot > intervals[phase - 1]) {
      boss.setData('lastShot', time)
      this._bossShoot(boss, phase)
    }
  }

  _bossShoot(boss, phase) {
    const dir = this.player.x - boss.x > 0 ? 1 : -1

    const shoot = (vx, vy) => {
      // Use bossProjs group so the existing overlap fires correctly
      const p = this.bossProjs.create(boss.x + dir * 20, boss.y - 20, 'boss_proj')
      if (!p) return
      p.setVelocity(vx, vy)
      p.body.allowGravity = false
      p.setDepth(9)
      this.time.delayedCall(4000, () => { if (p?.active) p.destroy() })
    }

    if (phase === 1) {
      shoot(dir * 240, -30)
    } else if (phase === 2) {
      shoot(dir * 260, -20)
      shoot(dir * 200, -120)
    } else {
      shoot(dir * 280, -10)
      shoot(dir * 220, -90)
      shoot(dir * 150, -180)
    }
  }

  // ── actions ───────────────────────────────────────────────────────────────
  _tryJump() {
    if (this._jumpCount >= 2) return
    this.player.setVelocityY(JUMP_VEL)
    this._jumpCount++
    const p = this.add.circle(this.player.x, this.player.y + 12, 8, 0xffffff, 0.3)
    this.tweens.add({ targets: p, scaleX: 3, scaleY: 0.5, alpha: 0, duration: 300, onComplete: () => p.destroy() })
  }

  _tryAttack() {
    const range   = this._powerupActive ? 120 : 80
    const dmgMult = this._powerupType === 'offer' ? 4 : this._powerupActive ? 2 : 1

    const slash = this.add.graphics().setDepth(15)
    slash.lineStyle(3, 0xffffff, 0.8)
    const dir = this.player.flipX ? -1 : 1
    slash.lineBetween(this.player.x, this.player.y - 10, this.player.x + dir * range, this.player.y + 10)
    this.tweens.add({ targets: slash, alpha: 0, duration: 150, onComplete: () => slash.destroy() })

    let hitAny = false
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
      if (dist < range) {
        hitAny         = true
        const isBoss   = e.getData('isBoss')
        const dmg      = isBoss ? dmgMult : dmgMult * (1 + Math.random())
        const newHp    = (e.getData('hp') || 1) - Math.ceil(dmg)
        e.setData('hp', newHp)
        this._showFloatingText(e.x, e.y - 20, `-${Math.ceil(dmg)}`, '#ff5555')
        e.setTint(0xffffff)
        this.time.delayedCall(100, () => { if (e.active) e.clearTint() })
        e.setVelocityX(dir * 200)
        if (newHp <= 0) this._killEnemy(e)
      }
    })

    if (!hitAny) this._showFloatingText(this.player.x + dir * 40, this.player.y - 10, 'miss!', '#666688')
  }

  // ── kill / death ──────────────────────────────────────────────────────────
  _killEnemy(e) {
    const isBoss = e.getData('isBoss')
    const lbl    = e.getData('lbl')
    if (lbl) lbl.destroy()

    // Particle burst
    const colors = [0xff8800, 0xffcc00, 0xff4444, 0xffffff]
    for (let i = 0; i < 10; i++) {
      const c  = Phaser.Utils.Array.GetRandom(colors)
      const px = e.x + Phaser.Math.Between(-15, 15)
      const py = e.y + Phaser.Math.Between(-15, 15)
      const d  = this.add.circle(px, py, Phaser.Math.Between(2, 5), c, 1).setDepth(20)
      this.tweens.add({
        targets: d,
        x: px + Phaser.Math.Between(-50, 50),
        y: py - Phaser.Math.Between(20, 60),
        alpha: 0, duration: Phaser.Math.Between(400, 700),
        onComplete: () => d.destroy(),
      })
    }

    if (isBoss) {
      this._onBossDefeated()
    } else {
      e.destroy()
      this._killedEnemies++
      GS.score += 50 + this.year * 25
      GS.totalEnemiesKilled++
      this._showFloatingText(e.x, e.y - 30, `+${50 + this.year * 25} pts`, '#ffcc44')
    }
  }

  _onBossDefeated() {
    if (this._levelComplete) return   // guard against double-fire
    this._levelComplete = true

    this._boss?.destroy()
    this._boss = null
    if (this._bossBar) this._bossBar.setWidth(0)

    this.cameras.main.shake(800, 0.03)
    this.cameras.main.flash(1000, 255, 200, 50)

    this._killedEnemies++
    GS.totalEnemiesKilled++
    GS.score += 500

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(90)
    this.tweens.add({ targets: overlay, alpha: 0.6, duration: 800 })

    this.add.text(W / 2, H / 2 - 30, 'BOSS DEFEATED!', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 18)}px`,
      color:      '#ffcc00', stroke: '#884400', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.add.text(W / 2, H / 2 + 10, '"PLACEMENTS CONQUERED"\n+500 points!', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 40)}px`,
      color:      '#ffffff', align: 'center',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.time.delayedCall(3000, () => this._goToSILab())
  }

  // ── collision handlers ────────────────────────────────────────────────────
  _onEnemyHit(player, enemy) {
    if (!enemy.active)               return
    if (enemy.getData('isBoss'))     return   // boss does ranged damage only
    const now = this.time.now
    if (now - this._lastDmgTime < DMG_COOLDOWN) return
    this._lastDmgTime = now
    this._takeDamage(10 + this.year * 3)
    const dir = player.x < enemy.x ? -1 : 1
    player.setVelocityX(dir * 300).setVelocityY(-150)
  }

  _onPickup(player, pickup) {
    if (!pickup?.active) return
    const isPowerup  = pickup.getData('isPowerup')
    const pickupKey  = pickup.getData('pickupKey')
    pickup.destroy()

    if (isPowerup) {
      const pu             = POWERUPS[this.year]
      this._powerupActive  = true
      this._powerupEndTime = this.time.now + pu.duration
      this._powerupType    = pu.type
      GS.powerupType       = pu.type
      this._showFloatingText(player.x, player.y - 35, pu.label, '#ffff44', 12)
      this._hudPowerup?.setText(pu.label)
      GS.score += 200
      this.cameras.main.flash(300, 255, 200, 0)
    } else {
      if (pickupKey === 'pickup_hp') {
        const heal = 25
        GS.health  = Math.min(GS.maxHealth, GS.health + heal)
        this._showFloatingText(player.x, player.y - 35, `+${heal} HP`, '#44ff88', 12)
      } else {
        GS.score += 100
        this._showFloatingText(player.x, player.y - 35, '+100 pts', '#ffcc44', 12)
      }
      this.cameras.main.flash(150, 100, 255, 100)
    }
  }

  _onProjHit(_player, proj) {
    if (!proj?.active) return
    const now = this.time.now
    if (now - this._lastDmgTime < DMG_COOLDOWN) return
    // Offer letter powerup = immune to projectiles
    if (this._powerupActive && this._powerupType === 'offer') {
      proj.destroy()
      return
    }
    this._lastDmgTime = now
    proj.destroy()
    this._takeDamage(15 + this.year * 5)
  }

  // ── damage ────────────────────────────────────────────────────────────────
  _takeDamage(amount) {
    if (this._powerupActive && this._powerupType === 'chai') amount = Math.floor(amount * 0.4)
    GS.health = Math.max(1, GS.health - amount)
    GS.cgpa   = Math.max(4.0, GS.cgpa - 0.05)

    this._showFloatingText(this.player.x, this.player.y - 25, `-${amount}`, '#ff4444')
    this.cameras.main.shake(120, 0.015)
    this.cameras.main.flash(80, 255, 30, 30)
    this.tweens.add({
      targets: this.player, alpha: 0.2,
      duration: 80, repeat: 5, yoyo: true,
      onComplete: () => { if (this.player?.active) this.player.setAlpha(1) }
    })

    if (GS.health <= 5 && !this._lowHpWarn) {
      this._lowHpWarn = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, 'LOW HP', {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(this.scale.width / 25)}px`,
        color:      '#ff0000',
      }).setScrollFactor(0).setDepth(80).setOrigin(0.5)
      this.tweens.add({ targets: this._lowHpWarn, alpha: 0.1, duration: 300, yoyo: true, repeat: -1 })
    }
  }

  // ── level complete ────────────────────────────────────────────────────────
  _completeLevel() {
    if (this._transitioning) return
    this._transitioning = true
    this._levelComplete = true

    GS.score += 300 + this._killedEnemies * 20
    GS.cgpa   = Math.min(10.0, GS.cgpa + 0.3)

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setScrollFactor(0).setDepth(90)
    const yearNames = ['YEAR 1 CLEARED!', 'YEAR 2 CLEARED!', 'YEAR 3 CLEARED!', 'YEAR 4 CLEARED!']

    this.add.text(W / 2, H / 2 - 30, yearNames[this.year], {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 22)}px`,
      color:      '#ffcc44',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.add.text(W / 2, H / 2 + 10, `score: ${GS.score}   cgpa: ${GS.cgpa.toFixed(1)}`, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 45)}px`,
      color:      '#aabbff',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5)

    this.time.delayedCall(2500, () => {
      if (this.year < 3) {
        this.scene.pause('GameScene')
        this.scene.launch('BTechTransition', { year: this.year + 1, score: GS.score })
      } else {
        this._goToSILab()
      }
    })
  }

  _goToSILab() {
    this.scene.stop()
    this.scene.start('BTechSILab')
  }

  // ── utils ─────────────────────────────────────────────────────────────────
  _showFloatingText(x, y, text, color = '#ffffff', size = 8) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${size}px`, color,
    }).setOrigin(0.5).setDepth(30)
    this.tweens.add({
      targets: t, y: y - 30, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    })
  }
}
