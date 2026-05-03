import Phaser from 'phaser'
import { PALETTES } from '../../palettes.js'
import { GS } from '../../config/GameConfig.js'

// ─────────────────────────────────────────────────────────────────────────────
// HUD — Builds and updates the in-game heads-up display
// ─────────────────────────────────────────────────────────────────────────────

export class HUD {
  constructor(scene, year) {
    this.scene = scene
    this.year  = year
    this._hudHpBg   = null
    this._hudHpBar  = null
    this._hudHpTxt  = null
    this._hudScore  = null
    this._hudYear   = null
    this._hudCgpa   = null
    this._hudKills  = null
    this._hudPowerup = null
  }

  build(W, H, pal) {
    const s = this.scene

    // Top bar bg - Glassmorphism effect
    const hudBg = s.add.graphics().setScrollFactor(0).setDepth(50)
    hudBg.fillStyle(0x000000, 0.4)
    hudBg.fillRect(0, 0, W, 32)
    // Glass highlight
    hudBg.lineStyle(1, 0xffffff, 0.1)
    hudBg.lineBetween(0, 32, W, 32)

    // HP bar with neon glow
    this._hudHpBg  = s.add.rectangle(12, 16, 100, 10, 0x000000, 0.5).setScrollFactor(0).setDepth(51).setOrigin(0, 0.5)
    this._hudHpBg.setStrokeStyle(1, 0xffffff, 0.1)
    
    this._hudHpBar = s.add.rectangle(12, 16, 100, 8, 0xff3333).setScrollFactor(0).setDepth(52).setOrigin(0, 0.5)
    
    // HP Text
    this._hudHpTxt = s.add.text(16, 11, 'HP 100', {
      fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${Math.floor(W / 58)}px`, color: '#ffffff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(53)

    // Score (center) - More premium font
    this._hudScore = s.add.text(W / 2, 6, 'SCORE: 0', {
      fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${Math.floor(W / 48)}px`, color: '#ffffff',
      fontStyle: 'bold', letterSpacing: 2
    }).setScrollFactor(0).setDepth(51).setOrigin(0.5, 0)

    // Year / CGPA (right)
    this._hudYear = s.add.text(W - 12, 6, `YEAR ${this.year + 1}`, {
      fontFamily: '"Outfit", "Nunito", sans-serif', fontSize: `${Math.floor(W / 55)}px`, color: '#ffcc44',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    this._hudCgpa = s.add.text(W - 12, 18, `CGPA ${GS.cgpa.toFixed(1)}`, {
      fontFamily: '"Inter", sans-serif', fontSize: `${Math.floor(W / 70)}px`, color: '#88ddff',
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    this._hudKills = s.add.text(W - 8, 22, `K: 0`, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 80)}px`, color: '#ff8888',
    }).setScrollFactor(0).setDepth(51).setOrigin(1, 0)

    // Powerup indicator
    this._hudPowerup = s.add.text(10, 30, '', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 72)}px`, color: '#ffcc00',
    }).setScrollFactor(0).setDepth(51)

    // Year banner (fades after 3 seconds)
    const bannerTxt = s.add.text(W / 2, H / 2 - 30, PALETTES[this.year].name, {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 26)}px`,
      color: `#${pal.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(90).setOrigin(0.5)
    s.tweens.add({ targets: bannerTxt, alpha: 0, delay: 2200, duration: 800, onComplete: () => bannerTxt.destroy() })
  }

  update(killedThisLevel, powerupActive, powerupEndTime, powerupType) {
    const s = this.scene
    const hp = Math.max(0, GS.health)
    this._hudHpTxt?.setText(`HP ${hp}`)
    if (this._hudHpBar) {
      this._hudHpBar.width = (hp / GS.maxHealth) * 90
      this._hudHpBar.setFillStyle(hp < 30 ? 0xff0000 : hp < 60 ? 0xff8800 : 0xff3333)
    }
    this._hudScore?.setText(`SCORE: ${GS.score}`)
    this._hudCgpa?.setText(`CGPA ${GS.cgpa.toFixed(1)}`)
    this._hudKills?.setText(`K: ${killedThisLevel}`)

    if (powerupActive) {
      const remain = Math.ceil(powerupEndTime - s.time.now)
      this._hudPowerup?.setText(`⚡ ${powerupType?.toUpperCase()} ${(remain / 1000).toFixed(1)}s`)
    } else {
      this._hudPowerup?.setText('')
    }
  }
}
