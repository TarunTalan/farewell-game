import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'
import { GS } from '../config/GameConfig.js'
import { SENIORS } from '../data/seniors.js'

// ═══════════════════════════════════════════════════════════════════════════════
// SI FINALE BRIDGE — Grand Invitation Scene
// The player walks through the SI Lab gate and receives a beautiful,
// personalized farewell invitation.
// ═══════════════════════════════════════════════════════════════════════════════
export class SIFinaleBridgeScene extends Phaser.Scene {
  constructor() { super('SIFinaleBridge') }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const fs = (n, min = 8, max = 80) => Math.max(min, Math.min(max, Math.floor(W / n)))

    const selectedSeniorId = gameState.selectedSenior
    const senior = SENIORS.find(s => s.id === selectedSeniorId)
    const fullName = senior ? senior.name : 'LEGEND'
    const firstName = fullName.split(' ')[0]

    // ── Phase tracking ──
    this._phase = 0

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 1: Deep space + SI Lab gate (0 - 4s)
    // ══════════════════════════════════════════════════════════════════════
    this.cameras.main.fadeIn(1500, 0, 0, 0)

    // Background
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x020810).setDepth(0)

    // Stars
    for (let i = 0; i < 100; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.8),
        Phaser.Math.FloatBetween(0.5, 2.5), 0xffffff,
        Phaser.Math.FloatBetween(0.15, 0.9)
      ).setDepth(1)
      this.tweens.add({
        targets: star, alpha: 0.05,
        duration: Phaser.Math.Between(400, 2000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      })
    }

    // Rising light motes
    this.time.addEvent({
      delay: 120, loop: true,
      callback: () => {
        const colors = [0x44aaff, 0x88ddff, 0xffcc44, 0xffffff, 0x66eeff]
        const mote = this.add.circle(
          Phaser.Math.Between(W * 0.15, W * 0.85), H + 10,
          Phaser.Math.FloatBetween(1, 4),
          Phaser.Utils.Array.GetRandom(colors),
          Phaser.Math.FloatBetween(0.3, 0.8)
        ).setDepth(2)
        this.tweens.add({
          targets: mote, y: -20, x: mote.x + Phaser.Math.Between(-60, 60),
          alpha: 0, duration: Phaser.Math.Between(2500, 5000),
          onComplete: () => mote.destroy()
        })
      }
    })

    // Gate outer glow rings
    const glow = this.add.graphics().setDepth(3)
    for (let r = 140; r > 0; r -= 5) {
      glow.fillStyle(0x2266cc, 0.008 * (1 - r / 140))
      glow.fillEllipse(W / 2, H * 0.42, r * 3, r * 2.5)
    }

    // Gate frame — ornate double-door
    const gate = this.add.graphics().setDepth(4)
    // Outer glow frame
    gate.fillStyle(0x0a2244); gate.fillRoundedRect(W * 0.18, H * 0.10, W * 0.64, H * 0.76, 20)
    gate.lineStyle(4, 0x44aaff, 0.8); gate.strokeRoundedRect(W * 0.18, H * 0.10, W * 0.64, H * 0.76, 20)
    // Inner frame
    gate.fillStyle(0x081830, 0.9); gate.fillRoundedRect(W * 0.22, H * 0.14, W * 0.56, H * 0.68, 14)
    gate.lineStyle(2, 0x88ddff, 0.5); gate.strokeRoundedRect(W * 0.22, H * 0.14, W * 0.56, H * 0.68, 14)
    // Energy field
    gate.fillStyle(0x1144aa, 0.12); gate.fillRoundedRect(W * 0.24, H * 0.16, W * 0.52, H * 0.64, 10)
    // Gold accent
    gate.lineStyle(2, 0xffcc44, 0.5); gate.strokeRoundedRect(W * 0.20, H * 0.12, W * 0.60, H * 0.72, 16)
    // Corner ornaments
    const corners = [[W * 0.20, H * 0.12], [W * 0.80, H * 0.12], [W * 0.20, H * 0.84], [W * 0.80, H * 0.84]]
    corners.forEach(([cx, cy]) => {
      gate.fillStyle(0xffcc44, 0.9); gate.fillCircle(cx, cy, 6)
      gate.fillStyle(0xffffff, 0.5); gate.fillCircle(cx, cy, 2.5)
    })

    // "SI LAB" text on gate
    const siText = this.add.text(W / 2, H * 0.26, 'SI', {
      fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${fs(3, 28, 60)}px`,
      color: '#ffffff', fontStyle: 'bold',
      stroke: '#44aaff', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5)

    const labText = this.add.text(W / 2, H * 0.38, 'L  A  B', {
      fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${fs(10, 14, 32)}px`,
      color: '#cceeff', fontStyle: '600', letterSpacing: 8
    }).setOrigin(0.5).setDepth(5)

    // Pulsing energy field
    const energy = this.add.rectangle(W / 2, H * 0.48, W * 0.45, H * 0.55, 0x44aaff, 0.08).setDepth(4)
    this.tweens.add({ targets: energy, alpha: 0.03, duration: 1500, yoyo: true, repeat: -1 })

    // Door panels that will open
    const doorLeft = this.add.rectangle(W * 0.24, H * 0.48, W * 0.26, H * 0.64, 0x0a2244)
      .setOrigin(0, 0.5).setDepth(100).setStrokeStyle(3, 0x44aaff)
    const doorRight = this.add.rectangle(W * 0.76, H * 0.48, W * 0.26, H * 0.64, 0x0a2244)
      .setOrigin(1, 0.5).setDepth(100).setStrokeStyle(3, 0x44aaff)

    // Door handles
    const handleL = this.add.circle(W * 0.42, H * 0.48, 4, 0xffcc44).setDepth(101)
    const handleR = this.add.circle(W * 0.58, H * 0.48, 4, 0xffcc44).setDepth(101)

    // Message before doors open
    const walkMsg = this.add.text(W / 2, H * 0.58, `${firstName}, step through\nthe gates of SI Lab...`, {
      fontFamily: '"Inter", "Nunito", sans-serif', fontSize: `${fs(24, 12, 20)}px`,
      color: '#ffdd66', align: 'center', lineSpacing: 8,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(105)
    this.tweens.add({ targets: walkMsg, alpha: 1, y: walkMsg.y - 10, duration: 1200, delay: 1000, ease: 'Power2' })

    // Flash behind doors
    const flashBack = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(90)

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 2: Doors open (2.5s - 5.5s)
    // ══════════════════════════════════════════════════════════════════════
    this.time.delayedCall(2500, () => {
      // Camera shake for dramatic effect
      this.cameras.main.shake(400, 0.015)

      // Doors swing open
      this.tweens.add({
        targets: [doorLeft, doorRight], scaleX: 0,
        duration: 2800, ease: 'Cubic.easeInOut',
      })
      this.tweens.add({ targets: [handleL, handleR], alpha: 0, duration: 800 })

      // Light floods through
      this.tweens.add({
        targets: flashBack, fillAlpha: 0.85,
        duration: 2800, ease: 'Quad.easeIn',
      })

      // Fade out gate elements
      this.tweens.add({
        targets: [walkMsg, siText, labText, energy],
        alpha: 0, duration: 2500, delay: 800
      })

      // Particle burst upon opening
      for (let i = 0; i < 40; i++) {
        const p = this.add.circle(W/2, H*0.48, Phaser.Math.Between(2, 6), 0xffffff, 0.8).setDepth(110)
        this.tweens.add({
          targets: p,
          x: W/2 + Phaser.Math.Between(-W, W),
          y: H*0.48 + Phaser.Math.Between(-H, H),
          alpha: 0, scale: 2, duration: Phaser.Math.Between(1500, 3000),
          onComplete: () => p.destroy()
        })
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 3: Grand reveal — invitation (5.5s onward)
    // ══════════════════════════════════════════════════════════════════════
    this.time.delayedCall(5500, () => {
      // Fade out all phase 1/2 elements
      this.tweens.add({
        targets: [gate, glow, doorLeft, doorRight, flashBack],
        alpha: 0, duration: 1500
      })

      // Golden background with Rays
      const goldBg = this.add.graphics().setDepth(200).setAlpha(0)
      goldBg.fillGradientStyle(0x05081a, 0x05081a, 0x1a0f00, 0x1a0f00, 1)
      goldBg.fillRect(0, 0, W, H)
      this.tweens.add({ targets: goldBg, alpha: 1, duration: 2000 })

      const rays = this.add.graphics().setDepth(201).setAlpha(0)
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2
        rays.lineStyle(2, 0xffcc44, 0.1)
        rays.lineBetween(W/2, H/2, W/2 + Math.cos(angle)*W*2, H/2 + Math.sin(angle)*W*2)
      }
      this.tweens.add({ targets: rays, alpha: 1, duration: 2000 })
      this.time.addEvent({ delay: 50, loop: true, callback: () => rays.rotation += 0.005 })

      // Golden confetti rain
      this._startGoldenRain(W, H)

      // ── "YOU ARE INVITED" ──
      const inviteTitle = this.add.text(W / 2, H * 0.08, '🎓', {
        fontSize: `${fs(6, 30, 60)}px`,
      }).setOrigin(0.5).setAlpha(0).setDepth(210).setScale(0.3)

      const inviteText = this.add.text(W / 2, H * 0.17, 'YOU ARE\nINVITED', {
        fontFamily: '"Outfit", sans-serif', fontSize: `${fs(8, 22, 48)}px`,
        color: '#ffcc44', fontStyle: '900', align: 'center',
        stroke: '#442200', strokeThickness: 5, letterSpacing: 6, lineSpacing: 4
      }).setOrigin(0.5).setAlpha(0).setDepth(210).setScale(0.3)

      // Animate title in
      this.tweens.add({
        targets: [inviteTitle, inviteText], alpha: 1, scale: 1,
        duration: 1800, ease: 'Back.easeOut(1.2)',
      })

      // Decorative line
      const divLine = this.add.graphics().setDepth(210).setAlpha(0)
      divLine.lineStyle(1.5, 0xffcc44, 0.6)
      divLine.lineBetween(W * 0.15, H * 0.26, W * 0.85, H * 0.26)
      divLine.fillStyle(0xffcc44, 0.8)
      divLine.fillCircle(W / 2, H * 0.26, 3)
      this.tweens.add({ targets: divLine, alpha: 1, duration: 800, delay: 800 })

      // ── Personalized message ──
      const loveMsg = this.add.text(W / 2, H * 0.40, [
        `Dear ${fullName},`,
        '',
        'You survived 4 years of engineering.',
        'You debugged code at 3 AM.',
        'You carried group projects solo.',
        'Your legacy in SI Lab is written',
        'in code, chai stains & memories.',
        '',
        'Now it\'s time to celebrate YOU. 💛',
      ].join('\n'), {
        fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${fs(34, 11, 17)}px`,
        color: '#ead4aa', align: 'center', lineSpacing: 6,
        stroke: '#000000', strokeThickness: 1
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      this.tweens.add({
        targets: loveMsg, alpha: 1, y: loveMsg.y - 15,
        duration: 2500, delay: 1200, ease: 'Cubic.easeOut'
      })

      // ── Event details box ──
      const boxY = H * 0.72
      const boxW = W * 0.85
      const boxH = H * 0.20
      const detailBox = this.add.graphics().setDepth(209).setAlpha(0)
      detailBox.fillStyle(0x1a0a00, 0.5)
      detailBox.fillRoundedRect(W / 2 - boxW / 2, boxY - boxH / 2, boxW, boxH, 16)
      detailBox.lineStyle(2, 0xffcc44, 0.5)
      detailBox.strokeRoundedRect(W / 2 - boxW / 2, boxY - boxH / 2, boxW, boxH, 16)

      const eventTitle = this.add.text(W / 2, boxY - boxH * 0.32, '✨ SI FAREWELL 2026 ✨', {
        fontFamily: '"Outfit", sans-serif', fontSize: `${fs(22, 12, 22)}px`,
        color: '#ffcc44', fontStyle: 'bold', letterSpacing: 3
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      const eventDate = this.add.text(W / 2, boxY - boxH * 0.06, '📅  9th May 2026', {
        fontFamily: '"Inter", sans-serif', fontSize: `${fs(26, 11, 20)}px`,
        color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      const eventVenue = this.add.text(W / 2, boxY + boxH * 0.18, '📍  SI Lab, CS Department', {
        fontFamily: '"Inter", sans-serif', fontSize: `${fs(28, 10, 18)}px`,
        color: '#ddccaa'
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      // Animate details in
      const detailDelay = 2800
      this.tweens.add({ targets: detailBox, alpha: 1, duration: 800, delay: detailDelay })
      this.tweens.add({ targets: eventTitle, alpha: 1, duration: 600, delay: detailDelay + 200 })
      this.tweens.add({
        targets: eventDate, alpha: 1, scale: { from: 0.6, to: 1 },
        duration: 800, delay: detailDelay + 600, ease: 'Back.easeOut'
      })
      this.tweens.add({ targets: eventVenue, alpha: 1, duration: 600, delay: detailDelay + 1000 })

      // ── Bottom tagline ──
      const tagline = this.add.text(W / 2, H * 0.92, `See you there, ${firstName}. 🫡`, {
        fontFamily: '"Nunito", sans-serif', fontSize: `${fs(28, 11, 18)}px`,
        color: '#ffdd88', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      this.tweens.add({
        targets: tagline, alpha: 1, duration: 1000, delay: detailDelay + 1600,
      })

      // Pulsing glow on tagline
      this.tweens.add({
        targets: tagline, scale: 1.04,
        duration: 1200, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: detailDelay + 2600
      })

      // ── Score display ──
      const scoreText = this.add.text(W / 2, H * 0.97, `Final Score: ${GS.score}  |  CGPA: ${GS.cgpa.toFixed(1)}`, {
        fontFamily: '"Nunito", sans-serif', fontSize: `${fs(50, 7, 12)}px`,
        color: '#887755'
      }).setOrigin(0.5).setAlpha(0).setDepth(210)

      this.tweens.add({ targets: scoreText, alpha: 0.6, duration: 800, delay: detailDelay + 2000 })
    })
  }

  // ── Golden confetti rain ────────────────────────────────────────────────────
  _startGoldenRain(W, H) {
    this.time.addEvent({
      delay: 40, loop: true,
      callback: () => {
        const goldColors = [0xffcc44, 0xffaa22, 0xffdd88, 0xffffff, 0xff8844]
        const x = Phaser.Math.Between(0, W)
        const size = Phaser.Math.FloatBetween(1, 4)
        const p = this.add.circle(x, -20, size, Phaser.Utils.Array.GetRandom(goldColors))
          .setDepth(205).setAlpha(Phaser.Math.FloatBetween(0.3, 0.9))

        this.tweens.add({
          targets: p,
          y: H + 20,
          x: x + Phaser.Math.Between(-80, 80),
          rotation: Math.PI * Phaser.Math.FloatBetween(1, 4),
          duration: Phaser.Math.Between(3000, 7000),
          onComplete: () => p.destroy()
        })
      }
    })

    // Larger sparkle bursts periodically
    this.time.addEvent({
      delay: 800, loop: true,
      callback: () => {
        const cx = Phaser.Math.Between(W * 0.1, W * 0.9)
        const cy = Phaser.Math.Between(H * 0.1, H * 0.7)
        for (let i = 0; i < 6; i++) {
          const spark = this.add.circle(cx, cy, Phaser.Math.Between(1, 3), 0xffdd88, 0.8)
            .setDepth(206)
          this.tweens.add({
            targets: spark,
            x: cx + Phaser.Math.Between(-50, 50),
            y: cy + Phaser.Math.Between(-50, 50),
            alpha: 0, scale: 0,
            duration: Phaser.Math.Between(500, 1200),
            onComplete: () => spark.destroy()
          })
        }
      }
    })
  }
}
