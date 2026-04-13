// ─────────────────────────────────────────────────────────────────────────────
// BootScene.js  ·  v2 — CINEMATIC BOOT
// Mobile-first. Generates all placeholder textures.
// Replace generateTexture() calls with this.load.image() when you have sprites.
// ─────────────────────────────────────────────────────────────────────────────

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  // ── preload ──────────────────────────────────────────────────────────────
  preload() {
    this._buildLoadingScreen()
    this._generateAllTextures()
  }

  _buildLoadingScreen() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Starfield base ───────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x020210).setOrigin(0)

    const starG = this.add.graphics()
    for (let i = 0; i < 220; i++) {
      const x  = Math.random() * W
      const y  = Math.random() * H
      const r  = Math.random()
      const sz = r < 0.6 ? 0.6 : r < 0.9 ? 1.1 : 1.8
      const a  = 0.2 + Math.random() * 0.7
      starG.fillStyle(0xffffff, a)
      starG.fillCircle(x, y, sz)
    }

    // ── Gradient orb behind loader ───────────────────────────────────────
    const orb = this.add.circle(W / 2, H * 0.6, 180, 0x1a0050, 0.55)
    this.tweens.add({
      targets: orb, scaleX: 1.18, scaleY: 1.18,
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })

    // ── Loader container ─────────────────────────────────────────────────
    const bY   = H * 0.62
    const bW   = Math.min(W * 0.72, 280)

    // Track bg
    const trackBg = this.add.rectangle(W / 2, bY, bW + 6, 14, 0x1a1a3a)
    trackBg.setStrokeStyle(1, 0x3030a0, 0.8)

    // Fill bar
    const bar = this.add.rectangle(W / 2 - bW / 2, bY, 0, 10, 0xf0c040)
    bar.setOrigin(0, 0.5)

    // Glow layer (fake bloom)
    const barGlow = this.add.rectangle(W / 2 - bW / 2, bY, 0, 10, 0xffd070, 0.25)
    barGlow.setOrigin(0, 0.5)

    // Label
    const label = this.add.text(W / 2, bY + 22, 'BOOTING SYSTEM…', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(W * 0.022, 9),
      fill: '#6060b0',
      letterSpacing: 2
    }).setOrigin(0.5)

    // Percent counter
    const pct = this.add.text(W / 2 + bW / 2 + 8, bY, '0%', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(W * 0.02, 8),
      fill: '#f0c040'
    }).setOrigin(0, 0.5)

    this.load.on('progress', v => {
      bar.width    = bW * v
      barGlow.width = bW * v
      pct.setText(Math.floor(v * 100) + '%')

      // Scanline sweep effect on bar
      bar.setAlpha(0.85 + Math.sin(v * Math.PI * 6) * 0.15)
    })

    this.load.on('complete', () => {
      label.setText('READY!')
      label.setStyle({ fill: '#f0c040' })
      pct.setText('100%')

      // Pulse bar on done
      this.tweens.add({
        targets: bar, scaleY: 1.5,
        duration: 180, yoyo: true, repeat: 2
      })
    })

    // ── Ambient corner glyph ─────────────────────────────────────────────
    const glyphStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(W * 0.018, 7),
      fill: '#2a2a6a'
    }
    this.add.text(8,          8,         '[ SI-LAB ]', glyphStyle)
    this.add.text(W - 8, H - 8,          'v2.0',       { ...glyphStyle, fill: '#1a1a50' }).setOrigin(1)
  }

  // ── texture factory ───────────────────────────────────────────────────────
  _generateAllTextures() {
    this._makeGround()
    this._makePlatform()
    this._makePlayer()
    this._makeEnemy()
    this._makeBoss()
    this._makePickup()
    this._makePowerupOrb()
    this._makeProjectile()
    this._makeBackground(0, 0x050520, 0x121248)   // Year 1 — deep navy
    this._makeBackground(1, 0x051510, 0x0d3020)   // Year 2 — dark teal
    this._makeBackground(2, 0x150a00, 0x2a1500)   // Year 3 — ember
    this._makeBackground(3, 0x1a0000, 0x400000)   // Year 4 / boss — blood
    this._makeLabFloor()
    this._makeCharacter()
    this._makeParticle()
    this._makeGlitch()
  }

  // ─── individual texture generators ───────────────────────────────────────

  _makeGround() {
    const g = this.add.graphics()
    // Base slab
    g.fillStyle(0x1c1c40)
    g.fillRect(0, 0, 32, 32)
    // Top edge highlight
    g.fillStyle(0x4040a0, 0.8)
    g.fillRect(0, 0, 32, 3)
    // Grid lines
    g.fillStyle(0x2a2a5a, 0.5)
    g.fillRect(0, 16, 32, 1)
    g.fillRect(16, 0, 1, 32)
    g.generateTexture('ground', 32, 32)
    g.destroy()
  }

  _makePlatform() {
    const g = this.add.graphics()
    // Body
    g.fillStyle(0x252550)
    g.fillRoundedRect(0, 0, 128, 22, 5)
    // Top edge glow
    g.fillStyle(0x6060c0, 0.9)
    g.fillRect(4, 1, 120, 3)
    // Side accents
    g.fillStyle(0x4040a0, 0.5)
    g.fillRect(0, 0, 4, 22)
    g.fillRect(124, 0, 4, 22)
    g.generateTexture('platform', 128, 22)
    g.destroy()
  }

  _makePlayer() {
    const g = this.add.graphics()
    // Head
    g.fillStyle(0xf5c87a)
    g.fillCircle(16, 10, 10)
    // Hoodie body
    g.fillStyle(0x2a4ed0)
    g.fillRoundedRect(6, 19, 20, 22, 3)
    // Hood shading
    g.fillStyle(0x1a3aa0, 0.5)
    g.fillTriangle(6, 19, 16, 14, 26, 19)
    // Arms
    g.fillStyle(0x2a4ed0)
    g.fillRect(0, 21, 7, 14)
    g.fillRect(25, 21, 7, 14)
    // Hands
    g.fillStyle(0xf5c87a)
    g.fillCircle(3,  35, 4)
    g.fillCircle(29, 35, 4)
    // Legs
    g.fillStyle(0x181830)
    g.fillRect(7,  41, 8, 13)
    g.fillRect(17, 41, 8, 13)
    // Shoes
    g.fillStyle(0xffffff)
    g.fillRect(5,  52, 10, 4)
    g.fillRect(17, 52, 10, 4)
    g.generateTexture('player', 32, 56)
    g.destroy()
  }

  _makeEnemy() {
    const g = this.add.graphics()
    // Body
    g.fillStyle(0xdd2222)
    g.fillCircle(16, 16, 14)
    // Shadow side
    g.fillStyle(0x990000, 0.4)
    g.fillCircle(19, 18, 12)
    // Eyes
    g.fillStyle(0xffffff)
    g.fillCircle(10, 12, 5)
    g.fillCircle(22, 12, 5)
    g.fillStyle(0x000000)
    g.fillCircle(11, 13, 3)
    g.fillCircle(23, 13, 3)
    // Angry brow
    g.fillStyle(0x000000)
    g.fillRect(6, 7, 8, 2)
    g.fillRect(18, 7, 8, 2)
    // Teeth
    g.fillStyle(0xffffff)
    for (let i = 0; i < 4; i++) g.fillRect(7 + i * 5, 22, 3, 5)
    g.generateTexture('enemy', 32, 32)
    g.destroy()
  }

  _makeBoss() {
    const g = this.add.graphics()
    // Case body
    g.fillStyle(0x6a0000)
    g.fillRoundedRect(0, 8, 96, 76, 10)
    // Highlight
    g.fillStyle(0x9a0000, 0.6)
    g.fillRoundedRect(2, 10, 92, 18, 8)
    // Handle
    g.fillStyle(0x3a0000)
    g.fillRoundedRect(30, 0, 36, 14, 6)
    g.fillStyle(0xaa5500)
    g.fillRect(28, 6, 4, 6)
    g.fillRect(64, 6, 4, 6)
    // Clasp
    g.fillStyle(0xd4a000)
    g.fillRect(44, 18, 8, 10)
    // Eyes — glowing red
    g.fillStyle(0xffffff)
    g.fillRect(14, 24, 22, 18)
    g.fillRect(60, 24, 22, 18)
    g.fillStyle(0xff2200)
    g.fillRect(20, 28, 12, 10)
    g.fillRect(66, 28, 12, 10)
    g.fillStyle(0x000000)
    g.fillRect(22, 30, 6, 6)
    g.fillRect(68, 30, 6, 6)
    // Mouth
    g.fillStyle(0x000000)
    g.fillRect(14, 56, 68, 10)
    g.fillStyle(0xffffff)
    for (let i = 0; i < 6; i++) g.fillRect(16 + i * 11, 56, 6, 8)
    g.generateTexture('boss', 96, 84)
    g.destroy()
  }

  _makePickup() {
    const g = this.add.graphics()
    // Outer star glow
    g.fillStyle(0xffd060, 0.3)
    g.fillCircle(16, 16, 16)
    // Star
    g.fillStyle(0xf0c040)
    const cx = 16, cy = 16, oR = 13, iR = 5, pts = 5
    const v = []
    for (let i = 0; i < pts * 2; i++) {
      const a = (i * Math.PI) / pts - Math.PI / 2
      const r = i % 2 === 0 ? oR : iR
      v.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
    }
    g.fillPoints(v, true)
    // Shine
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(11, 11, 3)
    g.generateTexture('pickup', 32, 32)
    g.destroy()
  }

  _makePowerupOrb() {
    const g = this.add.graphics()
    // Outer glow
    g.fillStyle(0x40b0ff, 0.2)
    g.fillCircle(20, 20, 20)
    // Core
    g.fillStyle(0x30a0ef)
    g.fillCircle(20, 20, 16)
    // Shine
    g.fillStyle(0xffffff, 0.45)
    g.fillCircle(14, 14, 6)
    g.fillStyle(0xffffff, 0.2)
    g.fillCircle(12, 12, 9)
    g.generateTexture('powerup_orb', 40, 40)
    g.destroy()
  }

  _makeProjectile() {
    const g = this.add.graphics()
    // Trail
    g.fillStyle(0xff8040, 0.3)
    g.fillEllipse(8, 8, 20, 8)
    // Core
    g.fillStyle(0xff5010)
    g.fillCircle(8, 8, 6)
    // Bright center
    g.fillStyle(0xffdd88, 0.8)
    g.fillCircle(8, 8, 3)
    g.generateTexture('projectile', 16, 16)
    g.destroy()
  }

  _makeParticle() {
    const g = this.add.graphics()
    g.fillStyle(0xffffff)
    g.fillCircle(4, 4, 4)
    g.generateTexture('particle', 8, 8)
    g.destroy()
  }

  _makeGlitch() {
    // A small texture used for glitch-offset effect on enemies
    const g = this.add.graphics()
    g.fillStyle(0x00ffff, 0.7)
    g.fillRect(0, 0, 6, 2)
    g.fillStyle(0xff00ff, 0.7)
    g.fillRect(0, 4, 6, 2)
    g.generateTexture('glitch', 6, 6)
    g.destroy()
  }

  // ── background generator — deep gradient + nebula + stars ─────────────────
  _makeBackground(index, colorA, colorB) {
    const W = 1200, H = 600
    const g = this.add.graphics()

    // Sky gradient — horizontal bands
    for (let y = 0; y < H; y += 2) {
      const t  = y / H
      const ca = Phaser.Display.Color.IntegerToColor(colorA)
      const cb = Phaser.Display.Color.IntegerToColor(colorB)
      const r  = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, t * 100)
      g.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b))
      g.fillRect(0, y, W, 2)
    }

    // Nebula blobs — very low opacity
    for (let i = 0; i < 16; i++) {
      g.fillStyle(0xffffff, 0.015 + Math.random() * 0.015)
      g.fillCircle(Math.random() * W, Math.random() * H, 80 + Math.random() * 160)
    }

    // Distant dust band
    g.fillStyle(0xffffff, 0.02)
    g.fillRect(0, H * 0.3, W, H * 0.2)

    // Stars — three layers
    const addStars = (count, minR, maxR, alpha) => {
      g.fillStyle(0xffffff, alpha)
      for (let i = 0; i < count; i++) {
        g.fillCircle(
          Math.random() * W,
          Math.random() * H * 0.92,
          minR + Math.random() * (maxR - minR)
        )
      }
    }
    addStars(250, 0.5, 0.8,  0.25)
    addStars(100, 0.8, 1.3,  0.5)
    addStars(40,  1.3, 2.2,  0.8)

    // Bright star cross-flares
    g.fillStyle(0xffffff, 0.9)
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * W
      const sy = Math.random() * H * 0.7
      g.fillRect(sx - 8, sy - 0.5, 16, 1)
      g.fillRect(sx - 0.5, sy - 8, 1, 16)
    }

    g.generateTexture(`bg_${index}`, W, H)
    g.destroy()
  }

  _makeLabFloor() {
    const g = this.add.graphics()
    // Dark tile
    g.fillStyle(0x131328)
    g.fillRect(0, 0, 64, 64)
    // Grout lines
    g.lineStyle(1, 0x0a0a20, 0.8)
    g.strokeRect(1, 1, 62, 62)
    // Subtle inner highlight
    g.fillStyle(0x1e1e40, 0.4)
    g.fillRect(2, 2, 28, 28)
    g.fillRect(34, 34, 28, 28)
    g.generateTexture('lab_floor', 64, 64)
    g.destroy()
  }

  _makeCharacter() {
    const g = this.add.graphics()
    g.fillStyle(0xffd6a5)
    g.fillCircle(16, 10, 9)
    g.fillStyle(0x3a7ad0)
    g.fillRoundedRect(9, 18, 14, 18, 3)
    g.generateTexture('character', 32, 36)
    g.destroy()
  }

  // ── create — animated loading screen → PreludeScene ───────────────────────
  create() {
    this._spawnBootParticles()
    this.cameras.main.fadeIn(600, 0, 0, 0)

    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.time.delayedCall(500, () => {
        this.scene.start('PreludeScene')
      })
    })
  }

  _spawnBootParticles() {
    const W = this.scale.width
    const H = this.scale.height

    // Quick upward floating orbs
    for (let i = 0; i < 18; i++) {
      const orb = this.add.circle(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(H * 0.4, H),
        Phaser.Math.Between(1, 4),
        0x5060ff,
        0.5
      )

      this.tweens.add({
        targets: orb,
        y: orb.y - Phaser.Math.Between(120, 300),
        alpha: 0,
        duration: 1200 + Math.random() * 1000,
        ease: 'Power2',
        delay: Math.random() * 800
      })
    }
  }
}