import Phaser from 'phaser'
import { PALETTES } from '../../palettes.js'
import { GS, BOSS_CFG } from '../../config/GameConfig.js'

// ─────────────────────────────────────────────────────────────────────────────
// Combat — Attack logic, damage, enemy kills, pickups
// ─────────────────────────────────────────────────────────────────────────────

export class Combat {
  constructor(scene, year) {
    this.scene = scene
    this.year  = year
    this._lastAttackTime = 0
  }

  /** Player melee attack */
  doAttack(time, player, enemies, particles, powerupActive, powerupType) {
    const isYear2 = (this.year === 1)
    const cooldown = isYear2 ? 600 : 280
    if (time - this._lastAttackTime < cooldown) return
    this._lastAttackTime = time

    const s     = this.scene
    const pal   = PALETTES[this.year]
    const dir   = player.flipX ? -1 : 1

    if (isYear2) {
      // ── YEAR 2 DASH MECHANIC ──
      const dashDist = 180
      const targetX  = player.x + dir * dashDist
      
      // Shadow trail VFX
      for (let i = 0; i < 4; i++) {
        const t = s.add.image(player.x + dir * (i * 30), player.y, 'player').setAlpha(0.4 - i * 0.1).setTint(pal.accent).setScale(1.5)
        if (player.flipX) t.setFlipX(true)
        s.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() })
      }

      s.tweens.add({ targets: player, x: targetX, duration: 120, ease: 'Cubic.easeOut' })
      
      // Impact logic
      enemies.getChildren().forEach(e => {
        if (!e.active || e.getData('hp') <= 0) return
        const dx = e.x - player.x
        if (Math.sign(dx) === dir && Math.abs(dx) < dashDist + 40) {
          this.killEnemy(e, particles)
          s.cameras.main.shake(100, 0.008)
          this.scene._showFloat(e.x, e.y - 20, 'TALENT!', '#00ff88')
        }
      })
      return
    }

    const range = powerupActive && powerupType === 'hack' ? 140 : 85

    // Slash VFX
    const slash = s.add.graphics().setDepth(15)
// ... (rest of original doAttack logic for other years)
    slash.lineStyle(3.5, pal.accent, 0.9)
    slash.lineBetween(player.x, player.y - 8, player.x + dir * range, player.y + 12)
    slash.lineStyle(1.5, 0xffffff, 0.5)
    slash.lineBetween(player.x + dir * 10, player.y - 5, player.x + dir * range * 0.9, player.y + 8)
    s.tweens.add({ targets: slash, alpha: 0, duration: 140, onComplete: () => slash.destroy() })

    // Particle burst from fist
    particles.setPosition(player.x + dir * 30, player.y)
    particles.setParticleTint(pal.accent)
    particles.explode(10)

    let hitAny = false
    enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('hp') <= 0) return
      const dist = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y)
      const inArc = Math.sign(e.x - player.x) === dir || dist < 40
      if (dist > range + e.width / 2 || !inArc) return

      hitAny = true
      const isBoss = e.getData('isBoss')
      const dmg    = isBoss ? 2 : Phaser.Math.Between(1, 2)
      const newHp  = e.getData('hp') - dmg
      e.setData('hp', newHp)

      // Hit flash
      e.setTint(0xffffff)
      s.time.delayedCall(90, () => { if (e.active) e.clearTint() })
      e.setVelocityX(dir * 240)

      this.scene._showFloat(e.x, e.y - 25, `-${dmg}`, '#ff5555')
      GS.score += 10

      // Update HP bar
      if (!isBoss) {
        const maxHp = e.getData('maxHp')
        const frac  = Math.max(0, newHp / maxHp)
        const barFg = e.getData('barFg')
        if (barFg) barFg.width = (e.width + 4) * frac
      } else {
        const bossHpBar = s._bossHpBar
        if (bossHpBar) {
          const frac = Math.max(0, newHp / BOSS_CFG.hp)
          bossHpBar.width = 216 * frac
        }
      }

      if (newHp <= 0) this.killEnemy(e, particles)
    })

    // ── YEAR 2 NODE INTERACTION ──
    if (this.year === 1) {
      this.scene._memoryGates.forEach(g => {
        if (g.opened) return
        g.nodes.forEach(n => {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, n.x, n.y)
          if (dist < 60) {
            hitAny = true
            this.scene._onNodeHit(n)
          }
        })
      })
    }

    if (!hitAny) this.scene._showFloat(player.x + dir * 50, player.y - 10, 'miss!', '#556688')
  }

  killEnemy(e, particles) {
    const s      = this.scene
    const isBoss = e.getData('isBoss')
    const pal    = PALETTES[this.year]

    // Destroy HUD elements
    ;['barBg', 'barFg', 'lbl'].forEach(k => {
      const obj = e.getData(k)
      if (obj) obj.destroy()
    })

    // Explosion particles
    particles.setPosition(e.x, e.y)
    particles.setParticleTint(pal.particleA)
    particles.explode(22)

    // Coin burst VFX
    const colors = [0xff8800, 0xffcc00, 0xff4444, 0xffffff, 0x44ffcc]
    for (let i = 0; i < 10; i++) {
      const dot = s.add.circle(e.x, e.y, Phaser.Math.Between(2, 6), Phaser.Utils.Array.GetRandom(colors)).setDepth(20)
      s.tweens.add({
        targets: dot,
        x: e.x + Phaser.Math.Between(-70, 70),
        y: e.y - Phaser.Math.Between(20, 70),
        alpha: 0, duration: Phaser.Math.Between(350, 650),
        onComplete: () => dot.destroy()
      })
    }

    if (isBoss) {
      s._onBossDefeated()
    } else {
      const pts = e.getData('score') || 50
      this.scene._showFloat(e.x, e.y - 35, `+${pts} pts`, '#ffcc44')
      GS.score += pts
      GS.totalKills++
      s._killedThisLevel++
      GS.cgpa = Math.min(10.0, GS.cgpa + 0.05)
      e.destroy()
    }
  }

  /** Player takes damage from enemy contact */
  onTouchEnemy(player, enemy) {
    const s = this.scene
    if (!enemy.active || enemy.getData('hp') <= 0) return
    if (enemy.getData('isBoss')) return
    const now = s.time.now
    if (now - s._lastDmgTime < s._dmgCooldown) return
    s._lastDmgTime = now
    this.takeDamage(4 + Math.floor(this.year * 0.5), player)
    const dir = player.x < enemy.x ? -1 : 1
    player.setVelocityX(dir * 320).setVelocityY(-170)
  }

  /** Player picks up an item */
  onPickup(player, pickup, particles) {
    const s = this.scene
    if (!pickup?.active) return
    pickup.destroy()

    const isPowerup = pickup.getData('isPowerup')
    if (isPowerup) {
      const pu = pickup.getData('puCfg')
      s._powerupActive  = true
      s._powerupEndTime = s.time.now + pu.duration
      s._powerupType    = pu.type
      GS.powerupType    = pu.type
      GS.score         += 200
      this.scene._showFloat(player.x, player.y - 40, `${pu.label}!`, '#ffff44', 12)
      this.scene._showFloat(player.x, player.y - 58, pu.desc || '', '#ffdd88', 9)
      s.cameras.main.flash(300, 255, 210, 50)
      particles.setPosition(player.x, player.y)
      particles.setParticleTint(pu.color)
      particles.explode(20)
    } else {
      const key = pickup.getData('pickupKey')
      if (key === 'pickup_hp') {
        GS.health = Math.min(GS.maxHealth, GS.health + 35)
        this.scene._showFloat(player.x, player.y - 35, '+35 HP', '#44ff88', 12)
        particles.setPosition(player.x, player.y)
        particles.setParticleTint(0x44ff88)
        particles.explode(10)
      } else {
        GS.score += 100
        this.scene._showFloat(player.x, player.y - 35, '+100 pts', '#ffcc44', 12)
      }
      s.cameras.main.flash(120, 80, 255, 120)
    }
  }

  /** Player hit by boss projectile */
  onProjHit(player, proj, particles) {
    const s = this.scene
    if (!proj?.active) return
    const now = s.time.now
    if (now - s._lastDmgTime < s._dmgCooldown) return
    if (s._powerupActive && s._powerupType === 'offer') {
      proj.destroy()
      this.scene._showFloat(player.x, player.y - 30, 'BLOCKED!', '#ffcc00')
      return
    }
    s._lastDmgTime = now
    proj.destroy()
    this.takeDamage(5, player)
    particles.setPosition(player.x, player.y)
    particles.setParticleTint(0xff4444)
    particles.explode(12)
  }

  /** Apply damage to player */
  takeDamage(amount, player) {
    const s = this.scene
    if (s._powerupActive && s._powerupType === 'chai') amount = Math.floor(amount * 0.40)
    GS.health = Math.max(0, GS.health - amount)
    GS.cgpa   = Math.max(4.0, GS.cgpa - 0.04)

    this.scene._showFloat(player.x, player.y - 28, `-${amount}`, '#ff4444')
    s.cameras.main.shake(110, 0.014)
    s.cameras.main.flash(70, 255, 30, 30)

    s.tweens.add({
      targets: player, alpha: 0.15,
      duration: 70, repeat: 5, yoyo: true,
      onComplete: () => { if (player?.active) player.setAlpha(1) }
    })

    // Low HP warning
    if (GS.health <= 20 && !s._lowHpWarning) {
      s._lowHpWarning = s.add.text(
        s.scale.width / 2, s.scale.height / 2 - 20,
        '⚠ LOW HP ⚠', {
          fontFamily: '"Nunito", sans-serif',
          fontSize: `${Math.floor(s.scale.width / 22)}px`,
          color: '#ff0000',
        }
      ).setScrollFactor(0).setDepth(80).setOrigin(0.5)
      s.tweens.add({ targets: s._lowHpWarning, alpha: 0.1, duration: 280, yoyo: true, repeat: -1 })
    }
    if (GS.health > 20 && s._lowHpWarning) {
      s._lowHpWarning.destroy()
      s._lowHpWarning = null
    }

    // Death — restart current level (not from beginning)
    if (GS.health <= 0) {
      s._levelComplete = true
      s.cameras.main.shake(500, 0.04)

      const W2 = s.scale.width, H2 = s.scale.height
      const deathText = s.add.text(W2 / 2, H2 / 2, '💀 YOU FELL!', {
        fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W2 / 14)}px`,
        color: '#ff4444', stroke: '#000000', strokeThickness: 4,
      }).setScrollFactor(0).setDepth(100).setOrigin(0.5)

      const retryText = s.add.text(W2 / 2, H2 / 2 + 40, 'Retrying this year...', {
        fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W2 / 30)}px`,
        color: '#ffffff',
      }).setScrollFactor(0).setDepth(100).setOrigin(0.5).setAlpha(0)

      s.tweens.add({ targets: retryText, alpha: 1, delay: 600, duration: 400 })

      s.cameras.main.fadeOut(1800, 0, 0, 0)
      s.time.delayedCall(2200, () => {
        GS.health = Math.floor(GS.maxHealth * 0.6)  // Restore 60% health
        s.scene.start('GameScene', { year: s.year })
      })
    }
  }
}
