import Phaser from 'phaser'

// ─────────────────────────────────────────────────────────────────────────────
// MobileControls — Multi-touch buttons for mobile play
// Supports simultaneous walk + jump / walk + attack
// ─────────────────────────────────────────────────────────────────────────────

export class MobileControls {
  constructor(scene) {
    this.scene = scene

    this._btnLeft   = null
    this._btnRight  = null
    this._btnJump   = null
    this._btnAttack = null

    // Continuous touch state
    this.touchLeft   = false
    this.touchRight  = false
    this.touchJump   = false
    this.touchAttack = false

    // "Just pressed" detection
    this.touchJumpPressed   = false
    this.touchAttackPressed = false
    this._prevTouchJump   = false
    this._prevTouchAttack = false

    // Button graphics for press feedback
    this._btnGraphics = {}
  }

build(W, H, level = 0) {
  const bw  = Math.max(W * 0.22, 88)
  const bh  = Math.max(H * 0.12, 88)
  const gap = bw * 0.14
  const pad = W * 0.025
  const bottomY = H - bh - pad * 2

  this._btnLeft  = { x: pad,            y: bottomY, w: bw, h: bh }
  this._btnRight = { x: pad + bw + gap, y: bottomY, w: bw, h: bh }

  if (level === 1) {
    // Year 2 — no jump/attack
    this._btnJump   = null
    this._btnAttack = null
  } else {
    // All other years — jump + attack on right side
    const rbw = Math.max(W * 0.22, 88)
    const rbh = Math.max(H * 0.12, 88)
    this._btnJump   = { x: W - pad - rbw * 2 - gap, y: bottomY, w: rbw, h: rbh }
    this._btnAttack = { x: W - pad - rbw,            y: bottomY, w: rbw, h: rbh }
  }

  this._drawButtons(W, H)
  this._setupInput()
}
_drawButtons(W, H) {
  const s = this.scene

  const dpadCx = (this._btnLeft.x + this._btnRight.x + this._btnRight.w) / 2
  const dpadCy = this._btnLeft.y + this._btnLeft.h / 2
  s.add.circle(dpadCx, dpadCy, this._btnLeft.w * 1.2, 0x000000, 0.28)
    .setScrollFactor(0).setDepth(97)

  const makeBtn = (rect, label, bgColor, key) => {
    const btnNormal = s.add.graphics().setScrollFactor(0).setDepth(99)
    btnNormal.fillStyle(0xffffff, 0.06)
    btnNormal.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 18)
    btnNormal.fillStyle(bgColor, 0.35)
    btnNormal.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 18)
    btnNormal.lineStyle(2.5, 0xffffff, 0.25)
    btnNormal.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 18)

    const btnPressed = s.add.graphics().setScrollFactor(0).setDepth(99).setVisible(false)
    btnPressed.fillStyle(bgColor, 0.65)
    btnPressed.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 18)
    btnPressed.lineStyle(3, 0xffffff, 0.55)
    btnPressed.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 18)

    const fontSize = Math.floor(rect.w * 0.44)
    s.add.text(
      rect.x + rect.w / 2,
      rect.y + rect.h / 2,
      label, {
        fontFamily: '"Outfit", sans-serif',
        fontSize:   `${fontSize}px`,
        color:      '#ffffff',
        fontStyle:  'bold',
      }
    ).setScrollFactor(0).setDepth(100).setOrigin(0.5)

    this._btnGraphics[key] = { normal: btnNormal, pressed: btnPressed }
  }

  makeBtn(this._btnLeft,  '◀', 0x4466ff, 'left')
  makeBtn(this._btnRight, '▶', 0x4466ff, 'right')

  if (this._btnJump) {
    const rbgCx = (this._btnJump.x + this._btnAttack.x + this._btnAttack.w) / 2
    const rbgCy = this._btnJump.y + this._btnJump.h / 2
    s.add.circle(rbgCx, rbgCy, this._btnJump.w * 1.2, 0x000000, 0.28)
      .setScrollFactor(0).setDepth(97)
    makeBtn(this._btnJump,   '▲', 0xff6644, 'jump')
    makeBtn(this._btnAttack, 'Z', 0xaa44ff, 'attack')
  }
}

_setupInput() {
  const s = this.scene
  const inRect = (px, py, r) => r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h

  s.events.on('update', () => {
    this.touchLeft   = false
    this.touchRight  = false
    this.touchJump   = false
    this.touchAttack = false

    const pointers = s.input.manager.pointers
    for (let i = 0; i < pointers.length; i++) {
      const ptr = pointers[i]
      if (!ptr || !ptr.isDown) continue
      const px = ptr.x
      const py = ptr.y

      if (inRect(px, py, this._btnLeft))   this.touchLeft   = true
      if (inRect(px, py, this._btnRight))  this.touchRight  = true
      if (inRect(px, py, this._btnJump))   this.touchJump   = true
      if (inRect(px, py, this._btnAttack)) this.touchAttack = true
    }

    // "Just pressed" detection for jump and attack
    this.touchJumpPressed   = this.touchJump   && !this._prevTouchJump
    this.touchAttackPressed = this.touchAttack && !this._prevTouchAttack
    this._prevTouchJump     = this.touchJump
    this._prevTouchAttack   = this.touchAttack

    this._updateBtnVisual('left',   this.touchLeft)
    this._updateBtnVisual('right',  this.touchRight)
    this._updateBtnVisual('jump',   this.touchJump)
    this._updateBtnVisual('attack', this.touchAttack)
  })
}

  _updateBtnVisual(key, pressed) {
    const g = this._btnGraphics[key]
    if (!g) return
    g.normal.setVisible(!pressed)
    g.pressed.setVisible(pressed)
  }
}
