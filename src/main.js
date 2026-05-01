// ─────────────────────────────────────────────────────────────────────────────
// main.js — Phaser game entry point
// Scene order: Boot → Prelude → CharSelect → Game
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { BootScene }       from './scenes/BootScene.js'
import { PreludeScene }    from './scenes/PreludeScene.js'
import { CharSelectScene } from './systems/CharSelectScene.js'
import { GameScene }       from './scenes/GameScene.js'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      window.innerWidth,
    height:     window.innerHeight,
    parent:     'game-container',
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: [
    BootScene,
    PreludeScene,
    CharSelectScene,
    GameScene,
  ],
}

new Phaser.Game(config)