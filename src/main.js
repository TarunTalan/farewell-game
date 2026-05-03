// ─────────────────────────────────────────────────────────────────────────────
// main.js — Phaser game entry point
// Scene order: Boot → Prelude → CharSelect → Game → SIFinaleBridge
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { BootScene }            from './scenes/BootScene.js'
import { PreludeScene }         from './scenes/PreludeScene.js'
import { CharSelectScene }      from './systems/CharSelectScene.js'
import { GameScene }            from './scenes/GameScene.js'
import { YearTransitionScene }  from './scenes/YearTransitionScene.js'
import { SIFinaleBridgeScene }  from './scenes/SIFinaleBridgeScene.js'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      480,
    height:     800,
    parent:     'game-container',
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  input: {
    activePointers: 4,   // Support 4 simultaneous touch points for mobile
  },
  scene: [
    BootScene,
    PreludeScene,
    CharSelectScene,
    GameScene,
    YearTransitionScene,
    SIFinaleBridgeScene,
  ],
}

new Phaser.Game(config)