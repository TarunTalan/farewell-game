const fs = require('fs');
const file = './src/scenes/GameScene.js';
let c = fs.readFileSync(file, 'utf8');

// 1. Fix _updatePlayer touch refs to use _mobile module
c = c.replace('this._touchLeft', 'this._mobile.touchLeft');
c = c.replace('this._touchRight', 'this._mobile.touchRight');
c = c.replace('this._touchJumpPressed', 'this._mobile.touchJumpPressed');
c = c.replace('this._touchAttackPressed', 'this._mobile.touchAttackPressed');

// 2. Replace _doAttack call with combat module
c = c.replace(
  `    if (wantAttack && time - (this._lastAttackTime || 0) > 280) {\n      this._lastAttackTime = time\n      this._doAttack(time)\n    }`,
  `    if (wantAttack) {\n      this._combat.doAttack(time, this.player, this.enemies, this._particles, this._powerupActive, this._powerupType)\n    }`
);

// 3. Replace _updateHUD call with module
c = c.replace(
  'this._updateHUD()',
  'this._hud.update(this._killedThisLevel, this._powerupActive, this._powerupEndTime, this._powerupType)'
);

// 4. Replace _showFloat in powerup expiry with combat module
c = c.replace(
  `this._showFloat(this.player.x, this.player.y - 35, 'powerup expired', '#888888')`,
  `this._combat._showFloat(this.player.x, this.player.y - 35, 'powerup expired', '#888888')`
);

// 5. Fix _onBossDefeated - add proper 3s blackout before SIFinaleBridge
const oldBossDefeated = `    this.time.delayedCall(3000, () => {
        text1.destroy()
        text2.destroy()
        
        // Let the player auto-walk to gate
        this._autoWalkRight = true

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(90)
        this.tweens.add({ targets: overlay, alpha: 1, delay: 1500, duration: 1500 })
        
        this.time.delayedCall(3000, () => this._finishGame())
    })`;

const newBossDefeated = `    // 3s celebration, then 3s blackout, then SI gate
    this.time.delayedCall(3000, () => {
        text1.destroy()
        text2.destroy()
        
        // Fade to black
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(200)
        this.tweens.add({ targets: overlay, alpha: 1, duration: 1500 })
        
        // Hold black for 3 seconds, then launch SI gate
        this.time.delayedCall(4500, () => this._finishGame())
    })`;

c = c.replace(oldBossDefeated, newBossDefeated);

fs.writeFileSync(file, c);
console.log('Refactoring complete');
