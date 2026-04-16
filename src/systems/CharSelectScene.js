// ─────────────────────────────────────────────────────────────────────────────
// CharSelectScene.js — Complete rebuild
// Mobile-first. Warm amber/gold theme. Smooth momentum reel. Big readable cards.
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'
import { SENIORS } from '../data/seniors.js'

const N = SENIORS.length
const CLONES = 3  // clones on each side for seamless infinite wrap

// ── Per-card accent palette — vivid, distinct, no blue soup ──────────────────
const CARD_ACCENTS = [
  { bg: 0x1a0a00, border: 0xff6b00, text: '#ff6b00', glow: '#ff6b00' }, // Blazing Orange
  { bg: 0x00001a, border: 0x3d9eff, text: '#3d9eff', glow: '#3d9eff' }, // Electric Blue
  { bg: 0x0d001a, border: 0xc84bff, text: '#c84bff', glow: '#c84bff' }, // Vivid Purple
  { bg: 0x001a0a, border: 0x00e676, text: '#00e676', glow: '#00e676' }, // Neon Green
  { bg: 0x1a0000, border: 0xff2d55, text: '#ff2d55', glow: '#ff2d55' }, // Hot Pink-Red
  { bg: 0x1a1400, border: 0xffd600, text: '#ffd600', glow: '#ffd600' }, // Pure Gold
  { bg: 0x001a1a, border: 0x00e5ff, text: '#00e5ff', glow: '#00e5ff' }, // Cyan
  { bg: 0x1a0a0a, border: 0xff5252, text: '#ff5252', glow: '#ff5252' }, // Coral Red
  { bg: 0x0a1a00, border: 0x76ff03, text: '#76ff03', glow: '#76ff03' }, // Lime
  { bg: 0x000d1a, border: 0x448aff, text: '#448aff', glow: '#448aff' }, // Sapphire
  { bg: 0x1a001a, border: 0xf50057, text: '#f50057', glow: '#f50057' }, // Magenta
]

export class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelectScene') }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height

    // ── Mobile-responsive card sizing ─────────────────────────────────────────
    this.CARD_W    = Math.round(Math.min(this.W * 0.72, 320))
    this.CARD_H    = Math.round(this.CARD_W * 1.55)
    this.CARD_STEP = Math.round(this.CARD_W * 0.58)
    this.TAPE_H    = Math.round(this.H * 0.055)
    this.AVATAR_R  = Math.round(this.CARD_W * 0.18)

    this.REEL_Y    = this.H * 0.47
    this.INFO_Y    = this.REEL_Y + this.CARD_H * 0.54 + this.TAPE_H + this.H * 0.035
    this.BTN_Y     = this.H * 0.915

    this._index        = 0
    this._scrolling    = false
    this._selStarted   = false
    this._swipeStartX  = null
    this._swipeStartY  = null
    this._swipeT       = 0
    this._holeOffset   = 0
    this._holeObjects  = []
    this._cardSlots    = []

    this.cameras.main.fadeIn(500, 10, 10, 20)

    this._buildBG()
    this._buildTapeRail()
    this._buildCards()
    this._buildUI()
    this._buildInput()
    this._applyStyles(false)
    this._updateInfo()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════════
  _buildBG() {
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x0e0b08).setOrigin(0).setDepth(0)

    // Warm horizontal grain lines
    const grain = this.add.graphics().setDepth(1).setAlpha(0.06)
    grain.lineStyle(1, 0xffcc77, 1)
    for (let y = 0; y < H; y += 18) grain.lineBetween(0, y, W, y)

    // Warm spotlight glow from top-center
    const gfx = this.add.graphics().setDepth(2)
    const cx = W / 2, cy = H * 0.3
    for (let r = W * 1.2; r > 0; r -= W * 0.06) {
      const t = r / (W * 1.2)
      gfx.fillStyle(0xff9500, (1 - t) * 0.07)
      gfx.fillCircle(cx, cy, r)
    }

    // Floating ember particles
    for (let i = 0; i < 22; i++) this._spawnParticle()

    // Strong edge vignette
    const vig = this.add.graphics().setDepth(3)
    for (let i = 0; i < 28; i++) {
      const t  = i / 28
      const a  = t * t * 0.7
      const bx = W * t * 0.45
      const by = H * t * 0.35
      vig.fillStyle(0x000000, a / 28 * 1.8)
      vig.fillRect(0, 0, bx, H)
      vig.fillRect(W - bx, 0, bx, H)
      vig.fillRect(0, 0, W, by)
      vig.fillRect(0, H - by, W, by)
    }

    // Scanlines
    const scan = this.add.graphics().setDepth(3).setAlpha(0.035)
    for (let y = 0; y < H; y += 4) {
      scan.fillStyle(0x000000, 1)
      scan.fillRect(0, y, W, 1)
    }

    // Title
    const titleY = H * 0.055
    const titleSize = this._fs(6.5, 22, 42)
    this.add.text(W / 2, titleY, 'Choose the senior', {
      fontFamily:      '"Rajdhani", "Arial Black", sans-serif',
      fontSize:        titleSize,
      fontStyle:       'bold',
      fill:            '#ffffff',
      stroke:          '#ff6600',
      strokeThickness: 2,
      letterSpacing:   3,
    }).setOrigin(0.5).setDepth(10).setShadow(0, 2, '#ff4400', 14, true)

    this.add.text(W / 2, titleY + titleSize + 6, 'SWIPE  ·  TAP  ·  CONQUER', {
      fontFamily:    '"Nunito", sans-serif',
      fontSize:      this._fs(3, 10, 15),
      fill:          '#b07040',
      letterSpacing: 5,
    }).setOrigin(0.5).setDepth(10)

    const lineG = this.add.graphics().setDepth(10)
    lineG.lineStyle(1, 0xff6600, 0.25)
    lineG.lineBetween(W * 0.1, H * 0.145, W * 0.9, H * 0.145)
  }

  _spawnParticle() {
    const { W, H } = this
    const colors = [0xff6600, 0xffaa00, 0xff4400, 0xffdd44]
    const col    = colors[Math.floor(Math.random() * colors.length)]
    const p      = this.add.circle(
      Math.random() * W, H + 10,
      Math.random() * 2.5 + 0.5,
      col, Math.random() * 0.6 + 0.2
    ).setDepth(4)
    const dur = 4000 + Math.random() * 5000
    this.tweens.add({
      targets: p,
      y: -20,
      x: p.x + (Math.random() - 0.5) * 80,
      alpha: 0,
      duration: dur,
      ease: 'Sine.easeIn',
      delay: Math.random() * 3000,
      repeat: -1,
      onRepeat: () => {
        p.x = Math.random() * W
        p.y = H + 10
        p.alpha = Math.random() * 0.6 + 0.2
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAPE RAIL
  // ═══════════════════════════════════════════════════════════════════════════
  _buildTapeRail() {
    const { W, REEL_Y, CARD_H, TAPE_H } = this
    const topY = REEL_Y - CARD_H / 2 - TAPE_H
    const botY = REEL_Y + CARD_H / 2

    // Tape body behind cards
    this.add.rectangle(W / 2, REEL_Y, W, CARD_H + TAPE_H * 2, 0x0a0804).setOrigin(0.5).setDepth(5)

    // Top strip
    this.add.rectangle(W / 2, topY + TAPE_H / 2, W, TAPE_H, 0x140f08).setOrigin(0.5).setDepth(6)
    this.add.rectangle(W / 2, topY,          W, 2, 0xff6600, 0.4).setOrigin(0.5, 0).setDepth(7)
    this.add.rectangle(W / 2, topY + TAPE_H, W, 2, 0xff6600, 0.4).setOrigin(0.5, 0).setDepth(7)

    // Bottom strip
    this.add.rectangle(W / 2, botY + TAPE_H / 2, W, TAPE_H, 0x140f08).setOrigin(0.5).setDepth(6)
    this.add.rectangle(W / 2, botY,          W, 2, 0xff6600, 0.4).setOrigin(0.5, 0).setDepth(7)
    this.add.rectangle(W / 2, botY + TAPE_H, W, 2, 0xff6600, 0.4).setOrigin(0.5, 0).setDepth(7)

    // Sprocket holes
    const holeW   = Math.round(TAPE_H * 0.55)
    const holeH   = Math.round(TAPE_H * 0.38)
    const holeGap = Math.round(holeW * 2.2)
    const count   = Math.ceil(W / holeGap) + 8
    const startX  = -holeGap * 3
    const hy1     = topY + (TAPE_H - holeH) / 2
    const hy2     = botY + (TAPE_H - holeH) / 2

    for (let i = 0; i < count; i++) {
      const bx = startX + i * holeGap

      const gt = this.add.graphics().setDepth(8)
      gt.fillStyle(0x060402, 1)
      gt.fillRoundedRect(bx - holeW / 2, hy1, holeW, holeH, 3)
      gt.lineStyle(1, 0x3a2510, 1)
      gt.strokeRoundedRect(bx - holeW / 2, hy1, holeW, holeH, 3)

      const gb = this.add.graphics().setDepth(8)
      gb.fillStyle(0x060402, 1)
      gb.fillRoundedRect(bx - holeW / 2, hy2, holeW, holeH, 3)
      gb.lineStyle(1, 0x3a2510, 1)
      gb.strokeRoundedRect(bx - holeW / 2, hy2, holeW, holeH, 3)

      this._holeObjects.push({ gt, gb, baseX: bx, holeGap })
    }

    // Side fade masks — hide off-screen cards cleanly
    const fadeW = Math.round(W * 0.16)
    const fadeH = CARD_H + TAPE_H * 2 + 10
    const fadeY = REEL_Y - fadeH / 2

    ;[{ side: 'left', startX: 0 }, { side: 'right', startX: W - fadeW }].forEach(({ side, startX: fx }) => {
      const fade = this.add.graphics().setDepth(50)
      for (let step = 0; step < 20; step++) {
        const t = step / 20
        const a = side === 'left' ? (1 - t) * 0.96 : t * 0.96
        const sx = side === 'left'
          ? fx + step * (fadeW / 20)
          : fx + (20 - step - 1) * (fadeW / 20)
        fade.fillStyle(0x0a0804, a)
        fade.fillRect(sx, fadeY, fadeW / 20 + 1, fadeH)
      }
    })
  }

  _shiftHoles(px) {
    if (!this._holeObjects.length) return
    const { holeGap } = this._holeObjects[0]
    this._holeOffset = ((this._holeOffset + px) % holeGap + holeGap) % holeGap
    this._holeObjects.forEach(h => {
      h.gt.x = this._holeOffset
      h.gb.x = this._holeOffset
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDS
  // ═══════════════════════════════════════════════════════════════════════════
  _buildCards() {
    const { W, REEL_Y } = this
    const seq = []
    for (let c = 0; c < CLONES; c++) seq.push(N - CLONES + c)
    for (let i = 0; i < N; i++)      seq.push(i)
    for (let c = 0; c < CLONES; c++) seq.push(c)

    seq.forEach((ri, si) => {
      const x    = W / 2 + (si - CLONES) * this.CARD_STEP
      const cont = this._makeCard(SENIORS[ri], ri, x, REEL_Y)
      this._cardSlots.push({ container: cont, realIdx: ri })

      cont.setInteractive(
        new Phaser.Geom.Rectangle(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H),
        Phaser.Geom.Rectangle.Contains
      )
      cont.on('pointerdown', () => {
        if (ri === this._index) { this._confirm() }
        else {
          let d = ri - this._index
          if (d >  N / 2) d -= N
          if (d < -N / 2) d += N
          this._scroll(d)
        }
      })
    })
  }

  _makeCard(s, ri, x, y) {
    const { CARD_W, CARD_H, AVATAR_R } = this
    const ac   = CARD_ACCENTS[ri % CARD_ACCENTS.length]
    const cont = this.add.container(x, y).setDepth(15)

    // Shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.55)
    shadow.fillRoundedRect(-CARD_W / 2 + 6, -CARD_H / 2 + 10, CARD_W, CARD_H, 18)

    // Card body
    const body = this.add.graphics()
    body.fillStyle(ac.bg, 1)
    body.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16)

    // Subtle inner highlight (top half)
    const highlight = this.add.graphics()
    highlight.fillStyle(0xffffff, 0.04)
    highlight.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H * 0.45, 16)

    // Border outer + inner dim
    const border = this.add.graphics()
    border.lineStyle(2.5, ac.border, 1)
    border.strokeRoundedRect(-CARD_W / 2 + 1.5, -CARD_H / 2 + 1.5, CARD_W - 3, CARD_H - 3, 15)
    border.lineStyle(1, ac.border, 0.18)
    border.strokeRoundedRect(-CARD_W / 2 + 6, -CARD_H / 2 + 6, CARD_W - 12, CARD_H - 12, 12)

    // Top accent bar
    const topBar = this.add.graphics()
    topBar.fillStyle(ac.border, 0.95)
    topBar.fillRoundedRect(
      -CARD_W / 2 + 2, -CARD_H / 2 + 2,
      CARD_W - 4, Math.round(CARD_H * 0.045),
      { tl: 14, tr: 14, bl: 0, br: 0 }
    )

    // Number badge
    const badgeW = Math.round(CARD_W * 0.2)
    const badgeH = Math.round(CARD_H * 0.065)
    const badgeY = -CARD_H / 2 + Math.round(CARD_H * 0.065)
    const numBadge = this.add.graphics()
    numBadge.fillStyle(ac.border, 0.2)
    numBadge.fillRoundedRect(-CARD_W / 2 + 10, badgeY, badgeW, badgeH, 5)

    const numTxt = this.add.text(
      -CARD_W / 2 + 10 + badgeW / 2,
      badgeY + badgeH / 2,
      String(ri + 1).padStart(2, '0'),
      { fontFamily: '"Nunito", sans-serif', fontSize: this._fs(3.5, 11, 16), fill: ac.text, fontStyle: 'bold' }
    ).setOrigin(0.5)

    // ── Avatar
    const avatarY = -CARD_H / 2 + Math.round(CARD_H * 0.31)

    const pulseRing = this.add.graphics()
    pulseRing.lineStyle(1.5, ac.border, 0.18)
    pulseRing.strokeCircle(0, avatarY, AVATAR_R + Math.round(AVATAR_R * 0.45))

    const glowFill = this.add.circle(0, avatarY, AVATAR_R + 10, ac.border, 0.08)

    const avatarCircle = this.add.graphics()
    avatarCircle.fillStyle(ac.bg, 1)
    avatarCircle.fillCircle(0, avatarY, AVATAR_R)
    avatarCircle.lineStyle(3, ac.border, 0.9)
    avatarCircle.strokeCircle(0, avatarY, AVATAR_R)

    // Spinning dashed ring
    const spinRing = this.add.graphics()
    const dashCount = 12
    const spinR = AVATAR_R + Math.round(AVATAR_R * 0.22)
    for (let d = 0; d < dashCount; d++) {
      const a1 = (d / dashCount) * Math.PI * 2
      const a2 = a1 + (Math.PI * 2 / dashCount) * 0.55
      spinRing.lineStyle(2, ac.border, 0.5)
      spinRing.beginPath()
      for (let p = 0; p <= 8; p++) {
        const aa = a1 + (a2 - a1) * (p / 8)
        const px2 = Math.cos(aa) * spinR
        const py2 = Math.sin(aa) * spinR + avatarY
        p === 0 ? spinRing.moveTo(px2, py2) : spinRing.lineTo(px2, py2)
      }
      spinRing.strokePath()
    }
    this.tweens.add({
      targets: spinRing, angle: 360,
      duration: 6000 + Math.random() * 3000,
      repeat: -1, ease: 'Linear',
    })

    let avatarDisplay
    if (this.textures.exists(s.id)) {
      avatarDisplay = this.add.image(0, avatarY, s.id)
        .setDisplaySize(AVATAR_R * 2 - 4, AVATAR_R * 2 - 4).setOrigin(0.5)
    } else {
      avatarDisplay = this.add.text(0, avatarY, s.name[0], {
        fontFamily: '"Rajdhani", "Arial Black", sans-serif',
        fontSize:   Math.round(AVATAR_R * 1.1),
        fontStyle:  'bold',
        fill:       '#ffffff',
      }).setOrigin(0.5)
      avatarDisplay.setShadow(0, 0, ac.glow, 16, true)
    }

    // ── Name
    const nameY    = -CARD_H / 2 + Math.round(CARD_H * 0.575)
    const nameSize = this._fs(4.8, 16, 26)
    const nameTxt  = this.add.text(0, nameY, s.name, {
      fontFamily:      '"Rajdhani", "Arial Black", sans-serif',
      fontSize:        nameSize,
      fontStyle:       'bold',
      fill:            '#ffffff',
      align:           'center',
      stroke:          '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5)
    nameTxt.setShadow(0, 1, ac.glow, 8, true)

    // ── Title/role
    const titleY2   = nameY + nameSize + 5
    const titleSize = this._fs(3, 10, 14)
    const titleTxt  = this.add.text(0, titleY2, s.title.toUpperCase(), {
      fontFamily:    '"Nunito", sans-serif',
      fontSize:      titleSize,
      fill:          ac.text,
      align:         'center',
      letterSpacing: 3,
    }).setOrigin(0.5)

    // ── Divider with diamond
    const divY = titleY2 + titleSize + 10
    const divG = this.add.graphics()
    divG.lineStyle(1, ac.border, 0.35)
    divG.lineBetween(-CARD_W * 0.38, divY, CARD_W * 0.38, divY)
    const diamond = this.add.graphics()
    diamond.fillStyle(ac.border, 0.8)
    diamond.fillTriangle(0, divY - 4, 4, divY, 0, divY + 4)
    diamond.fillTriangle(0, divY - 4, -4, divY, 0, divY + 4)

    // ── Bio
    const bioY   = divY + 12
    const bioTxt = this.add.text(0, bioY, s.bio || s.desc || '', {
      fontFamily:  '"Nunito", sans-serif',
      fontSize:    this._fs(2.8, 9, 13),
      fill:        '#c8a882',
      align:       'center',
      wordWrap:    { width: CARD_W - Math.round(CARD_W * 0.18) },
      lineSpacing: 4,
    }).setOrigin(0.5, 0)

    // ── Stats
    const statsBaseY = CARD_H / 2 - Math.round(CARD_H * 0.16)
    const barW       = Math.round(CARD_W * 0.24)
    const barH       = Math.round(CARD_H * 0.022)
    const statDefs   = [
      { label: 'PWR', val: s.stat?.power  ?? 7, ox: -Math.round(CARD_W * 0.3) },
      { label: 'SPD', val: s.stat?.speed  ?? 7, ox: 0                          },
      { label: 'WIS', val: s.stat?.wisdom ?? 7, ox:  Math.round(CARD_W * 0.3) },
    ]
    const statEls = []
    statDefs.forEach(({ label, val, ox }) => {
      const lbl = this.add.text(ox, statsBaseY, label, {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   this._fs(2.5, 8, 11),
        fill:       '#7a6040',
        fontStyle:  'bold',
        align:      'center',
      }).setOrigin(0.5, 1)

      const by  = statsBaseY + 4
      const bg2 = this.add.graphics()
      bg2.fillStyle(0x000000, 0.5)
      bg2.fillRoundedRect(ox - barW / 2, by, barW, barH, barH / 2)

      const fillW = Math.round(barW * Math.min(val, 10) / 10)
      const fill  = this.add.graphics()
      fill.fillStyle(ac.border, 0.9)
      fill.fillRoundedRect(ox - barW / 2, by, fillW, barH, barH / 2)

      const valTxt = this.add.text(ox, by + barH + 3, String(val), {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   this._fs(2.3, 7, 10),
        fill:       ac.text,
        align:      'center',
      }).setOrigin(0.5, 0)

      statEls.push(lbl, bg2, fill, valTxt)
    })

    // ── Tap hint (only visible on active card)
    const tapHint = this.add.text(0, CARD_H / 2 - 14, 'TAP TO SELECT', {
      fontFamily:    '"Nunito", sans-serif',
      fontSize:      this._fs(2.4, 8, 11),
      fill:          ac.text,
      align:         'center',
      letterSpacing: 4,
    }).setOrigin(0.5, 1).setAlpha(0)
    this.tweens.add({
      targets: tapHint,
      alpha:   { from: 0, to: 0.8 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
    cont._tapHint = tapHint

    cont.add([
      shadow, body, highlight, border, topBar,
      numBadge, numTxt,
      pulseRing, glowFill, avatarCircle, spinRing, avatarDisplay,
      nameTxt, titleTxt, divG, diamond, bioTxt,
      ...statEls, tapHint,
    ])
    cont._accent = ac
    return cont
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════════════════════════════
  _buildUI() {
    const { W, H, INFO_Y, BTN_Y } = this

    this._leftBtn  = this._navBtn(Math.round(W * 0.07), H * 0.47, '‹', -1)
    this._rightBtn = this._navBtn(Math.round(W * 0.93), H * 0.47, '›',  1)

    // Name
    this._infoName = this.add.text(W / 2, INFO_Y, '', {
      fontFamily: '"Rajdhani", "Arial Black", sans-serif',
      fontSize:   this._fs(6.5, 22, 36),
      fontStyle:  'bold',
      fill:       '#ffffff',
      align:      'center',
    }).setOrigin(0.5).setDepth(100)

    // Subtitle
    this._infoSub = this.add.text(W / 2, INFO_Y + this._fs(6.5, 22, 36) + 6, '', {
      fontFamily:    '"Nunito", sans-serif',
      fontSize:      this._fs(3.2, 11, 16),
      fill:          '#ff6600',
      align:         'center',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(100)

    // Dots
    this._dots      = []
    const dotY      = INFO_Y + this._fs(6.5, 22, 36) + this._fs(3.2, 11, 16) + 22
    const dotSpacing = Math.min(18, W * 0.035)
    const dotsW     = (N - 1) * dotSpacing
    SENIORS.forEach((s, i) => {
      const dot = this.add.circle(W / 2 - dotsW / 2 + i * dotSpacing, dotY, 5, 0x2a1a08, 1).setDepth(100)
      dot.setStrokeStyle(1.5, 0x664422, 0.6)
      dot.setInteractive()
      dot.on('pointerdown', () => {
        let d = i - this._index
        if (d >  N / 2) d -= N
        if (d < -N / 2) d += N
        this._scroll(d)
      })
      this._dots.push(dot)
    })

    // Confirm button
    this._confirmBg = this.add.graphics().setDepth(100)
    this._drawConfirmBg(0xff6600, false)

    this._confirmTxt = this.add.text(W / 2, BTN_Y, '★  LOCK IN  ★', {
      fontFamily:    '"Rajdhani", "Arial Black", sans-serif',
      fontSize:      this._fs(5, 17, 24),
      fontStyle:     'bold',
      fill:          '#ffffff',
      align:         'center',
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(101)
    this._confirmTxt.setShadow(0, 2, '#ff4400', 10, true)

    this.tweens.add({
      targets: this._confirmTxt,
      scaleX: 1.03, scaleY: 1.03,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    const btnW = Math.min(Math.round(W * 0.65), 280)
    const btnH = Math.round(H * 0.07)
    this._confirmTxt.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    )
    this._confirmTxt.on('pointerdown', () => this._confirm())
  }

  _drawConfirmBg(color, hover) {
    const { W, BTN_Y, H } = this
    const btnW = Math.min(Math.round(W * 0.65), 280)
    const btnH = Math.round(H * 0.07)
    this._confirmBg.clear()
    this._confirmBg.fillStyle(color, hover ? 0.3 : 0.15)
    this._confirmBg.fillRoundedRect(W / 2 - btnW / 2, BTN_Y - btnH / 2, btnW, btnH, btnH / 2)
    this._confirmBg.lineStyle(2.5, color, hover ? 1 : 0.7)
    this._confirmBg.strokeRoundedRect(W / 2 - btnW / 2, BTN_Y - btnH / 2, btnW, btnH, btnH / 2)
  }

  _navBtn(x, y, glyph, dir) {
    const size = Math.round(Math.min(this.W * 0.13, 56))

    const bg = this.add.graphics().setDepth(200)
    bg.fillStyle(0x1a0e04, 0.85)
    bg.fillRoundedRect(x - size / 2, y - size * 0.9, size, size * 1.8, 10)
    bg.lineStyle(1.5, 0xff6600, 0.4)
    bg.strokeRoundedRect(x - size / 2, y - size * 0.9, size, size * 1.8, 10)

    const txt = this.add.text(x, y, glyph, {
      fontFamily: '"Rajdhani", "Arial Black", sans-serif',
      fontSize:   Math.round(size * 1.1),
      fontStyle:  'bold',
      fill:       '#ff6600',
    }).setOrigin(0.5).setDepth(201)
    txt.setShadow(0, 0, '#ff4400', 10, true)

    const tap = this.add.rectangle(x, y, size + 20, size * 2.2, 0x000000, 0).setDepth(202).setInteractive()
    tap.on('pointerdown', () => {
      this.tweens.add({ targets: txt, scaleX: 0.82, scaleY: 0.82, duration: 80, yoyo: true })
      this._scroll(dir)
    })
    return { bg, txt, tap }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  _buildInput() {
    this.input.keyboard.on('keydown-LEFT',  () => this._scroll(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this._scroll(1))
    this.input.keyboard.on('keydown-A',     () => this._scroll(-1))
    this.input.keyboard.on('keydown-D',     () => this._scroll(1))
    this.input.keyboard.on('keydown-ENTER', () => this._confirm())
    this.input.keyboard.on('keydown-SPACE', () => this._confirm())

    this.input.on('pointerdown', p => {
      this._swipeStartX = p.x
      this._swipeStartY = p.y
      this._swipeT      = Date.now()
    })
    this.input.on('pointerup', p => {
      if (this._swipeStartX === null) return
      const dx  = p.x - this._swipeStartX
      const dy  = p.y - this._swipeStartY
      const dt  = Date.now() - this._swipeT
      const vel = Math.abs(dx) / Math.max(dt, 1)
      if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 30) {
        const steps = vel > 1.2 ? 2 : 1
        this._scroll(dx < 0 ? steps : -steps)
      }
      this._swipeStartX = null
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════════════════════
  _scroll(dir) {
    if (this._scrolling) return
    this._scrolling = true

    this._index = ((this._index + dir) % N + N) % N

    const duration = Math.abs(dir) > 1 ? 520 : 380
    const ease     = 'Cubic.easeOut'

    this._cardSlots.forEach(({ container }) => {
      this.tweens.add({
        targets: container,
        x: container.x - dir * this.CARD_STEP,
        duration,
        ease,
      })
    })

    // Hole scroll
    let lastV = 0
    const totalPx = dir * this.CARD_STEP
    this.tweens.add({
      targets: { v: 0 },
      v: totalPx,
      duration,
      ease,
      onUpdate: tw => {
        const cur   = tw.targets[0].v
        const delta = cur - lastV
        lastV = cur
        this._shiftHoles(delta)
      },
    })

    this._applyStyles(true)
    this._updateInfo()

    this.time.delayedCall(duration + 30, () => {
      this._repositionCards()
      this._scrolling = false
    })
  }

  _repositionCards() {
    const { W, CARD_STEP } = this
    const centerSlot = CLONES + this._index
    const halfN      = N / 2

    this._cardSlots.forEach(({ container }, si) => {
      let offset = si - centerSlot
      if (offset > halfN) offset -= N
      if (offset < -halfN) offset += N
      container.x = W / 2 + offset * CARD_STEP
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  _applyStyles(animated) {
    const dur  = animated ? 350 : 0
    const ease = 'Power3.out'

    this._cardSlots.forEach(({ container, realIdx }) => {
      let d = Math.abs(realIdx - this._index)
      if (d > N / 2) d = N - d

      const active  = realIdx === this._index
      const scale   = active ? 1.0 : Math.max(0.62, 1 - d * 0.15)
      const alpha   = active ? 1.0 : Math.max(0.18, 1 - d * 0.32)
      const targetY = this.REEL_Y + (active ? -Math.round(this.CARD_H * 0.025) : d * 7)

      container.setDepth(active ? 25 : 20 - d)
      if (container._tapHint) container._tapHint.setVisible(active)

      if (dur > 0) {
        this.tweens.add({ targets: container, scaleX: scale, scaleY: scale, alpha, y: targetY, duration: dur, ease })
      } else {
        container.setScale(scale).setAlpha(alpha)
        container.y = targetY
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO + DOTS
  // ═══════════════════════════════════════════════════════════════════════════
  _updateInfo() {
    const s  = SENIORS[this._index]
    const ac = CARD_ACCENTS[this._index % CARD_ACCENTS.length]

    this.tweens.add({
      targets: [this._infoName, this._infoSub],
      alpha: 0, duration: 80, ease: 'Linear',
      onComplete: () => {
        this._infoName.setText(s.name)
        this._infoName.setStyle({ fill: '#ffffff' })
        this._infoName.setShadow(0, 1, ac.glow, 14, true)
        this._infoSub.setText(s.title.toUpperCase())
        this._infoSub.setStyle({ fill: ac.text })
        this.tweens.add({ targets: [this._infoName, this._infoSub], alpha: 1, duration: 180 })
      }
    })

    this._drawConfirmBg(ac.border, false)
    this._confirmTxt.setShadow(0, 2, ac.glow, 12, true)

    this._dots.forEach((dot, i) => {
      const active = i === this._index
      const dac    = CARD_ACCENTS[i % CARD_ACCENTS.length]
      this.tweens.add({ targets: dot, scaleX: active ? 1.8 : 1, scaleY: active ? 1.8 : 1, alpha: active ? 1 : 0.45, duration: 250 })
      dot.setFillStyle(active ? dac.border : 0x2a1a08)
      dot.setStrokeStyle(1.5, active ? dac.border : 0x664422, active ? 1 : 0.5)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM
  // ═══════════════════════════════════════════════════════════════════════════
  _confirm() {
    if (this._selStarted) return
    this._selStarted = true

    const s  = SENIORS[this._index]
    const ac = CARD_ACCENTS[this._index % CARD_ACCENTS.length]
    gameState.selectedSenior = s.id
    this.input.enabled = false

    // Dim non-active
    this._cardSlots.forEach(({ container, realIdx }) => {
      if (realIdx !== this._index) {
        this.tweens.add({ targets: container, alpha: 0.06, duration: 600, ease: 'Power2.out' })
      }
    })

    // Active card: pulse + glow ring
    this._cardSlots.forEach(({ container, realIdx }) => {
      if (realIdx !== this._index) return
      this.tweens.add({ targets: container, scaleX: 1.12, scaleY: 1.12, duration: 300, yoyo: true, repeat: 5, ease: 'Sine.easeInOut' })
      const ring = this.add.graphics().setDepth(30)
      ring.lineStyle(5, ac.border, 0.7)
      ring.strokeRoundedRect(-this.CARD_W / 2 - 8, -this.CARD_H / 2 - 8, this.CARD_W + 16, this.CARD_H + 16, 20)
      container.add(ring)
      this.tweens.add({ targets: ring, alpha: 0.15, duration: 500, yoyo: true, repeat: 5 })
    })

    this._confirmTxt.setText('✓  LOCKED IN!')
    this._confirmTxt.setStyle({ fill: '#00ff88' })
    this._confirmTxt.setShadow(0, 0, '#00ff88', 16, true)
    this._drawConfirmBg(0x00cc66, true)

    const flash = this.add.rectangle(0, 0, this.W, this.H, 0xffffff, 0).setOrigin(0).setDepth(9999)
    this.tweens.add({ targets: flash, alpha: 0.22, duration: 80, yoyo: true })

    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(700, () => this.scene.start('GameScene'))
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════════════════════════════════
  _fs(vw, minPx = 8, maxPx = 80) {
    return Math.max(minPx, Math.min(maxPx, Math.round(this.W * vw / 100)))
  }
}