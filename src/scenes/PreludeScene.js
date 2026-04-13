// ─────────────────────────────────────────────────────────────────────────────
// PreludeScene.js  ·  v2 — CINEMATIC INTRO  (mobile-first)
// ─────────────────────────────────────────────────────────────────────────────

import { DialogueSystem }  from '../systems/DialogueSystem.js'
import { CharacterSelect } from '../systems/CharacterSelect.js'
import { gameState }       from '../data/GameState.js'

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t
const rand = (min, max) => min + Math.random() * (max - min)

export class PreludeScene extends Phaser.Scene {
  constructor() {
    super('PreludeScene')
    this._layers   = []   // depth layers to destroy on cleanup
    this._tweenReg = []   // tween handles
    this._timeReg  = []   // timer handles
  }

  // ── lifecycle ───────────────────────────────────────────────────────────────
  create() {
    this.W = this.scale.width
    this.H = this.scale.height

    this._buildWorld()
    this.cameras.main.fadeIn(1000, 0, 0, 0)
    this._runCinematic()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1.  WORLD  — sky, fog, particles, ambient
  // ═══════════════════════════════════════════════════════════════════════════
  _buildWorld() {
    const { W, H } = this

    // ── Deep-space background ───────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x030312).setOrigin(0)
    const bg = this.add.image(W / 2, H / 2, 'bg_0')
      .setDisplaySize(W * 1.4, H * 1.4)
      .setAlpha(0.55)
    this._tween(bg, { scaleX: bg.scaleX * 1.06, scaleY: bg.scaleY * 1.06, duration: 18000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })

    // ── Layered nebula orbs ─────────────────────────────────────────────────
    ;[
      [W * 0.2,  H * 0.25, 220, 0x3020ff, 0.06],
      [W * 0.8,  H * 0.4,  180, 0x8010a0, 0.05],
      [W * 0.55, H * 0.7,  160, 0x002060, 0.07],
    ].forEach(([x, y, r, c, a]) => {
      const orb = this.add.circle(x, y, r, c, a)
      this._tween(orb, {
        scaleX: 1.2, scaleY: 1.2, alpha: a * 1.8,
        duration: 4000 + rand(0, 3000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      })
    })

    // ── Procedural star field — two depth passes ────────────────────────────
    this._buildStarField()

    // ── Horizontal scan-line overlay (very subtle) ──────────────────────────
    const scan = this.add.graphics()
    for (let y = 0; y < H; y += 4) {
      scan.fillStyle(0x000000, 0.06)
      scan.fillRect(0, y, W, 1)
    }

    // ── Atmospheric fog ribbons ─────────────────────────────────────────────
    ;[
      [H * 0.72, W * 2, 220, 0x0a0a30, 0.40, 9000, 80],
      [H * 0.55, W * 2, 160, 0x141440, 0.28, 14000, -60],
      [H * 0.35, W * 2, 120, 0x1c1c60, 0.16, 11000, 40],
    ].forEach(([y, w, h, c, a, dur, dx]) => {
      const fog = this.add.rectangle(W / 2, y, w, h, c, a)
      this._tween(fog, { x: W / 2 + dx, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    })

    // ── Ambient top vignette ────────────────────────────────────────────────
    const vig = this.add.graphics()
    for (let y = 0; y < H * 0.25; y += 3) {
      vig.fillStyle(0x000000, 0.5 * (1 - y / (H * 0.25)))
      vig.fillRect(0, y, W, 3)
    }
    // Bottom vignette
    for (let y = 0; y < H * 0.3; y += 3) {
      vig.fillStyle(0x000000, 0.6 * (1 - y / (H * 0.3)))
      vig.fillRect(0, H - y, W, 3)
    }

    // ── Floating dust particles ─────────────────────────────────────────────
    this._spawnDustLoop()
  }

  _buildStarField() {
    const { W, H } = this
    // Back layer — tiny, slow twinkle
    for (let i = 0; i < 140; i++) {
      const s = this.add.circle(rand(0, W), rand(0, H), rand(0.5, 1.2), 0xffffff, rand(0.2, 0.5))
      this._tween(s, { alpha: rand(0.05, 0.15), duration: 1200 + rand(0, 2000), yoyo: true, repeat: -1, delay: rand(0, 2000) })
    }
    // Front layer — bigger, faster twinkle
    for (let i = 0; i < 50; i++) {
      const s = this.add.circle(rand(0, W), rand(0, H * 0.85), rand(1.2, 2.2), 0xffffff, rand(0.5, 0.9))
      this._tween(s, { alpha: rand(0.1, 0.3), duration: 700 + rand(0, 1200), yoyo: true, repeat: -1, delay: rand(0, 1500) })
    }
    // Cross-flare stars
    const flareG = this.add.graphics()
    flareG.fillStyle(0xffffff, 0.7)
    for (let i = 0; i < 10; i++) {
      const sx = rand(0, W), sy = rand(0, H * 0.6)
      flareG.fillRect(sx - 7, sy - 0.5, 14, 1)
      flareG.fillRect(sx - 0.5, sy - 7, 1, 14)
      flareG.fillCircle(sx, sy, 1.5)
    }
    // Shooting stars — scheduled
    this._scheduleShootingStars()
  }

  _scheduleShootingStars() {
    const shoot = () => {
      if (!this.scene.isActive('PreludeScene')) return
      const { W, H } = this
      const line = this.add.rectangle(
        -100, rand(0, H * 0.5), rand(60, 140), rand(1, 2), 0xffffff
      ).setAlpha(0.8).setOrigin(0, 0.5)
      const angle = rand(15, 30) * Phaser.Math.DEG_TO_RAD
      this._tween(line, {
        x: W + 200,
        y: line.y + (W + 300) * Math.tan(angle),
        alpha: 0,
        duration: rand(800, 1600),
        ease: 'Linear',
        onComplete: () => line.destroy()
      })
      this._timer(rand(3000, 7000), shoot)
    }
    this._timer(rand(1500, 3500), shoot)
  }

  _spawnDustLoop() {
    const { W, H } = this
    const spawnOne = () => {
      if (!this.scene.isActive('PreludeScene')) return
      const d = this.add.circle(rand(0, W), H * rand(0.4, 1.0), rand(1, 3), 0xffffff, rand(0.03, 0.12))
      this._tween(d, {
        y: d.y - rand(60, 200),
        x: d.x + rand(-30, 30),
        alpha: 0,
        duration: rand(3000, 7000),
        ease: 'Power1',
        onComplete: () => d.destroy()
      })
      this._timer(rand(120, 280), spawnOne)
    }
    spawnOne()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2.  CINEMATIC SEQUENCE
  // ═══════════════════════════════════════════════════════════════════════════
  _runCinematic() {
    this._showTitle()
  }

  // ── Floating game title ──────────────────────────────────────────────────
  _showTitle() {
    const { W, H } = this

    // Glow behind title
    const glow = this.add.circle(W / 2, H * 0.22, 120, 0x2040ff, 0)
    this._tween(glow, { fillAlpha: 0.10, duration: 1800, ease: 'Power2' })
    this._tween(glow, { scaleX: 1.3, scaleY: 1.3, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800 })

    // Sub-title — institute name
    const sub = this.add.text(W / 2, H * 0.15, 'S I   L A B', {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(7),
      fill: '#5060c0',
      letterSpacing: 8
    }).setOrigin(0.5).setAlpha(0)

    // Main title
    const title = this.add.text(W / 2, H * 0.22, 'PLACEMENT\nSURVIVOR', {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(22),
      fill: '#f0c040',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.8)

    // Chromatic aberration fake — two ghost copies
    const titleR = this.add.text(W / 2 + 3, H * 0.22, 'PLACEMENT\nSURVIVOR', {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(22),
      fill: '#ff0040',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0)
    const titleB = this.add.text(W / 2 - 3, H * 0.22, 'PLACEMENT\nSURVIVOR', {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(22),
      fill: '#0050ff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0)

    // Reveal sequence
    this._timer(300, () => {
      this._tween(sub, { alpha: 1, duration: 1000, ease: 'Power2' })
    })
    this._timer(700, () => {
      // Glitch flash
      this._tween(titleR, { alpha: 0.35, duration: 80, yoyo: true, repeat: 3, ease: 'Linear' })
      this._tween(titleB, { alpha: 0.35, duration: 80, yoyo: true, repeat: 3, ease: 'Linear', delay: 40 })
      this._tween(title, {
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 600, ease: 'Back.out(1.2)'
      })
    })

    // Floating bob
    this._tween(title, { y: title.y - 7, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1400 })

    // After title reveal — start story lines
    this._timer(2200, () => this._runStoryLines())
  }

  // ── Story text crawl ──────────────────────────────────────────────────────
  _runStoryLines() {
    const { W, H } = this

    const lines = [
      { text: 'The night before end sem…',    color: '#c0c0e0', size: 20 },
      { text: 'Deadlines approaching…',        color: '#c0b0b0', size: 20 },
      { text: 'Assignments unfinished…',       color: '#c0a080', size: 20 },
      { text: 'Systems failing…',              color: '#e08060', size: 22 },
      { text: 'There is only one solution.',   color: '#f0c040', size: 18 },
    ]

    let idx = 0
    const slotY = H * 0.72

    const showNext = () => {
      if (idx >= lines.length) {
        this._timer(400, () => this._showGate())
        return
      }
      const { text, color, size } = lines[idx]
      idx++

      // Horizontal rule before each line (except first)
      let rule
      if (idx > 1) {
        rule = this.add.rectangle(W / 2, slotY - 26, 0, 1, 0x404080, 0.6)
        this._tween(rule, { width: W * 0.55, duration: 300, ease: 'Power2' })
      }

      const t = this.add.text(W / 2, slotY, text, {
        fontFamily: '"VT323"',
        fontSize: this._fs(size),
        fill: color,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0).setY(slotY + 12)

      this._tween(t, { alpha: 1, y: slotY, duration: 500, ease: 'Power2' })

      // Hold, then fade out
      this._timer(2400, () => {
        this._tween(t, { alpha: 0, y: slotY - 10, duration: 450, ease: 'Power2', onComplete: () => {
          t.destroy()
          if (rule) rule.destroy()
          showNext()
        }})
      })
    }

    showNext()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.  THE GATE  — main cinematic set-piece
  // ═══════════════════════════════════════════════════════════════════════════
  _showGate() {
    const { W, H } = this

    // Camera zoom towards center
    this._tween(this.cameras.main, { zoom: 1.04, duration: 14000, ease: 'Sine.easeInOut' })

    // ── Atmospheric spotlight behind gate ───────────────────────────────────
    const spotlight = this.add.circle(W / 2, H / 2, 280, 0x101050, 0)
    this._tween(spotlight, { fillAlpha: 0.55, duration: 1200, ease: 'Power2' })
    this._tween(spotlight, { scaleX: 1.12, scaleY: 1.12, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800 })

    // Ground shadow beneath gate
    const shadow = this.add.ellipse(W / 2, H * 0.78, 320, 40, 0x000000, 0.45)
    this._tween(shadow, { scaleX: 1.04, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // ── Build gate container ────────────────────────────────────────────────
    const gX = W / 2
    const gY = H * 0.46
    const gate = this.add.container(gX, gY)

    // Scale for mobile — gate fills ~60% of screen width
    const gScale = Math.min((W * 0.60) / 260, 1.2)

    // ── Shadow / depth layer ────────────────────────────────────────────────
    const gShadow = this.add.rectangle(10, 12, 268, 348, 0x000000, 0.35)
    gate.add(gShadow)

    // ── Outer stone frame ───────────────────────────────────────────────────
    const frame = this.add.rectangle(0, 0, 268, 344, 0x2b1e0e)
    frame.setStrokeStyle(6, 0x1a0f04, 1)
    gate.add(frame)

    // Stone frame detail — corner blocks
    ;[[-134, -172], [134, -172], [-134, 172], [134, 172]].forEach(([x, y]) => {
      gate.add(this.add.rectangle(x, y, 22, 22, 0x3a2810))
    })

    // ── Door panels (left / right) ──────────────────────────────────────────
    const doorColor  = 0x5c3a1a
    const doorShade  = 0x3a2210
    const doorHigh   = 0x7a5030
    const doorW = 114, doorH = 304

    // Left door
    const dL = this._makeDoorPanel(-1, doorW, doorH, doorColor, doorShade, doorHigh)
    dL.forEach(obj => gate.add(obj))

    // Right door
    const dR = this._makeDoorPanel(1, doorW, doorH, doorColor, doorShade, doorHigh)
    dR.forEach(obj => gate.add(obj))

    // ── Center gap line ─────────────────────────────────────────────────────
    gate.add(this.add.rectangle(0, 0, 3, doorH, 0x000000, 0.8))

    // ── Glass / frosted panel in the middle ─────────────────────────────────
    const glass = this.add.rectangle(0, -20, 110, 180, 0x8ad0ff, 0.08)
    glass.setStrokeStyle(2, 0xffffff, 0.18)
    gate.add(glass)

    // Glass reflection streaks
    gate.add(this.add.rectangle(-18, -20, 10, 160, 0xffffff, 0.04).setRotation(0.1))
    gate.add(this.add.rectangle( 10, -50, 5,  80,  0xffffff, 0.03).setRotation(0.1))

    // ── PLACEMENTS 2026 poster ──────────────────────────────────────────────
    const poster = this.add.rectangle(0, -90, 118, 68, 0xf5f0e8)
    poster.setStrokeStyle(3, 0x000000, 1)
    poster.setRotation(Phaser.Math.DegToRad(-1.5))
    gate.add(poster)

    // Poster red header bar
    const pBar = this.add.rectangle(0, -115, 118, 18, 0xcc1111)
    pBar.setRotation(Phaser.Math.DegToRad(-1.5))
    gate.add(pBar)

    const pTitle = this.add.text(0, -115, 'NOTICE', {
      fontFamily: '"Press Start 2P"',
      fontSize: 7,
      color: '#ffffff'
    }).setOrigin(0.5).setRotation(Phaser.Math.DegToRad(-1.5))
    gate.add(pTitle)

    const pText = this.add.text(0, -85, 'PLACEMENTS\n   2026\nGOOD LUCK', {
      fontFamily: '"Press Start 2P"',
      fontSize: 8,
      color: '#1a1a1a',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5).setRotation(Phaser.Math.DegToRad(-1.5))
    gate.add(pText)

    // Pin
    gate.add(this.add.circle(-42, -120, 4, 0xee3322))

    // ── Door handles ────────────────────────────────────────────────────────
    const hY = 20
    ;[-18, 18].forEach(hX => {
      const bar = this.add.rectangle(hX, hY, 8, 30, 0xc8a840)
      bar.setStrokeStyle(1, 0x8a6020, 1)
      gate.add(bar)
      // Handle highlight
      gate.add(this.add.rectangle(hX - 1, hY - 5, 3, 16, 0xffe880, 0.5))
    })

    // ── Door hinge bolts ─────────────────────────────────────────────────────
    ;[-100, 100].forEach(hx => {
      [-100, 0, 100].forEach(hy => {
        gate.add(this.add.circle(hx, hy, 5, 0x806030))
        gate.add(this.add.circle(hx, hy, 2, 0xd0a040))
      })
    })

    // ── Arch above gate ─────────────────────────────────────────────────────
    const arch = this.add.arc(0, -172, 134, 180, 360, false, 0x2b1e0e)
    arch.setStrokeStyle(6, 0x1a0f04, 1)
    gate.add(arch)

    // Arch keystone
    gate.add(this.add.rectangle(0, -178, 36, 28, 0x3a2810))
    gate.add(this.add.text(0, -178, '꩜', {
      fontFamily: '"VT323"', fontSize: 20, color: '#f0c040'
    }).setOrigin(0.5))

    // ── Neon sign strip above arch ───────────────────────────────────────────
    const sign = this.add.text(0, -210, '◆  ENTER  ◆', {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(8),
      color: '#f0c040',
      stroke: '#804000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0)
    gate.add(sign)
    this._tween(sign, { alpha: 0.7, duration: 800, delay: 1200 })
    this._tween(sign, { alpha: 0.3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 2000 })

    // ── Assemble scale + entrance animation ─────────────────────────────────
    gate.setScale(0)
    gate.setAlpha(0)

    this._tween(gate, {
      alpha: 1, scaleX: gScale, scaleY: gScale,
      duration: 900, ease: 'Back.out(1.4)',
      onComplete: () => this._animateGateIdle(gate, gY)
    })

    // ── Ground particles rising from gate base ───────────────────────────────
    this._timer(1000, () => this._spawnGateSteam(gX, H * 0.78))

    // ── Prompt ──────────────────────────────────────────────────────────────
    const promptText = this.sys.game.device.input.touch ? 'TAP TO ENTER' : 'PRESS  ENTER'
    const prompt = this.add.text(W / 2, H * 0.82, promptText, {
      fontFamily: '"Press Start 2P"',
      fontSize: this._fs(10),
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0)

    this._timer(1100, () => {
      this._tween(prompt, { alpha: 1, duration: 600 })
      this._tween(prompt, { alpha: 0.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800 })
    })

    // ── Input — keyboard + tap ───────────────────────────────────────────────
    const onEnter = () => this._enterGate(gate, prompt, spotlight, shadow)

    this.input.keyboard.once('keydown-ENTER', onEnter)
    this.input.keyboard.once('keydown-SPACE', onEnter)
    this.input.once('pointerdown', onEnter)
  }

  // ── Door panel factory ────────────────────────────────────────────────────
  _makeDoorPanel(side, W, H, base, shade, highlight) {
    const objs = []
    const cx = side * (W / 2 + 3)

    // Door body
    const body = this.add.rectangle(cx, 0, W, H, base)
    body.setStrokeStyle(2, shade, 1)
    objs.push(body)

    // Bevelled inset panels
    const panH = H / 3 - 8
    ;[-H / 3, 0, H / 3].forEach(py => {
      // Inset
      objs.push(this.add.rectangle(cx, py, W - 20, panH, 0x000000, 0.15))
      // Top edge (light)
      objs.push(this.add.rectangle(cx, py - panH / 2, W - 20, 2, highlight, 0.6))
      // Left edge (light) for left door, right for right
      objs.push(this.add.rectangle(cx - side * (W / 2 - 14), py, 2, panH, highlight, 0.4))
    })

    // Side highlight strip
    objs.push(this.add.rectangle(cx - side * (W / 2 - 3), 0, 4, H - 4, highlight, 0.25))

    return objs
  }

  // ── Idle gate animation ───────────────────────────────────────────────────
  _animateGateIdle(gate, baseY) {
    this._tween(gate, {
      y: baseY - 8,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  // ── Steam / mist from gate base ───────────────────────────────────────────
  _spawnGateSteam(gX, gY) {
    const spawnOne = () => {
      if (!this.scene.isActive('PreludeScene')) return
      const p = this.add.circle(
        gX + rand(-80, 80), gY,
        rand(4, 12), 0x8090ff, rand(0.05, 0.15)
      )
      this._tween(p, {
        y: gY - rand(40, 130),
        x: p.x + rand(-30, 30),
        alpha: 0,
        scaleX: 3, scaleY: 3,
        duration: rand(1200, 2800),
        ease: 'Power1',
        onComplete: () => p.destroy()
      })
      this._timer(rand(60, 200), spawnOne)
    }
    spawnOne()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4.  GATE ENTER  — dramatic transition
  // ═══════════════════════════════════════════════════════════════════════════
  _enterGate(gate, prompt, spotlight, shadow) {
    // Disable input immediately
    this.input.removeAllListeners()
    this.input.keyboard.removeAllListeners()

    prompt.destroy()

    // White flash
    const flash = this.add.rectangle(0, 0, this.W * 3, this.H * 3, 0xffffff, 0)
      .setOrigin(0)

    // Gate swings open — scale X to 0 on each half (fake door open)
    this._tween(gate, { scaleX: gate.scaleX * 3.5, scaleY: gate.scaleY * 3.5, duration: 900, ease: 'Power2' })
    this._tween(spotlight, { scaleX: 3, scaleY: 3, fillAlpha: 0.8, duration: 900, ease: 'Power2' })

    // Flash in
    this._tween(flash, { fillAlpha: 1, duration: 700, delay: 500, ease: 'Power2' })

    // Rumble — camera shake
    this.cameras.main.shake(600, 0.012)

    // Transition to LabScene
    this._timer(1400, () => {
      this.cameras.main.fadeOut(300, 255, 255, 255)
      this._timer(300, () => this.scene.start('LabScene'))
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5.  DIALOGUE  (called by LabScene or after character select if needed)
  // ═══════════════════════════════════════════════════════════════════════════
  _startDialogue() {
    const dialogueSystem = new DialogueSystem(gameState)
    dialogueSystem.play('opening', () => {
      const charSelect = new CharacterSelect(selectedSenior => {
        gameState.selectedSenior = selectedSenior
        dialogueSystem.play('selected', () => {
          this.scene.start('GameScene')
        })
      })
      charSelect.show()
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Responsive font size — clamps between min and max px */
  _fs(baseVw, minPx = 8, maxPx = 64) {
    return Math.max(minPx, Math.min(maxPx, Math.round(this.W * baseVw / 100)))
  }

  /** Register and return a tween */
  _tween(targets, config) {
    const t = this.tweens.add({ targets, ...config })
    this._tweenReg.push(t)
    return t
  }

  /** Register and fire a delayed call */
  _timer(delay, cb) {
    const t = this.time.delayedCall(delay, cb)
    this._timeReg.push(t)
    return t
  }

  /** Cleanup on scene shutdown */
  shutdown() {
    this._tweenReg.forEach(t => t.stop?.())
    this._timeReg.forEach(t => t.remove?.())
  }
}