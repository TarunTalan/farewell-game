// ─────────────────────────────────────────────────────────────────────────────
// GameScene.js — Side-scrolling game (skeleton)
// Imports cleaned up — LabScene removed from flow
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'

const ZONE_WIDTH      = 2400
const WORLD_WIDTH     = ZONE_WIDTH * 4
const WORLD_HEIGHT    = 360
const GROUND_Y        = WORLD_HEIGHT - 48
const PLAYER_SPEED    = 200
const JUMP_VEL        = -420
const MAX_HEALTH      = 100
const DAMAGE_COOLDOWN = 1200

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  create() {
    const w = this.scale.width
    const h = this.scale.height

    // ── State reset ───────────────────────────────────────────────────────
    gameState.health        = MAX_HEALTH
    gameState.score         = 0
    gameState.currentZone   = 0
    gameState.powerupActive = false
    gameState.bossDefeated  = false
    this._lastDamageTime    = 0
    this._jumpCount         = 0
    this._bossSpawned       = false
    this._powerupSpawned    = false

    // ── Physics world ─────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.physics.world.gravity.y = 800

    // ── World ─────────────────────────────────────────────────────────────
    this._createBackgrounds()
    this._createGround()
    this._createPlayer()

    this.enemies     = this.physics.add.group()
    this.pickups     = this.physics.add.group()
    this.projectiles = this.physics.add.group()

    this._spawnZoneEnemies(0)

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(h / WORLD_HEIGHT)

    // ── Colliders ─────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.groundGroup)
    this.physics.add.collider(this.enemies, this.groundGroup)
    this.physics.add.overlap(this.player, this.enemies,     this._onPlayerHitEnemy, null, this)
    this.physics.add.overlap(this.player, this.pickups,     this._onPickup,         null, this)
    this.physics.add.overlap(this.player, this.projectiles, this._onProjectileHit,  null, this)

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors   = this.input.keyboard.createCursorKeys()
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.input.on('pointerdown', (ptr) => {
      if (ptr.x < this.scale.width / 2) this._tryJump()
      else this._tryAttack()
    })

    // ── Simple HUD ────────────────────────────────────────────────────────
    this._hudHealth = this.add.text(16, 16, 'HP: 100', {
      fontFamily: '"Press Start 2P"', fontSize: 8, fill: '#44ff88'
    }).setScrollFactor(0).setDepth(20)

    this._hudScore = this.add.text(16, 30, 'SCORE: 0', {
      fontFamily: '"Press Start 2P"', fontSize: 7, fill: '#aaaaff'
    }).setScrollFactor(0).setDepth(20)

    this._hudSenior = this.add.text(16, 44, 'SENIOR: ' + (gameState.selectedSenior || '???').toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: 6, fill: '#ffcc44'
    }).setScrollFactor(0).setDepth(20)

    this.add.text(20, WORLD_HEIGHT - 14, '← TAP LEFT: JUMP   TAP RIGHT: ATTACK ⚔', {
      fontFamily: '"Press Start 2P"', fontSize: 5, fill: '#334455'
    }).setScrollFactor(0).setDepth(10)
  }

  update(time) {
    if (!this.player?.active) return

    const onGround = this.player.body.blocked.down
    if (onGround) this._jumpCount = 0

    const speed = gameState.powerupActive ? PLAYER_SPEED * 1.6 : PLAYER_SPEED
    if (this.cursors.left.isDown) this.player.setVelocityX(-speed * 0.5)
    else this.player.setVelocityX(speed)

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) this._tryJump()

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this._tryAttack()

    const px   = this.player.x
    const zone = Math.min(3, Math.floor(px / ZONE_WIDTH))
    if (zone !== gameState.currentZone) {
      gameState.currentZone = zone
    }

    if (!this._bossSpawned && zone === 3 && px > ZONE_WIDTH * 3 + 160) {
      this._spawnBoss()
    }

    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      if (e.getData('isBoss')) this._updateBoss(e, time)
      else {
        const dx = this.player.x - e.x
        e.setVelocityX(dx > 0 ? 70 : -70)
      }
    })

    const distScore = Math.floor(px / 8)
    if (distScore > gameState.score) {
      gameState.score = distScore
      this._hudScore?.setText('SCORE: ' + gameState.score)
    }
  }

  _spawnZoneEnemies(zone) {
    const zx = ZONE_WIDTH * zone
    const configs = [
      [
        { x: zx + 500,  label: 'Lost Syllabus' },
        { x: zx + 900,  label: 'Ragging' },
        { x: zx + 1400, label: 'Dean Notice' },
        { x: zx + 700,  pickup: true },
      ],
      [
        { x: zx + 400,  label: 'Bug 🐛' },
        { x: zx + 800,  label: 'Seg Fault' },
        { x: zx + 1300, label: 'Compiler 💀' },
        { x: zx + 600,  pickup: true },
      ],
      [
        { x: zx + 400,  label: 'Deadline 📅' },
        { x: zx + 900,  label: 'No Wifi' },
        { x: zx + 1400, label: 'Backlog' },
        { x: zx + 700,  pickup: true },
      ],
      [],
    ]
    ;(configs[zone] || []).forEach(s => {
      if (s.pickup) this._spawnPickup(s.x, GROUND_Y - 24)
      else          this._spawnEnemy(s.x, GROUND_Y - 20, s.label)
    })
  }

  _spawnEnemy(x, y, label = 'Enemy') {
    const e = this.enemies.create(x, y, 'enemy')
    e.setCollideWorldBounds(false).setBounce(0).setData('hp', 3).setData('label', label)
    this.add.text(x, y - 26, label, { fontFamily: '"VT323"', fontSize: 13, fill: '#ff8888' }).setOrigin(0.5)
    return e
  }

  _spawnPickup(x, y) {
    const p = this.pickups.create(x, y, 'pickup')
    p.setCollideWorldBounds(false)
    p.body.allowGravity = false
    this.tweens.add({ targets: p, y: y - 12, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' })
    return p
  }

  _spawnBoss() {
    this._bossSpawned = true
    const bx  = ZONE_WIDTH * 3 + 500
    const boss = this.enemies.create(bx, GROUND_Y - 50, 'boss')
    boss.setCollideWorldBounds(true).setData('hp', 20).setData('maxHp', 20)
        .setData('isBoss', true).setData('phase', 1).setData('lastShot', 0).setScale(1.4)
    this.physics.add.collider(boss, this.groundGroup)

    this._bossHpBar = this.add.rectangle(this.scale.width / 2 - 119, 28, 238, 10, 0xff3030)
      .setScrollFactor(0).setDepth(20).setOrigin(0, 0.5)
    this.add.rectangle(this.scale.width / 2, 28, 240, 14, 0x1a1a3a)
      .setScrollFactor(0).setDepth(19)
    this.add.text(this.scale.width / 2, 14, '⚠ PLACEMENTS ⚠', {
      fontFamily: '"Press Start 2P"', fontSize: 7, fill: '#ff5050'
    }).setScrollFactor(0).setDepth(20).setOrigin(0.5)
  }

  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const maxHp = boss.getData('maxHp')
    const phase = hp > maxHp * 0.6 ? 1 : hp > maxHp * 0.3 ? 2 : 3
    boss.setData('phase', phase)
    if (this._bossHpBar) this._bossHpBar.width = Math.max(0, (hp / maxHp) * 238)
    const speed = [0, 55, 90, 130][phase]
    const dx    = this.player.x - boss.x
    if (Math.abs(dx) > 100) boss.setVelocityX(dx > 0 ? speed : -speed)
    else boss.setVelocityX(0)
    const interval = [0, 3200, 2000, 1100][phase]
    if (time - boss.getData('lastShot') > interval) {
      boss.setData('lastShot', time)
      this._bossShoot(boss)
    }
  }

  _bossShoot(boss) {
    const dx   = this.player.x - boss.x
    const proj = this.projectiles.create(boss.x, boss.y - 20, 'projectile')
    proj.setVelocityX(dx > 0 ? 260 : -260).setVelocityY(-40)
    proj.body.allowGravity = false
    this.time.delayedCall(3500, () => { if (proj.active) proj.destroy() })
  }

  _tryJump() {
    if (this._jumpCount >= 2) return
    this.player.setVelocityY(JUMP_VEL)
    this._jumpCount++
  }

  _tryAttack() {
    const RANGE = 90
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
      if (dist < RANGE) {
        const dmg = gameState.powerupActive ? 2 : 1
        const hp  = e.getData('hp') - dmg
        e.setData('hp', hp)
        const hit = this.add.text(e.x, e.y - 30, `-${dmg}`, {
          fontFamily: '"Press Start 2P"', fontSize: 8, fill: '#ff5050'
        }).setOrigin(0.5)
        this.tweens.add({ targets: hit, y: e.y - 60, alpha: 0, duration: 600, onComplete: () => hit.destroy() })
        if (hp <= 0) this._killEnemy(e)
      }
    })
  }

  _killEnemy(e) {
    const isBoss = e.getData('isBoss')
    for (let i = 0; i < 6; i++) {
      const px = e.x + Phaser.Math.Between(-20, 20)
      const py = e.y + Phaser.Math.Between(-20, 20)
      const dot = this.add.circle(px, py, 4, 0xf0c040)
      this.tweens.add({ targets: dot, x: px + Phaser.Math.Between(-40, 40), y: py - Phaser.Math.Between(20, 60), alpha: 0, duration: 500, onComplete: () => dot.destroy() })
    }
    if (isBoss) {
      this._bossHpBar?.destroy()
      this.cameras.main.shake(400, 0.022)
      this.cameras.main.flash(600, 255, 200, 50)
      this.enemies.clear(true, true)
      gameState.bossDefeated = true
      this.add.text(this.scale.width / 2, this.scale.height / 2, 'YOU WIN!', {
        fontFamily: '"Press Start 2P"', fontSize: 20, fill: '#ffcc00'
      }).setScrollFactor(0).setDepth(99).setOrigin(0.5)
    } else {
      e.destroy()
      gameState.score += 50
      this._hudScore?.setText('SCORE: ' + gameState.score)
    }
  }

  _onPlayerHitEnemy(player, enemy) {
    if (enemy.getData('isBoss')) return
    const now = this.time.now
    if (now - this._lastDamageTime < DAMAGE_COOLDOWN) return
    this._lastDamageTime = now
    this._takeDamage(12)
    const dir = player.x < enemy.x ? -1 : 1
    player.setVelocityX(dir * 280).setVelocityY(-180)
  }

  _onPickup(player, pickup) {
    pickup.destroy()
    gameState.health = Math.min(MAX_HEALTH, gameState.health + 20)
    this._hudHealth?.setText('HP: ' + gameState.health)
    gameState.score += 100
    this._hudScore?.setText('SCORE: ' + gameState.score)
    const t = this.add.text(player.x, player.y - 40, '+20 HP', {
      fontFamily: '"VT323"', fontSize: 18, fill: '#50d090'
    }).setOrigin(0.5)
    this.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  _onProjectileHit(player, proj) {
    const now = this.time.now
    if (now - this._lastDamageTime < DAMAGE_COOLDOWN) return
    if (gameState.powerupActive) { proj.destroy(); return }
    this._lastDamageTime = now
    proj.destroy()
    this._takeDamage(15)
  }

  _takeDamage(amount) {
    gameState.health = Math.max(1, gameState.health - amount)
    this._hudHealth?.setText('HP: ' + gameState.health)
    this.cameras.main.shake(180, 0.012)
    this.cameras.main.flash(120, 255, 30, 30)
    this.tweens.add({ targets: this.player, alpha: 0, duration: 80, repeat: 5, yoyo: true, onComplete: () => this.player.setAlpha(1) })
  }

  _createGround() {
    this.groundGroup = this.physics.add.staticGroup()
    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      this.groundGroup.create(x + 16, GROUND_Y + 16, 'ground').refreshBody()
    }
    const platforms = [
      { x: 500, y: GROUND_Y - 80 }, { x: 900, y: GROUND_Y - 130 },
      { x: 1400, y: GROUND_Y - 90 }, { x: 1900, y: GROUND_Y - 110 },
      { x: ZONE_WIDTH + 450, y: GROUND_Y - 100 }, { x: ZONE_WIDTH + 1000, y: GROUND_Y - 140 },
      { x: ZONE_WIDTH * 2 + 400, y: GROUND_Y - 120 }, { x: ZONE_WIDTH * 3 + 280, y: GROUND_Y - 110 },
    ]
    platforms.forEach(p => this.groundGroup.create(p.x, p.y, 'platform').refreshBody())
  }

  _createBackgrounds() {
    const colors = [0x0a0a2a, 0x0a1a1a, 0x1a0a0a, 0x1a0000]
    colors.forEach((c, i) => {
      this.add.rectangle(ZONE_WIDTH * i + ZONE_WIDTH / 2, WORLD_HEIGHT / 2, ZONE_WIDTH, WORLD_HEIGHT, c).setDepth(-2)
    })
    for (let z = 0; z < 4; z++) {
      this.add.tileSprite(ZONE_WIDTH * z + ZONE_WIDTH / 2, WORLD_HEIGHT / 2, ZONE_WIDTH, WORLD_HEIGHT, `bg_${z}`)
        .setScrollFactor(0.15).setDepth(-1).setAlpha(0.7)
    }
    const zoneLabels = ['YEAR 1 — Confusion Zone', 'YEAR 2 — Lab Survival', 'YEAR 3 — Project Panic', 'YEAR 4 — Placement Hell']
    zoneLabels.forEach((name, i) => {
      this.add.text(ZONE_WIDTH * i + 40, 20, name, {
        fontFamily: '"Press Start 2P"', fontSize: 7, fill: '#ffffff', alpha: 0.25,
      }).setDepth(0)
    })
  }

  _createPlayer() {
    this.player = this.physics.add.image(100, GROUND_Y - 40, 'player')
    this.player.setCollideWorldBounds(true).setBounce(0.05).setDragX(600)
      .setMaxVelocity(400, 700).setDepth(5)
  }
}