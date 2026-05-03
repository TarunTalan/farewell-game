const fs = require('fs');
const file = './src/scenes/GameScene.js';
let c = fs.readFileSync(file, 'utf8');

// Remove old _buildHUD and _updateHUD methods (replaced by HUD module)
const hudStart = '  // ── HUD ───────────────────────────────────────────────────────────────────\n  _buildHUD(W, H, pal) {';
const hudEnd = '    }\n  }\n\n  // ── Mobile controls';
c = c.replace(c.substring(c.indexOf(hudStart), c.indexOf(hudEnd)), '  // ── Mobile controls');

// Remove old _buildMobileControls, _drawMobileButtons, _setupTouchInput (replaced by MobileControls module)
const mobileStart = '  // ── Mobile controls ───────────────────────────────────────────────────────\n  _buildMobileControls(W, H) {';
const mobileEnd = '  // ── Update loop';
const mobileBlock = c.substring(c.indexOf(mobileStart), c.indexOf(mobileEnd));
c = c.replace(mobileBlock, '  // ── Update loop');

// Remove old _doAttack, _killEnemy, _onTouchEnemy, _onPickup, _onProjHit, _takeDamage, _showFloat (replaced by Combat module)
const combatStart = '\n  _doAttack(time) {';
const combatEnd = '  _onBossDefeated()';
if (c.indexOf(combatStart) !== -1 && c.indexOf(combatEnd) !== -1) {
  const block = c.substring(c.indexOf(combatStart), c.indexOf(combatEnd));
  c = c.replace(block, '\n  ');
}

// Remove the old collision callback methods that are now in Combat
const oldOnTouch = c.indexOf('  // ── Collision callbacks');
const oldDamage = c.indexOf('  // ── Damage');
const oldLevelEnd = '  // ── Level end';
if (oldOnTouch !== -1 && c.indexOf(oldLevelEnd) !== -1) {
  const block2 = c.substring(oldOnTouch, c.indexOf(oldLevelEnd));
  c = c.replace(block2, '  ');
}

// Remove old _showFloat at the end (replaced by Combat module)
const showFloatStart = '\n  // ── Floating text';
if (c.indexOf(showFloatStart) !== -1) {
  const idx = c.indexOf(showFloatStart);
  const endIdx = c.indexOf('\n}\n', idx);
  if (endIdx !== -1) {
    c = c.substring(0, idx) + '\n}\n';
  }
}

fs.writeFileSync(file, c);
console.log('Cleanup complete, file size:', c.length);
