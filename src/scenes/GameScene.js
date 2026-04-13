// ─────────────────────────────────────────────────────────────────────────────
// GameScene.js — The main continuous side-scrolling game
// ─────────────────────────────────────────────────────────────────────────────
import { gameState }       from '../data/GameState.js'
import { DialogueSystem }  from '../systems/DialogueSystem.js'
import { PowerupSystem }   from '../systems/PowerupSystem.js'
import { HUD }             from '../systems/HUD.js'
import { VideoSystem }     from '../systems/VideoSystem.js'

const ZONE_WIDTH      = 2400   // pixels per zone
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

    // ── Reset state ───────────────────────────────────────────────────────
    gameState.health       = MAX_HEALTH
    gameState.score        = 0
    gameState.currentZone  = 0
    gameState.powerupActive = false
    gameState.powerupUsed  = false
    gameState.bossDefeated = false
    this._lastDamageTime   = 0
    this._jumpCount        = 0
    this._powerupSpawned   = false
    this._bossSpawned      = false
    this._dialoguePlaying  = false

    // ── Systems ───────────────────────────────────────────────────────────
    this.dialogueSys = new DialogueSystem(gameState)
    this.powerupSys  = new PowerupSystem(gameState)
    this.hud         = new HUD(gameState)
    this.videoSys    = new VideoSystem()
    // Set your video — uncomment one:
    // this.videoSys.setYouTube('YOUR_YOUTUBE_VIDEO_ID')
    // this.videoSys.setLocal('/videos/farewell.mp4')

    this.hud.show()
    this.hud.setZone(0)
    this.hud.setHealth(MAX_HEALTH, MAX_HEALTH)
    this.hud.setScore(0)

    // ── Physics world bounds ──────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.physics.world.gravity.y = 800

    // ── Build world ───────────────────────────────────────────────────────
    this._createBackgrounds()
    this._createGround()
    this._createPlayer()

    // ── Enemy / pickup groups ─────────────────────────────────────────────
    this.enemies     = this.physics.add.group()
    this.pickups     = this.physics.add.group()
    this.projectiles = this.physics.add.group()

    this._spawnZoneEnemies(0)

    // ── Camera — follows player, fits world height to screen ──────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    // Zoom so the world height fills the screen
    this.cameras.main.setZoom(h / WORLD_HEIGHT)

    // ── Colliders ─────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.groundGroup)
    this.physics.add.collider(this.enemies, this.groundGroup)
    this.physics.add.overlap(
      this.player, this.enemies,
      this._onPlayerHitEnemy, null, this
    )
    this.physics.add.overlap(
      this.player, this.pickups,
      this._onPickup, null, this
    )
    this.physics.add.overlap(
      this.player, this.projectiles,
      this._onProjectileHit, null, this
    )

    // ── Keyboard input ────────────────────────────────────────────────────
    this.cursors   = this.input.keyboard.createCursorKeys()
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // ── Touch input — left half = jump, right half = attack ───────────────
    this.input.on('pointerdown', (ptr) => {
      if (this._dialoguePlaying) return
      if (ptr.x < this.scale.width / 2) this._tryJump()
      else this._tryAttack()
    })

    // ── On-screen control hints ───────────────────────────────────────────
    this.add.text(20, WORLD_HEIGHT - 20, '← TAP LEFT: JUMP', {
      fontFamily: '"Press Start 2P"', fontSize: 6,
      fill: '#ffffff', alpha: 0.4
    }).setScrollFactor(0).setDepth(10)

    this.add.text(WORLD_WIDTH - 20, WORLD_HEIGHT - 20, 'TAP RIGHT: ATTACK ⚔', {
      fontFamily: '"Press Start 2P"', fontSize: 6,
      fill: '#ffffff', alpha: 0.4
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(10)
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  update(time) {
    if (this._dialoguePlaying || !this.player?.active) return

    const onGround = this.player.body.blocked.down
    if (onGround) this._jumpCount = 0

    // Auto-run right; left arrow lets player move back slightly to dodge
    const speed = gameState.powerupActive ? PLAYER_SPEED * 1.6 : PLAYER_SPEED
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed * 0.5)
    } else {
      this.player.setVelocityX(speed)
    }

    // Keyboard jump
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey)
    ) this._tryJump()

    // Keyboard attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this._tryAttack()

    // ── Zone transition ───────────────────────────────────────────────────
    const px   = this.player.x
    const zone = Math.min(3, Math.floor(px / ZONE_WIDTH))
    if (zone !== gameState.currentZone) this._enterZone(zone)

    // ── Power-up orb spawns mid-zone-1 ───────────────────────────────────
    if (!this._powerupSpawned && px > ZONE_WIDTH * 1.15) {
      this._spawnPowerupOrb()
    }

    // ── Boss spawns at start of zone-3 ───────────────────────────────────
    if (!this._bossSpawned && zone === 3 && px > ZONE_WIDTH * 3 + 160) {
      this._spawnBoss()
    }

    // ── Enemy AI ──────────────────────────────────────────────────────────
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      if (e.getData('isBoss')) {
        this._updateBoss(e, time)
      } else {
        // Walk toward player
        const dx = this.player.x - e.x
        e.setVelocityX(dx > 0 ? 70 : -70)
      }
    })

    // ── Score based on distance ───────────────────────────────────────────
    const distScore = Math.floor(px / 8)
    if (distScore > gameState.score) {
      gameState.score = distScore
      this.hud.setScore(gameState.score)
    }
  }

  // ── Zone management ───────────────────────────────────────────────────────

  _enterZone(zone) {
    gameState.currentZone = zone
    this.hud.setZone(zone)
    this._spawnZoneEnemies(zone)

    const scripts = { 1: 'zone2_start', 2: 'zone3_start', 3: 'boss_intro' }
    if (scripts[zone]) {
      this._dialoguePlaying = true
      this.player.setVelocityX(0)
      this.dialogueSys.play(scripts[zone], () => {
        this._dialoguePlaying = false
      })
    }
  }

  _spawnZoneEnemies(zone) {
    const zx = ZONE_WIDTH * zone
    const configs = [
      [
        { x: zx + 500,  label: 'Lost Syllabus' },
        { x: zx + 900,  label: 'Ragging' },
        { x: zx + 1400, label: 'Dean Notice' },
        { x: zx + 1900, label: 'Wrong Branch' },
        { x: zx + 700,  pickup: true },
        { x: zx + 1600, pickup: true },
      ],
      [
        { x: zx + 400,  label: 'Bug 🐛' },
        { x: zx + 800,  label: 'Seg Fault' },
        { x: zx + 1300, label: 'Compiler 💀' },
        { x: zx + 1800, label: 'Viva Surprise' },
        { x: zx + 600,  pickup: true },
        { x: zx + 1500, pickup: true },
      ],
      [
        { x: zx + 400,  label: 'Deadline 📅' },
        { x: zx + 900,  label: 'No Wifi' },
        { x: zx + 1400, label: 'Backlog' },
        { x: zx + 1900, label: 'Internship Form' },
        { x: zx + 700,  pickup: true },
        { x: zx + 1600, pickup: true },
      ],
      [],  // boss zone — handled separately
    ]

    ;(configs[zone] || []).forEach(s => {
      if (s.pickup) this._spawnPickup(s.x, GROUND_Y - 24)
      else          this._spawnEnemy(s.x,  GROUND_Y - 20, s.label)
    })
  }

  // ── Spawning ──────────────────────────────────────────────────────────────

  _spawnEnemy(x, y, label = 'Enemy') {
    const e = this.enemies.create(x, y, 'enemy')
    e.setCollideWorldBounds(false)
    e.setBounce(0)
    e.setData('hp', 3)
    e.setData('label', label)
    this.add.text(x, y - 26, label, {
      fontFamily: '"VT323"', fontSize: 13, fill: '#ff8888'
    }).setOrigin(0.5).setName(`lbl_${x}`)
    return e
  }

  _spawnPickup(x, y) {
    const p = this.pickups.create(x, y, 'pickup')
    p.setCollideWorldBounds(false)
    p.body.allowGravity = false
    this.tweens.add({
      targets: p, y: y - 12,
      yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut'
    })
    return p
  }

  _spawnPowerupOrb() {
    this._powerupSpawned = true
    const x = ZONE_WIDTH * 1.4
    const orb = this.physics.add.image(x, GROUND_Y - 40, 'powerup_orb')
    orb.body.allowGravity = false
    this.tweens.add({
      targets: orb, y: GROUND_Y - 60,
      yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut'
    })
    // Glow pulse
    this.tweens.add({
      targets: orb, alpha: 0.6,
      yoyo: true, repeat: -1, duration: 500
    })
    this.physics.add.overlap(this.player, orb, () => {
      if (gameState.powerupUsed) return
      gameState.powerupUsed = true
      orb.destroy()
      this._dialoguePlaying = true
      this.player.setVelocityX(0)
      this.dialogueSys.play('powerup_summon', () => {
        this.powerupSys.trigger(() => {
          this._dialoguePlaying = false
        })
      })
    })
  }

  _spawnBoss() {
    this._bossSpawned = true
    const bx = ZONE_WIDTH * 3 + 500

    const boss = this.enemies.create(bx, GROUND_Y - 50, 'boss')
    boss.setCollideWorldBounds(true)
    boss.setData('hp', 20)
    boss.setData('maxHp', 20)
    boss.setData('isBoss', true)
    boss.setData('phase', 1)
    boss.setData('lastShot', 0)
    boss.setScale(1.4)

    // Boss HP bar elements (fixed to camera)
    this._bossHpBg = this.add.rectangle(
      this.scale.width / 2, 28, 240, 14, 0x1a1a3a
    ).setScrollFactor(0).setDepth(20)
    this._bossHpBar = this.add.rectangle(
      this.scale.width / 2 - 119, 28, 238, 10, 0xff3030
    ).setScrollFactor(0).setDepth(20).setOrigin(0, 0.5)
    this._bossLabel = this.add.text(
      this.scale.width / 2, 14,
      '⚠ PLACEMENTS ⚠',
      { fontFamily: '"Press Start 2P"', fontSize: 7, fill: '#ff5050' }
    ).setScrollFactor(0).setDepth(20).setOrigin(0.5)

    this.physics.add.collider(boss, this.groundGroup)
  }

  // ── Boss AI ───────────────────────────────────────────────────────────────

  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const maxHp = boss.getData('maxHp')
    const phase = hp > maxHp * 0.6 ? 1 : hp > maxHp * 0.3 ? 2 : 3
    boss.setData('phase', phase)

    if (this._bossHpBar) {
      this._bossHpBar.width = Math.max(0, (hp / maxHp) * 238)
    }

    const speed = [0, 55, 90, 130][phase]
    const dx    = this.player.x - boss.x
    if (Math.abs(dx) > 100) boss.setVelocityX(dx > 0 ? speed : -speed)
    else boss.setVelocityX(0)

    const interval = [0, 3200, 2000, 1100][phase]
    if (time - boss.getData('lastShot') > interval) {
      boss.setData('lastShot', time)
      this._bossShoot(boss)
    }

    if (phase >= 2 && boss.body.blocked.down && Math.random() < 0.003) {
      boss.setVelocityY(JUMP_VEL * 0.75)
    }
  }

  _bossShoot(boss) {
    const dx   = this.player.x - boss.x
    const proj = this.projectiles.create(boss.x, boss.y - 20, 'projectile')
    proj.setVelocityX(dx > 0 ? 260 : -260)
    proj.setVelocityY(-40)
    proj.body.allowGravity = false
    this.time.delayedCall(3500, () => { if (proj.active) proj.destroy() })
  }

  // ── Player actions ────────────────────────────────────────────────────────

  _tryJump() {
    if (this._jumpCount >= 2) return
    this.player.setVelocityY(JUMP_VEL)
    this._jumpCount++
    this.tweens.add({
      targets: this.player,
      scaleX: 0.8, scaleY: 1.25,
      duration: 70, yoyo: true
    })
  }

  _tryAttack() {
    // Flash white briefly
    this.tweens.add({
      targets: this.player,
      alpha: 0.4, duration: 60, yoyo: true
    })

    const RANGE = 90
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, e.x, e.y
      )
      if (dist < RANGE) {
        const dmg = gameState.powerupActive ? 2 : 1
        const hp  = e.getData('hp') - dmg
        e.setData('hp', hp)
        this.tweens.add({ targets: e, alpha: 0.1, duration: 60, yoyo: true })
        // Floating damage text
        const hit = this.add.text(e.x, e.y - 30, `-${dmg}`, {
          fontFamily: '"Press Start 2P"', fontSize: 8, fill: '#ff5050'
        }).setOrigin(0.5)
        this.tweens.add({
          targets: hit, y: e.y - 60, alpha: 0,
          duration: 600, onComplete: () => hit.destroy()
        })
        if (hp <= 0) this._killEnemy(e)
      }
    })
  }

  _killEnemy(e) {
    const isBoss = e.getData('isBoss')
    // Burst particles
    for (let i = 0; i < 6; i++) {
      const px = e.x + Phaser.Math.Between(-20, 20)
      const py = e.y + Phaser.Math.Between(-20, 20)
      const dot = this.add.circle(px, py, 4, 0xf0c040)
      this.tweens.add({
        targets: dot,
        x: px + Phaser.Math.Between(-40, 40),
        y: py - Phaser.Math.Between(20, 60),
        alpha: 0, duration: 500,
        onComplete: () => dot.destroy()
      })
    }
    if (isBoss) {
      this._onBossDefeated()
    } else {
      e.destroy()
      gameState.score += 50
      this.hud.setScore(gameState.score)
    }
  }

  // ── Collision callbacks ───────────────────────────────────────────────────

  _onPlayerHitEnemy(player, enemy) {
    if (enemy.getData('isBoss')) return
    const now = this.time.now
    if (now - this._lastDamageTime < DAMAGE_COOLDOWN) return
    this._lastDamageTime = now
    this._takeDamage(12)
    const dir = player.x < enemy.x ? -1 : 1
    player.setVelocityX(dir * 280)
    player.setVelocityY(-180)
  }

  _onPickup(player, pickup) {
    pickup.destroy()
    gameState.health = Math.min(MAX_HEALTH, gameState.health + 20)
    this.hud.setHealth(gameState.health, MAX_HEALTH)
    gameState.score += 100
    this.hud.setScore(gameState.score)
    const t = this.add.text(player.x, player.y - 40, '+20 HP', {
      fontFamily: '"VT323"', fontSize: 18, fill: '#50d090'
    }).setOrigin(0.5)
    this.tweens.add({
      targets: t, y: player.y - 80, alpha: 0,
      duration: 800, onComplete: () => t.destroy()
    })
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
    this.hud.setHealth(gameState.health, MAX_HEALTH)
    this.cameras.main.shake(180, 0.012)
    this.cameras.main.flash(120, 255, 30, 30)
    this.tweens.add({
      targets: this.player,
      alpha: 0, duration: 80,
      repeat: 5, yoyo: true,
      onComplete: () => this.player.setAlpha(1)
    })
  }

  // ── Boss defeated ──────────────────────────────────────────────────────────

  _onBossDefeated() {
    gameState.bossDefeated = true
    this._dialoguePlaying  = true

    this._bossHpBg?.destroy()
    this._bossHpBar?.destroy()
    this._bossLabel?.destroy()

    this.cameras.main.shake(400, 0.022)
    this.cameras.main.flash(600, 255, 200, 50)
    this.enemies.clear(true, true)

    this.time.delayedCall(900, () => {
      this.dialogueSys.play('boss_defeated', () => {
        this.dialogueSys.play('final_arrival', () => {
          this.hud.hide()
          this.videoSys.play(() => {})
        })
      })
    })
  }

  // ── World builders ────────────────────────────────────────────────────────

  _createGround() {
    this.groundGroup = this.physics.add.staticGroup()

    // Continuous ground floor
    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      this.groundGroup.create(x + 16, GROUND_Y + 16, 'ground').refreshBody()
    }

    // Platforms spread across zones
    const platforms = [
      { x: 500,  y: GROUND_Y - 80  },
      { x: 900,  y: GROUND_Y - 130 },
      { x: 1400, y: GROUND_Y - 90  },
      { x: 1900, y: GROUND_Y - 110 },
      { x: ZONE_WIDTH + 450,  y: GROUND_Y - 100 },
      { x: ZONE_WIDTH + 1000, y: GROUND_Y - 140 },
      { x: ZONE_WIDTH + 1700, y: GROUND_Y - 90  },
      { x: ZONE_WIDTH*2 + 400,  y: GROUND_Y - 120 },
      { x: ZONE_WIDTH*2 + 1000, y: GROUND_Y - 80  },
      { x: ZONE_WIDTH*2 + 1700, y: GROUND_Y - 150 },
      { x: ZONE_WIDTH*3 + 280, y: GROUND_Y - 110  },
    ]
    platforms.forEach(p => {
      this.groundGroup.create(p.x, p.y, 'platform').refreshBody()
    })
  }

  _createBackgrounds() {
    // One background rect per zone, colour-coded
    const colors = [0x0a0a2a, 0x0a1a1a, 0x1a0a0a, 0x1a0000]
    colors.forEach((c, i) => {
      this.add.rectangle(
        ZONE_WIDTH * i + ZONE_WIDTH / 2,
        WORLD_HEIGHT / 2,
        ZONE_WIDTH,
        WORLD_HEIGHT,
        c
      ).setDepth(-2)
    })

    // Use the pre-generated background textures as a slow parallax layer
    for (let z = 0; z < 4; z++) {
      this.add.tileSprite(
        ZONE_WIDTH * z + ZONE_WIDTH / 2,
        WORLD_HEIGHT / 2,
        ZONE_WIDTH,
        WORLD_HEIGHT,
        `bg_${z}`
      ).setScrollFactor(0.15).setDepth(-1).setAlpha(0.7)
    }

    // Zone name labels at start of each zone
    const zoneLabels = [
      'YEAR 1 — Confusion Zone',
      'YEAR 2 — Lab Survival',
      'YEAR 3 — Project Panic',
      'YEAR 4 — Placement Hell',
    ]
    zoneLabels.forEach((name, i) => {
      this.add.text(ZONE_WIDTH * i + 40, 20, name, {
        fontFamily: '"Press Start 2P"',
        fontSize: 7,
        fill: '#ffffff',
        alpha: 0.25,
      }).setDepth(0)
    })
  }

_createPlayer() {
  this.player = this.physics.add.image(100, GROUND_Y - 40, 'player')
  this.player.setCollideWorldBounds(true)
  this.player.setBounce(0.05)
  this.player.setDragX(600)
  this.player.setMaxVelocity(400, 700) // ✅ fixed
  this.player.setDepth(5)
}
}