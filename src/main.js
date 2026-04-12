// ─────────────────────────────────────────────────────────────────────────────
// main.js — Game entry point
// ─────────────────────────────────────────────────────────────────────────────
import Phaser from 'phaser'
import { BootScene }    from './scenes/BootScene.js'
import { PreludeScene } from './scenes/PreludeScene.js'
import { GameScene }    from './scenes/GameScene.js'

// ── Responsive canvas size ────────────────────────────────────────────────────
// Lock to portrait-ish aspect ratio on mobile, wider on desktop
const MAX_W = 480
const W = Math.min(window.innerWidth, MAX_W)
const H = window.innerHeight

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#0a0a1a',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,         // ← set true to see hitboxes during dev
    },
  },
  scene: [BootScene, PreludeScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,    // support multi-touch
  },
  render: {
    antialias: false,     // pixel-perfect rendering
    pixelArt: true,
  },
}

const game = new Phaser.Game(config)

// ── Handle resize ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  game.scale.resize(
    Math.min(window.innerWidth, MAX_W),
    window.innerHeight
  )
})

export default game
