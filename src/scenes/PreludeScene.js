// ─────────────────────────────────────────────────────────────────────────────
// PreludeScene.js
// Cinematic opening — shows the SI Lab in crisis, then triggers dialogue,
// then launches character select.
// ─────────────────────────────────────────────────────────────────────────────
import { DialogueSystem } from '../systems/DialogueSystem.js'
import { CharacterSelect } from '../systems/CharacterSelect.js'
import { gameState } from '../data/GameState.js'

export class PreludeScene extends Phaser.Scene {
  constructor() { super('PreludeScene') }

  create() {
    const w = this.scale.width, h = this.scale.height

    // ── Background ────────────────────────────────────────────────────────
    this.add.image(w/2, h/2, 'bg_0').setDisplaySize(w, h)

    // ── Lab title text ────────────────────────────────────────────────────
    this.add.text(w/2, h * 0.18, 'SI LAB', {
      fontFamily: '"Press Start 2P"',
      fontSize: Math.min(w * 0.08, 36),
      fill: '#f0c040',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0)
    .setName('labTitle')

    // ── Chaos particles (assignment sheets flying) ─────────────────────────
    this.particles = this.add.particles(0, 0, 'pickup', {
      x: { min: 0, max: w },
      y: { min: -20, max: -5 },
      speedY: { min: 60, max: 140 },
      speedX: { min: -30, max: 30 },
      rotate: { min: 0, max: 360 },
      lifespan: 3000,
      quantity: 2,
      frequency: 400,
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
    })

    // ── Cinematic text sequence ────────────────────────────────────────────
    const lines = [
      { text: '[ SI LAB — NIGHT BEFORE END SEM ]', delay: 400 },
      { text: 'Bugs. Deadlines. Missing maggi.', delay: 1800 },
      { text: 'The juniors are in trouble.', delay: 3200 },
      { text: 'There is only one solution...', delay: 4600 },
      { text: 'CALL THE SENIORS.', delay: 5800, big: true },
    ]

    lines.forEach(({ text, delay, big }) => {
      this.time.delayedCall(delay, () => {
        const t = this.add.text(w/2, h * 0.65, text, {
          fontFamily: big ? '"Press Start 2P"' : '"VT323"',
          fontSize: big ? Math.min(w * 0.05, 22) : Math.min(w * 0.06, 26),
          fill: big ? '#f0c040' : '#c0c0e0',
          stroke: '#000',
          strokeThickness: big ? 4 : 2,
          wordWrap: { width: w * 0.85 },
          align: 'center',
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: t,
          alpha: 1,
          y: h * 0.6,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            this.time.delayedCall(1200, () => {
              this.tweens.add({ targets: t, alpha: 0, duration: 400 })
            })
          }
        })
      })
    })

    // ── After cinematic — trigger dialogue then character select ───────────
    this.time.delayedCall(7800, () => {
      this.particles.destroy()

      // Dialogue system needs gameState but no senior selected yet
      const dialogueSystem = new DialogueSystem(gameState)
      dialogueSystem.play('opening', () => {
        // After dialogue — show character select
        const charSelect = new CharacterSelect((selectedSenior) => {
          gameState.selectedSenior = selectedSenior
          // Brief post-select dialogue
          dialogueSystem.play('selected', () => {
            this.scene.start('GameScene')
          })
        })
        charSelect.show()
      })
    })
  }
}
