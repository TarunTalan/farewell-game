// ─────────────────────────────────────────────────────────────────────────────
// PreludeScene.js  ·  Cinematic Story Intro — ENHANCED
// Flow: SI Lab fun → 3 disappear → phone call → WHO ARE THEY? → LEGENDS reveal
// ─────────────────────────────────────────────────────────────────────────────

import { gameState } from '../data/GameState.js'

// ─── Member data ──────────────────────────────────────────────────────────────
const MEMBERS = [
  { name: 'Divyansh',  color: 0x7b2fbe, shirt: 0x5a1a99, skin: 0xd4956a, hair: 0x1a0a00, msg: 'bhai yeh bug\nkyu aa raha hai??' },
  { name: 'Sachi',     color: 0x2fb88a, shirt: 0x1a8866, skin: 0xe8c09a, hair: 0x0a0500, msg: 'kal submission\nhai bruh 😭' },
  { name: 'Shivansh',  color: 0xe06010, shirt: 0xaa4400, skin: 0xc87941, hair: 0x080400, msg: 'chill karo\nchai pilo ☕' },
  { name: 'Srayanash', color: 0xcc2222, shirt: 0x991111, skin: 0xd4956a, hair: 0x0d0600, msg: '404: motivation\nnot found 💀' },
]

export class PreludeScene extends Phaser.Scene {
  constructor() {
    super('PreludeScene')
    this._tw  = []
    this._tmr = []
  }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height
    this._generateTextures()
    this.cameras.main.fadeIn(1200, 0, 0, 0)
    this._phase1_labScene()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTURE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  _generateTextures() {
    MEMBERS.forEach((m, i) => this._makeCharSprite(m, `char_${i}`))
    this._makeMonitorTexture()
    this._makeChairTexture()
    this._makePhoneTexture()
    this._makeLabWallTexture()
    this._makeLabFloorTexture()
    this._makeDeskTexture()
  }

  _makeCharSprite(m, key) {
    const g = this.add.graphics()
    // Shadow
    g.fillStyle(0x000000, 0.28)
    g.fillEllipse(20, 69, 26, 6)
    // Legs
    g.fillStyle(0x111128)
    g.fillRect(11, 48, 8, 18)
    g.fillRect(21, 48, 8, 18)
    // Leg crease
    g.fillStyle(0x000000, 0.2)
    g.fillRect(12, 48, 3, 18)
    g.fillRect(22, 48, 3, 18)
    // Shoes
    g.fillStyle(0xe0e0e0)
    g.fillRoundedRect(8,  62, 12, 6, 2)
    g.fillRoundedRect(20, 62, 12, 6, 2)
    g.fillStyle(0x888888, 0.4)
    g.fillRect(8, 65, 12, 2)
    g.fillRect(20, 65, 12, 2)
    // Body / shirt
    g.fillStyle(m.shirt)
    g.fillRoundedRect(8, 26, 24, 24, 4)
    // Shirt shadow left
    g.fillStyle(0x000000, 0.18)
    g.fillRoundedRect(8, 26, 9, 24, 4)
    // Shirt highlight right
    g.fillStyle(0xffffff, 0.04)
    g.fillRoundedRect(22, 28, 8, 14, 3)
    // Collar V
    g.fillStyle(m.skin)
    g.fillTriangle(14, 26, 20, 34, 26, 26)
    // Colour strip on shirt
    g.fillStyle(m.color, 0.55)
    g.fillRect(10, 38, 20, 3)
    // Arms
    g.fillStyle(m.shirt)
    g.fillRoundedRect(1, 28, 8, 16, 3)
    g.fillRoundedRect(31, 28, 8, 16, 3)
    g.fillStyle(0x000000, 0.15)
    g.fillRoundedRect(1, 28, 4, 16, 3)
    g.fillRoundedRect(35, 28, 3, 16, 3)
    // Hands
    g.fillStyle(m.skin)
    g.fillCircle(5,  44, 5)
    g.fillCircle(35, 44, 5)
    // Knuckle lines
    g.fillStyle(0x000000, 0.1)
    g.fillRect(3, 43, 4, 1)
    g.fillRect(33, 43, 4, 1)
    // Head
    g.fillStyle(m.skin)
    g.fillCircle(20, 14, 12)
    // Face shading
    g.fillStyle(0x000000, 0.07)
    g.fillCircle(22, 16, 10)
    // Ear
    g.fillStyle(m.skin)
    g.fillCircle(9,  15, 3)
    g.fillCircle(31, 15, 3)
    // Eyes — whites
    g.fillStyle(0xffffff)
    g.fillRoundedRect(12, 10, 5, 5, 1)
    g.fillRoundedRect(23, 10, 5, 5, 1)
    // Irises
    g.fillStyle(0x1a1a2a)
    g.fillRect(13, 11, 3, 3)
    g.fillRect(24, 11, 3, 3)
    // Eye shine
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(14, 11, 1, 1)
    g.fillRect(25, 11, 1, 1)
    // Eyebrows
    g.fillStyle(m.hair)
    g.fillRect(12, 8, 5, 2)
    g.fillRect(23, 8, 5, 2)
    // Nose dot
    g.fillStyle(0x000000, 0.12)
    g.fillCircle(20, 16, 2)
    // Mouth
    g.fillStyle(0x7a3a1a)
    g.fillRoundedRect(16, 19, 8, 2, 1)
    // Hair — solid cap
    g.fillStyle(m.hair)
    g.fillEllipse(20, 6, 26, 14)
    g.fillRect(8,  6, 24, 7)
    g.fillRect(8,  3, 8,  9)
    g.fillRect(24, 3, 8,  9)
    // Hair highlight
    g.fillStyle(0xffffff, 0.06)
    g.fillEllipse(16, 4, 12, 6)

    g.generateTexture(key, 40, 72)
    g.destroy()
  }

  _makeMonitorTexture() {
    const g = this.add.graphics()
    // Stand
    g.fillStyle(0x0a0a18)
    g.fillRect(21, 60, 8, 12)
    g.fillRect(12, 70, 26, 5)
    // Bezel outer
    g.fillStyle(0x101020)
    g.fillRoundedRect(0, 0, 52, 62, 5)
    // Bezel inner shadow
    g.fillStyle(0x0a0a18)
    g.fillRoundedRect(1, 1, 50, 60, 5)
    // Screen bg
    g.fillStyle(0x04040e)
    g.fillRect(4, 4, 44, 52)
    // Code lines
    const codeColors = [0x00ff88, 0x4488ff, 0xff8844, 0xffff44, 0xffffff, 0x44ffff, 0xff44ff]
    const indents    = [0, 10, 20, 10, 0, 14, 6]
    for (let row = 0; row < 9; row++) {
      const len = 8 + Math.floor(Math.random() * 30)
      const ind = indents[row % indents.length]
      g.fillStyle(codeColors[row % codeColors.length], 0.75)
      g.fillRect(6 + ind, 7 + row * 5, len, 2)
      if (row % 4 === 0) {
        g.fillStyle(0x334466, 0.4)
        g.fillRect(6 + ind + 2, 7 + row * 5 + 3, Math.floor(len * 0.6), 1)
      }
    }
    // Active cursor line highlight
    g.fillStyle(0x0a2040, 0.5)
    g.fillRect(4, 48, 44, 4)
    // Cursor blink
    g.fillStyle(0x00ff88, 1)
    g.fillRect(6, 49, 5, 2)
    // Screen edge blue glow
    g.fillStyle(0x0a2060, 0.25)
    g.fillRect(4, 4, 44, 3)
    g.fillRect(4, 4, 3, 52)
    // Power LED
    g.fillStyle(0x00ee44)
    g.fillCircle(46, 58, 2)
    g.fillStyle(0x88ffaa, 0.5)
    g.fillCircle(46, 57, 1)
    g.generateTexture('monitor', 52, 75)
    g.destroy()
  }

  _makeChairTexture() {
    const g = this.add.graphics()
    // Back rest
    g.fillStyle(0x181830)
    g.fillRoundedRect(4, 0, 32, 22, 4)
    // Back padding
    g.fillStyle(0x1e1e3c, 0.7)
    g.fillRect(7, 4, 26, 14)
    g.fillStyle(0x2a2a50, 0.3)
    g.fillRect(7, 4, 26, 4)
    // Seat
    g.fillStyle(0x181830)
    g.fillRoundedRect(2, 20, 36, 10, 3)
    g.fillStyle(0x2a2a50, 0.3)
    g.fillRect(4, 20, 32, 3)
    // Cylinder post
    g.fillStyle(0x0d0d1e)
    g.fillRect(16, 30, 8, 10)
    g.fillStyle(0x222244, 0.4)
    g.fillRect(16, 30, 4, 10)
    // Base star
    g.fillStyle(0x0a0a1a)
    ;[[-14, 10], [14, 10], [0, 0], [-10, -6], [10, -6]].forEach(([dx, dy]) => {
      g.fillRect(20 + dx - 2, 44 + dy - 2, 4, 4)
    })
    g.fillRect(6,  40, 28, 3)
    g.fillRect(14, 36, 12, 8)
    // Wheels
    g.fillStyle(0x222244)
    ;[6, 18, 30].forEach(wx => {
      g.fillCircle(wx, 47, 4)
      g.fillStyle(0x3a3a66, 0.5)
      g.fillCircle(wx, 47, 2)
      g.fillStyle(0x222244)
    })
    g.generateTexture('chair', 40, 52)
    g.destroy()
  }

  _makePhoneTexture() {
    const g = this.add.graphics()
    // Body frame
    g.fillStyle(0x1a1a2e)
    g.fillRoundedRect(0, 0, 40, 72, 8)
    g.fillStyle(0x0e0e20)
    g.fillRoundedRect(1, 1, 38, 70, 7)
    // Camera notch
    g.fillStyle(0x0a0a18)
    g.fillRoundedRect(13, 3, 14, 5, 2)
    g.fillStyle(0x1a1a30)
    g.fillCircle(20, 5, 2)
    // Screen
    g.fillStyle(0x040412)
    g.fillRoundedRect(3, 10, 34, 52, 3)
    // Caller display on screen
    g.fillStyle(0x0a0a22, 1)
    g.fillRect(5, 12, 30, 48)
    // Status bar
    g.fillStyle(0x00ff44, 0.4)
    g.fillRect(5, 12, 30, 3)
    // Caller name area
    g.fillStyle(0x220000, 0.8)
    g.fillRect(5, 18, 30, 20)
    g.fillStyle(0xff4444, 0.2)
    g.fillRect(5, 18, 30, 4)
    // Unknown caller text (bars)
    g.fillStyle(0xcc3333, 0.7)
    g.fillRect(9, 22, 22, 3)
    g.fillStyle(0xaa2222, 0.5)
    g.fillRect(12, 28, 16, 2)
    // Incoming call area
    g.fillStyle(0x001100, 0.7)
    g.fillRect(5, 42, 30, 14)
    // Accept / decline dots
    g.fillStyle(0x22cc44)
    g.fillCircle(12, 50, 5)
    g.fillStyle(0xcc2222)
    g.fillCircle(28, 50, 5)
    g.fillStyle(0xffffff, 0.7)
    g.fillRect(10, 49, 4, 2)
    g.fillRect(26, 49, 4, 2)
    // Notif LED
    g.fillStyle(0xff3333)
    g.fillCircle(37, 4, 3)
    g.fillStyle(0xff8888, 0.6)
    g.fillCircle(37, 3, 1)
    // Home bar
    g.fillStyle(0x2a2a44)
    g.fillRoundedRect(13, 64, 14, 3, 1)
    g.generateTexture('phone', 40, 72)
    g.destroy()
  }

  _makeLabWallTexture() {
    const g = this.add.graphics()
    const TW = 480, TH = 200
    // Wall base gradient-ish
    for (let y = 0; y < TH; y += 2) {
      const t = y / TH
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(0x080816),
        Phaser.Display.Color.IntegerToColor(0x0a0a20),
        100, t * 100
      )
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      g.fillRect(0, y, TW, 2)
    }
    // Brick rows
    const bW = 80, bH = 28
    for (let row = 0; row < 8; row++) {
      const off = row % 2 === 0 ? 0 : bW / 2
      for (let col = -1; col < 8; col++) {
        const bx = col * bW + off
        const by = row * bH
        g.lineStyle(1, 0x0e0e26, 0.7)
        g.strokeRect(bx + 1, by + 1, bW - 2, bH - 2)
        // Subtle brick variation
        const shade = (row + col) % 3 === 0 ? 0x0c0c22 : 0x0a0a1e
        g.fillStyle(shade, 0.25)
        g.fillRect(bx + 2, by + 2, bW - 4, bH - 4)
      }
    }
    // Baseboard
    g.fillStyle(0x060612, 0.6)
    g.fillRect(0, TH - 8, TW, 8)
    g.lineStyle(1, 0x1a1a3a, 0.4)
    g.lineBetween(0, TH - 8, TW, TH - 8)
    g.generateTexture('lab_wall', TW, TH)
    g.destroy()
  }

  _makeLabFloorTexture() {
    const g = this.add.graphics()
    const TW = 480, TH = 96
    g.fillStyle(0x060710)
    g.fillRect(0, 0, TW, TH)
    const TS = 48
    for (let tx = 0; tx < TW; tx += TS) {
      for (let ty = 0; ty < TH; ty += TS) {
        g.lineStyle(1, 0x0d0d20, 0.9)
        g.strokeRect(tx + 1, ty + 1, TS - 2, TS - 2)
        // Alternating tile shading
        if ((Math.floor(tx / TS) + Math.floor(ty / TS)) % 2 === 0) {
          g.fillStyle(0x0a0a1c, 0.4)
          g.fillRect(tx + 2, ty + 2, TS - 4, TS - 4)
        }
        // Specular corner
        g.fillStyle(0x111130, 0.2)
        g.fillRect(tx + 2, ty + 2, 8, 8)
      }
    }
    // Reflection strip
    g.fillStyle(0x1a1a40, 0.12)
    g.fillRect(0, 0, TW, 5)
    g.generateTexture('lab_floor', TW, TH)
    g.destroy()
  }

  _makeDeskTexture() {
    const g = this.add.graphics()
    const DW = 90, DH = 16
    // Desk top surface
    g.fillStyle(0x141428)
    g.fillRoundedRect(0, 0, DW, DH, 4)
    // Top edge highlight
    g.fillStyle(0x2a2a5a, 0.7)
    g.fillRect(2, 0, DW - 4, 2)
    // Surface spec
    g.fillStyle(0x1a1a44, 0.3)
    g.fillRect(4, 3, 18, 4)
    // Border
    g.lineStyle(1, 0x2a2a5a, 0.5)
    g.strokeRoundedRect(0, 0, DW, DH, 4)
    g.generateTexture('desk', DW, DH)
    g.destroy()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — SI Lab
  // ═══════════════════════════════════════════════════════════════════════════
  _phase1_labScene() {
    const { W, H } = this

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x06060f).setOrigin(0)

    // Wall (top 60%)
    this.add.tileSprite(0, 0, W, H * 0.62, 'lab_wall').setOrigin(0).setAlpha(0.88)
    // Floor
    this.add.tileSprite(0, H * 0.70, W, H * 0.30, 'lab_floor').setOrigin(0).setAlpha(0.9)
    // Wall/floor divider line
    const divG = this.add.graphics()
    divG.lineStyle(2, 0x1a1a3a, 0.5)
    divG.lineBetween(0, H * 0.70, W, H * 0.70)

    // Ceiling strip lights
    this._ceilingLight(W * 0.22, 0, W * 0.38)
    this._ceilingLight(W * 0.72, 0, W * 0.32)

    // Monitor wall glow blobs
    const glowSlots = [W * 0.15, W * 0.38, W * 0.62, W * 0.85]
    const glowColors = [0x0a1a6a, 0x0a3a2a, 0x2a1a4a, 0x1a1a5a]
    glowSlots.forEach((x, i) => {
      const gG = this.add.graphics()
      for (let r = 50; r > 0; r -= 5) {
        gG.fillStyle(glowColors[i], 0.018 * (1 - r / 50))
        gG.fillEllipse(x, H * 0.28, r * 2.8, r * 1.2)
      }
    })

    // Post-FX overlays
    // this._scanlines()  // Removed obstructing scanlines

    // ── Title tag ────────────────────────────────────────────────────────────
    const topTag = this._txt(W / 2, H * 0.03, '[ SI LAB  //  CS DEPT  //  LATE NIGHT ]', 'mono', 8, '#1a1a4a')
      .setOrigin(0.5).setAlpha(0)
    this._tween(topTag, { alpha: 1, duration: 600, delay: 300 })

    const sceneTitle = this._txt(W / 2, H * 0.09, 'A NORMAL NIGHT IN THE LAB', 'pixel', this._fs(3, 8, 16), '#222f88')
      .setOrigin(0.5).setAlpha(0)
    this._tween(sceneTitle, { alpha: 1, duration: 500, delay: 700 })

    const titleRule = this.add.graphics().setAlpha(0)
    titleRule.lineStyle(1, 0x2a3a88, 0.4)
    titleRule.lineBetween(W * 0.18, H * 0.14, W * 0.82, H * 0.14)
    this._tween(titleRule, { alpha: 1, duration: 400, delay: 1000 })

    // ── Characters ───────────────────────────────────────────────────────────
    const deskY = H * 0.69
    const charY = H * 0.57

    const xSlots = [W * 0.15, W * 0.38, W * 0.62, W * 0.85]
    const charGlowColors = [0x0a1a6a, 0x0a6a1a, 0x6a0a1a, 0x6a1a0a]

    MEMBERS.forEach((m, i) => {
      const x     = xSlots[i]
      const delay = 800 + i * 200

      // Monitor glow behind monitor
      const mgG = this.add.graphics().setAlpha(0).setDepth(3)
      for (let r = 30; r > 0; r -= 4) {
        mgG.fillStyle(charGlowColors[i], 0.04 * (1 - r / 30))
        mgG.fillEllipse(x, deskY - 24, r * 3, r * 1.5)
      }
      // Monitor
      const mon = this.add.image(x, deskY - 20, 'monitor').setAlpha(0).setScale(0.80).setDepth(4)
      // Desk
      const desk = this.add.image(x, deskY, 'desk').setAlpha(0).setScale(0.92).setDepth(4)
      // Chair (lower z — behind char)
      const chair = this.add.image(x + 2, deskY + 22, 'chair').setAlpha(0).setScale(0.65).setDepth(3)
      // Character
      const char = this.add.image(x, charY, `char_${i}`).setAlpha(0).setScale(0.80).setDepth(5)
      // Name tag
      const tag = this._buildNameTag(x, deskY + 36, m.name, m.color).setAlpha(0).setDepth(6)

      this._tween(mgG,   { alpha: 1, duration: 350, delay })
      this._tween(mon,   { alpha: 1, duration: 350, delay: delay + 60 })
      this._tween(desk,  { alpha: 1, duration: 300, delay: delay + 80 })
      this._tween(chair, { alpha: 1, duration: 300, delay: delay + 100 })
      this._tween(char,  { alpha: 1, y: charY, duration: 380, ease: 'Back.out(1.5)', delay: delay + 140 })
      this._tween(tag,   { alpha: 1, duration: 280, delay: delay + 320 })

      // Idle breathe
      this._tween(char, { scaleY: 0.81, scaleX: 0.79, duration: 1500 + i * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: delay + 700 })
      // Monitor glow pulse
      this._tween(mgG, { alpha: 0.5, duration: 1700 + i * 250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      // Speech bubble
      this._timer(1800 + i * 320, () => {
        const bub = this._buildSpeechBubble(x, charY - 68, m.msg, m.color).setAlpha(0).setDepth(8)
        this._tween(bub, { alpha: 1, duration: 400 })  // Removed flying animation, just fade in
        this._timer(3000, () => {  // Extended duration
          this._tween(bub, { alpha: 0, duration: 400, onComplete: () => bub.destroy() })
        })
      })
    })

    // Floating vibe text (kept for speaking effect)
    this._timer(2600, () => this._spawnFloat(W * 0.50, H * 0.33, 'hahaha 😂',  '#447744'))
    this._timer(3100, () => this._spawnFloat(W * 0.27, H * 0.31, 'bhai 💀',    '#335577'))
    this._timer(3600, () => this._spawnFloat(W * 0.73, H * 0.32, 'chal bhai!', '#554433'))
    this._timer(4100, () => this._spawnFloat(W * 0.47, H * 0.36, 'khatam? 😱', '#665533'))

    // Monitor random flicker

    // Transition after 6.5s
    this._timer(6500, () => this._blackOut(700, () => this._phase2_disappear()))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — DISAPPEARANCE
  // ═══════════════════════════════════════════════════════════════════════════
  _phase2_disappear() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)

    // Glitch burst — 4 flashes
    this._glitchBurst(4, () => {
      // Rebuilt lab — only Divyansh present
      this.add.rectangle(0, 0, W, H, 0x06060f).setOrigin(0)
      this.add.tileSprite(0, 0, W, H * 0.62, 'lab_wall').setOrigin(0).setAlpha(0.78)
      this.add.tileSprite(0, H * 0.70, W, H * 0.30, 'lab_floor').setOrigin(0).setAlpha(0.8)
      const dG = this.add.graphics()
      dG.lineStyle(2, 0x1a1a3a, 0.4)
      dG.lineBetween(0, H * 0.70, W, H * 0.70)
      this._ceilingLight(W * 0.22, 0, W * 0.38)
      // this._scanlines()  // Removed
      // this._cornerVignette()  // Removed

      // Emergency red atmospheric overlay
      const redAtm = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0).setDepth(40)
      this._tween(redAtm, { fillAlpha: 0.035, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      const deskY = H * 0.69
      const charY = H * 0.57
      const xSlots = [W * 0.15, W * 0.38, W * 0.62, W * 0.85]

      xSlots.forEach((x, i) => {
        const isDivyansh = i === 0

        // Desk always
        const desk = this.add.image(x, deskY, 'desk').setScale(0.92).setDepth(4)

        if (isDivyansh) {
          // Monitor still on
          const mgG = this.add.graphics().setDepth(3)
          for (let r = 30; r > 0; r -= 4) {
            mgG.fillStyle(0x0a1a6a, 0.04 * (1 - r / 30))
            mgG.fillEllipse(x, deskY - 24, r * 3, r * 1.5)
          }
          this.add.image(x, deskY - 20, 'monitor').setScale(0.80).setDepth(4)
          const chair = this.add.image(x + 2, deskY + 22, 'chair').setScale(0.65).setDepth(3)
          const char = this.add.image(x, charY, 'char_0').setScale(0.80).setDepth(5)
          // Scared — slight continuous shake
          this._tween(char, { x: x + 3, duration: 55, yoyo: true, repeat: -1, ease: 'Linear' })
          // Name tag
          this._buildNameTag(x, deskY + 36, 'Divyansh', 0x7b2fbe).setDepth(6)
          // Scared speech bubble
          this._timer(800, () => {
            const bub = this._buildSpeechBubble(x, charY - 68, '...woh kahan\ngaye?? 😱', 0x7b2fbe).setAlpha(0).setDepth(8)
            this._tween(bub, { alpha: 1, duration: 300 })
          })
        } else {
          // EMPTY — toppled chair, scattered items
          const chair = this.add.image(x + Phaser.Math.Between(-8, 8), deskY + 26, 'chair')
            .setScale(0.65).setDepth(3).setAlpha(0.5)
            .setRotation(Phaser.Math.FloatBetween(-0.6, 0.6))
            .setTint(0x111122)
          // Fallen keyboard block
          const kbd = this.add.rectangle(
            x + Phaser.Math.Between(-18, 18), deskY - 2,
            Phaser.Math.Between(28, 40), 8, 0x0e0e20, 0.7
          ).setRotation(Phaser.Math.FloatBetween(-0.5, 0.5)).setDepth(5)
          // Big dim question mark
          const qm = this._txt(x, charY - 4, '?', 'pixel', this._fs(8, 22, 44), '#1a1a40')
            .setOrigin(0.5).setAlpha(0).setDepth(6)
          this._tween(qm, { alpha: 0.45, duration: 450, delay: 300 + i * 100 })
          this._tween(qm, { y: charY - 12, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 })
        }
      })

      // ── MISSING panel ──────────────────────────────────────────────────────
      this._timer(500, () => {
        const pW = Math.min(W * 0.90, 370)
        const pX = W / 2, pY = H * 0.17

        const panelG = this.add.graphics().setDepth(20).setAlpha(0)
        panelG.fillStyle(0x110000, 0.95)
        panelG.fillRoundedRect(pX - pW / 2, pY - 32, pW, 62, 5)
        panelG.lineStyle(2, 0xcc2222, 0.85)
        panelG.strokeRoundedRect(pX - pW / 2, pY - 32, pW, 62, 5)
        panelG.fillStyle(0xcc2222, 1)
        panelG.fillRect(pX - pW / 2, pY - 32, 5, 62)    // left accent
        panelG.fillStyle(0x220000, 1)
        panelG.fillRect(pX - pW / 2 + 5, pY - 32, pW - 5, 4)  // top red strip
        this._tween(panelG, { alpha: 1, duration: 400 })

        const missingT = this._txt(pX + 4, pY - 14, '⚠  3 MEMBERS MISSING', 'pixel', this._fs(3.5, 10, 20), '#cc2222')
          .setOrigin(0.5).setAlpha(0).setDepth(21)
        const namesT = this._txt(pX + 4, pY + 10, 'SACHI  ·  SHIVANSH  ·  SRAYANASH', 'mono', 9, '#661111')
          .setOrigin(0.5).setAlpha(0).setDepth(21)

        this._tween(missingT, { alpha: 1, duration: 350, delay: 100 })
        this._tween(namesT,   { alpha: 1, duration: 350, delay: 280 })

        // Flicker red
        this._timer(1100, () => {
          this._tween(missingT, { alpha: 0.2, duration: 65, yoyo: true, repeat: 7, ease: 'Linear' })
        })
      })

      this._timer(4200, () => this._blackOut(650, () => this._phase3_phoneCall()))
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — PHONE CALL
  // ═══════════════════════════════════════════════════════════════════════════
  _phase3_phoneCall() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
    // this._scanlines()  // Removed
    // this._cornerVignette()  // Removed
    this._grain()

    // Subtle dark-red vignette
    const atmG = this.add.graphics()
    for (let r = 80; r > 0; r -= 8) {
      atmG.fillStyle(0x220000, 0.014 * (1 - r / 80))
      atmG.fillEllipse(W / 2, H * 0.28, r * 3, r * 2)
    }

    // Phone with glow halo
    const phoneHalo = this.add.graphics().setAlpha(0).setDepth(8)
    for (let r = 50; r > 0; r -= 5) {
      phoneHalo.fillStyle(0xff2222, 0.015 * (1 - r / 50))
      phoneHalo.fillCircle(W / 2, H * 0.30, r)
    }
    const phone = this.add.image(W / 2, H * 0.30, 'phone').setAlpha(0).setScale(1.15).setDepth(9)
    const phoneShad = this.add.ellipse(W / 2 + 6, H * 0.30 + 36, 50, 12, 0x000000, 0.35).setDepth(7)

    this._tween(phoneHalo, { alpha: 1, duration: 400 })
    this._tween(phoneShad, { alpha: 1, duration: 400 })
    this._tween(phone, { alpha: 1, scaleX: 1.15, scaleY: 1.15, duration: 380, ease: 'Back.out(1.4)' })

    // Ring shake
    this._timer(460, () => {
      this._tween(phone, { x: W / 2 + 11, duration: 50, yoyo: true, repeat: 16, ease: 'Linear' })
    })
    // Halo pulse
    this._tween(phoneHalo, { alpha: 0.4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 })

    // INCOMING label
    const incoming = this._txt(W / 2, H * 0.49, '[ INCOMING CALL ]', 'mono', this._fs(2.5, 8, 13), '#335533')
      .setOrigin(0.5).setAlpha(0)
    this._tween(incoming, { alpha: 1, duration: 300, delay: 600 })
    this._tween(incoming, { alpha: 0.2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1100 })

    // Dialogue sequence
    const lines = [
      { spk: 'UNKNOWN',   txt: '"Hum tere lab ke 3 bande le\ngaye hain..."',           col: '#cc3333', delay: 1900  },
      { spk: 'UNKNOWN',   txt: '"Ransom chahiye.\nSI LAB ke BEST bande bhejo."',        col: '#cc3333', delay: 5100  },
      { spk: 'DIVYANSH',  txt: '"Best bande...?\nTum jaante nahi kya maang rahe ho."',  col: '#9b4fde', delay: 8500  },
      { spk: 'DIVYANSH',  txt: '"Ab sirf ek hi option hai..."',                          col: '#9b4fde', delay: 11700 },
      { spk: 'DIVYANSH',  txt: '"Unhe bulana padega."',                                  col: '#f0c040', delay: 13700 },
    ]

    lines.forEach(({ spk, txt, col, delay }) => {
      const box = this._buildDialogueBox(W / 2, H * 0.72, spk, txt, col).setAlpha(0).setDepth(30)
      this._timer(delay, () => {
        this._tween(box, { alpha: 1, duration: 240, ease: 'Power2' })
        this._timer(2700, () => this._tween(box, { alpha: 0, duration: 220, onComplete: () => box.destroy() }))
      })
    })

    this._timer(16800, () => this._blackOut(550, () => this._phase4_whoAreThey()))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — WHO ARE THEY?
  // ═══════════════════════════════════════════════════════════════════════════
  _phase4_whoAreThey() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
    // this._cornerVignette()  // Removed
    // this._scanlines()  // Removed
    this._grain()

    // Blood-red ambient
    const redGlow = this.add.ellipse(W / 2, H / 2, W * 1.3, H * 1.1, 0x1a0000, 0.6)
    this._tween(redGlow, { scaleX: 1.1, scaleY: 1.1, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // Glitch lead

    // Main text
    const who = this._txt(W / 2, H * 0.41, 'WHO ARE\n"THEY" ???', 'pixel', this._fs(9, 26, 60), '#ffffff')
      .setOrigin(0.5).setAlpha(0).setDepth(10)
      .setStyle({ stroke: '#000000', strokeThickness: 5, lineSpacing: 8, align: 'center' })

    // Chromatic aberration copies
    const whoR = this._txt(W / 2 + 4, H * 0.41, 'WHO ARE\n"THEY" ???', 'pixel', this._fs(9, 26, 60), '#ff0022')
      .setOrigin(0.5).setAlpha(0).setDepth(8).setStyle({ lineSpacing: 8, align: 'center' })
    const whoB = this._txt(W / 2 - 4, H * 0.41, 'WHO ARE\n"THEY" ???', 'pixel', this._fs(9, 26, 60), '#0033ff')
      .setOrigin(0.5).setAlpha(0).setDepth(8).setStyle({ lineSpacing: 8, align: 'center' })

    this._tween(who,  { alpha: 1, duration: 480, ease: 'Power2' })
    this._tween(whoR, { alpha: 0.22, duration: 480 })
    this._tween(whoB, { alpha: 0.22, duration: 480 })

    // Flash flicker
    this._timer(600, () => {
      for (let i = 0; i < 5; i++) {
        this._timer(i * 80, () => {
          const f = this.add.rectangle(0, 0, W, H, 0xffffff, 0.05).setOrigin(0).setDepth(9900)
          this._tween(f, { alpha: 0, duration: 55, onComplete: () => f.destroy() })
        })
      }
    })

    // Red strobe
    this._timer(1100, () => {
      const strobe = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0).setDepth(9800)
      this._tween(strobe, { fillAlpha: 0.07, duration: 180, yoyo: true, repeat: 6 })
    })

    this._timer(3500, () => this._blackOut(650, () => this._phase5_theyReveal()))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — THE LEGENDS
  // ═══════════════════════════════════════════════════════════════════════════
  _phase5_theyReveal() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x030008).setOrigin(0)
    // this._cornerVignette()  // Removed
    // this._scanlines()  // Removed
    this._grain()

    // Purple nebula centre
    const nebG = this.add.graphics().setDepth(0)
    for (let r = 160; r > 0; r -= 10) {
      nebG.fillStyle(0x110022, 0.012 * (1 - r / 160))
      nebG.fillEllipse(W / 2, H * 0.44, r * 2.2, r * 1.6)
    }

    // Dust particles
    const dustG = this.add.graphics().setAlpha(0.4).setDepth(0)
    for (let i = 0; i < 140; i++) {
      const sz = Math.random() * 1.4 + 0.3
      dustG.fillStyle(0xffffff, Math.random() * 0.7 + 0.15)
      dustG.fillCircle(Math.random() * W, Math.random() * H, sz)
    }

    // Sequence
    const seq = [
      { text: 'THEY refer to...',         col: '#334455', size: 3.2, delay: 200  },
      { text: 'THE STRONGEST',            col: '#8844aa', size: 7,   delay: 1600 },
      { text: 'MEMBERS OF SI LAB.',       col: '#8844aa', size: 5.2, delay: 3100 },
      { text: '— THE GOATS —',            col: '#cc9900', size: 5.2, delay: 4700 },
      { text: 'THE LEGENDS.',             col: '#ffcc00', size: 8.5, delay: 6200 },
      { text: 'THE ONES WHO GUIDED US.',  col: '#886644', size: 3.2, delay: 7700 },
    ]

    seq.forEach(({ text, col, size, delay }) => {
      const sz = this._fs(size, size * 2.8, size * 5.5)
      const t  = this._txt(W / 2, H * 0.47, text, 'pixel', sz, col)
        .setOrigin(0.5).setAlpha(0).setDepth(10)
        .setStyle({ stroke: '#000000', strokeThickness: 2, align: 'center' })
      this._timer(delay, () => {
        this._tween(t, { alpha: 1, y: H * 0.45, duration: 360, ease: 'Back.out(1.2)' })
        this._timer(980, () => {
          this._tween(t, { alpha: 0, y: H * 0.41, scaleX: 0.88, scaleY: 0.88, duration: 360, ease: 'Power2', onComplete: () => t.destroy() })
        })
      })
    })

    // ── FINAL REVEAL ─────────────────────────────────────────────────────────
    this._timer(9200, () => {
      // God rays
      const raysG = this.add.graphics().setAlpha(0).setDepth(2)
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2
        const len   = Math.min(W, H) * 0.62
        const thick = i % 2 === 0 ? 3 : 1
        const a     = i % 2 === 0 ? 0.05 : 0.02
        raysG.lineStyle(thick, 0xffcc00, a)
        raysG.lineBetween(W / 2, H * 0.43, W / 2 + Math.cos(angle) * len, H * 0.43 + Math.sin(angle) * len)
      }
      this._tween(raysG, { alpha: 1, duration: 900 })
      this._tween(raysG, { rotation: Math.PI * 2, duration: 18000, repeat: -1, ease: 'Linear' })

      // Glow circle
      const glowG = this.add.graphics().setAlpha(0).setDepth(3)
      for (let r = 120; r > 0; r -= 8) {
        glowG.fillStyle(0xffcc00, 0.007 * (1 - r / 120))
        glowG.fillCircle(W / 2, H * 0.43, r)
      }
      this._tween(glowG, { alpha: 1, duration: 700, delay: 200 })

      // Orange glow shadow text
      const theyShadow = this._txt(W / 2 + 4, H * 0.41, 'T H E Y', 'pixel', this._fs(12, 36, 90), '#ff5500')
        .setOrigin(0.5).setAlpha(0).setDepth(4)
        .setStyle({ stroke: '#000000', strokeThickness: 10 })
      // Main text
      const they = this._txt(W / 2, H * 0.41, 'T H E Y', 'pixel', this._fs(12, 36, 90), '#ffdd00')
        .setOrigin(0.5).setAlpha(0).setDepth(5)
        .setStyle({ stroke: '#000000', strokeThickness: 7, letterSpacing: 8 })

      this._tween(theyShadow, { alpha: 0.5, duration: 700, ease: 'Back.out(1.2)' })
      this._tween(they,       { alpha: 1,   duration: 700, ease: 'Back.out(1.2)' })
      // Eternal pulse
      this._tween(they, { scaleX: 1.035, scaleY: 1.035, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 })

      // Subtitle
      const sub = this._txt(W / 2, H * 0.61, '— THE SENIORS WHO CHANGED EVERYTHING —', 'mono', this._fs(2, 6, 11), '#443322')
        .setOrigin(0.5).setAlpha(0).setDepth(5)
      this._tween(sub, { alpha: 1, duration: 600, delay: 500 })

      // Prompt
      const prompt = this._buildPrompt()
      this._tween(prompt, { alpha: 1, duration: 600, delay: 1500 })

      this._timer(1700, () => {
        const go = () => {
          this.input.removeAllListeners()
          this.input.keyboard?.removeAllListeners()
          this._blackOut(600, () => this.scene.start('CharSelectScene'))
        }
        this.input.once('pointerdown', go)
        this.input.keyboard?.once('keydown-ENTER', go)
        this.input.keyboard?.once('keydown-SPACE', go)
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  _buildNameTag(x, y, name, color) {
    const container = this.add.container(x, y)
    const tw  = name.length * 6 + 18
    const hex = '#' + color.toString(16).padStart(6, '0')
    const bg  = this.add.graphics()
    bg.fillStyle(0x000000, 0.65)
    bg.fillRoundedRect(-tw / 2, -9, tw, 18, 3)
    bg.lineStyle(1, color, 0.65)
    bg.strokeRoundedRect(-tw / 2, -9, tw, 18, 3)
    const t = this.add.text(0, 0, name, {
      fontFamily: '"Share Tech Mono", monospace', fontSize: 8, color: hex,
    }).setOrigin(0.5)
    container.add([bg, t])
    return container
  }

  _buildSpeechBubble(x, y, text, color) {
    const container = this.add.container(x, y)
    const hex   = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color
    const lines = text.split('\n')
    const bh    = lines.length * 12 + 18
    const bw    = 134
    const bg    = this.add.graphics()
    bg.fillStyle(0x08080f, 0.94)
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6)
    bg.lineStyle(1, typeof color === 'number' ? color : parseInt(color.replace('#', '0x')), 0.7)
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6)
    // Tail
    bg.fillTriangle(-7, bh / 2, 7, bh / 2, 0, bh / 2 + 10)
    bg.lineStyle(1, typeof color === 'number' ? color : parseInt(color.replace('#', '0x')), 0.4)
    bg.lineBetween(-7, bh / 2, 0, bh / 2 + 10)
    bg.lineBetween(7, bh / 2, 0, bh / 2 + 10)
    const t = this.add.text(0, 0, text, {
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: 8, color: '#aabccc', align: 'center', lineSpacing: 3,
    }).setOrigin(0.5)
    container.add([bg, t])
    return container
  }

  _buildDialogueBox(x, y, speaker, text, color) {
    const { W }   = this
    const hexCol  = color
    const intCol  = parseInt(color.replace('#', '0x'))
    const bw      = Math.min(W * 0.88, 410)
    const bh      = 76
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.90)
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 5)
    bg.lineStyle(2, intCol, 0.80)
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 5)
    // Left accent strip
    bg.fillStyle(intCol, 1)
    bg.fillRect(-bw / 2, -bh / 2, 4, bh)
    // Top inner dark strip
    bg.fillStyle(intCol, 0.07)
    bg.fillRect(-bw / 2 + 4, -bh / 2, bw - 4, 4)
    const spk = this.add.text(-bw / 2 + 14, -bh / 2 + 8, '▶ ' + speaker, {
      fontFamily: '"Share Tech Mono", monospace', fontSize: 8, color: hexCol,
    })
    const txt = this.add.text(-bw / 2 + 14, -bh / 2 + 24, text, {
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: 10, color: '#c8d8ee',
      wordWrap: { width: bw - 28 }, lineSpacing: 3,
    })
    container.add([bg, spk, txt])
    return container
  }

  _buildPrompt() {
    const { W, H } = this
    const isMobile = this.sys.game.device.input.touch
    const label    = isMobile ? '[ TAP TO CONTINUE ]' : '[ PRESS ENTER ]'
    const container = this.add.container(W / 2, H * 0.84).setAlpha(0).setDepth(20)
    const bw = 220
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.65)
    bg.fillRoundedRect(-bw / 2, -18, bw, 36, 5)
    bg.lineStyle(1, 0xffcc00, 0.45)
    bg.strokeRoundedRect(-bw / 2, -18, bw, 36, 5)
    const t = this.add.text(0, 0, label, {
      fontFamily: '"Share Tech Mono", monospace', fontSize: 10, color: '#ccaa44',
    }).setOrigin(0.5)
    container.add([bg, t])
    this._tween(container, { alpha: 0.2, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 })
    return container
  }

  // ── Scene decorators ─────────────────────────────────────────────────────
  _ceilingLight(x, y, width) {
    const { H } = this
    const g = this.add.graphics()
    // Tube body
    g.fillStyle(0xd0e8ff, 0.06)
    g.fillRect(x - width / 2, y, width, 4)
    g.fillStyle(0xd0e8ff, 0.7)
    g.fillRect(x - width / 2 + 2, y + 1, width - 4, 2)
    // Light cone (triangle fan)
    for (let i = 0; i < 28; i++) {
      const t   = i / 28
      const cw  = width * 0.5 * (1 + t * 1.4)
      const cy  = y + 4 + t * H * 0.44
      const a   = 0.055 * (1 - t) * (1 - t)
      g.fillStyle(0xb8d0ff, a)
      g.fillRect(x - cw / 2, cy, cw, 4)
    }
  }

  _scanlines() {
    const { W, H } = this
    const g = this.add.graphics().setDepth(9000)
    for (let y = 0; y < H; y += 3) {
      g.fillStyle(0x000000, 0.09)
      g.fillRect(0, y, W, 1)
    }
  }

  _cornerVignette() {
    const { W, H } = this
    const g = this.add.graphics().setDepth(8800)
    for (let i = 0; i < 12; i++) {
      const t = i / 12
      const a = 0.20 * (1 - t) * (1 - t)
      const ew = W * 0.16 * (1 - t)
      const eh = H * 0.12 * (1 - t)
      g.fillStyle(0x000000, a)
      g.fillRect(0, 0, ew, H)
      g.fillRect(W - ew, 0, ew, H)
      g.fillRect(0, 0, W, eh)
      g.fillRect(0, H - eh, W, eh)
    }
  }

  _grain() {
    const { W, H } = this
    const g = this.add.graphics().setDepth(9100).setAlpha(0.022)
    for (let i = 0; i < 1800; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.5 + 0.2)
      g.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 1, 1)
    }
  }

  _glitchBurst(count, onDone) {
    const { W, H } = this
    let done = 0
    const flash = () => {
      const bg = this.add.rectangle(0, 0, W, H, 0xffffff, 0.88).setOrigin(0).setDepth(9999)
      for (let i = 0; i < 6; i++) {
        const sl = this.add.rectangle(
          Phaser.Math.Between(0, W),
          Phaser.Math.Between(0, H),
          Phaser.Math.Between(W * 0.25, W * 0.9),
          Phaser.Math.Between(2, 9),
          Phaser.Utils.Array.GetRandom([0xff00ff, 0x00ffff, 0xff0000, 0x00ff00]),
          Phaser.Math.FloatBetween(0.5, 0.95)
        ).setOrigin(Phaser.Math.FloatBetween(0, 1), 0.5).setDepth(10000)
        this._tween(sl, { alpha: 0, duration: Phaser.Math.Between(50, 130), onComplete: () => sl.destroy() })
      }
      this._tween(bg, {
        alpha: 0, duration: 100, ease: 'Linear',
        onComplete: () => {
          bg.destroy(); done++
          if (done < count) this._timer(Phaser.Math.Between(40, 130), flash)
          else onDone?.()
        }
      })
    }
    flash()
  }

  _glitchLines(count) {
    const { W, H } = this
    for (let i = 0; i < count; i++) {
      this._timer(i * 160, () => {
        const sl = this.add.rectangle(
          Phaser.Math.Between(0, W * 0.6),
          Phaser.Math.Between(H * 0.08, H * 0.92),
          Phaser.Math.Between(W * 0.15, W * 0.75),
          Phaser.Math.Between(1, 5),
          Phaser.Utils.Array.GetRandom([0xff00ff, 0x00ffff, 0xffffff, 0xff4444]),
          Phaser.Math.FloatBetween(0.05, 0.25)
        ).setDepth(9500)
        this._tween(sl, { alpha: 0, duration: Phaser.Math.Between(70, 200), onComplete: () => sl.destroy() })
      })
    }
  }

  _monitorFlicker() {
    if (!this.scene.isActive('PreludeScene')) return
    const { W, H } = this
    const ln = this.add.rectangle(
      Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.65),
      Phaser.Math.Between(30, 180), 2, 0x4488ff, 0.07
    ).setDepth(6)
    this._tween(ln, { alpha: 0, duration: Phaser.Math.Between(35, 110), onComplete: () => ln.destroy() })
    this._timer(Phaser.Math.Between(100, 380), () => this._monitorFlicker())
  }

  _spawnFloat(x, y, text, color) {
    const t = this._txt(x, y, text, 'mono', this._fs(2, 6, 10), color)
      .setOrigin(0.5).setAlpha(0).setDepth(12)
    this._tween(t, {
      alpha: 1, y: y - 8, duration: 600, ease: 'Power1',  // Slower, less flying
      onComplete: () => {
        this._tween(t, { alpha: 0, y: y - 20, duration: 800, delay: 800, ease: 'Power1', onComplete: () => t.destroy() })  // Longer delay
      }
    })
  }

  _blackOut(dur, cb) {
    const o = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0).setOrigin(0).setDepth(9990)
    this._tween(o, { fillAlpha: 1, duration: dur, ease: 'Linear', onComplete: cb })
  }

  _clearScene() {
    this.children.list.slice().forEach(c => c.destroy())
    this._tw.forEach(t => t?.stop?.())
    this._tw = []
    this._tmr.forEach(t => t?.remove?.())
    this._tmr = []
  }

  _txt(x, y, str, font = 'mono', size = 10, fill = '#ffffff') {
    return this.add.text(x, y, str, {
      fontFamily: font === 'pixel'
        ? '"Press Start 2P", monospace'
        : '"Share Tech Mono", "Courier New", monospace',
      fontSize: size,
      fill,
      resolution: 2,
    })
  }

  _ellipse(x, y, w, h, color, alpha) {
    return this.add.ellipse(x, y, w, h, color, alpha)
  }

  _tween(targets, cfg) {
    const t = this.tweens.add({ targets, ...cfg })
    this._tw.push(t)
    return t
  }

  _timer(delay, cb) {
    const t = this.time.delayedCall(delay, cb)
    this._tmr.push(t)
    return t
  }

  _fs(vw, minPx = 8, maxPx = 64) {
    return Math.max(minPx, Math.min(maxPx, Math.round(this.W * vw / 100)))
  }

  shutdown() {
    this._tw.forEach(t => t?.stop?.())
    this._tmr.forEach(t => t?.remove?.())
  }
}