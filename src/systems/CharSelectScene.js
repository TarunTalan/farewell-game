// ─────────────────────────────────────────────────────────────────────────────
// CharSelectScene.js — TAPE ROLLER senior character selection (REBUILT)
// Infinite circular scroll, 3D depth staging, film tape holes, glow effects
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'
import { SENIORS } from '../data/seniors.js'

// Card dimensions
const CARD_W   = 170
const CARD_H   = 268
const CARD_GAP = 28   // gap between cards (each side)
const CARD_STEP = CARD_W + CARD_GAP * 2
const TAPE_H   = 44
const AVATAR_R = 36
const N = SENIORS.length

// How many clones on each side for the infinite loop illusion
const CLONES = 3

export class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelectScene') }

  // ─── State ────────────────────────────────────────────────────────────────
  create() {
    this.W = this.scale.width
    this.H = this.scale.height

    this._index     = 0          // current real index [0, N-1]
    this._scrolling = false
    this._cardContainers = []    // all card container objects (clones + real)
    this._holeTop   = []         // sprocket hole graphics top
    this._holeBot   = []         // sprocket hole graphics bot
    this._holeOffsetX = 0        // accumulated pixel offset for hole animation
    this._stars     = []

    this.cameras.main.fadeIn(600, 0, 0, 0)

    this._buildBG()
    this._buildTape()
    this._buildAllCards()
    this._buildUI()
    this._buildInput()
    this._applyCardStyles(false)
    this._updateInfo()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BG — star field + grid + vignette
  // ═══════════════════════════════════════════════════════════════════════════
  _buildBG() {
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x06060f).setOrigin(0).setDepth(0)

    // Grid
    const grid = this.add.graphics().setDepth(1).setAlpha(0.035)
    grid.lineStyle(1, 0x6666ff, 1)
    for (let x = 0; x < W; x += 60) grid.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += 60) grid.lineBetween(0, y, W, y)

    // Stars
    for (let i = 0; i < 70; i++) {
      const star = this.add.circle(
        Math.random() * W, Math.random() * H,
        Math.random() * 0.9 + 0.3,
        0x9999ff,
        Math.random() * 0.6 + 0.1
      ).setDepth(2)
      this._stars.push(star)
      this.tweens.add({
        targets: star,
        alpha: Math.random() * 0.15,
        duration: 2000 + Math.random() * 3000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Math.random() * 3000,
      })
    }

    // Vignette — radial darkening edges
    const vig = this.add.graphics().setDepth(3)
    const steps = 40
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const alpha = t * t * 0.55
      const rx = W * 0.5 * t
      const ry = H * 0.5 * t
      vig.fillStyle(0x000000, alpha / steps * 2)
      // left
      vig.fillRect(0, 0, rx, H)
      vig.fillRect(W - rx, 0, rx, H)
      vig.fillRect(0, 0, W, ry)
      vig.fillRect(0, H - ry, W, ry)
    }

    // Scanlines
    const scan = this.add.graphics().setDepth(9000).setAlpha(0.04)
    for (let y = 0; y < H; y += 3) {
      scan.fillStyle(0x000000, 1)
      scan.fillRect(0, y, W, 1)
    }

    // Corner decorations
    this._drawCorner(10, 10,       1, 1)
    this._drawCorner(W - 10, 10,  -1, 1)
    this._drawCorner(10, H - 10,   1,-1)
    this._drawCorner(W - 10, H-10,-1,-1)

    // Title
    const titleText = this.add.text(W / 2, H * 0.055, 'LEGENDS CHOOSE', {
      fontFamily: '"Orbitron", "Press Start 2P", monospace',
      fontSize: this._fs(2.8, 14, 28),
      fill: '#ffffff',
      stroke: '#6666ff',
      strokeThickness: 3,
      letterSpacing: 6,
    }).setOrigin(0.5).setDepth(10)
    titleText.setShadow(0, 0, '#6666ff', 18, true)

    this.add.text(W / 2, H * 0.115, '━━━  SELECT YOUR CHAMPION  ━━━', {
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: this._fs(1.4, 7, 11),
      fill: '#5577ff',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.85)
  }

  _drawCorner(x, y, sx, sy) {
    const g = this.add.graphics().setDepth(50)
    g.lineStyle(2, 0x6666ff, 0.4)
    g.beginPath()
    g.moveTo(x, y + sy * 20)
    g.lineTo(x, y)
    g.lineTo(x + sx * 20, y)
    g.strokePath()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAPE RAIL — film strip top + bottom with sprocket holes
  // ═══════════════════════════════════════════════════════════════════════════
  _buildTape() {
    const { W, H } = this
    const railY  = H * 0.5
    const railH  = CARD_H + TAPE_H * 2
    const topY   = railY - railH / 2
    const botY   = railY + railH / 2

    // Dark tape body
    this.add.rectangle(W / 2, railY, W, railH, 0x0a0a1a)
      .setOrigin(0.5).setDepth(6)

    // Top strip
    this.add.rectangle(W / 2, topY + TAPE_H / 2, W, TAPE_H, 0x0d0d1e)
      .setOrigin(0.5).setDepth(7)
    this.add.rectangle(W / 2, topY,        W, 1.5, 0x4488ff, 0.35).setOrigin(0.5, 0).setDepth(8)
    this.add.rectangle(W / 2, topY+TAPE_H, W, 1.5, 0x4488ff, 0.35).setOrigin(0.5, 0).setDepth(8)

    // Bot strip
    this.add.rectangle(W / 2, botY - TAPE_H / 2, W, TAPE_H, 0x0d0d1e)
      .setOrigin(0.5).setDepth(7)
    this.add.rectangle(W / 2, botY - TAPE_H,      W, 1.5, 0x4488ff, 0.35).setOrigin(0.5, 0).setDepth(8)
    this.add.rectangle(W / 2, botY,               W, 1.5, 0x4488ff, 0.35).setOrigin(0.5, 0).setDepth(8)

    // Sprocket holes — generate enough to cover full width + overflow for scroll illusion
    const holeW   = 20
    const holeH   = 12
    const holeGap = 36
    const holeCount = Math.ceil(W / holeGap) + 6
    const startX  = -holeGap * 2

    this._holeTopContainer = this.add.container(0, 0).setDepth(9)
    this._holeBotContainer = this.add.container(0, 0).setDepth(9)

    for (let i = 0; i < holeCount; i++) {
      const hx = startX + i * holeGap

      // Top hole
      const ht = this.add.graphics()
      ht.fillStyle(0x000000, 0.95)
      ht.fillRoundedRect(hx - holeW/2, topY + (TAPE_H - holeH)/2, holeW, holeH, 3)
      ht.lineStyle(1, 0x2a2a55, 0.6)
      ht.strokeRoundedRect(hx - holeW/2, topY + (TAPE_H - holeH)/2, holeW, holeH, 3)
      this._holeTopContainer.add(ht)
      this._holeTop.push({ gfx: ht, baseX: hx })

      // Bot hole
      const hb = this.add.graphics()
      hb.fillStyle(0x000000, 0.95)
      hb.fillRoundedRect(hx - holeW/2, botY - TAPE_H + (TAPE_H - holeH)/2, holeW, holeH, 3)
      hb.lineStyle(1, 0x2a2a55, 0.6)
      hb.strokeRoundedRect(hx - holeW/2, botY - TAPE_H + (TAPE_H - holeH)/2, holeW, holeH, 3)
      this._holeBotContainer.add(hb)
      this._holeBot.push({ gfx: hb, baseX: hx })
    }
  }

  // Shift holes by pixel delta (wraps for infinite illusion)
  _shiftHoles(deltaPx) {
    const holeGap = 36
    this._holeOffsetX += deltaPx
    // keep offset in [0, holeGap) range for seamless wrap
    this._holeOffsetX = ((this._holeOffsetX % holeGap) + holeGap) % holeGap

    const totalW = this.W + holeGap * 6
    this._holeTop.forEach(h => {
      const raw = h.baseX + this._holeOffsetX
      const wrapped = ((raw % totalW) + totalW) % totalW - holeGap * 2
      h.gfx.x = wrapped - h.baseX
    })
    this._holeBotContainer.x = this._holeTopContainer.x
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDS — build [CLONES tail] + [real N] + [CLONES head] for infinite wrap
  // ═══════════════════════════════════════════════════════════════════════════
  _buildAllCards() {
    const { W, H } = this
    this._cardContainers = []
    this._cardRealIndices = []  // real SENIORS index for each card slot

    // Build sequence: tail clones, real, head clones
    const sequence = []
    for (let c = 0; c < CLONES; c++) sequence.push(N - CLONES + c)  // tail
    for (let i = 0; i < N; i++) sequence.push(i)                     // real
    for (let c = 0; c < CLONES; c++) sequence.push(c)                // head

    const totalCards = sequence.length
    const centerSlot = CLONES  // slot index of real card 0

    sequence.forEach((realIdx, slotIdx) => {
      const s      = SENIORS[realIdx]
      const slotX  = W / 2 + (slotIdx - centerSlot) * CARD_STEP
      const slotY  = H * 0.5
      const cont   = this._buildCard(s, realIdx, slotX, slotY)
      this._cardContainers.push(cont)
      this._cardRealIndices.push(realIdx)

      // Tap to select
      cont.setInteractive(
        new Phaser.Geom.Rectangle(-CARD_W/2, -CARD_H/2, CARD_W, CARD_H),
        Phaser.Geom.Rectangle.Contains
      )
      cont.on('pointerdown', () => {
        if (realIdx === this._index) {
          this._confirm()
        } else {
          let d = realIdx - this._index
          if (d > N / 2)  d -= N
          if (d < -N / 2) d += N
          this._scroll(d)
        }
      })
    })
  }

  _buildCard(s, realIdx, x, y) {
    const cont = this.add.container(x, y).setDepth(15)

    // Shadow
    const shadow = this.add.rectangle(4, 8, CARD_W, CARD_H, 0x000000, 0.7)
    shadow.setOrigin(0.5)

    // Card body
    const body = this.add.graphics()
    body.fillStyle(0x0a0a18, 1)
    body.fillRect(-CARD_W/2, -CARD_H/2, CARD_W, CARD_H)

    // Border glow (drawn as thick stroke then inner thin)
    const border = this.add.graphics()
    border.lineStyle(2.5, s.color, 0.9)
    border.strokeRect(-CARD_W/2 + 1.5, -CARD_H/2 + 1.5, CARD_W - 3, CARD_H - 3)
    border.lineStyle(1, s.color, 0.25)
    border.strokeRect(-CARD_W/2 + 5, -CARD_H/2 + 5, CARD_W - 10, CARD_H - 10)

    // Top accent bar
    const bar = this.add.rectangle(0, -CARD_H/2 + 5, CARD_W - 3, 9, s.color, 0.92)
    bar.setOrigin(0.5)

    // Card number
    const accentColor = s.accent || s.color
    const numTxt = this.add.text(
      -CARD_W/2 + 8, -CARD_H/2 + 14,
      String(realIdx + 1).padStart(2, '0'),
      { fontFamily:'"Share Tech Mono",monospace', fontSize:8, fill:accentColor, fontStyle:'bold' }
    )

    // Avatar zone
    const avatarBg = this.add.circle(0, -CARD_H/2 + 68, AVATAR_R, s.color, 0.12)
    const avatarGlow = this.add.circle(0, -CARD_H/2 + 68, AVATAR_R + 10, s.color, 0.07)
    const avatarRing = this.add.graphics()
    avatarRing.lineStyle(2, s.color, 0.7)
    avatarRing.strokeCircle(0, -CARD_H/2 + 68, AVATAR_R)
    avatarRing.lineStyle(1, s.color, 0.25)
    avatarRing.strokeCircle(0, -CARD_H/2 + 68, AVATAR_R + 6)

    // Avatar image or fallback letter
    let avatar
    let avatarLetter = null
    if (this.textures.exists(s.id)) {
      avatar = this.add.image(0, -CARD_H/2 + 68, s.id)
      avatar.setDisplaySize(AVATAR_R * 2, AVATAR_R * 2)
      avatar.setOrigin(0.5)
      const maskShape = this.make.graphics()
      maskShape.fillCircle(0, 0, AVATAR_R)
      const mask = maskShape.createGeometryMask()
      avatar.setMask(mask)
    } else {
      avatarLetter = this.add.text(0, -CARD_H/2 + 68, s.name[0], {
        fontFamily:'"Orbitron","Press Start 2P",monospace',
        fontSize: 22, fontWeight:'900', fill:'#ffffff',
        stroke:'#000000', strokeThickness:1,
      }).setOrigin(0.5)
      avatarLetter.setShadow(0, 0, accentColor, 10, true)
      avatar = avatarLetter
    }

    // Spin ring animation on avatar
    this.tweens.add({
      targets: avatarRing,
      angle: 360,
      duration: 8000 + Math.random() * 4000,
      repeat: -1,
      ease: 'Linear',
    })

    // Name
    const nameTxt = this.add.text(0, -CARD_H/2 + 116, s.name, {
      fontFamily:'"Orbitron","Press Start 2P",monospace',
      fontSize:8, fontWeight:'700', fill:'#ffffff',
      stroke:'#000000', strokeThickness:1, align:'center', letterSpacing:2,
    }).setOrigin(0.5)

    // Title
    const titleTxt = this.add.text(0, -CARD_H/2 + 132, '「 ' + s.title + ' 」', {
      fontFamily:'"Share Tech Mono",monospace',
      fontSize:7.5, fill:accentColor, align:'center',
    }).setOrigin(0.5)

    // Divider
    const div = this.add.graphics()
    div.lineStyle(1, s.color, 0.3)
    div.lineBetween(-CARD_W/2 + 12, -CARD_H/2 + 146, CARD_W/2 - 12, -CARD_H/2 + 146)

    // Description
    const descTxt = this.add.text(0, -CARD_H/2 + 155, s.bio, {
      fontFamily:'"Share Tech Mono",monospace',
      fontSize:6.5, fill:'#8899bb', align:'center',
      wordWrap:{ width: CARD_W - 18 },
      lineSpacing:2,
    }).setOrigin(0.5, 0)

    // Stats
    const statsY = CARD_H/2 - 30
    const statCols = [
      { label:'PWR', val:s.stat.power,  x:-52 },
      { label:'SPD', val:s.stat.speed,  x:0   },
      { label:'WIS', val:s.stat.wisdom, x:52  },
    ]
    const statEls = []
    statCols.forEach(({ label, val, x:sx }) => {
      const lbl = this.add.text(sx, statsY - 10, label, {
        fontFamily:'"Share Tech Mono",monospace', fontSize:5.5,
        fill:'#445566', fontStyle:'bold', align:'center',
      }).setOrigin(0.5)

      const barBg = this.add.graphics()
      barBg.fillStyle(0x111122, 1)
      barBg.fillRect(sx - 17, statsY - 1, 34, 5)
      barBg.lineStyle(1, s.color, 0.25)
      barBg.strokeRect(sx - 17, statsY - 1, 34, 5)

      const fillW = (34 * val) / 10
      const barFill = this.add.graphics()
      barFill.fillStyle(s.color, 0.85)
      barFill.fillRect(sx - 17, statsY - 1, fillW, 5)

      statEls.push(lbl, barBg, barFill)
    })

    // Reflection overlay
    const reflection = this.add.graphics()
    reflection.fillStyle(0xffffff, 0.02)
    reflection.fillRect(-CARD_W/2 + 2, -CARD_H/2 + 2, CARD_W - 4, CARD_H * 0.35)

    cont.add([
      shadow, body, border, bar,
      avatarGlow, avatarBg, avatarRing,
      numTxt, avatar, nameTxt, titleTxt, div, descTxt,
      ...statEls, reflection,
    ])

    cont._seniorData = s
    return cont
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI — arrows, info panel, dots, confirm
  // ═══════════════════════════════════════════════════════════════════════════
  _buildUI() {
    const { W, H } = this

    // Left arrow button (mobile-friendly, large tap target)
    this._leftBtn  = this._makeNavBtn(W * 0.055, H * 0.5, '‹', -1)
    this._rightBtn = this._makeNavBtn(W * 0.945, H * 0.5, '›',  1)

    // ── Info panel ────────────────────────────────────────────────
    this._infoName = this.add.text(W / 2, H * 0.795, '', {
      fontFamily:'"Orbitron","Press Start 2P",monospace',
      fontSize: this._fs(2.2, 13, 22),
      fill:'#ffffff', stroke:'#000000', strokeThickness:1,
      align:'center', letterSpacing:4,
    }).setOrigin(0.5).setDepth(100)

    this._infoTitle = this.add.text(W / 2, H * 0.845, '', {
      fontFamily:'"Share Tech Mono",monospace',
      fontSize: this._fs(1.5, 8, 12),
      fill:'#6688ff', align:'center', letterSpacing:3,
    }).setOrigin(0.5).setDepth(100)

    // ── Dots ──────────────────────────────────────────────────────
    this._dots = []
    const dotSpacing = Math.min(14, W * 0.025)
    const dotsTotalW = (N - 1) * dotSpacing
    SENIORS.forEach((s, i) => {
      const dx = W / 2 - dotsTotalW / 2 + i * dotSpacing
      const dot = this.add.circle(dx, H * 0.755, 4, 0x1a1a2e, 1).setDepth(100)
      dot.setStrokeStyle(1.5, 0x6666ff, 0.5)
      dot.setInteractive({ useHandCursor: true })
      dot.on('pointerdown', () => {
        let d = i - this._index
        if (d > N/2) d -= N
        if (d < -N/2) d += N
        this._scroll(d)
      })
      this._dots.push(dot)
    })

    // ── Confirm button ────────────────────────────────────────────
    const confirmBg = this.add.rectangle(W / 2, H * 0.925, 180, 44, 0x6666ff, 0.1)
      .setStrokeStyle(2, 0x6666ff, 0.5).setDepth(100)

    this._confirmBtn = this.add.text(W / 2, H * 0.925, '★  SELECT  ★', {
      fontFamily:'"Orbitron","Press Start 2P",monospace',
      fontSize: this._fs(1.8, 9, 14),
      fill:'#ffdd44', stroke:'#000000', strokeThickness:1,
      align:'center', letterSpacing:3,
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true })
    this._confirmBtn.setShadow(0, 0, '#ffaa00', 12, true)

    this._confirmBtn.on('pointerdown', () => this._confirm())
    this._confirmBtn.on('pointerover', () => {
      this._confirmBtn.setStyle({ fill:'#ffffff' })
      confirmBg.setFillStyle(0xffdd44, 0.2)
      confirmBg.setStrokeStyle(2, 0xffdd44, 1)
    })
    this._confirmBtn.on('pointerout', () => {
      this._confirmBtn.setStyle({ fill:'#ffdd44' })
      confirmBg.setFillStyle(0x6666ff, 0.1)
      confirmBg.setStrokeStyle(2, 0x6666ff, 0.5)
    })

    this.tweens.add({
      targets: this._confirmBtn,
      scaleX:1.04, scaleY:1.04,
      duration:950, yoyo:true, repeat:-1, ease:'Sine.easeInOut',
    })
  }

  _makeNavBtn(x, y, glyph, dir) {
    // Background
    const bg = this.add.rectangle(x, y, 46, 80, 0x0a0a20, 0.8)
      .setStrokeStyle(1.5, 0x6666ff, 0.35).setDepth(200)

    const txt = this.add.text(x, y, glyph, {
      fontFamily:'"Rajdhani","Orbitron",sans-serif',
      fontSize: this._fs(4, 22, 42),
      fill:'#6677ff', fontStyle:'bold',
    }).setOrigin(0.5).setDepth(201)
    txt.setShadow(0, 0, '#4444ff', 8, true)

    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerdown', () => this._scroll(dir))
    bg.on('pointerover', () => { txt.setStyle({ fill:'#aabbff' }); bg.setFillStyle(0x2233aa, 0.3) })
    bg.on('pointerout',  () => { txt.setStyle({ fill:'#6677ff' }); bg.setFillStyle(0x0a0a20, 0.8) })
    bg.on('pointerdown', () => {
      this.tweens.add({ targets:[bg,txt], scaleX:0.9, scaleY:0.9, duration:80, yoyo:true })
    })
    return { bg, txt }
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

    // Swipe
    this.input.on('pointerdown', p => { this._swipeX = p.x })
    this.input.on('pointerup',   p => {
      if (this._swipeX === undefined) return
      const dx = p.x - this._swipeX
      if (Math.abs(dx) > 40) this._scroll(dx < 0 ? 1 : -1)
      this._swipeX = undefined
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL — infinite circular, snaps back silently after edge wrap
  // ═══════════════════════════════════════════════════════════════════════════
  _scroll(dir) {
    if (this._scrolling) return
    this._scrolling = true

    // New real index (wraps)
    const newIndex = ((this._index + dir) % N + N) % N
    this._index = newIndex

    // Animate all cards
    const duration = 400
    const ease     = 'Back.out(1.1)'

    this._cardContainers.forEach((cont, slotIdx) => {
      // current x → target x
      const currentSlotFromCenter = (cont.x - this.W / 2) / CARD_STEP
      const targetSlotFromCenter  = currentSlotFromCenter - dir
      const targetX = this.W / 2 + targetSlotFromCenter * CARD_STEP

      this.tweens.add({
        targets: cont,
        x: targetX,
        duration,
        ease,
      })
    })

    // Animate holes
    const holePx = dir * CARD_STEP
    this.tweens.add({
      targets: { v: 0 },
      v: holePx,
      duration,
      ease: 'Cubic.out',
      onUpdate: (tw) => {
        const delta = tw.getValue() - (tw.getValue() - tw.targets[0].v)
        this._shiftHoles(-dir * 2)
      },
    })

    // After animation: snap cards back to canonical positions (silent, no tween)
    this.time.delayedCall(duration + 20, () => {
      this._repositionCards()
      this._applyCardStyles(true)
      this._updateInfo()
      this._scrolling = false
    })

    // Start style update immediately for responsive feel
    this._applyCardStyles(true)
    this._updateInfo()
  }

  // Snap all cards to their correct positions based on current _index, no animation
  _repositionCards() {
    const { W } = this
    const centerSlot = CLONES

    // Rebuild sequence (same order as _buildAllCards)
    const sequence = []
    for (let c = 0; c < CLONES; c++) sequence.push(N - CLONES + c)
    for (let i = 0; i < N; i++) sequence.push(i)
    for (let c = 0; c < CLONES; c++) sequence.push(c)

    this._cardContainers.forEach((cont, slotIdx) => {
      const realIdx = sequence[slotIdx]
      // position relative to currently selected card
      const offsetFromSelected = slotIdx - (centerSlot + this._index)
      cont.x = W / 2 + offsetFromSelected * CARD_STEP
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Card visual styles — scale, alpha, depth per distance from center
  // ═══════════════════════════════════════════════════════════════════════════
  _applyCardStyles(animated) {
    const duration = animated ? 380 : 0
    const ease     = 'Power3.out'

    this._cardContainers.forEach((cont, slotIdx) => {
      const realIdx = this._cardRealIndices[slotIdx]
      let d = Math.abs(realIdx - this._index)
      if (d > N / 2) d = N - d

      const isActive = realIdx === this._index

      const targetScaleX = isActive ? 1.1  : Math.max(0.55, 1 - d * 0.14)
      const targetScaleY = isActive ? 1.1  : Math.max(0.55, 1 - d * 0.14)
      const targetAlpha  = isActive ? 1.0  : Math.max(0.15, 1 - d * 0.3)
      const targetY      = this.H * 0.5 + (isActive ? -8 : d * 5)
      const targetDepth  = 20 - d

      cont.setDepth(targetDepth)

      if (duration > 0) {
        this.tweens.add({
          targets: cont,
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          alpha:  targetAlpha,
          y:      targetY,
          duration,
          ease,
        })
      } else {
        cont.setScale(targetScaleX, targetScaleY)
        cont.setAlpha(targetAlpha)
        cont.y = targetY
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Info panel + dots update
  // ═══════════════════════════════════════════════════════════════════════════
  _updateInfo() {
    const s = SENIORS[this._index]

    this._infoName.setText(s.name)
    this._infoName.setStyle({ fill: s.accent })
    this._infoName.setShadow(0, 0, s.accent, 16, true)

    this._infoTitle.setText('「 ' + s.title + ' 』')
    this._infoTitle.setStyle({ fill: s.accent })

    this._dots.forEach((dot, i) => {
      const active = i === this._index
      this.tweens.add({
        targets: dot,
        scaleX: active ? 1.6 : 1,
        scaleY: active ? 1.6 : 1,
        alpha:  active ? 1   : 0.4,
        duration: 280, ease:'Power2.out',
      })
      dot.setFillStyle(active ? s.color : 0x1a1a2e)
      if (active) dot.setStrokeStyle(1.5, s.color, 0.9)
      else        dot.setStrokeStyle(1.5, 0x6666ff, 0.35)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM
  // ═══════════════════════════════════════════════════════════════════════════
  _confirm() {
    if (this._selectionStarted) return
    this._selectionStarted = true

    const selected = SENIORS[this._index]
    gameState.selectedSenior = selected.id

    // Disable further input
    this.input.enabled = false
    this._confirmBtn.disableInteractive()
    this._leftBtn.bg.disableInteractive()
    this._rightBtn.bg.disableInteractive()
    this._dots.forEach(dot => dot.disableInteractive())

    // Highlight the active card with a glowing ring and pulse
    this._cardContainers.forEach((cont, slotIdx) => {
      const isActive = this._cardRealIndices[slotIdx] === this._index
      if (isActive) {
        const glow = this.add.graphics().setDepth(30)
        glow.lineStyle(4, selected.color, 0.65)
        glow.strokeRoundedRect(-CARD_W/2 - 10, -CARD_H/2 - 10, CARD_W + 20, CARD_H + 20, 16)
        cont.add(glow)

        this.tweens.add({
          targets: cont,
          scaleX: 1.24,
          scaleY: 1.24,
          duration: 450,
          yoyo: true,
          repeat: 7,
          ease: 'Sine.easeInOut',
        })

        this.tweens.add({
          targets: glow,
          alpha: 0.1,
          duration: 900,
          yoyo: true,
          repeat: 7,
          ease: 'Sine.easeInOut',
        })
      } else {
        this.tweens.add({
          targets: cont,
          alpha: 0.15,
          duration: 500,
          ease: 'Power2.out',
        })
      }
    })

    // Countdown text and status line
    const countdown = this.add.text(this.W / 2, this.H * 0.82,
      'LOCKING IN CHARACTER...  4', {
      fontFamily:'"Orbitron","Press Start 2P",monospace',
      fontSize: this._fs(1.8, 10, 18),
      fill: '#ffffff', align:'center', letterSpacing: 2,
      stroke:'#000000', strokeThickness:2,
    }).setOrigin(0.5).setDepth(100)

    const status = this.add.text(this.W / 2, this.H * 0.88,
      'GET READY FOR LAUNCH', {
      fontFamily:'"Share Tech Mono",monospace',
      fontSize: this._fs(1.4, 8, 12),
      fill: selected.color, align:'center', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(100)

    let secondsLeft = 4
    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        secondsLeft -= 1
        if (secondsLeft >= 0) {
          countdown.setText('LOCKING IN CHARACTER...  ' + secondsLeft)
        }
      }
    })

    this._confirmBtn.setText('✓  LOCKED IN')
    this._confirmBtn.setStyle({ fill:'#00ff88' })
    this._confirmBtn.setShadow(0, 0, '#00ff88', 14, true)

    const overlay = this.add.rectangle(0, 0, this.W, this.H, 0x09101f, 0.18)
      .setOrigin(0).setDepth(9998)

    this.tweens.add({
      targets: overlay,
      alpha: 0.28,
      duration: 1800,
      ease: 'Sine.easeInOut',
    })

    this.time.delayedCall(4500, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0)
      this.time.delayedCall(900, () => this.scene.start('GameScene'))
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utility
  // ═══════════════════════════════════════════════════════════════════════════
  _fs(vw, minPx = 8, maxPx = 64) {
    return Math.max(minPx, Math.min(maxPx, Math.round(this.W * vw / 100)))
  }
}