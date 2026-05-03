import Phaser from 'phaser'
import { W, H, GROUND_Y, LEVEL_WIDTH, PLAYER_SPEED, JUMP_VEL, DMG_COOLDOWN } from '../constants.js'
import { PALETTES } from '../palettes.js'
import { gameState } from '../data/GameState.js'
import { SENIORS } from '../data/seniors.js'
import { YEAR_ENEMIES } from '../enemyConfig.js'
import { POWERUPS } from '../powerupConfig.js'
import { ZONE_LABELS, PLATFORM_CONFIGS, generateEnemyPositions, PICKUP_POSITIONS } from '../gameUtils.js'
import { GS, GROUND_Y_FRAC, YEAR_VARIANTS, BOSS_CFG } from '../config/GameConfig.js'
import { buildTextures } from '../utils/TextureBuilder.js'
import { YearTransitionScene } from './YearTransitionScene.js'
import { SIFinaleBridgeScene } from './SIFinaleBridgeScene.js'
import { HUD } from './game/HUD.js'
import { MobileControls } from './game/MobileControls.js'
import { Combat } from './game/Combat.js'

// ─────────────────────────────────────────────────────────────────────────────
// Main GameScene
// ─────────────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  // ── init ──────────────────────────────────────────────────────────────────
  init(data = {}) {
    this.year = data.year ?? 0

    if (data.resetState) {
      GS.health    = 100; GS.maxHealth = 100
      GS.score     = 0;   GS.cgpa      = 10.0
      GS.year      = 0;   GS.totalKills = 0
      GS.powerupType = null; GS.powerupTimer = 0
      GS.hasResumeBoost = false
    }

    // Per-level state
    this._lastDmgTime     = 0
    this._dmgCooldown     = DMG_COOLDOWN
    this._jumpCount       = 0
    this._bossSpawned     = false
    this._levelComplete   = false
    this._transitioning   = false
    this._killedThisLevel = 0
    this._powerupActive   = false
    this._powerupEndTime  = 0
    this._powerupType     = null
    this._bossEntity      = null
    this._bossHpBar       = null
    this._bossPhaseLabel  = null
    this._bossPhase       = 0
    this._lowHpWarning    = null
    this._bgTile          = null
    this._particles       = null
    this._scanlineOverlay = null
    this._seniorTag       = null
    this._selectedSenior  = SENIORS.find(senior => senior.id === gameState.selectedSenior) || null
    this._yearVariant     = YEAR_VARIANTS[this.year] || YEAR_VARIANTS[0]
    this._surgeActive     = false
    this._surgeEndTime    = 0
    this._nextSurgeTime   = this._yearVariant.surgeEvery || Infinity
    this._doorSequenceStarted = false
    this._autoWalkRight   = false
    this._exitDoor        = null
    this._exitDoorGlow    = null

    // Mobile button zones (set in create)
    this._btnLeft   = null
    this._btnRight  = null
    this._btnJump   = null
    this._btnAttack = null

    // Touch tracking will be handled by MobileControls module
    this._touchLeft   = false
    this._touchRight  = false
    this._touchJump   = false
    this._touchAttack = false

    // Touch "just pressed" detection for non-continuous actions
    this._touchJumpPressed   = false
    this._touchAttackPressed = false
    this._prevTouchJump      = false
    this._prevTouchAttack    = false

    // Multi-touch pointer tracking
    this._activePointers = new Map()
  }

  // ── create ────────────────────────────────────────────────────────────────
  create() {
    const W   = this.scale.width
    const H   = this.scale.height
    const pal = PALETTES[this.year]

    buildTextures(this)

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, H)
    this.physics.world.gravity.y = 750

    this._groundY = H * GROUND_Y_FRAC

    // Physics groups — always initialize FIRST to avoid collider/creation errors
    this.platforms   = this.physics.add.staticGroup()
    this.enemies     = this.physics.add.group()
    this.pickups     = this.physics.add.group()
    this.bossProjs   = this.physics.add.group()
    this.groundTiles = this.physics.add.staticGroup()

    this._buildBackground(pal, W, H)
    this._buildGround(pal, H)

    if (this.year === 1) {
      // Year 2 gets its own bespoke background drawn here in create(),
      // and skips generic platforms / atmosphere entirely.
      this._buildYear2Background(W, H)
    } else {
      this._buildPlatforms(pal, H)
      this._buildAtmosphere(pal, W, H)
    }

    // Particle emitter
    this._particles = this.add.particles(0, 0, 'particle', {
      speed:    { min: 60,  max: 220 },
      scale:    { start: 0.9, end: 0 },
      lifespan: { min: 250, max: 600 },
      gravityY: 280,
      emitting: false,
      quantity:  0,
    })

    // Player
    this.player = this.physics.add.image(70, this._groundY - 40, 'player')
    this.player
      .setCollideWorldBounds(true)
      .setBounce(0.02)
      .setDragX(900)
      .setMaxVelocity(400, 700)
      .setDepth(10)
      .setScale(1.5)

    this._createSeniorTag(W, H)

    // ── Year 2 Special: Memory Tester ──
    if (this.year === 1) {
      this._memoryGates      = []
      this._memoryActive     = false
      this._memorySequence   = []
      this._playerSequence   = []
      this._memoryStep       = 0
      this._memoryLocked     = false
      this._memoryDifficulty = 5

      this._buildMemoryGates(pal)
    } else {
      this._populateLevel(H)
    }

    // Camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, H)
    this.cameras.main.startFollow(this.player, true, 0.10, 0.10)

    // Colliders
    this.physics.add.collider(this.player,  this.groundTiles)
    this.physics.add.collider(this.player,  this.platforms)
    this.physics.add.collider(this.enemies, this.groundTiles)
    this.physics.add.collider(this.enemies, this.platforms)

    // ── Modules ──
    this._combat = new Combat(this, this.year)
    this._mobile = new MobileControls(this)
    this._hud    = new HUD(this, this.year)

    // Overlaps — delegate to combat module
    this.physics.add.overlap(this.player, this.enemies,   (p, e)  => this._combat.onTouchEnemy(p, e),               null, this)
    this.physics.add.overlap(this.player, this.pickups,   (p, pk) => this._combat.onPickup(p, pk, this._particles),  null, this)
    this.physics.add.overlap(this.player, this.bossProjs, (p, pr) => this._combat.onProjHit(p, pr, this._particles), null, this)

    // Input — keyboard
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd    = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' })
    this.atkKey  = this.input.keyboard.addKey('Z')
    this.atkKey2 = this.input.keyboard.addKey('X')

    // Mobile controls
this._mobile.build(W, H, this.year)


    // HUD
    this._hud.build(W, H, pal)

    // Post-processing scanline overlay (fixed, over everything)
    this._buildScanlines(W, H)

    // Screen fade in
    this.cameras.main.fadeIn(350)

    // Cleanup on shutdown
    this.events.once('shutdown', () => {
      this.input.off('pointerdown')
      this.input.off('pointermove')
      this.input.off('pointerup')
    })
  }

  // ── Support scene registration ─────────────────────────────────────────────
  _ensureSupportScenes() {
    // Scenes are now registered in main.js config
  }

  // ── Background ────────────────────────────────────────────────────────────
  _buildBackground(pal, W, H) {
    if (this.year === 1) {
      // Year 2 custom background is built in _buildYear2Background().
      // We still need the exit door so _checkLevelEnd() works.
      this._exitDoor = this.add.image(LEVEL_WIDTH - 70, this._groundY - 50, 'exit_door')
        .setDepth(2)
      this._exitDoorGlow = this.add.rectangle(
        LEVEL_WIDTH - 70, this._groundY - 25, 50, 80, 0xffbb55, 0.18
      ).setDepth(1)
      this.tweens.add({
        targets: this._exitDoorGlow,
        alpha: 0.06, duration: 1100, yoyo: true, repeat: -1,
      })
      return
    }

    // Tiling city bg (parallax)
    this._bgTile = this.add.tileSprite(W / 2, H / 2, W, H, `bg_${this.year}`)
      .setScrollFactor(0)
      .setDepth(-5)

    // Fog gradient overlay (bottom)
    const fog = this.add.graphics().setScrollFactor(0).setDepth(-3)
    fog.fillGradientStyle(pal.fog, pal.fog, pal.sky, pal.sky, 0.8, 0.8, 0, 0)
    fog.fillRect(0, 0, W, H)

    // Accent light strip at horizon
    const strip = this.add.graphics().setScrollFactor(0).setDepth(-2)
    strip.fillGradientStyle(pal.accent, pal.accent, 0x000000, 0x000000, 0.12, 0.12, 0, 0)
    strip.fillRect(0, H * GROUND_Y_FRAC - 6, W, 14)

    // Zone labels
    this._getZoneLabels().forEach(({ x, text }) => {
      this.add.text(x, 18, text, {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(W / 60)}px`,
        color:      `#${pal.accent.toString(16).padStart(6, '0')}`,
      }).setAlpha(0.28).setDepth(0)
    })

    // Exit door
    this._exitDoor = this.add.image(LEVEL_WIDTH - 70, this._groundY - 50, 'exit_door')
      .setDepth(2)
    this._exitDoorGlow = this.add.rectangle(
      LEVEL_WIDTH - 70,
      this._groundY - 25,
      50, 80,
      this.year === 3 ? 0xffdd66 : 0x44aaff,
      this.year === 3 ? 0.2     : 0.12
    ).setDepth(1)
    this.tweens.add({
      targets:  this._exitDoorGlow,
      alpha:    this.year === 3 ? 0.08 : 0.04,
      duration: 1100,
      yoyo:     true,
      repeat:   -1,
    })
  }

  // ── Year 2 bespoke background ─────────────────────────────────────────────
  _buildYear2Background(W, H) {
    const horizonY = H * 0.55

    // 1. Sky — deep blue-black gradient filling whole screen
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10)
    sky.fillGradientStyle(0x080818, 0x080818, 0x161028, 0x161028, 1)
    sky.fillRect(0, 0, W, H)

    // 2. Moon
    const moon = this.add.graphics().setScrollFactor(0).setDepth(-9)
    moon.fillStyle(0xfff8e8, 1)
    moon.fillCircle(W * 0.80, H * 0.13, 26)
    moon.fillStyle(0xfff8e8, 0.05)
    moon.fillCircle(W * 0.80, H * 0.13, 50)
    moon.fillStyle(0xfff8e8, 0.03)
    moon.fillCircle(W * 0.80, H * 0.13, 70)

    // 3. Stars — sparse, warm-tinted
    const starGfx = this.add.graphics().setScrollFactor(0).setDepth(-9)
    for (let i = 0; i < 70; i++) {
      starGfx.fillStyle(0xfff0dd, 0.3 + Math.random() * 0.6)
      starGfx.fillCircle(
        Math.random() * W,
        Math.random() * horizonY * 0.9,
        Math.random() < 0.15 ? 1.3 : 0.6
      )
    }

    // 4. Far city silhouette — slow parallax
    const farCity = this.add.graphics().setScrollFactor(0.06).setDepth(-8)
    farCity.fillStyle(0x0d0b1a, 1)
    const farB = [
      [0.00, 0.78, 0.05, 0.22], [0.06, 0.70, 0.04, 0.30], [0.11, 0.80, 0.06, 0.20],
      [0.18, 0.65, 0.04, 0.35], [0.23, 0.75, 0.05, 0.25], [0.29, 0.68, 0.04, 0.32],
      [0.34, 0.82, 0.07, 0.18], [0.42, 0.62, 0.04, 0.38], [0.47, 0.74, 0.05, 0.26],
      [0.53, 0.78, 0.06, 0.22], [0.60, 0.65, 0.04, 0.35], [0.65, 0.72, 0.05, 0.28],
      [0.71, 0.80, 0.06, 0.20], [0.78, 0.68, 0.04, 0.32], [0.83, 0.76, 0.05, 0.24],
      [0.89, 0.62, 0.05, 0.38], [0.95, 0.74, 0.05, 0.26],
    ]
    farB.forEach(([x, y, w, h]) => {
      farCity.fillRect(x * LEVEL_WIDTH * 0.3, y * H, w * LEVEL_WIDTH * 0.3, h * H)
    })
    // Tiny warm windows on far buildings
    farB.forEach(([x, y, w, h]) => {
      const bx = x * LEVEL_WIDTH * 0.3, by = y * H
      const bw = w * LEVEL_WIDTH * 0.3, bh = h * H
      for (let r = 0; r < Math.floor(bh / 10); r++) {
        for (let c = 0; c < Math.floor(bw / 9); c++) {
          if (Math.random() < 0.18) {
            farCity.fillStyle(0xffcc77, 0.45)
            farCity.fillRect(bx + c * 9 + 2, by + r * 10 + 2, 4, 4)
          }
        }
      }
    })

    // 5. Near city silhouette — medium parallax
    const nearCity = this.add.graphics().setScrollFactor(0.18).setDepth(-7)
    nearCity.fillStyle(0x090815, 1)
    const nearB = [
      [0.00, 0.72, 0.07, 0.28], [0.08, 0.62, 0.05, 0.38], [0.14, 0.76, 0.06, 0.24],
      [0.21, 0.58, 0.05, 0.42], [0.27, 0.68, 0.08, 0.32], [0.36, 0.74, 0.05, 0.26],
      [0.42, 0.60, 0.06, 0.40], [0.49, 0.70, 0.07, 0.30], [0.57, 0.64, 0.05, 0.36],
      [0.63, 0.76, 0.07, 0.24], [0.71, 0.58, 0.05, 0.42], [0.77, 0.72, 0.06, 0.28],
      [0.84, 0.66, 0.07, 0.34], [0.92, 0.74, 0.08, 0.26],
    ]
    nearB.forEach(([x, y, w, h]) => {
      nearCity.fillRect(x * LEVEL_WIDTH * 0.38, y * H, w * LEVEL_WIDTH * 0.38, h * H)
    })
    // Amber windows — near, denser
    nearB.forEach(([x, y, w, h]) => {
      const bx = x * LEVEL_WIDTH * 0.38, by = y * H
      const bw = w * LEVEL_WIDTH * 0.38, bh = h * H
      for (let r = 0; r < Math.floor(bh / 10); r++) {
        for (let c = 0; c < Math.floor(bw / 9); c++) {
          if (Math.random() < 0.28) {
            nearCity.fillStyle(Math.random() < 0.8 ? 0xffbb55 : 0xffeebb, 0.7)
            nearCity.fillRect(bx + c * 9 + 2, by + r * 10 + 2, 5, 4)
          }
        }
      }
    })

    // 6. Ground fill — dark asphalt across full level width (world space)
    const groundGfx = this.add.graphics().setDepth(-6)
    groundGfx.fillStyle(0x0e0c18, 1)
    groundGfx.fillRect(0, horizonY, LEVEL_WIDTH, H - horizonY)

    // 7. Horizon amber bleed — warm streetlight glow (screen-fixed)
    const hBleed = this.add.graphics().setScrollFactor(0).setDepth(-5)
    hBleed.fillGradientStyle(0x1e1206, 0x1e1206, 0x0e0c18, 0x0e0c18, 0.6, 0.6, 0, 0)
    hBleed.fillRect(0, horizonY, W, 50)

    // 8. Thin fog band at horizon
    const fog = this.add.graphics().setScrollFactor(0).setDepth(-5)
    fog.fillStyle(0x12101e, 0.22)
    fog.fillRect(0, horizonY - 18, W, 36)

    // 9. Street lamp posts — decorative, in world space
    const lampGfx = this.add.graphics().setDepth(-4)
    const lampPositions = [300, 750, 1200, 1650, 2100, 2550]
    lampPositions.forEach(lx => {
      const ly = this._groundY
      // Pole
      lampGfx.fillStyle(0x2a2535, 1)
      lampGfx.fillRect(lx - 3, ly - 110, 6, 110)
      // Arm
      lampGfx.fillRect(lx - 3, ly - 110, 22, 5)
      // Lamp head
      lampGfx.fillStyle(0xffcc66, 1)
      lampGfx.fillRect(lx + 12, ly - 116, 18, 10)
      // Soft glow pool on ground
      lampGfx.fillStyle(0xffaa33, 0.06)
      lampGfx.fillEllipse(lx + 20, ly - 2, 90, 18)
    })

    // 10. Zone labels for Year 2
    const zoneLabels = [
      { x: 120,  text: 'PROBATION ZONE' },
      { x: 900,  text: 'MID SEMESTER'   },
      { x: 1700, text: 'BACKLOG ALLEY'  },
      { x: 2500, text: 'FINALS'         },
    ]
    zoneLabels.forEach(({ x, text }) => {
      this.add.text(x, 18, text, {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(W / 60)}px`,
        color:      '#ffbb55',
      }).setAlpha(0.22).setDepth(0)
    })
  }

  _getZoneLabels() {
    const fallback = [
      [{ x: 60, text: 'ORIENTATION' }, { x: 900, text: 'SEM 1'      }, { x: 1800, text: 'MID-SEMS'   }, { x: 2600, text: 'END-SEMS'         }],
      [{ x: 60, text: 'LAB 1'       }, { x: 900, text: 'LAB 2'      }, { x: 1800, text: 'MINI PROJECT'}, { x: 2600, text: 'LAB VIVA'         }],
      [{ x: 60, text: 'IDEATION'    }, { x: 900, text: 'DEVELOPMENT'}, { x: 1800, text: 'DEADLINES'  }, { x: 2600, text: 'BOSS FIGHT'        }],
      [{ x: 60, text: 'RESUME'      }, { x: 900, text: 'APTITUDE'   }, { x: 1800, text: 'TECH ROUND' }, { x: 2600, text: 'GLORIOUS SI DOOR' }],
    ]
    return ZONE_LABELS[this.year] || fallback[this.year] || fallback[0]
  }

  _createSeniorTag(W, H) {
    if (!this._selectedSenior) return
    this._seniorTag = this.add.text(
      W - 10, 8,
      `🎓 ${this._selectedSenior.name.split(' ')[0].toUpperCase()}`,
      { fontFamily: '"Nunito", sans-serif', fontSize: `${Math.floor(W / 60)}px`, color: '#f0c040' }
    ).setOrigin(1, 0).setDepth(50).setScrollFactor(0)
  }

  // ── Ground ────────────────────────────────────────────────────────────────
  _buildGround(pal, H) {
    const tileW = 32, tileH = 20
    for (let x = 0; x < LEVEL_WIDTH; x += tileW) {
      const t = this.groundTiles.create(x + tileW / 2, H * GROUND_Y_FRAC + tileH / 2, 'ground')
      t.setTint(pal.ground).refreshBody()
    }
  }

  // ── Platforms ─────────────────────────────────────────────────────────────
  _buildPlatforms(pal, H) {
    const gy = H * GROUND_Y_FRAC
    const fallback = [
      [[320,gy-70],[580,gy-105],[870,gy-75],[1120,gy-120],[1380,gy-80],[1650,gy-60],[1920,gy-105],[2200,gy-78],[2480,gy-95],[2750,gy-60]],
      [[290,gy-80],[545,gy-120],[810,gy-70],[1060,gy-140],[1330,gy-90],[1620,gy-65],[1900,gy-115],[2180,gy-58],[2450,gy-95],[2720,gy-110]],
      [[310,gy-75],[570,gy-115],[860,gy-145],[1060,gy-80],[1340,gy-105],[1640,gy-60],[1940,gy-90],[2200,gy-130],[2480,gy-70],[2760,gy-100]],
      [[280,gy-95],[510,gy-135],[760,gy-78],[1030,gy-148],[1290,gy-88],[1570,gy-124],[1880,gy-92],[2140,gy-140],[2430,gy-100],[2720,gy-128]],
    ]
    const configs = PLATFORM_CONFIGS[this.year] || fallback[this.year] || fallback[0]
    configs.forEach(([x, y], index) => {
      const p = this.platforms.create(x, y, 'platform')
      p.setTint(pal.ground)
      p.refreshBody()

      if (this._yearVariant.movingPlatforms && index % 2 === 1) {
        const startX = x
        const travel = this.year === 4 ? 90 : 60
        this.tweens.add({
          targets:  p,
          x:        startX + travel,
          duration: 2200 + index * 90,
          yoyo:     true,
          repeat:   -1,
          ease:     'Sine.easeInOut',
          onUpdate: () => p.body.updateFromGameObject(),
        })
      }
    })
  }

  // ── Atmosphere effects ────────────────────────────────────────────────────
  _buildAtmosphere(pal, W, H) {
    if (this.year === 0) {
      // Twinkling stars
      for (let i = 0; i < 60; i++) {
        const s = this.add.circle(
          Phaser.Math.Between(0, LEVEL_WIDTH),
          Phaser.Math.Between(0, H * 0.55),
          Phaser.Math.Between(1, 2),
          0xffffff,
          Phaser.Math.FloatBetween(0.2, 0.9)
        ).setDepth(-4)
        this.tweens.add({
          targets:  s,
          alpha:    0.05,
          duration: Phaser.Math.Between(600, 2200),
          yoyo:     true,
          repeat:   -1,
          delay:    Phaser.Math.Between(0, 2000),
        })
      }
    } else if (this.year === 2) {
      // Year 3: Flying debris + embers
      this._debrisTimer = this.time.addEvent({
        delay: 600, loop: true,
        callback: () => {
          const y = Phaser.Math.Between(20, H * 0.65)
          const d = this.add.rectangle(
            LEVEL_WIDTH + 20, y,
            Phaser.Math.Between(4, 14), Phaser.Math.Between(4, 14),
            0xff8800, 0.65
          ).setDepth(-1)
          this.tweens.add({
            targets: d, x: -60, angle: 360,
            duration: Phaser.Math.Between(1800, 3600),
            onComplete: () => d.destroy(),
          })
        },
      })
    } else if (this.year === 3) {
      // Year 4: Floating golden leaves + warm light motes
      this._leafTimer = this.time.addEvent({
        delay: 400, loop: true,
        callback: () => {
          const colors = [0xff8844, 0xffcc44, 0xffaa22, 0xddaa44, 0xffdd88]
          const leaf = this.add.circle(
            LEVEL_WIDTH + 20,
            Phaser.Math.Between(10, H * 0.7),
            Phaser.Math.Between(2, 5),
            Phaser.Utils.Array.GetRandom(colors),
            Phaser.Math.FloatBetween(0.3, 0.7)
          ).setDepth(-1)
          this.tweens.add({
            targets:  leaf,
            x:        -30,
            y:        leaf.y + Phaser.Math.Between(20, 80),
            angle:    Phaser.Math.Between(180, 720),
            duration: Phaser.Math.Between(3000, 6000),
            onComplete: () => leaf.destroy(),
          })
        },
      })
      // Warm light particles rising
      this.time.addEvent({
        delay: 250, loop: true,
        callback: () => {
          const mote = this.add.circle(
            Phaser.Math.Between(0, LEVEL_WIDTH),
            H,
            Phaser.Math.FloatBetween(1, 3),
            0xffdd88,
            Phaser.Math.FloatBetween(0.1, 0.4)
          ).setDepth(-2)
          this.tweens.add({
            targets:  mote,
            y:        -20,
            alpha:    0,
            duration: Phaser.Math.Between(3000, 6000),
            onComplete: () => mote.destroy(),
          })
        },
      })
    }
  }

  // ── Scanline post-process ─────────────────────────────────────────────────
  _buildScanlines(W, H) {
    const scan = this.add.graphics().setScrollFactor(0).setDepth(200)
    scan.fillStyle(0x000000, 0.07)
    for (let y = 0; y < H; y += 3) {
      scan.fillRect(0, y, W, 1)
    }
    // Vignette edges
    const vig   = this.add.graphics().setScrollFactor(0).setDepth(199)
    const edgeW = W * 0.10
    for (let x = 0; x < edgeW; x++) {
      const a = 0.45 * (1 - x / edgeW)
      vig.fillStyle(0x000000, a)
      vig.fillRect(x,         0, 1, H)
      vig.fillRect(W - x - 1, 0, 1, H)
    }
    const edgeH = H * 0.14
    for (let y = 0; y < edgeH; y++) {
      const a = 0.35 * (1 - y / edgeH)
      vig.fillStyle(0x000000, a)
      vig.fillRect(0, y,         W, 1)
      vig.fillRect(0, H - y - 1, W, 1)
    }
  }

  // ── Populate level entities ───────────────────────────────────────────────
  _populateLevel(H) {
    const gy    = this._groundY
    const cfgs  = YEAR_ENEMIES[this.year]
    const count = YEAR_VARIANTS[this.year]?.enemyCount || 8

    for (let i = 0; i < count; i++) {
      const cfg = cfgs[i % cfgs.length]
      const x   = 320 + i * 240 + Phaser.Math.Between(-30, 30)
      const key = `enemy_${this.year}_${i % cfgs.length}`
      this._spawnEnemy(x, gy - cfg.h / 2 - 2, cfg, key)
    }

    // Pickups — alternating score / hp
    YEAR_VARIANTS[this.year].pickupXs.forEach((x, i) => {
      this._spawnPickup(x, gy - 52, i % 2 === 0 ? 'pickup_hp' : 'pickup')
    })

    // Powerup
    const puCfg = POWERUPS[this.year]
    this._spawnPowerupPickup(750 + this.year * 280, gy - 60, puCfg)

    // Boss on Year 4 (index 3) — PLACEMENTS final boss
    if (this.year === 3) {
      this.time.delayedCall(300, () => this._spawnBoss(H))
    }
  }

  _spawnEnemy(x, y, cfg, key) {
    const e = this.enemies.create(x, y, key)
    e.setCollideWorldBounds(true).setBounce(0.08).setDepth(8)
    e.setData('hp',        cfg.hp)
    e.setData('maxHp',     cfg.hp)
    e.setData('speed',     cfg.speed + Phaser.Math.Between(-8, 8))
    e.setData('label',     cfg.label)
    e.setData('score',     cfg.score)
    e.setData('isBoss',    false)
    e.setData('jumpTimer', Phaser.Math.FloatBetween(0, 2))

    // HP bar
    const barBg = this.add.rectangle(x, y - cfg.h / 2 - 10, cfg.w + 4, 5, 0x330000).setDepth(9)
    const barFg = this.add.rectangle(x - 2, y - cfg.h / 2 - 10, cfg.w, 3, 0xff3333).setOrigin(0, 0.5).setDepth(10)
    const lbl   = this.add.text(x, y - cfg.h / 2 - 18, cfg.label, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(this.scale.width / 65)}px`,
      color:      '#ffaaaa',
    }).setOrigin(0.5).setDepth(10)

    e.setData('barBg', barBg)
    e.setData('barFg', barFg)
    e.setData('lbl',   lbl)
    return e
  }

  _spawnPickup(x, y, key) {
    const p = this.pickups.create(x, y, key)
    p.body.allowGravity = false
    p.setDepth(7)
    p.setData('pickupKey', key)
    p.setData('isPowerup', false)
    this.tweens.add({ targets: p, y: y - 10, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' })
    return p
  }

  _spawnPowerupPickup(x, y, puCfg) {
    const p = this.pickups.create(x, y, 'powerup')
    p.body.allowGravity = false
    p.setDepth(7).setScale(1.3).setTint(puCfg.color)
    p.setData('isPowerup', true)
    p.setData('puCfg',     puCfg)
    this.tweens.add({ targets: p, angle: 360, duration: 2200, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: p, y: y - 12, yoyo: true, repeat: -1, duration: 750 })

    this.add.text(x, y - 30, puCfg.label, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(this.scale.width / 65)}px`,
      color:      '#ffff88',
    }).setOrigin(0.5).setDepth(9)
    return p
  }

  _spawnBoss(H) {
    const gy = this._groundY
    const e  = this.enemies.create(LEVEL_WIDTH - 360, gy - BOSS_CFG.h / 2 - 2, 'boss')
    e.setCollideWorldBounds(true).setDepth(9)
    e.setData('hp',        BOSS_CFG.hp)
    e.setData('maxHp',     BOSS_CFG.hp)
    e.setData('isBoss',    true)
    e.setData('phase',     0)
    e.setData('lastShot',  0)
    e.setData('speed',     BOSS_CFG.phases[0].speed)
    e.setData('jumpTimer', 0)

    this.physics.add.collider(e, this.groundTiles)
    this.physics.add.collider(e, this.platforms)

    const W      = this.scale.width
    const bHud   = this.add.container(0, 0).setScrollFactor(0).setDepth(60)
    const barBg  = this.add.rectangle(W / 2, 22, 220, 12, 0x220000).setScrollFactor(0)

    this._bossHpBar = this.add.rectangle(W / 2 - 108, 22, 216, 8, 0xff0000)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(61)

    this.add.text(W / 2, 12, 'PLACEMENTS BOSS', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 56)}px`,
      color:      '#ff4444',
    }).setScrollFactor(0).setDepth(61).setOrigin(0.5)

    this._bossPhaseLabel = this.add.text(W / 2, 32, 'PHASE 1', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 70)}px`,
      color:      '#ff9999',
    }).setScrollFactor(0).setDepth(61).setOrigin(0.5)

    this._bossEntity  = e
    this._bossSpawned = true

    // Warning flash
    this.cameras.main.shake(700, 0.022)
    const warn = this.add.text(W / 2, H / 2, '⚠ PLACEMENTS INCOMING ⚠', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 22)}px`,
      color:      '#ff0000',
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5)
    this.tweens.add({ targets: warn, alpha: 0, delay: 600, duration: 2200, onComplete: () => warn.destroy() })
  }

  // ── Update loop ───────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.player?.active || !this.player.body) return
    if (this._levelComplete) return

    // Parallax BG scroll
    if (this._bgTile) this._bgTile.tilePositionX = this.cameras.main.scrollX * 0.07

    this._updatePlayer(time, delta)

    if (this.year === 1) {
      this._updateMemoryGame(time)
    } else {
      this._updateEnemies(time)
    }

    this._updateBossProjectiles()
    this._updatePickupLabels()

    this._hud.update(this._killedThisLevel, this._powerupActive, this._powerupEndTime, this._powerupType)
    this._checkLevelEnd(time)
  }

  _updatePlayer(time, delta) {
    const onGround = this.player.body.blocked.down
    if (onGround) this._jumpCount = 0

    // Speed modifier
    let speed = PLAYER_SPEED
    if (this._powerupActive && this._powerupType === 'coffee') speed *= 1.9

    // Horizontal movement
    let goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._mobile.touchLeft
    let goRight = this.cursors.right.isDown || this.wasd.right.isDown || this._mobile.touchRight

    if (this._levelComplete) {
      if (this._autoWalkRight) { goRight = true; goLeft = false }
      else                     { goRight = false; goLeft = false }
    }

    if      (goLeft)  this.player.setVelocityX(-speed)
    else if (goRight) this.player.setVelocityX(speed)
    else {
      const vx = this.player.body.velocity.x
      this.player.setVelocityX(vx * 0.78) // smooth stop
    }

    // Facing
    if      (goLeft)  this.player.setFlipX(true)
    else if (goRight) this.player.setFlipX(false)

    // Texture
    this.player.setTexture(onGround ? 'player' : 'player_jump')

    // Jump
    const wantJump = Phaser.Input.Keyboard.JustDown(this.cursors.up)
                  || Phaser.Input.Keyboard.JustDown(this.cursors.space)
                  || Phaser.Input.Keyboard.JustDown(this.wasd.up)
                  || this._mobile.touchJumpPressed

    if (wantJump && !this._levelComplete && this._jumpCount < 2) {
      this.player.setVelocityY(JUMP_VEL)
      this._jumpCount++
      this._particles.setPosition(this.player.x, this.player.y + this.player.height / 2)
      this._particles.setParticleTint(0xffffff)
      this._particles.explode(8)
    }

    // Attack
    const wantAttack = Phaser.Input.Keyboard.JustDown(this.atkKey)
                    || Phaser.Input.Keyboard.JustDown(this.atkKey2)
                    || this._mobile.touchAttackPressed

if (wantAttack && !this._levelComplete) {
      this._combat.doAttack(time, this.player, this.enemies, this._particles, this._powerupActive, this._powerupType)
      this._doSlashEffect()
    }

    // Powerup expiry
    if (this._powerupActive && time > this._powerupEndTime) {
      this._powerupActive = false
      this._powerupType   = null
      this._combat._showFloat(this.player.x, this.player.y - 35, 'powerup expired', '#888888')
    }
  }




  _onBossDefeated() {
    if (this._levelComplete) return

    this._bossEntity?.destroy()
    this._bossEntity = null
    if (this._bossHpBar) this._bossHpBar.setDisplaySize(0, 8)

    GS.score += 500
    GS.totalKills++
    this._killedThisLevel++

    this.cameras.main.shake(900, 0.03)
    this.cameras.main.flash(1100, 255, 180, 50)

    const W = this.scale.width, H = this.scale.height

    const text1 = this.add.text(W / 2, H / 2 - 30, '🎓 PLACEMENTS CONQUERED!', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 18)}px`,
      color:      '#ffcc00',
      stroke:     '#884400',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5).setScale(0)

    this.tweens.add({ targets: text1, scale: 1, duration: 1000, ease: 'Elastic.easeOut' })

    const text2 = this.add.text(W / 2, H / 2 + 30, 'Now walk to the SI Lab door! →', {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${Math.floor(W / 32)}px`,
      color:      '#ffffff',
      align:      'center',
    }).setScrollFactor(0).setDepth(99).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: text2, alpha: 1, duration: 800, delay: 800 })

    // Confetti
    for (let i = 0; i < 40; i++) {
      const dot = this.add.circle(
        W / 2 + Phaser.Math.Between(-100, 100), H + 10,
        Phaser.Math.Between(4, 8),
        Phaser.Utils.Array.GetRandom([0xffcc00, 0xff6600, 0x44aaff, 0xffffff])
      ).setScrollFactor(0).setDepth(98)
      this.tweens.add({
        targets: dot,
        y: Phaser.Math.Between(H * 0.1, H * 0.5),
        x: dot.x + Phaser.Math.Between(-200, 200),
        duration: Phaser.Math.Between(1500, 2500),
        ease: 'Cubic.easeOut',
      })
    }

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [text1, text2], alpha: 0, duration: 800,
        onComplete: () => { text1.destroy(); text2.destroy() },
      })
    })
  }

  // ── Enemy AI ──────────────────────────────────────────────────────────────
  _updateEnemies(time) {
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('hp') <= 0) return

      const barBg = e.getData('barBg'), barFg = e.getData('barFg'), lbl = e.getData('lbl')
      if (barBg) barBg.setPosition(e.x, e.y - e.height / 2 - 8)
      if (barFg) barFg.setPosition(e.x - (e.width + 4) / 2, e.y - e.height / 2 - 8)
      if (lbl)   lbl.setPosition(e.x, e.y - e.height / 2 - 18)

      if (e.getData('isBoss')) {
        this._updateBoss(e, time)
      } else {
        const dx  = this.player.x - e.x
        const spd = e.getData('speed') || 60

        if (Math.abs(dx) < 450) e.setVelocityX(dx > 0 ? spd : -spd)
        else                    e.setVelocityX(0)

        // Occasional jump
        let jt = e.getData('jumpTimer') - this.game.loop.delta / 1000
        e.setData('jumpTimer', jt)
        if (jt <= 0 && e.body.blocked.down) {
          e.setVelocityY(-320 - Math.random() * 80)
          e.setData('jumpTimer', Phaser.Math.FloatBetween(1.5, 3.5))
        }
      }
    })
  }

  _updateBoss(boss, time) {
    const hp    = boss.getData('hp')
    const frac  = hp / BOSS_CFG.hp
    const phase = frac > 0.65 ? 0 : frac > 0.35 ? 1 : 2
    const ph    = BOSS_CFG.phases[phase]

    // Phase change effects
    if (phase !== this._bossPhase) {
      this._bossPhase = phase
      this.cameras.main.shake(400, 0.018)
      this.cameras.main.flash(500, 255, 100, 0)
      boss.setTint(ph.color)
      this._bossPhaseLabel?.setText(`PHASE ${phase + 1}`)
      this._particles.setPosition(boss.x, boss.y)
      this._particles.setParticleTint(ph.color)
      this._particles.explode(30)
    }

    boss.setTint(ph.color)

    // Move toward player
    const dx = this.player.x - boss.x
    if (Math.abs(dx) > 70) boss.setVelocityX(dx > 0 ? ph.speed : -ph.speed)
    else                   boss.setVelocityX(0)

    // Boss jump
    let jt = boss.getData('jumpTimer') - this.game.loop.delta / 1000
    boss.setData('jumpTimer', jt)
    if (jt <= 0 && boss.body.blocked.down) {
      boss.setVelocityY(-400)
      boss.setData('jumpTimer', Phaser.Math.FloatBetween(1.2, 2.5))
    }

    // Shoot
    const lastShot = boss.getData('lastShot') || 0
    if (time - lastShot > ph.shootInterval) {
      boss.setData('lastShot', time)
      this._bossShoot(boss, phase)
    }

    // Update HP bar
    if (this._bossHpBar) {
      const pct = Math.max(0, hp / BOSS_CFG.hp)
      this._bossHpBar.width = 216 * pct
    }
  }

  _bossShoot(boss, phase) {
    const dir = this.player.x < boss.x ? -1 : 1
    const spd = 250

    const shoot = (vx, vy) => {
      const p = this.bossProjs.create(boss.x + dir * 45, boss.y - 10, 'boss_proj')
      if (!p) return
      p.setVelocity(vx, vy)
      p.body.allowGravity = false
      p.setDepth(9)
      this.time.delayedCall(5000, () => { if (p?.active) p.destroy() })
    }

    shoot(dir * spd, -20)
    if (phase >= 1) shoot(dir * (spd - 60),  -130)
    if (phase >= 2) shoot(dir * (spd - 120), -220)
  }

  _updateBossProjectiles() {
    this.bossProjs.getChildren().forEach(p => {
      if (!p.active) return
      if (p.y > this.scale.height + 50) p.destroy()
    })
  }

  _updatePickupLabels() {
    // labels are positioned at spawn — nothing to do each frame
  }

  // ── Level end ─────────────────────────────────────────────────────────────
  _checkLevelEnd(time) {
    if (this._transitioning || !this.player) return
    if (this.player.x > LEVEL_WIDTH - 120) {
      if (this.year === 3 && this._bossEntity?.active) {
        this._combat._showFloat(this.player.x, this.player.y - 40, 'Defeat the boss first!', '#ff4444')
        return
      }
      this._completeYear()
    }
  }

  _completeYear() {
    if (this._transitioning) return
    this._transitioning = true
    this._levelComplete = true
    this._autoWalkRight = true

    GS.score += 300 + this._killedThisLevel * 20
    GS.cgpa   = Math.min(10.0, GS.cgpa + 0.3)
    GS.year   = this.year + 1
    GS.health = Math.min(GS.maxHealth, GS.health + 40)

    const W = this.scale.width, H = this.scale.height

    if (this.year === 0) {
      this._showYear1Stats(W, H)
    }else if (this.year === 1) {
      this._showYear2Stats(W, H)
     } else {
      const yearNames = ['YEAR 1 CLEARED!', 'YEAR 2 CLEARED!', 'YEAR 3 CLEARED!', 'BOSS DEFEATED!']
      const mainTxt = this.add.text(W / 2, H / 2 - 25, yearNames[this.year] || 'CLEARED!', {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(W / 18)}px`,
        color:      '#ffcc44',
        stroke:     '#000000',
        strokeThickness: 4,
      }).setScrollFactor(0).setDepth(99).setOrigin(0.5).setScale(0)

      this.tweens.add({ targets: mainTxt, scale: 1, duration: 800, ease: 'Elastic.easeOut' })

      const subTxt = this.add.text(W / 2, H / 2 + 25, `score: ${GS.score}   cgpa: ${GS.cgpa.toFixed(1)}`, {
        fontFamily: '"Nunito", sans-serif',
        fontSize:   `${Math.floor(W / 36)}px`,
        color:      '#ffffff',
      }).setScrollFactor(0).setDepth(99).setOrigin(0.5).setAlpha(0)

      this.tweens.add({ targets: subTxt, alpha: 1, delay: 500, duration: 500 })

      this.time.delayedCall(3000, () => {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('YearTransition', { year: this.year + 1, score: GS.score })
        })
      })
    }
  }

  _showYear1Stats(W, H) {
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(1000)
    const overlay   = this.add.rectangle(0, 0, W, H, 0x000000, 0.9).setOrigin(0)
    container.add(overlay)

    const cardW = W * 0.85, cardH = H * 0.7
    const cardX = W / 2,    cardY = H / 2
    const cardBG = this.add.graphics()
    cardBG.fillStyle(0x0a0a1a, 1)
    cardBG.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 20)
    cardBG.lineStyle(3, 0x00ff88, 0.8)
    cardBG.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 20)
    cardBG.lineStyle(1, 0x00ff88, 0.3)
    cardBG.strokeRoundedRect(cardX - cardW / 2 + 8, cardY - cardH / 2 + 8, cardW - 16, cardH - 16, 15)
    container.add(cardBG)

    const title = this.add.text(cardX, cardY - cardH / 2 + 60, 'YEAR 1 REPORT CARD', {
      fontFamily: '"Rajdhani", sans-serif',
      fontSize:   '32px',
      fontStyle:  'bold',
      fill:       '#00ff88',
      letterSpacing: 2,
    }).setOrigin(0.5).setScale(0)
    container.add(title)

    const stats = [
      { k: 'SCORE',               v: GS.score,                              c: '#ffffff'  },
      { k: 'CGPA',                v: 'WOH JAANKE KYA KAROGE',              c: '#ffcc00'  },
      { k: 'RELATIONSHIP STATUS', v: 'Coders ki nhi hoti\n(except paras sir)', c: '#ff44aa' },
      { k: 'DSA',                 v: 'probably less than ayush sir',        c: '#44aaff'  },
    ]

    const entries = []
    stats.forEach((s, i) => {
      const yPos = cardY - cardH / 2 + 150 + i * 95
      const kTxt = this.add.text(cardX, yPos, s.k, {
        fontFamily: '"Nunito", sans-serif', fontSize: '13px', fill: '#888888', letterSpacing: 3,
      }).setOrigin(0.5).setAlpha(0)
      const vTxt = this.add.text(cardX, yPos + 32, s.v, {
        fontFamily: '"Rajdhani", sans-serif', fontSize: '19px', fill: s.c, fontStyle: 'bold',
        align: 'center', wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5).setAlpha(0)
      container.add([kTxt, vTxt])
      entries.push(kTxt, vTxt)
    })

    const continueTxt = this.add.text(cardX, cardY + cardH / 2 - 50, 'CLICK TO CONTINUE', {
      fontFamily: '"Nunito", sans-serif', fontSize: '15px', fill: '#00ff88', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0)
    container.add(continueTxt)

    this.tweens.add({ targets: title, scale: 1, duration: 800, ease: 'Elastic.out(1, 0.5)' })
    entries.forEach((el, i) => {
      this.tweens.add({ targets: el, alpha: 1, y: el.y - 15, delay: 600 + i * 200, duration: 600, ease: 'Power2.out' })
    })

    this.time.delayedCall(3500, () => {
      this.tweens.add({ targets: continueTxt, alpha: 1, duration: 500 })
      this.tweens.add({ targets: continueTxt, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 })

      this.input.once('pointerdown', () => {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('YearTransition', { year: this.year + 1, score: GS.score })
        })
      })
    })

    // Confetti
    for (let i = 0; i < 40; i++) {
      const c = this.add.circle(
        W / 2 + Phaser.Math.Between(-150, 150), H + 20,
        Phaser.Math.Between(4, 7),
        Phaser.Utils.Array.GetRandom([0x00ff88, 0x00aaff, 0xffffff, 0xffcc00])
      ).setScrollFactor(0).setDepth(1001)
      this.tweens.add({
        targets: c,
        y: H * 0.4 + Phaser.Math.Between(-150, 150),
        x: c.x + Phaser.Math.Between(-200, 200),
        duration: 1500 + Math.random() * 1500,
        ease: 'Cubic.out',
        onComplete: () => {
          this.tweens.add({ targets: c, alpha: 0, y: H + 50, duration: 2500 })
        },
      })
    }
  }


  _showYear2Stats(W, H) {
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(1000)
    const overlay   = this.add.rectangle(0, 0, W, H, 0x000000, 0.92).setOrigin(0)
    container.add(overlay)

    const cardW = W * 0.88, cardH = H * 0.78
    const cardX = W / 2,    cardY = H / 2

    // Card background
    const cardBG = this.add.graphics()
    cardBG.fillStyle(0x08060f, 1)
    cardBG.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22)
    cardBG.lineStyle(2.5, 0xffbb55, 0.85)
    cardBG.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22)
    cardBG.lineStyle(1, 0xffbb55, 0.25)
    cardBG.strokeRoundedRect(cardX - cardW / 2 + 8, cardY - cardH / 2 + 8, cardW - 16, cardH - 16, 17)
    container.add(cardBG)

    // Title
    const title = this.add.text(cardX, cardY - cardH / 2 + 52, 'YEAR 2 REPORT CARD', {
      fontFamily: '"Rajdhani", sans-serif', fontSize: '30px',
      fontStyle: 'bold', fill: '#ffbb55', letterSpacing: 3,
    }).setOrigin(0.5).setScale(0)
    container.add(title)

    // Divider
    const div = this.add.graphics()
    div.lineStyle(1, 0xffbb55, 0.3)
    div.lineBetween(cardX - cardW * 0.38, cardY - cardH / 2 + 78, cardX + cardW * 0.38, cardY - cardH / 2 + 78)
    container.add(div)

    // Stats rows (left side — text)
    const stats = [
      { k: 'FRIENDS MADE',        v: 'For Life 🫂',                              c: '#00ff88' },
      { k: 'RELATIONSHIP STATUS', v: 'Still single\n(Paras sir still winning tho 💀)', c: '#ff88cc' },
      { k: 'MEMORY GATES CLEARED', v: '3 / 3  —  you actually remembered stuff', c: '#44aaff' },
      { k: 'CGPA',                v: '',                                          c: '#ffcc44', meme: true },
    ]

    const textColW  = cardW * 0.52
    const imgColX   = cardX + cardW * 0.17
    const startY    = cardY - cardH / 2 + 108

    const entries = []
    let   memeImgAdded = false

    stats.forEach((s, i) => {
      const yPos = startY + i * 88

      const kTxt = this.add.text(cardX - cardW * 0.38, yPos, s.k, {
        fontFamily: '"Nunito", sans-serif', fontSize: '11px',
        fill: '#777777', letterSpacing: 3,
      }).setOrigin(0, 0).setAlpha(0)

      container.add(kTxt)
      entries.push(kTxt)

      if (s.meme) {
        // Show salman.png as the CGPA answer
        if (!memeImgAdded) {
          memeImgAdded = true
          const img = this.add.image(imgColX, yPos + 28, 'salman_meme')
            .setOrigin(0.5).setDisplaySize(110, 80).setAlpha(0)
          container.add(img)
          entries.push(img)

          const memeLabel = this.add.text(imgColX, yPos + 76, '(the meme speaks for itself)', {
            fontFamily: '"Nunito", sans-serif', fontSize: '9px', fill: '#666666',
          }).setOrigin(0.5).setAlpha(0)
          container.add(memeLabel)
          entries.push(memeLabel)
        }
      } else {
        const vTxt = this.add.text(cardX - cardW * 0.38, yPos + 22, s.v, {
          fontFamily: '"Rajdhani", sans-serif', fontSize: '16px',
          fill: s.c, fontStyle: 'bold', align: 'left',
          wordWrap: { width: textColW },
        }).setOrigin(0, 0).setAlpha(0)
        container.add(vTxt)
        entries.push(vTxt)
      }
    })

    // Score strip at bottom of card
    const scoreTxt = this.add.text(cardX, cardY + cardH / 2 - 78,
      `SCORE  ${GS.score}     KILLS  ${this._killedThisLevel}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px', fill: '#888888', letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0)
    container.add(scoreTxt)
    entries.push(scoreTxt)

    // Continue prompt
    const continueTxt = this.add.text(cardX, cardY + cardH / 2 - 44, 'CLICK TO CONTINUE', {
      fontFamily: '"Nunito", sans-serif', fontSize: '14px', fill: '#ffbb55', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0)
    container.add(continueTxt)

    // Animations
    this.tweens.add({ targets: title, scale: 1, duration: 820, ease: 'Elastic.out(1,0.5)' })
    entries.forEach((el, i) => {
      this.tweens.add({
        targets: el, alpha: 1, y: el.y - 12,
        delay: 500 + i * 180, duration: 580, ease: 'Power2.out',
      })
    })

    this.time.delayedCall(3800, () => {
      this.tweens.add({ targets: continueTxt, alpha: 1, duration: 450 })
      this.tweens.add({ targets: continueTxt, alpha: 0.25, duration: 750, yoyo: true, repeat: -1 })

      this.input.once('pointerdown', () => {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('YearTransition', { year: this.year + 1, score: GS.score })
        })
      })
    })

    // Amber confetti (lofi night theme)
    for (let i = 0; i < 35; i++) {
      const col = Phaser.Utils.Array.GetRandom([0xffbb55, 0xffcc88, 0xff8800, 0xffffff, 0x00e5ff])
      const c   = this.add.circle(
        W / 2 + Phaser.Math.Between(-170, 170), H + 15,
        Phaser.Math.Between(3, 7), col
      ).setScrollFactor(0).setDepth(1001)
      this.tweens.add({
        targets: c,
        y: H * 0.35 + Phaser.Math.Between(-120, 120),
        x: c.x + Phaser.Math.Between(-180, 180),
        duration: 1600 + Math.random() * 1400,
        ease: 'Cubic.out',
        onComplete: () => {
          this.tweens.add({ targets: c, alpha: 0, y: H + 40, duration: 2200 })
        },
      })
    }
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Year 2 — Traffic-Light Memory Gates  (3 gates, escalating difficulty)
  // ─────────────────────────────────────────────────────────────────────────
// ── Slash visual effect ───────────────────────────────────────────────────
  _doSlashEffect() {
    if (!this.player?.active) return
    const dir = this.player.flipX ? -1 : 1
    const cx  = this.player.x + dir * 38
    const cy  = this.player.y - 10
    const col = this._powerupActive ? 0xff4400 : 0x00eeff

    for (let i = 0; i < 5; i++) {
      const angle = Phaser.Math.DegToRad(-30 + i * 15) * dir
      const len   = 28 + i * 8
      const gfx   = this.add.graphics().setDepth(25)
      gfx.lineStyle(3 - Math.floor(i / 2), col, 0.9 - i * 0.15)
      gfx.beginPath()
      gfx.moveTo(cx, cy)
      gfx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
      gfx.strokePath()
      this.tweens.add({ targets: gfx, alpha: 0, duration: 160 + i * 20, onComplete: () => gfx.destroy() })
    }

    const ring = this.add.graphics().setDepth(24)
    ring.lineStyle(2, col, 0.8)
    ring.strokeCircle(cx, cy, 10)
    this.tweens.add({
      targets: ring, alpha: 0, scaleX: 2.8, scaleY: 2.8,
      duration: 220, ease: 'Power2', onComplete: () => ring.destroy(),
    })

    this._particles.setPosition(cx, cy)
    this._particles.setParticleTint(col)
    this._particles.explode(6)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Year 2 — Checkpoint Memory Gates  (3 gates, pure Phaser Graphics)
  // ─────────────────────────────────────────────────────────────────────────

_buildMemoryGates(pal) {
    const gy = this._groundY
    const W  = this.scale.width

    const gateCfgs = [
      { seqLen: 4, twist: 'normal',  label: 'CHECKPOINT 1', hint: 'Same order'              },
      { seqLen: 5, twist: 'reverse', label: 'CHECKPOINT 2', hint: 'REVERSE order!'           },
      { seqLen: 6, twist: 'shift',   label: 'CHECKPOINT 3', hint: 'Each +1  R→Y  Y→G  G→R'  },
    ]

    const gatePositions = [560, 1380, 2200]

    gatePositions.forEach((gx, i) => {
      const cfg        = gateCfgs[i]
      const barrierCol = [0xff3333, 0xffaa00, 0xcc44ff][i]

      // ── BLOCKER: sits LEFT of the visual gate ─────────────────────────────
      // Player walks right → hits blocker → stops → lights are visible
      // ahead and to the right on screen
      const blockerX = gx - 10
      const blocker  = this.physics.add.staticImage(blockerX, gy - 80, 'ground')
        .setDisplaySize(12, 160).setAlpha(0)
      blocker.refreshBody()
      this.physics.add.collider(this.player, blocker)

      // ── ENERGY BARRIER LINE at blocker position ───────────────────────────
      const barrierGfx = this.add.graphics().setDepth(6)
      barrierGfx.lineStyle(4, barrierCol, 1)
      barrierGfx.lineBetween(blockerX, gy - 170, blockerX, gy)
      barrierGfx.lineStyle(16, barrierCol, 0.18)
      barrierGfx.lineBetween(blockerX, gy - 170, blockerX, gy)
      barrierGfx.lineStyle(32, barrierCol, 0.07)
      barrierGfx.lineBetween(blockerX, gy - 170, blockerX, gy)
      this.tweens.add({
        targets: barrierGfx, alpha: 0.35,
        duration: 650, yoyo: true, repeat: -1,
      })

      // ── TRAFFIC LIGHT — drawn to the RIGHT of blocker (visible on screen) ─
      // Light post centered at gx + 60 so player sees it clearly
      const lightCX = gx + 60   // world-x centre of the light structure
      const poleTop = gy - 230

      const structGfx = this.add.graphics().setDepth(5)

      // Pole
      structGfx.fillStyle(0x1e1c2e, 1)
      structGfx.fillRect(lightCX - 5, poleTop, 10, gy - poleTop)

      // Horizontal arm
      structGfx.fillStyle(0x1e1c2e, 1)
      structGfx.fillRect(lightCX - 44, poleTop + 10, 44, 8)

      // Housing box — left of pole, lights stacked inside
      const houseX = lightCX - 44
      const houseY = poleTop
      const houseW = 38
      const houseH = 130
      structGfx.fillStyle(0x0d0c1a, 1)
      structGfx.fillRoundedRect(houseX, houseY, houseW, houseH, 8)
      structGfx.lineStyle(2, barrierCol, 0.7)
      structGfx.strokeRoundedRect(houseX, houseY, houseW, houseH, 8)

      // Sign above housing
      structGfx.fillStyle(0x0a0818, 0.95)
      structGfx.fillRoundedRect(houseX - 10, houseY - 28, houseW + 20, 24, 5)
      structGfx.lineStyle(1.5, barrierCol, 0.8)
      structGfx.strokeRoundedRect(houseX - 10, houseY - 28, houseW + 20, 24, 5)

      const signTxt = this.add.text(
        houseX + houseW / 2, houseY - 16,
        `${cfg.label}`, {
          fontFamily: '"Nunito", sans-serif',
          fontSize:   '10px',
          color:      '#ffcc77',
        }
      ).setOrigin(0.5).setDepth(7)

      const alertDot = this.add.circle(houseX - 4, houseY - 16, 4, barrierCol, 1).setDepth(7)
      this.tweens.add({ targets: alertDot, alpha: 0.1, duration: 480, yoyo: true, repeat: -1 })

      // Seq length badge below sign
      const seqBadge = this.add.text(
        houseX + houseW / 2, houseY - 4,
        `×${cfg.seqLen}`, {
          fontFamily: '"Nunito", sans-serif',
          fontSize:   '9px',
          color:      '#888899',
        }
      ).setOrigin(0.5).setDepth(7)

      // ── Three lights inside housing (stacked vertically) ──────────────────
      const lightDefs = [
        { col: 0xff2222, hex: 'ff2222' },   // 0 = Red
        { col: 0xffcc00, hex: 'ffcc00' },   // 1 = Yellow
        { col: 0x22dd55, hex: '22dd55' },   // 2 = Green
      ]
      const lightLX = houseX + houseW / 2   // horizontal centre of housing

      const lights = lightDefs.map((def, j) => {
        const lly = houseY + 22 + j * 36    // vertical position inside housing

        // Dark socket ring
        const dimGfx = this.add.graphics().setDepth(6)
        dimGfx.fillStyle(0x000000, 0.8)
        dimGfx.fillCircle(lightLX, lly, 14)
        dimGfx.fillStyle(def.col, 0.14)
        dimGfx.fillCircle(lightLX, lly, 13)
        dimGfx.lineStyle(1, def.col, 0.25)
        dimGfx.strokeCircle(lightLX, lly, 13)

        // Lit graphic — starts invisible
        const litGfx = this.add.graphics().setDepth(7).setAlpha(0)
        litGfx.fillStyle(def.col, 1)
        litGfx.fillCircle(lightLX, lly, 13)
        // Specular highlight
        litGfx.fillStyle(0xffffff, 0.4)
        litGfx.fillCircle(lightLX - 4, lly - 4, 4)
        // Outer bloom
        litGfx.lineStyle(7, def.col, 0.45)
        litGfx.strokeCircle(lightLX, lly, 17)
        litGfx.lineStyle(14, def.col, 0.15)
        litGfx.strokeCircle(lightLX, lly, 22)

        // Number label to right of housing
        const numTxt = this.add.text(houseX + houseW + 8, lly, `${j + 1}`, {
          fontFamily: '"Rajdhani", sans-serif',
          fontSize:   '15px',
          color:      `#${def.hex}`,
          fontStyle:  'bold',
          stroke:     '#000000',
          strokeThickness: 2,
        }).setOrigin(0, 0.5).setDepth(7).setAlpha(0.45)

        return { dimGfx, litGfx, numTxt, lly, col: def.col, hex: def.hex }
      })

      // Road dashes in front of blocker
      const roadGfx = this.add.graphics().setDepth(1)
      for (let m = 0; m < 5; m++) {
        roadGfx.fillStyle(0xffcc44, 0.25)
        roadGfx.fillRect(blockerX + 20 + m * 24, gy + 2, 14, 5)
      }

      this._memoryGates.push({
        gate:       { x: gx, y: gy - 60 },
        blocker, barrierGfx, structGfx,
        lights, signTxt, alertDot, seqBadge, roadGfx,
        opened:     false,
        cfg,
        sequence:   this._genGateSequence(cfg.seqLen),
      })
    })
  }

  _genGateSequence(len) {
    return Array.from({ length: len }, () => Phaser.Math.Between(0, 2))
  }

  _reshuffleGate(gateIdx) {
    const g    = this._memoryGates[gateIdx]
    g.sequence = this._genGateSequence(g.cfg.seqLen)
    this._showFloat(g.gate.x, g.gate.y - 60, '🔄 NEW PATTERN!', '#ff00aa')
  }

  _updateMemoryGame(time) {
    const px = this.player.x
    this._memoryGates.forEach((g, i) => {
      if (g.opened) return
      if (Math.abs(px - g.gate.x) < 230 && !this._memoryActive && !this._memoryLocked) {
        this._startGateMemory(i)
      }
    })
  }

  _startGateMemory(gateIdx) {
    this._memoryActive = true
    this._memoryLocked = true
    const g = this._memoryGates[gateIdx]

    this._showFloat(g.gate.x, g.gate.y - 55, '👀 WATCH THE LIGHTS!', '#00e5ff')
    this.player.setVelocityX(0)
    this.player.body.moves = false

    this.time.delayedCall(800, () => this._playPanelSequence(gateIdx))
  }

  _playPanelSequence(gateIdx) {
    const g    = this._memoryGates[gateIdx]
    const seq  = g.sequence
    const cfg  = g.cfg
    const STEP = 700   // ms per light — longer so it's actually readable

    // Build expected answer
    let ansSeq = [...seq]
    if (cfg.twist === 'reverse') ansSeq = [...seq].reverse()
    if (cfg.twist === 'shift')   ansSeq = seq.map(v => (v + 1) % 3)
    g.expectedStr = ansSeq.map(v => v + 1).join('')

    seq.forEach((lIdx, step) => {
      // Flash ON
      this.time.delayedCall(step * STEP, () => {
        const lt = g.lights[lIdx]

        // Snap lit circle fully visible
lt.litGfx.setAlpha(1)
        lt.numTxt.setAlpha(1)

        // Colour-tinted screen flash
        const r = (lt.col >> 16) & 0xff
        const gn = (lt.col >> 8) & 0xff
        const b  = lt.col & 0xff
        this.cameras.main.flash(80, r, gn, b, true)

        // Step counter floating above light
        const lbl = this.add.text(lt.lx, lt.ly - 38, `${step + 1}`, {
          fontFamily: '"Rajdhani", sans-serif', fontSize: '26px',
          color: `#${lt.hex}`, fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(20)
        this.tweens.add({ targets: lbl, y: lbl.y - 28, alpha: 0, duration: 500, onComplete: () => lbl.destroy() })
      })

      // Flash OFF — 60% through the step window
      this.time.delayedCall(step * STEP + STEP * 0.60, () => {
g.lights[lIdx].litGfx.setAlpha(0)
        g.lights[lIdx].numTxt.setAlpha(0.45)
      })
    })

    // After all flashes done → hint + popup
    const totalDuration = seq.length * STEP + 200
    this.time.delayedCall(totalDuration, () => {
      if (cfg.twist !== 'normal') {
        this._showFloat(g.gate.x, g.gate.y - 75, `⚠ ${cfg.hint}`, '#ffaa00', Math.floor(this.scale.width / 50))
      }
      this.time.delayedCall(cfg.twist !== 'normal' ? 1400 : 500, () => {
        this.player.body.moves = true
        this._showGatePopup(gateIdx)
      })
    })
  }

  _showGatePopup(gateIdx) {
    const g   = this._memoryGates[gateIdx]
    const cfg = g.cfg

    // Remove any existing popup
    const old = document.getElementById('_mgOverlay')
    if (old) old.remove()

    const accentHex = ['#ff3333', '#ffaa00', '#cc44ff'][gateIdx]

    const overlay = document.createElement('div')
    overlay.id = '_mgOverlay'
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'display:flex','align-items:center','justify-content:center',
      'background:rgba(4,2,12,0.88)',
      'font-family:"Nunito",sans-serif',
      'animation:_mgIn 0.22s ease',
    ].join(';')

    const twistDesc = {
      normal:  'Type the colours in the <b>same order</b> you saw them.',
      reverse: '⚠️ Type the colours in <b>REVERSE</b> order — last first!',
      shift:   '🎓 Each colour shifts +1 &nbsp;( R→Y &nbsp; Y→G &nbsp; G→R )',
    }

    overlay.innerHTML = `
      <style>
        @keyframes _mgIn  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        @keyframes _mgShk { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)} 75%{transform:translateX(9px)} }
        #_mgCard {
          background: linear-gradient(160deg,#0b0920 0%,#160d2a 100%);
          border: 2px solid ${accentHex};
          border-radius: 20px;
          padding: 16px 16px 14px;
          width: min(420px, 96vw);
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 0 50px ${accentHex}55, inset 0 0 30px #00000044;
          display: flex; flex-direction: column; gap: 16px;
        }
        #_mgCard h2 {
          margin:0; text-align:center; font-size:1.1rem;
          letter-spacing:3px; color:${accentHex};
          font-family:"Rajdhani",sans-serif; font-weight:700;
        }
        ._mgTwist {
          background:${accentHex}18; border:1px solid ${accentHex}66;
          border-radius:10px; padding:10px 14px;
          color:#ddd; font-size:0.82rem; line-height:1.6; text-align:center;
        }
        ._mgLegend {
          display:flex; gap:10px; justify-content:center; flex-wrap:wrap;
        }
        ._mgChip {
          border-radius:8px; padding:5px 14px; font-size:0.8rem;
          font-weight:700; letter-spacing:1px; border:1.5px solid;
        }
#_mgInput {
          background:#08061a; border:2px solid #333; color:#fff;
          font-size:1.6rem; letter-spacing:.4rem; text-align:center;
          border-radius:12px; padding:8px 4px; width:100%;
          outline:none; transition:border-color .2s, box-shadow .2s;
          caret-color:${accentHex};
          box-sizing: border-box;
        }
        #_mgInput:focus { border-color:${accentHex}; box-shadow:0 0 14px ${accentHex}44 }
#_mgSubmit {
          background:${accentHex}; color:#000; font-weight:800;
          font-size:1rem; border:none; border-radius:12px;
          padding:11px 0; cursor:pointer; letter-spacing:3px;
          transition:opacity .15s, transform .1s;
          font-family:"Rajdhani",sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        #_mgSubmit:hover { opacity:.88; transform:scale(1.02) }
        #_mgErr {
          color:#ff4455; font-size:.82rem; text-align:center;
          display:none; animation:_mgShk .35s;
        }
        ._mgSeqLen {
          text-align:center; color:#666; font-size:.78rem; letter-spacing:2px;
        }
      </style>
      <div id="_mgCard">
        <h2>${cfg.label.toUpperCase()} — MEMORY CHECK</h2>
        <div class="_mgTwist">${twistDesc[cfg.twist]}</div>
        <div class="_mgLegend">
          <div class="_mgChip" style="color:#ff4455;border-color:#ff4455">1 = RED</div>
          <div class="_mgChip" style="color:#ffcc00;border-color:#ffcc00">2 = YELLOW</div>
          <div class="_mgChip" style="color:#22dd55;border-color:#22dd55">3 = GREEN</div>
        </div>
        <div class="_mgSeqLen">SEQUENCE LENGTH: ${g.cfg.seqLen} digits</div>
        <input id="_mgInput" type="text" maxlength="${g.cfg.seqLen}"
               placeholder="${'·'.repeat(g.cfg.seqLen)}" autocomplete="off" spellcheck="false" />
        <button id="_mgSubmit">SUBMIT ↵</button>
        <div id="_mgErr">❌ Wrong! The pattern has been refreshed.</div>
      </div>
    `

    document.body.appendChild(overlay)

    const inp  = document.getElementById('_mgInput')
    const btn  = document.getElementById('_mgSubmit')
    const err  = document.getElementById('_mgErr')

    inp.focus()

    // Only allow 1 2 3
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/[^123]/g, '').slice(0, g.cfg.seqLen)
    })

    const onSubmit = () => {
      const val = inp.value.trim()
      if (val === g.expectedStr) {
        // ── Correct ──────────────────────────────────────────────────────────
        overlay.style.transition = 'opacity .3s'
        overlay.style.opacity    = '0'
        setTimeout(() => overlay.remove(), 320)

        g.opened           = true
        this._memoryActive = false
        this._memoryLocked = false   // ← allow next gate to trigger


// Destroy all gate visuals
g.barrierGfx.destroy()
        g.blocker.destroy()
        g.structGfx.destroy()
        g.signTxt.destroy()
        g.alertDot.destroy()
        g.seqBadge?.destroy()
        g.roadGfx.destroy()
        g.lights.forEach(lt => {
          lt.dimGfx.destroy()
          lt.litGfx.destroy()
          lt.numTxt.destroy()
        })
        this._showFloat(g.gate.x, g.gate.y - 50, '✅ CHECKPOINT CLEARED!', '#00ff88')
        this.cameras.main.flash(500, 0, 255, 120)
        this.cameras.main.shake(180, 0.007)

      } else {
        // ── Wrong ────────────────────────────────────────────────────────────
        err.style.display   = 'block'
        err.style.animation = 'none'
        void err.offsetWidth
        err.style.animation = '_mgShk .35s'
        inp.style.borderColor = '#ff4455'
        inp.value = ''

        setTimeout(() => {
          overlay.remove()
          this._showFloat(this.player.x, this.player.y - 45, '💀 WRONG! -12 HP', '#ff0000')
          this.cameras.main.shake(450, 0.018)
          this._combat.takeDamage(12, this.player)

          this.time.delayedCall(1300, () => {
            this._reshuffleGate(gateIdx)
            this._memoryActive = false
            this._memoryLocked = false
          })
        }, 1300)
      }
    }

    btn.addEventListener('click', onSubmit)
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') onSubmit() })
  }

  _finishGame() {
    this.scene.stop()
    this.scene.start('SIFinaleBridge')
  }

  // ── Year 2 end-screen ─────────────────────────────────────────────────────
  _showYear2Stats(W, H) {
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(1000)
    const overlay   = this.add.rectangle(0, 0, W, H, 0x000000, 0.92).setOrigin(0)
    container.add(overlay)

    const cardW = W * 0.84, cardH = H * 0.82
    const cardX = W / 2,    cardY = H / 2

    // Card BG
    const cardBG = this.add.graphics()
    cardBG.fillStyle(0x08060f, 1)
    cardBG.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22)
    cardBG.lineStyle(2.5, 0xffbb55, 0.9)
    cardBG.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22)
    cardBG.lineStyle(1, 0xffbb55, 0.22)
    cardBG.strokeRoundedRect(cardX - cardW / 2 + 8, cardY - cardH / 2 + 8, cardW - 16, cardH - 16, 17)
    container.add(cardBG)

    // Title
    const title = this.add.text(cardX, cardY - cardH / 2 + 44, 'YEAR 2 REPORT CARD', {
      fontFamily: '"Rajdhani", sans-serif', fontSize: '28px',
      fontStyle: 'bold', fill: '#ffbb55', letterSpacing: 3,
    }).setOrigin(0.5).setScale(0)
    container.add(title)

    // Divider line
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, 0xffbb55, 0.28)
    divGfx.lineBetween(cardX - cardW * 0.4, cardY - cardH / 2 + 70, cardX + cardW * 0.4, cardY - cardH / 2 + 70)
    container.add(divGfx)

    // Layout constants
    const leftX   = cardX - cardW * 0.40
    const startY  = cardY - cardH / 2 + 90
    const rowH    = 78
    const entries = []

    // ── Row helper ────────────────────────────────────────────────────────
    const addRow = (i, keyStr, valStr, valColor) => {
      const ky = startY + i * rowH
      const k  = this.add.text(leftX, ky, keyStr, {
        fontFamily: '"Nunito", sans-serif', fontSize: '10px',
        fill: '#666688', letterSpacing: 3,
      }).setOrigin(0, 0).setAlpha(0)
      const v  = this.add.text(leftX, ky + 20, valStr, {
        fontFamily: '"Rajdhani", sans-serif', fontSize: '17px',
        fill: valColor, fontStyle: 'bold',
        wordWrap: { width: cardW * 0.82 },
      }).setOrigin(0, 0).setAlpha(0)
      container.add([k, v])
      entries.push(k, v)
    }

    addRow(0, 'FRIENDS MADE',         'For Life 🫂',                            '#00ff88')
    addRow(1, 'RELATIONSHIP STATUS',  'Still single  (Paras sir still winning tho 💀)', '#ff88cc')
    addRow(2, 'MEMORY CHECKPOINTS',   '3 / 3  —  galaxy brain unlocked',        '#44aaff')

    // CGPA row — key label only, image fills the value slot
    const cgpaY = startY + 3 * rowH
    const cgpaK = this.add.text(leftX, cgpaY, 'CGPA', {
      fontFamily: '"Nunito", sans-serif', fontSize: '10px',
      fill: '#666688', letterSpacing: 3,
    }).setOrigin(0, 0).setAlpha(0)
    container.add(cgpaK)
    entries.push(cgpaK)

    // Salman meme image — directly below the CGPA key label
    const memeImg = this.add.image(leftX + 80, cgpaY + 52, 'salman_meme')
      .setOrigin(0.5).setDisplaySize(148, 100).setAlpha(0)
    container.add(memeImg)
    entries.push(memeImg)

    const memeCap = this.add.text(leftX + 80, cgpaY + 108, '(the meme speaks for itself)', {
      fontFamily: '"Nunito", sans-serif', fontSize: '9px', fill: '#555577',
    }).setOrigin(0.5, 0).setAlpha(0)
    container.add(memeCap)
    entries.push(memeCap)

    // Score strip
    const scoreY  = cardY + cardH / 2 - 70
    const scoreTxt = this.add.text(cardX, scoreY,
      `SCORE  ${GS.score}   ·   YEAR 2 COMPLETE`, {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px',
      fill: '#666688', letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0)
    container.add(scoreTxt)
    entries.push(scoreTxt)

    // Continue prompt
    const contY   = cardY + cardH / 2 - 38
    const contTxt = this.add.text(cardX, contY, 'CLICK TO CONTINUE', {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px',
      fill: '#ffbb55', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0)
    container.add(contTxt)

    // ── Animations ────────────────────────────────────────────────────────
    this.tweens.add({ targets: title, scale: 1, duration: 800, ease: 'Elastic.out(1,0.5)' })
    entries.forEach((el, idx) => {
      this.tweens.add({
        targets: el, alpha: 1, y: el.y - 10,
        delay: 480 + idx * 130, duration: 560, ease: 'Power2.out',
      })
    })

    this.time.delayedCall(3600, () => {
      this.tweens.add({ targets: contTxt, alpha: 1, duration: 420 })
      this.tweens.add({ targets: contTxt, alpha: 0.22, duration: 720, yoyo: true, repeat: -1 })

      this.input.once('pointerdown', () => {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('YearTransition', { year: this.year + 1, score: GS.score })
        })
      })
    })

    // Amber confetti
    for (let i = 0; i < 38; i++) {
      const col = Phaser.Utils.Array.GetRandom([0xffbb55, 0xff8800, 0xffeebb, 0x00e5ff, 0xffffff])
      const c   = this.add.circle(
        W / 2 + Phaser.Math.Between(-180, 180), H + 12,
        Phaser.Math.Between(3, 7), col
      ).setScrollFactor(0).setDepth(1001)
      this.tweens.add({
        targets: c,
        y: H * 0.3 + Phaser.Math.Between(-100, 130),
        x: c.x + Phaser.Math.Between(-160, 160),
        duration: 1500 + Math.random() * 1600,
        ease: 'Cubic.out',
        onComplete: () => this.tweens.add({ targets: c, alpha: 0, y: H + 50, duration: 2200 }),
      })
    }
  }

  // ── Floating text ─────────────────────────────────────────────────────────
  _showFloat(x, y, text, color = '#ffffff', size) {
    const W  = this.scale.width
    const sz = size ?? Math.floor(W / 46)
    const t  = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize:   `${sz}px`,
      color,
      stroke:     '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(30)
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0, duration: 850, ease: 'Power2',
      onComplete: () => t.destroy(),
    })
  }
}