const fs = require('fs');
const file = './src/scenes/GameScene.js';
let content = fs.readFileSync(file, 'utf8');

const startStr = "// ── Persistent cross-level state ──────────────────────────────────────────────";
const endStr = "// ─────────────────────────────────────────────────────────────────────────────\n// Main GameScene\n// ─────────────────────────────────────────────────────────────────────────────\nexport class GameScene extends Phaser.Scene {";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newImports = `import { GS, GROUND_Y_FRAC, YEAR_VARIANTS, BOSS_CFG } from '../config/GameConfig.js'
import { buildTextures } from '../utils/TextureBuilder.js'
import { YearTransitionScene } from './YearTransitionScene.js'
import { EndingScene } from './EndingScene.js'
import { SIFinaleBridgeScene } from './SIFinaleBridgeScene.js'

// ─────────────────────────────────────────────────────────────────────────────
// Main GameScene
// ─────────────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {`;

  const newContent = content.substring(0, startIndex) + newImports + content.substring(endIndex + endStr.length);
  fs.writeFileSync(file, newContent);
  console.log("Successfully rewrote GameScene.js");
} else {
  console.log("Could not find start or end strings");
}
