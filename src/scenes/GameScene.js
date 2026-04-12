// ─────────────────────────────────────────────────────────────────────────────
// GameScene.js — The main continuous side-scrolling game
//
// Zones:   0 = Year 1 (Confusion),  1 = Year 2 (Lab Survival),
//          2 = Year 3 (Project Panic), 3 = Year 4 (Placement Boss)
//
// World layout:
//   Each zone is ZONE_WIDTH pixels wide.
//   Zone 3 (boss) is shorter — the boss takes center stage.
//
// Controls:
//   Tap / Space / ArrowUp → Jump (double-jump allowed)
//   Tap attack button / Z  → Attack (damages nearby enemies)
// ─────────────────────────────────────────────────────────────────────────────
import { gameState }       from '../data/GameState.js'
import { DialogueSystem }  from '../systems/DialogueSystem.js'
import { PowerupSystem }   from '../systems/PowerupSystem.js'
import { HUD }             from '../systems/HUD.js'
import { VideoSystem }     from '../systems/VideoSystem.js'

const ZONE_WIDTH   = 3200   // pixels per zone
const WORLD_WIDTH  = ZONE_WIDTH * 4
const WORLD_HEIGHT = 480
const GROUND_Y     = WORLD_HEIGHT - 48
const PLAYER_SPEED = 220
const JUMP_VEL     = -480
const MAX_HEALTH   = 100
const DAMAGE_COOLDOWN = 1200  // ms invincible after hit

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────

  create() {
    const w = this.scale.width, h = this.scale.height
    this.worldH = WORLD_HEIGHT
    this.worldW = WORLD_WIDTH

    // State
    gameState.health      = MAX_HEALTH
    gameState.score       = 0
    gameState.currentZone = 0
    this._lastDamageTime  = 0
    this._jumpCount       = 0
    this._powerupSpawned  = false
    this._bossSpawned     = false
    this._dialoguePlaying = false

    // Systems
    this.dialogueSys = new DialogueSystem(gameState)
    this.powerupSys  = new PowerupSystem(gameState)
    this.hud         = new HUD(gameState)
    this.videoSys    = new VideoSystem()
    // ← Set your video here:
    // this.videoSys.setYouTube('YOUR_YOUTUBE_ID')
    // this.videoSys.setLocal('/videos/farewell.mp4')

    this.hud.show()
    this.hud.setZone(0)
    this.hud.setHealth(MAX_HEALTH, MAX_HEALTH)

    // Physics world
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // ── Tilemapped ground ─────────────────────────────────────────────────
    this._createGround()

    // ── Backgrounds (tiled per zone) ──────────────────────────────────────
    this._createBackgrounds()

    // ── Player ────────────────────────────────────────────────────────────
    this._createPlayer()

    // ── Enemy groups ──────────────────────────────────────────────────────
    this.enemies    = this.physics.add.group()
    this.pickups    = this.physics.add.group()
    this.projectiles = this.physics.add.group()

    this._spawnZoneEnemies(0)

    // ── Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(h / WORLD_HEIGHT)

    // ── Colliders ─────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.groundGroup)
    this.physics.add.collider(this.enemies, this.groundGroup)

    this.physics.add.overlap(this.player, this.enemies, this._onPlayerHitEnemy, null, this)
    this.physics.add.overlap(this.player, this.pickups, this._onPickup, null, this)
    this.physics.add.overlap(this.player, this.projectiles, this._onProjectileHit, null, this)

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys()
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Touch: tap left side = jump, tap right side = attack
    this.input.on('pointerdown', (ptr) => {
      if (this._dialoguePlaying) return
      if (ptr.x < this.scale.width / 2) this._tryJump()
      else                              this._tryAttack()
    })

    // ── Touch HUD buttons ─────────────────────────────────────────────────
    this._createTouchControls()

    // ── Parallax stars ────────────────────────────────────────────────────
    this._createParallaxStars()

    // ── Zone transition tracker ───────────────────────────────────────────
    this._zoneCheckpoints = [0, ZONE_WIDTH, ZONE_WIDTH*2, ZONE_WIDTH*3]
  }

  update(time, delta) {
    if (this._dialoguePlaying || !this.player?.active) return

    // ── Player movement ───────────────────────────────────────────────────
    const onGround = this.player.body.blocked.down

    if (onGround) this._jumpCount = 0

    const left  = this.cursors.left.isDown
    const right = this.cursors.right.isDown || true  // always run right
    const speed = gameState.powerupActive ? PLAYER_SPEED * 1.5 : PLAYER_SPEED

    // Auto-run right, allow some left movement for dodging
    if (left)       this.player.setVelocityX(-speed * 0.5)
    else            this.player.setVelocityX(speed)

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this._tryJump()
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this._tryAttack()

    // ── Zone detection ────────────────────────────────────────────────────
    const px = this.player.x
    const zone = Math.min(3, Math.floor(px / ZONE_WIDTH))
    if (zone !== gameState.currentZone) {
      this._enterZone(zone)
    }

    // ── Powerup orb spawn (after zone 1 boss, before zone 2) ─────────────
    if (!this._powerupSpawned && px > ZONE_WIDTH * 1.2) {
      this._spawnPowerupOrb()
    }

    // ── Boss spawn ────────────────────────────────────────────────────────
    if (!this._bossSpawned && zone === 3 && px > ZONE_WIDTH * 3 + 200) {
      this._spawnBoss()
    }

    // ── Enemy behavior ────────────────────────────────────────────────────
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      if (e.getData('isBoss')) {
        this._updateBoss(e, time)
      } else {
        // Simple enemies walk toward player (or pace)
        const dx = this.player.x - e.x
        e.setVelocityX(dx > 0 ? 80 : -80)
      }
    })

    // ── Score: distance-based ─────────────────────────────────────────────
    const newScore = Math.floor(px / 10) + (gameState.score - Math.floor(px / 10))
    gameState.score = Math.max(gameState.score, Math.floor(px / 10))
    this.hud.setScore(gameState.score)

    // ── Parallax ──────────────────────────────────────────────────────────
    if (this._stars) {
      this._stars.forEach(s => {
        s.setTilePosition(this.cameras.main.scrollX * s.getData('speed'), 0)
      })
    }
  }

  // ── Zone management ───────────────────────────────────────────────────────

  _enterZone(zone) {
    gameState.currentZone = zone
    this.hud.setZone(zone)
    this._spawnZoneEnemies(zone)

    if (zone === 1) {
      this._dialoguePlaying = true
      this.dialogueSys.play('zone2_start', () => { this._dialoguePlaying = false })
    }
    if (zone === 2) {
      this._dialoguePlaying = true
      this.dialogueSys.play('zone3_start', () => { this._dialoguePlaying = false })
      this.player.setVelocityX(0)
    }
    if (zone === 3) {
      this._dialoguePlaying = true
      this.player.setVelocityX(0)
      this.dialogueSys.play('boss_intro', () => { this._dialoguePlaying = false })
    }
  }

  _spawnZoneEnemies(zone) {
    const configs = [
      // Zone 0: lost assignment sheets + confused seniors
      [
        { x: 800,  type: 'enemy', label: 'Lost Syllabus' },
        { x: 1200, type: 'enemy', label: 'Ragging' },
        { x: 1800, type: 'enemy', label: 'Dean Notice' },
        { x: 2400, type: 'enemy', label: 'Wrong Branch' },
        { x: 2800, type: 'pickup' },
      ],
      // Zone 1: bugs + broken compilers
      [
        { x: ZONE_WIDTH + 400,  type: 'enemy', label: 'Bug' },
        { x: ZONE_WIDTH + 800,  type: 'enemy', label: 'Seg Fault' },
        { x: ZONE_WIDTH + 1400, type: 'enemy', label: 'Compiler' },
        { x: ZONE_WIDTH + 2000, type: 'enemy', label: 'Viva' },
        { x: ZONE_WIDTH + 2600, type: 'pickup' },
      ],
      // Zone 2: deadlines + project pressure
      [
        { x: ZONE_WIDTH*2 + 400,  type: 'enemy', label: 'Deadline' },
        { x: ZONE_WIDTH*2 + 900,  type: 'enemy', label: 'No Wifi' },
        { x: ZONE_WIDTH*2 + 1500, type: 'enemy', label: 'Internship' },
        { x: ZONE_WIDTH*2 + 2000, type: 'enemy', label: 'Backlog' },
        { x: ZONE_WIDTH*2 + 2500, type: 'pickup' },
      ],
      // Zone 3: handled separately via _spawnBoss
      [],
    ]

    const spawns = configs[zone] || []
    spawns.forEach(s => {
      if (s.type === 'pickup') {
        this._spawnPickup(s.x, GROUND_Y - 20)
      } else {
        this._spawnEnemy(s.x, GROUND_Y - 16, s.label)
      }
    })
  }

  // ── Entity spawning ───────────────────────────────────────────────────────

  _spawnEnemy(x, y, label = 'Enemy') {
    const e = this.enemies.create(x, y, 'enemy')
    e.setCollideWorldBounds(false)
    e.setBounce(0)
    e.setData('hp', 3)
    e.setData('label', label)
    // Label above enemy
    this.add.text(x, y - 28, label, {
      fontFamily: '"VT323"', fontSize: 14, fill: '#ff8080'
    }).setName(`label_${x}`)
    return e
  }

  _spawnPickup(x, y) {
    const p = this.pickups.create(x, y, 'pickup')
    p.setCollideWorldBounds(false)
    this.tweens.add({
      targets: p, y: y - 10, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut'
    })
    return p
  }

  _spawnPowerupOrb() {
    this._powerupSpawned = true
    const x = ZONE_WIDTH * 1.5
    const orb = this.physics.add.image(x, GROUND_Y - 30, 'powerup_orb')
    orb.setImmovable(true)
    this.tweens.add({
      targets: orb, y: GROUND_Y - 50, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut'
    })
    this.physics.add.overlap(this.player, orb, () => {
      if (gameState.powerupUsed) return
      gameState.powerupUsed = true
      orb.destroy()
      this.player.setVelocityX(0)
      this._dialoguePlaying = true
      this.dialogueSys.play('powerup_summon', () => {
        this.powerupSys.trigger(() => {
          this._dialoguePlaying = false
        })
      })
    })
  }

  _spawnBoss() {
    this._bossSpawned = true
    const bossX = ZONE_WIDTH * 3 + 600

    const boss = this.enemies.create(bossX, GROUND_Y - 40, 'boss')
    boss.setCollideWorldBounds(true)
    boss.setData('hp', 20)
    boss.setData('maxHp', 20)
    boss.setData('isBoss', true)
    boss.setData('phase', 1)
    boss.setData('lastShot', 0)
    boss.setData('label', 'PLACEMENTS')
    boss.setScale(1.5)

    // Boss health bar
    this._bossHpBg = this.add.rectangle(
      this.scale.width / 2, 40, 260, 18, 0x1a1a3a
    ).setScrollFactor(0)
    this._bossHpBar = this.add.rectangle(
      this.scale.width / 2 - 130 + 1, 40, 258, 14, 0xff3030
    ).setScrollFactor(0).setOrigin(0, 0.5)
    this._bossLabel = this.add.text(
      this.scale.width / 2, 22, '⚠ PLACEMENTS ⚠', {
        fontFamily: '"Press Start 2P"', fontSize: 9, fill: '#ff5050'
      }
    ).setScrollFactor(0).setOrigin(0.5)

    this.physics.add.collider(boss, this.groundGroup)
    return boss
  }

  // ── Boss AI ───────────────────────────────────────────────────────────────

  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const maxHp = boss.getData('maxHp')
    const phase = hp > maxHp * 0.6 ? 1 : hp > maxHp * 0.3 ? 2 : 3
    boss.setData('phase', phase)

    // Update boss HP bar
    if (this._bossHpBar) {
      this._bossHpBar.width = Math.max(0, (hp / maxHp) * 258)
    }

    // Movement: pace back and forth, faster in later phases
    const speed = [0, 60, 100, 140][phase]
    const dx = this.player.x - boss.x
    if (Math.abs(dx) > 120) boss.setVelocityX(dx > 0 ? speed : -speed)
    else boss.setVelocityX(0)

    // Shoot projectiles
    const shotInterval = [0, 3000, 2000, 1200][phase]
    if (time - boss.getData('lastShot') > shotInterval) {
      boss.setData('lastShot', time)
      this._bossShoot(boss)
    }

    // Phase 2: jump occasionally
    if (phase >= 2 && boss.body.blocked.down && Math.random() < 0.004) {
      boss.setVelocityY(JUMP_VEL * 0.8)
    }
  }

  _bossShoot(boss) {
    const dx = this.player.x - boss.x
    const proj = this.projectiles.create(boss.x, boss.y, 'projectile')
    proj.setVelocityX(dx > 0 ? 280 : -280)
    proj.setVelocityY(-60)
    proj.setCollideWorldBounds(false)
    this.time.delayedCall(3000, () => proj.destroy())
  }

  // ── Player actions ────────────────────────────────────────────────────────

  _tryJump() {
    if (this._dialoguePlaying) return
    if (this._jumpCount < 2) {
      this.player.setVelocityY(JUMP_VEL)
      this._jumpCount++
      // Squash & stretch
      this.tweens.add({
        targets: this.player, scaleX: 0.85, scaleY: 1.2,
        duration: 80, yoyo: true
      })
    }
  }

  _tryAttack() {
    if (this._dialoguePlaying) return
    // Flash player
    this.tweens.add({
      targets: this.player, alpha: 0.5, duration: 80, yoyo: true
    })
    // Damage enemies in range
    const RANGE = 80
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
      if (dist < RANGE) {
        const dmg = gameState.powerupActive ? 2 : 1
        const hp = e.getData('hp') - dmg
        e.setData('hp', hp)
        // Hit flash
        this.tweens.add({ targets: e, alpha: 0.2, duration: 80, yoyo: true })
        if (hp <= 0) {
          this._killEnemy(e)
        }
      }
    })
  }

  _killEnemy(e) {
    const isBoss = e.getData('isBoss')
    // Burst effect
    const particles = this.add.particles(e.x, e.y, 'pickup', {
      speed: { min: 80, max: 200 },
      lifespan: 500,
      quantity: 8,
      scale: { start: 0.4, end: 0 },
    })
    this.time.delayedCall(600, () => particles.destroy())

    if (isBoss) {
      this._onBossDefeated()
    } else {
      e.destroy()
      gameState.score += 50
    }
  }

  // ── Collider callbacks ────────────────────────────────────────────────────

  _onPlayerHitEnemy(player, enemy) {
    if (enemy.getData('isBoss')) return  // boss damage via projectiles only
    const now = this.time.now
    if (now - this._lastDamageTime < DAMAGE_COOLDOWN) return
    this._lastDamageTime = now
    this._takeDamage(10)
    // Knock back
    player.setVelocityX(player.x < enemy.x ? -300 : 300)
    player.setVelocityY(-200)
  }

  _onPickup(player, pickup) {
    pickup.destroy()
    const heal = 20
    gameState.health = Math.min(MAX_HEALTH, gameState.health + heal)
    this.hud.setHealth(gameState.health, MAX_HEALTH)
    gameState.score += 100
    // Heal text
    const t = this.add.text(player.x, player.y - 40, `+${heal} HP`, {
      fontFamily: '"VT323"', fontSize: 20, fill: '#50d090'
    }).setOrigin(0.5)
    this.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  _onProjectileHit(player, proj) {
    const now = this.time.now
    if (now - this._lastDamageTime < DAMAGE_COOLDOWN) return
    if (gameState.powerupActive) { proj.destroy(); return } // juniors block it
    this._lastDamageTime = now
    proj.destroy()
    this._takeDamage(15)
  }

  _takeDamage(amount) {
    gameState.health = Math.max(0, gameState.health - amount)
    this.hud.setHealth(gameState.health, MAX_HEALTH)

    // Camera shake
    this.cameras.main.shake(200, 0.01)

    // Flash red
    this.cameras.main.flash(150, 255, 30, 30)

    // Invincibility flash on player
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 100,
      repeat: 5,
      yoyo: true,
      onComplete: () => this.player.setAlpha(1)
    })

    // No death — health floors at 1 (seniors don't die, they just struggle)
    if (gameState.health <= 1) {
      gameState.health = 1
      this.hud.setHealth(1, MAX_HEALTH)
    }
  }

  // ── Boss defeated ──────────────────────────────────────────────────────────

  _onBossDefeated() {
    gameState.bossDefeated = true
    this._dialoguePlaying = true

    // Hide boss HP bar
    this._bossHpBg?.destroy()
    this._bossHpBar?.destroy()
    this._bossLabel?.destroy()

    this.cameras.main.shake(400, 0.02)
    this.cameras.main.flash(500, 255, 200, 50)

    this.enemies.clear(true, true)

    this.time.delayedCall(800, () => {
      this.dialogueSys.play('boss_defeated', () => {
        this.dialogueSys.play('final_arrival', () => {
          // Show video
          this._dialoguePlaying = false
          this.hud.hide()
          this.videoSys.play(() => {
            // Game ends after video
          })
        })
      })
    })
  }

  // ── World creation ────────────────────────────────────────────────────────

  _createGround() {
    this.groundGroup = this.physics.add.staticGroup()
    // Continuous ground
    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      const tile = this.groundGroup.create(x + 16, GROUND_Y + 16, 'ground')
      tile.refreshBody()
    }
    // Some platforms per zone
    const platforms = [
      { x: 600,  y: GROUND_Y - 80 },
      { x: 1000, y: GROUND_Y - 130 },
      { x: 1600, y: GROUND_Y - 90 },
      { x: 2200, y: GROUND_Y - 110 },
      { x: ZONE_WIDTH + 500,  y: GROUND_Y - 100 },
      { x: ZONE_WIDTH + 1200, y: GROUND_Y - 140 },
      { x: ZONE_WIDTH + 2000, y: GROUND_Y - 90 },
      { x: ZONE_WIDTH*2 + 400,  y: GROUND_Y - 120 },
      { x: ZONE_WIDTH*2 + 1000, y: GROUND_Y - 80 },
      { x: ZONE_WIDTH*2 + 1800, y: GROUND_Y - 150 },
      { x: ZONE_WIDTH*3 + 300, y: GROUND_Y - 100 },
    ]
    platforms.forEach(p => {
      const plat = this.groundGroup.create(p.x, p.y, 'platform')
      plat.refreshBody()
    })
  }

  _createBackgrounds() {
    this._stars = []
    for (let z = 0; z < 4; z++) {
      const bg = this.add.tileSprite(
        ZONE_WIDTH * z + ZONE_WIDTH / 2,
        WORLD_HEIGHT / 2,
        ZONE_WIDTH,
        WORLD_HEIGHT,
        `bg_${z}`
      ).setScrollFactor(0.2)
      bg.setData('speed', 0.2 + z * 0.05)
      this._stars.push(bg)
    }
    // Zone label markers (decorative)
    const zoneNames = ['YEAR 1\nConfusion Zone', 'YEAR 2\nLab Survival', 'YEAR 3\nProject Panic', 'YEAR 4\nPlacement Hell']
    zoneNames.forEach((name, i) => {
      this.add.text(ZONE_WIDTH * i + 60, 40, name, {
        fontFamily: '"Press Start 2P"',
        fontSize: 8,
        fill: '#ffffff',
        alpha: 0.3,
        lineSpacing: 6
      })
    })
  }

  _createPlayer() {
    this.player = this.physics.add.image(120, GROUND_Y - 30, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.1)
    this.player.setDragX(800)
    this.player.setMaxVelocityY(600)
  }

  _createTouchControls() {
    // Visual touch hints (bottom corners)
    const w = this.scale.width, h = this.scale.height
    const jumpBtn = this.add.text(40, h - 40, '⬆ JUMP', {
      fontFamily: '"Press Start 2P"', fontSize: 8, fill: '#ffffff', alpha: 0.3
    }).setScrollFactor(0).setDepth(10)
    const atkBtn = this.add.text(w - 80, h - 40, 'ATK ⚔', {
      fontFamily: '"Press Start 2P"', fontSize: 8, fill: '#ffffff', alpha: 0.3
    }).setScrollFactor(0).setDepth(10)
  }

  _createParallaxStars() {
    // Already handled in _createBackgrounds via tileSprite
  }
}
