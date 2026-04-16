// ─────────────────────────────────────────────────────────────────────────────
// BootScene.js  ·  v3 — MAXIMUM BOOT SEQUENCE
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { SENIORS } from '../data/seniors.js'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    this._bootStartTime = performance.now()
    this._bootMinDuration = 4000
    this._bootFakeProgress = 0
    this._bootProgressTarget = 0
    this._bootLoadComplete = false
    this._bootCompleteTime = null

    this._buildLoadingScreen()
    this._loadBootAssets()
    this._loadSeniorImages()
    this._generateAllTextures()
  }

  _loadBootAssets() {
    const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='
    for (let i = 0; i < 6; i++) {
      this.load.image(`_boot_dummy_${i}`, dummyPng)
    }
  }

  _loadSeniorImages() {
    const placeholderPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='
    SENIORS.forEach(senior => {
      // Use placeholder for now since actual senior images aren't provided
      this.load.image(senior.id, placeholderPng)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  _buildLoadingScreen() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Deep void base ───────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)

    // ── Radial vignette blobs ────────────────────────────────────────────
    this.add.ellipse(W * 0.5, H * 0.38, W * 1.5, H * 1.1, 0x0a0014, 0.88)
    this.add.ellipse(W * 0.5, H * 0.5,  W * 0.9, H * 0.75, 0x06000e, 0.72)

    // ── Film grain ───────────────────────────────────────────────────────
    const grain = this.add.graphics().setAlpha(0.045)
    for (let i = 0; i < 3200; i++) {
      grain.fillStyle(Math.random() > 0.5 ? 0xffffff : 0x888888, Math.random() * 0.55 + 0.2)
      grain.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 1, 1)
    }

    // ── Scanlines ────────────────────────────────────────────────────────
    const scan = this.add.graphics()
    for (let y = 0; y < H; y += 3) {
      scan.fillStyle(0x000000, 0.16)
      scan.fillRect(0, y, W, 1)
    }

    // ── Edge vignette ────────────────────────────────────────────────────
    const edge = this.add.graphics()
    const edgeW = W * 0.10
    for (let x = 0; x < edgeW; x++) {
      const a = 0.55 * (1 - x / edgeW)
      edge.fillStyle(0x000000, a)
      edge.fillRect(x, 0, 1, H)
      edge.fillRect(W - x - 1, 0, 1, H)
    }
    const edgeH = H * 0.12
    for (let y = 0; y < edgeH; y++) {
      const a = 0.4 * (1 - y / edgeH)
      edge.fillStyle(0x000000, a)
      edge.fillRect(0, y, W, 1)
      edge.fillRect(0, H - y - 1, W, 1)
    }

    // ── Purple glow band behind progress bar ──────────────────────────────
    const bandY = H * 0.86
    const band  = this.add.graphics()
    for (let dy = -70; dy <= 70; dy++) {
      band.fillStyle(0x3a1a88, 0.018 * Math.exp(-Math.abs(dy) * 0.038))
      band.fillRect(0, bandY + dy, W, 1)
    }

    // ── Animated hex grid ─────────────────────────────────────────────────
    this._buildHexGrid(W, H)

    // ── Terminal log lines ────────────────────────────────────────────────
    this._buildTerminalLines(W, H)

    // ── Progress bar ─────────────────────────────────────────────────────
    this._buildProgressBar(W, H, bandY)

    // ── HUD corners ───────────────────────────────────────────────────────
    const hudS = {
      fontFamily: '"Nunito", sans-serif',
      fontSize: Math.max(7, Math.min(W * 0.02, 9)), fill: '#1a1a2e'
    }
    this.add.text(Math.max(12, W * 0.04), Math.max(12, H * 0.03), 'SI-LAB', hudS)
    this.add.text(W - Math.max(12, W * 0.04), Math.max(12, H * 0.03), 'v4.0 // BUILD 2026',
      { ...hudS, fill: '#110f1e' }).setOrigin(1, 0)

    const topRule = this.add.graphics()
    topRule.lineStyle(1, 0x2a1a5e, 0.5)
    topRule.lineBetween(
      Math.max(12, W * 0.04), H * 0.065,
      W - Math.max(12, W * 0.04), H * 0.065
    )
  }

  _buildHexGrid(W, H) {
    const container = this.add.container(0, 0).setAlpha(0.03)
    const g         = this.add.graphics()
    const size      = Math.min(W, H) * 0.052
    const cols      = Math.ceil(W / (size * 1.75)) + 2
    const rows      = Math.ceil(H / (size * 1.52)) + 2

    const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
    })

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * size * 1.75 + (row % 2 === 0 ? 0 : size * 0.875)
        const cy = row * size * 1.52
        g.lineStyle(0.5, 0x7755ff, 1)
        g.strokePoints(hexPts(cx, cy, size * 0.86), true)
      }
    }
    container.add(g)

    this.tweens.add({
      targets: container, alpha: 0.07,
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
  }

  _buildTerminalLines(W, H) {
    const lines = [
      { text: '[INIT]   hardware abstraction layer loaded',  col: '#6644cc' },
      { text: '[INIT]   memory controller — 4096 MB OK',     col: '#554499' },
      { text: '[KERN]   mounting virtual filesystem…',        col: '#6644cc' },
      { text: '[KERN]   entropy pool seeded (urandom)',       col: '#554499' },
      { text: '[PROC]   spawning worker threads [8]',         col: '#6644cc' },
      { text: '[NET]    binding socket descriptors',           col: '#554499' },
      { text: '[SYS]    loading asset pipeline…',            col: '#6644cc' },
      { text: '[GFX]    compiling shader programs',           col: '#554499' },
      { text: '[AUDIO]  initializing audio context',          col: '#6644cc' },
      { text: '[READY]  all subsystems nominal ✓',           col: '#39ff88' },
    ]

    const termX      = Math.max(16, W * 0.05)
    const termStartY = H * 0.13
    const lineH      = Math.min(H * 0.038, 15)
    const fontSize   = Math.max(7, Math.min(W * 0.02, 10))

    lines.forEach((line, i) => {
      const t = this.add.text(termX, termStartY + i * lineH, '', {
        fontFamily: '"Nunito", sans-serif',
        fontSize, fill: line.col, resolution: 2,
      }).setAlpha(0).setOrigin(0)

      this.load.on('progress', v => {
        const threshold = i / lines.length
        if (v >= threshold && t.alpha === 0) {
          this.tweens.add({
            targets: t, alpha: 1, duration: 160, ease: 'Linear',
            onStart: () => {
              let idx = 0
              const full = line.text
              const tick = () => {
                if (idx <= full.length) {
                  t.setText(full.slice(0, idx) + (idx < full.length ? '█' : ''))
                  idx++
                  this.time.delayedCall(16, tick)
                } else {
                  t.setText(full)
                }
              }
              tick()
            }
          })
        }
      })
    })
  }

  _buildProgressBar(W, H, barCenterY) {
    const pad  = Math.max(W * 0.07, 24)
    const barW = W - pad * 2
    const barH = 3

    // Track
    this.add.rectangle(pad, barCenterY, barW + 4, barH + 6, 0x0d0d22).setOrigin(0, 0.5)
    this.add.rectangle(pad, barCenterY, barW,     barH,     0x1a1a3a).setOrigin(0, 0.5)

    // Tick marks
    const tickG = this.add.graphics()
    for (let t = 0; t <= 10; t++) {
      tickG.fillStyle(0x2a2a55, 0.7)
      tickG.fillRect(pad + (barW * t / 10) - 0.5, barCenterY - 8, 1, 4)
    }

    // Fill + glow layers
    const barFill  = this.add.rectangle(pad, barCenterY, 2, barH,      0x7755ff).setOrigin(0, 0.5)
    const barGlow1 = this.add.rectangle(pad, barCenterY, 2, barH + 7,  0x9966ff, 0.28).setOrigin(0, 0.5)
    const barGlow2 = this.add.rectangle(pad, barCenterY, 2, barH + 16, 0xaa77ff, 0.09).setOrigin(0, 0.5)
    const dot      = this.add.rectangle(pad + 2, barCenterY, 2, barH + 4, 0xffffff, 0.85).setOrigin(0, 0.5)

    const pct = this.add.text(pad, barCenterY + 14, '0%', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: Math.max(8, Math.min(W * 0.022, 10)), fill: '#7755ff',
    }).setOrigin(0, 0)

    this._bootProgressBar = { barFill, barGlow1, barGlow2, dot, pct, barW, pad }
    this._bootProgressTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        const elapsed = performance.now() - this._bootStartTime
        const total = 4000

        let progress = elapsed / total
        progress = Math.pow(progress, 0.9)

        this._bootFakeProgress = Phaser.Math.Clamp(progress, 0, 1)
        this._updateBootProgress()
      }
    })

    this.add.text(pad, barCenterY + 26, 'SI-LAB  //  BOOT SEQUENCE', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: Math.max(6, Math.min(W * 0.016, 8)), fill: '#1a0e33',
    }).setOrigin(0, 0)

    const rule = this.add.graphics()
    rule.lineStyle(1, 0x221133, 0.45)
    rule.lineBetween(pad, barCenterY - 22, W - pad, barCenterY - 22)

  }

  _updateBootProgress() {
    if (!this._bootProgressBar) return

    let progress = this._bootFakeProgress || 0
    if (this._bootLoadComplete && performance.now() - this._bootStartTime >= this._bootMinDuration) {
      progress = 1
    }
    progress = Phaser.Math.Clamp(progress, 0, 1)

    const { barFill, barGlow1, barGlow2, dot, pct, barW, pad } = this._bootProgressBar
    const fillWidth = Math.max(2, barW * progress)

    barFill.width = fillWidth
    barGlow1.width = fillWidth
    barGlow2.width = fillWidth
    dot.x = pad + fillWidth - 1.5
    pct.setText(Math.round(progress * 100) + '%')

    if (progress >= 1) {
      pct.setText('100%')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEXTURE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  _generateAllTextures() {
    this._makeGround()
    this._makePlatform()
    this._makePlayer()
    this._makeEnemy()
    this._makeBoss()
    this._makePickup()
    this._makePowerupOrb()
    this._makeProjectile()
    this._makeParticle()
    this._makeGlitch()
    this._makeSmokeParticle()
    this._makeEmberParticle()
    this._makeBackground(0, 0x030318, 0x0d0d3a)
    this._makeBackground(1, 0x030e10, 0x082820)
    this._makeBackground(2, 0x100800, 0x200c00)
    this._makeBackground(3, 0x110000, 0x280000)
  }

  _makeGround() {
    const g = this.add.graphics()
    g.fillStyle(0x0c0c28); g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x3333aa, 1); g.fillRect(0, 0, 32, 2)
    g.fillStyle(0x202077, 0.5); g.fillRect(0, 2, 32, 1)
    g.lineStyle(0.5, 0x1a1a4a, 0.6)
    g.lineBetween(0, 16, 32, 16)
    g.lineBetween(16, 0, 16, 32)
    g.fillStyle(0x3333aa, 0.4); g.fillCircle(16, 16, 2)
    g.generateTexture('ground', 32, 32); g.destroy()
  }

  _makePlatform() {
    const W = 128, H = 20
    const g = this.add.graphics()
    g.fillStyle(0x000000, 0.3); g.fillRoundedRect(3, 4, W, H, 4)
    g.fillStyle(0x181840); g.fillRoundedRect(0, 0, W, H, 4)
    g.fillStyle(0x5555ee); g.fillRect(6, 0, W - 12, 2)
    g.fillStyle(0x3333aa, 0.45); g.fillRect(6, 2, W - 12, 1)
    g.fillStyle(0x5555dd); g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H)
    g.fillStyle(0x080822); g.fillRect(0, H - 2, W, 2)
    g.lineStyle(0.5, 0x2a2a66, 0.3); g.lineBetween(5, H / 2, W - 5, H / 2)
    g.generateTexture('platform', W, H); g.destroy()
  }

  _makePlayer() {
    const W = 34, H = 60
    const g = this.add.graphics()
    // Shadow
    g.fillStyle(0x000000, 0.22); g.fillEllipse(17, 58, 22, 6)
    // Legs
    g.fillStyle(0x0d0d20)
    g.fillRoundedRect(7,  41, 9, 14, 2)
    g.fillRoundedRect(18, 41, 9, 14, 2)
    // Shoes
    g.fillStyle(0xe8e8f0)
    g.fillRoundedRect(4,  53, 12, 5, 2)
    g.fillRoundedRect(18, 53, 12, 5, 2)
    g.fillStyle(0x4466ff, 0.7)
    g.fillRect(4, 55, 12, 1); g.fillRect(18, 55, 12, 1)
    // Body
    g.fillStyle(0x1a3399); g.fillRoundedRect(5, 19, 24, 24, 4)
    g.fillStyle(0x152a80, 0.7); g.fillRoundedRect(9, 30, 16, 8, 2)
    g.fillStyle(0x4466dd, 0.5); g.fillRect(16, 20, 2, 12)
    // Arms
    g.fillStyle(0x1a3399)
    g.fillRoundedRect(0,  21, 7, 14, 2)
    g.fillRoundedRect(27, 21, 7, 14, 2)
    // Hands
    g.fillStyle(0xd4905a)
    g.fillCircle(3,  35, 4)
    g.fillCircle(31, 35, 4)
    // Neck
    g.fillStyle(0xd4905a); g.fillRect(14, 15, 6, 6)
    // Head
    g.fillStyle(0xe8a870); g.fillCircle(17, 10, 10)
    // Hair
    g.fillStyle(0x1a0a00)
    g.fillEllipse(17, 3, 21, 10)
    g.fillRect(7, 3, 5, 7)
    // Eyes
    g.fillStyle(0x111111)
    g.fillRect(11, 9, 4, 3)
    g.fillRect(19, 9, 4, 3)
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(12, 9, 1, 1); g.fillRect(20, 9, 1, 1)
    // Hood outline
    g.fillStyle(0x152a80, 0.35); g.fillTriangle(5, 19, 17, 12, 29, 19)
    g.generateTexture('player', W, H); g.destroy()
  }

  _makeEnemy() {
    const g = this.add.graphics()
    g.fillStyle(0xaa0000, 0.18); g.fillCircle(16, 16, 16)
    g.fillStyle(0x8b0000); g.fillCircle(16, 16, 14)
    g.fillStyle(0xcc2222, 0.35); g.fillCircle(14, 13, 12)
    g.fillStyle(0x3a0000, 0.55); g.fillCircle(20, 20, 10)
    g.fillStyle(0xffffff)
    g.fillEllipse(10, 11, 10, 7); g.fillEllipse(22, 11, 10, 7)
    g.fillStyle(0xdd0000)
    g.fillCircle(10, 12, 3); g.fillCircle(22, 12, 3)
    g.fillStyle(0x000000)
    g.fillCircle(10, 13, 2); g.fillCircle(22, 13, 2)
    g.lineStyle(2, 0x000000, 1)
    g.lineBetween(5, 7, 14, 9); g.lineBetween(18, 9, 27, 7)
    g.fillStyle(0x000000); g.fillRect(7, 22, 18, 6)
    g.fillStyle(0xffffff)
    for (let i = 0; i < 5; i++) g.fillTriangle(7 + i * 4, 22, 9 + i * 4, 27, 11 + i * 4, 22)
    g.generateTexture('enemy', 32, 32); g.destroy()
  }

  _makeBoss() {
    const W = 96, H = 84
    const g = this.add.graphics()
    g.fillStyle(0x000000, 0.45); g.fillRoundedRect(6, 14, W, H, 10)
    g.fillStyle(0x3a0000); g.fillRoundedRect(0, 8, W, H, 10)
    g.fillStyle(0x5a0000, 0.65); g.fillRoundedRect(2, 10, W - 4, 20, 8)
    g.fillStyle(0x220000); g.fillRoundedRect(28, 0, 40, 12, 5)
    g.fillStyle(0x997700)
    g.fillRoundedRect(26, 18, 8, 10, 2); g.fillRoundedRect(62, 18, 8, 10, 2)
    g.fillStyle(0xddaa00); g.fillRoundedRect(38, 18, 20, 14, 3)
    g.fillStyle(0x000000); g.fillRect(45, 23, 6, 4)
    g.fillStyle(0x111111)
    g.fillRoundedRect(10, 28, 26, 20, 4); g.fillRoundedRect(60, 28, 26, 20, 4)
    g.fillStyle(0xffffff)
    g.fillEllipse(23, 38, 20, 14); g.fillEllipse(73, 38, 20, 14)
    g.fillStyle(0xdd0000)
    g.fillCircle(23, 38, 7); g.fillCircle(73, 38, 7)
    g.fillStyle(0x000000)
    g.fillCircle(23, 38, 4); g.fillCircle(73, 38, 4)
    g.fillStyle(0xffffff, 0.7)
    g.fillCircle(25, 36, 2); g.fillCircle(75, 36, 2)
    g.fillStyle(0x000000); g.fillRect(10, 60, 76, 12)
    g.fillStyle(0xeeeedd)
    for (let i = 0; i < 7; i++) g.fillTriangle(11 + i * 11, 60, 17 + i * 11, 71, 22 + i * 11, 60)
    g.lineStyle(1, 0x220000, 0.5)
    for (let i = 0; i < 6; i++) g.lineBetween(10 + i * 14, 10, 10 + i * 14, 82)
    g.generateTexture('boss', W, H); g.destroy()
  }

  _makePickup() {
    const g = this.add.graphics()
    g.fillStyle(0xf0b800, 0.18); g.fillCircle(16, 16, 16)
    g.fillStyle(0xf0b800)
    g.fillTriangle(16, 2, 28, 22, 4, 22)
    g.fillTriangle(16, 30, 4, 10, 28, 10)
    g.fillStyle(0xffe044, 0.75)
    g.fillTriangle(16, 6, 25, 20, 7, 20)
    g.fillStyle(0xffffff, 0.45)
    g.fillTriangle(10, 9, 16, 16, 12, 16)
    g.generateTexture('pickup', 32, 32); g.destroy()
  }

  _makePowerupOrb() {
    const g = this.add.graphics()
    g.fillStyle(0x0088ff, 0.12); g.fillCircle(20, 20, 20)
    g.fillStyle(0x0077ee); g.fillCircle(20, 20, 14)
    g.fillStyle(0x44aaff, 0.8); g.fillCircle(18, 18, 9)
    g.fillStyle(0xffffff, 0.6); g.fillCircle(14, 14, 5)
    g.fillStyle(0xffffff, 0.9); g.fillCircle(13, 13, 2)
    g.generateTexture('powerup_orb', 40, 40); g.destroy()
  }

  _makeProjectile() {
    const g = this.add.graphics()
    g.fillStyle(0xff3300, 0.3); g.fillEllipse(8, 8, 20, 10)
    g.fillStyle(0xff3300); g.fillCircle(8, 8, 5)
    g.fillStyle(0xffbb44, 0.9); g.fillCircle(8, 8, 2)
    g.fillStyle(0xffffff, 0.7); g.fillCircle(7, 7, 1)
    g.generateTexture('projectile', 16, 16); g.destroy()
  }

  _makeParticle() {
    const g = this.add.graphics()
    g.fillStyle(0xffffff); g.fillCircle(3, 3, 3)
    g.generateTexture('particle', 6, 6); g.destroy()
  }

  _makeSmokeParticle() {
    const g = this.add.graphics()
    g.fillStyle(0x888899, 0.14); g.fillCircle(12, 12, 12)
    g.generateTexture('smoke', 24, 24); g.destroy()
  }

  _makeEmberParticle() {
    const g = this.add.graphics()
    g.fillStyle(0xff6600); g.fillCircle(3, 3, 3)
    g.generateTexture('ember', 6, 6); g.destroy()
  }

  _makeGlitch() {
    const g = this.add.graphics()
    g.fillStyle(0x00ffff, 0.9); g.fillRect(0, 0, 8, 2)
    g.fillStyle(0xff00ff, 0.9); g.fillRect(0, 3, 6, 2)
    g.generateTexture('glitch', 8, 6); g.destroy()
  }

  _makeBackground(index, colorA, colorB) {
    const W = 1200, H = 600
    const g = this.add.graphics()
    for (let y = 0; y < H; y += 2) {
      const t  = y / H
      const ca = Phaser.Display.Color.IntegerToColor(colorA)
      const cb = Phaser.Display.Color.IntegerToColor(colorB)
      const r  = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, t * 100)
      g.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b))
      g.fillRect(0, y, W, 2)
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0xffffff, 0.012 + Math.random() * 0.01)
      g.fillCircle(Math.random() * W, Math.random() * H, 90 + Math.random() * 140)
    }
    const addStars = (n, minR, maxR, alpha) => {
      g.fillStyle(0xffffff, alpha)
      for (let i = 0; i < n; i++) {
        g.fillCircle(Math.random() * W, Math.random() * H * 0.9, minR + Math.random() * (maxR - minR))
      }
    }
    addStars(220, 0.3, 0.7,  0.22)
    addStars(80,  0.7, 1.2,  0.48)
    addStars(30,  1.2, 2.0,  0.78)
    g.fillStyle(0xffffff, 0.85)
    for (let i = 0; i < 6; i++) {
      const sx = Math.random() * W, sy = Math.random() * H * 0.7
      g.fillRect(sx - 6, sy - 0.5, 12, 1)
      g.fillRect(sx - 0.5, sy - 6, 1, 12)
      g.fillCircle(sx, sy, 1.4)
    }
    g.generateTexture(`bg_${index}`, W, H); g.destroy()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create() {
    this._spawnBootDriftParticles()
    this.cameras.main.fadeIn(800, 0, 0, 0)

    const elapsed = performance.now() - (this._bootStartTime || performance.now())
    const wait = Math.max(0, this._bootMinDuration - elapsed)

    this.time.delayedCall(wait, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(700, () => this.scene.start('PreludeScene'))
    })
  }

  _spawnBootDriftParticles() {
    const W = this.scale.width
    const H = this.scale.height
    const palette = [0x7755ff, 0x4433aa, 0x9966cc, 0x5544bb, 0x33aaff]
    for (let i = 0; i < 30; i++) {
      const x   = Phaser.Math.Between(0, W)
      const y   = Phaser.Math.Between(H * 0.45, H)
      const sz  = Phaser.Math.FloatBetween(0.8, 3.0)
      const col = Phaser.Utils.Array.GetRandom(palette)
      const orb = this.add.circle(x, y, sz, col, Phaser.Math.FloatBetween(0.25, 0.65))
      this.tweens.add({
        targets: orb,
        y:       y - Phaser.Math.Between(100, H * 0.65),
        x:       x + Phaser.Math.Between(-40, 40),
        alpha:   0,
        duration: 1600 + Math.random() * 1200,
        ease:    'Sine.easeOut',
        delay:   Math.random() * 1000
      })
    }
  }
}