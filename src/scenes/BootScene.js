// ─────────────────────────────────────────────────────────────────────────────
// BootScene.js
// Generates all placeholder game assets as canvas textures.
// When you add real sprites, replace the generateTexture calls with
// this.load.image('key', 'path') in a separate PreloadScene.
// ─────────────────────────────────────────────────────────────────────────────

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    // Show a simple loading bar
    const w = this.scale.width, h = this.scale.height
    const barBg = this.add.rectangle(w/2, h/2, 300, 16, 0x1a1a3a)
    const bar   = this.add.rectangle(w/2 - 150, h/2, 0, 12, 0xf0c040).setOrigin(0, 0.5)
    const label = this.add.text(w/2, h/2 + 32, 'Loading...', {
      fontFamily: '"Press Start 2P"', fontSize: 10, fill: '#8080c0'
    }).setOrigin(0.5)

    this.load.on('progress', v => { bar.width = 300 * v })
    this.load.on('complete', () => { label.setText('Ready!') })

    // ── Generate placeholder textures via canvas ──────────────────────────
    this._makeGround()
    this._makePlatform()
    this._makePlayer()
    this._makeEnemy()
    this._makeBoss()
    this._makePickup()
    this._makePowerupOrb()
    this._makeProjectile()
    this._makeBackground(0, 0x0a0a2a, 0x1a1a4a) // Year 1
    this._makeBackground(1, 0x0a1a1a, 0x1a3a2a) // Year 2
    this._makeBackground(2, 0x1a0a0a, 0x3a1a0a) // Year 3
    this._makeBackground(3, 0x1a0000, 0x3a0000) // Year 4 / boss
  }

  create() {
    this.scene.start('PreludeScene')
  }

  // ── Texture generators ────────────────────────────────────────────────────

  _makeGround() {
    const g = this.add.graphics()
    g.fillStyle(0x2a2a5a)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x3a3a7a)
    g.fillRect(0, 0, 32, 4)
    g.generateTexture('ground', 32, 32)
    g.destroy()
  }

  _makePlatform() {
    const g = this.add.graphics()
    g.fillStyle(0x3a3a6a)
    g.fillRoundedRect(0, 0, 120, 20, 4)
    g.fillStyle(0x5050a0)
    g.fillRect(0, 0, 120, 4)
    g.generateTexture('platform', 120, 20)
    g.destroy()
  }

  _makePlayer() {
    // Simple character silhouette — replace with sprite sheet later
    const g = this.add.graphics()
    g.fillStyle(0xf0c040)
    g.fillCircle(16, 10, 10)    // head
    g.fillStyle(0x3050d0)
    g.fillRect(8, 20, 16, 20)   // body
    g.fillStyle(0xf0c040)
    g.fillRect(2, 22, 8, 14)    // left arm
    g.fillRect(22, 22, 8, 14)   // right arm
    g.fillStyle(0x101030)
    g.fillRect(8, 40, 8, 12)    // left leg
    g.fillRect(16, 40, 8, 12)   // right leg
    g.generateTexture('player', 32, 52)
    g.destroy()
  }

  _makeEnemy() {
    const g = this.add.graphics()
    g.fillStyle(0xff4444)
    g.fillCircle(16, 16, 14)
    g.fillStyle(0x000000)
    g.fillCircle(10, 12, 4)     // eye L
    g.fillCircle(22, 12, 4)     // eye R
    g.fillStyle(0xffffff)
    g.fillRect(8, 20, 16, 4)    // teeth
    g.generateTexture('enemy', 32, 32)
    g.destroy()
  }

  _makeBoss() {
    const g = this.add.graphics()
    // Giant placement boss — briefcase with a mean face
    g.fillStyle(0x8b0000)
    g.fillRoundedRect(0, 0, 96, 80, 8)
    g.fillStyle(0xcc0000)
    g.fillRect(32, 0, 32, 10)   // handle
    g.fillStyle(0xffffff)
    g.fillRect(16, 20, 20, 16)  // eye L
    g.fillRect(60, 20, 20, 16)  // eye R
    g.fillStyle(0xff0000)
    g.fillRect(24, 26, 8, 8)    // pupil L
    g.fillRect(68, 26, 8, 8)    // pupil R
    g.fillStyle(0x000000)
    g.fillRect(16, 50, 64, 8)   // angry mouth
    g.generateTexture('boss', 96, 80)
    g.destroy()
  }

_makePickup() {
    const g = this.add.graphics()
    g.fillStyle(0xf0c040)
    const cx = 16, cy = 16, outerR = 14, innerR = 6, points = 5
    const pts = []
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
    }
    g.fillPoints(pts, true)
    g.generateTexture('pickup', 32, 32)
    g.destroy()
  }
  _makePowerupOrb() {
    const g = this.add.graphics()
    g.fillStyle(0x50d0ff)
    g.fillCircle(20, 20, 18)
    g.fillStyle(0xffffff, 0.4)
    g.fillCircle(14, 14, 6)
    g.generateTexture('powerup_orb', 40, 40)
    g.destroy()
  }

  _makeProjectile() {
    const g = this.add.graphics()
    g.fillStyle(0xff6020)
    g.fillCircle(8, 8, 7)
    g.generateTexture('projectile', 16, 16)
    g.destroy()
  }

  _makeBackground(index, colorA, colorB) {
    const w = 800, h = 480
    const g = this.add.graphics()
    // Gradient-ish bg using rects
    
    for (let y = 0; y < h; y += 4) {
      const t = y / h
      const r = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(colorA),
        Phaser.Display.Color.IntegerToColor(colorB),
        100, t * 100
      )
      g.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b))
      g.fillRect(0, y, w, 4)
    }
    // Stars / particles for atmosphere
    g.fillStyle(0xffffff, 0.6)
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * w
      const sy = Math.random() * h * 0.7
      g.fillCircle(sx, sy, 1)
    }
    g.generateTexture(`bg_${index}`, w, h)
    g.destroy()
  }
}
