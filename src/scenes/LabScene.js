// ─────────────────────────────────────────────────────────────────────────────
// LabScene.js — Cinematic Computer Lab Scene (Three.js + Phaser)
// COMPLETELY REDRAWN: Large expressive characters, dramatic lighting,
// phone-optimized layout, fast punchy dialogues, two-act structure.
//
// ACT 1: Lab banter scene — 4 large, visible NPCs chatting
// ACT 2: PANIC scene — 2-3 NPCs missing, emergency atmosphere
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { DialogueSystem } from '../systems/DialogueSystem.js'
import { gameState } from '../data/GameState.js'

let THREE = null

async function loadThree() {
  if (window.THREE) { THREE = window.THREE; return }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.onload = () => { THREE = window.THREE; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── NPC definitions — ACT 1 ───────────────────────────────────────────────
const NPC_DATA = [
  {
    name: 'RITIK',
    shirtColor: 0x2255cc,
    skinTone: 0xd4956a,
    hairColor: 0x110500,
    pantsColor: 0x1a1a3a,
    position: { x: -2.4, z: 0.2 },
    rotation: 0.5,
    dialogues: [
      'BHAI! Placement ho gayi toh PARTY! 🎉',
      'Nahi hui toh bhi party — bas chota wala.',
      'HR bhi insaan hai... shayad. 😎'
    ],
    isTrigger: false,
    presentInAct2: true
  },
  {
    name: 'SHIVANSH',
    shirtColor: 0xcc3311,
    skinTone: 0xc87941,
    hairColor: 0x080300,
    pantsColor: 0x1c1c2e,
    position: { x: -0.5, z: -1.2 },
    rotation: -0.3,
    dialogues: [
      'CGPA 6.2 hai... Google mein apply kar raha hoon. 💀',
      '"Weakness kya hai?" — "Sir, khaana zyada kha leta hoon."',
      'Reject hua toh next company. 😤'
    ],
    isTrigger: false,
    presentInAct2: false   // ← MISSING in Act 2
  },
  {
    name: 'ANMOL',
    shirtColor: 0x118844,
    skinTone: 0xe8b89a,
    hairColor: 0x180800,
    pantsColor: 0x1e1e30,
    position: { x: 1.3, z: -0.6 },
    rotation: 0.6,
    dialogues: [
      'Ek baar internship mili thi. Sapna tha. 😭',
      'DSA easy hai — bas trees, graphs, DP yaad rakh.',
      'Worst case? UPSC hai hi bhai. 🙏'
    ],
    isTrigger: false,
    presentInAct2: false   // ← MISSING in Act 2
  },
  {
    name: 'DIVYANSH',
    shirtColor: 0x7722aa,
    skinTone: 0xd48b6a,
    hairColor: 0x0c0400,
    pantsColor: 0x141428,
    position: { x: 2.8, z: 0.4 },
    rotation: -0.7,
    dialogues: [
      '⚠️ BHAI SUNOOOO!!',
      'PROFESSOR KA VIVA KAL HAI — QUESTIONS INTERNET PE NAHI!!',
      'SYSTEMS CRASH HO RAHE HAIN! DATA WIPE!\nGAME START KARO ABHI WARNA SAB KHATAM!! 🚨'
    ],
    isTrigger: true,
    presentInAct2: true
  }
]

// ─────────────────────────────────────────────────────────────────────────────
export class LabScene extends Phaser.Scene {
  constructor() {
    super('LabScene')
    this._act = 1   // 1 = banter, 2 = panic
  }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────

  async create() {
    this.cameras.main.setAlpha(0)
    await loadThree()

    this._initThreeRenderer()
    this._buildLab()
    this._buildNPCs()
    this._buildPlayer()
    this._setupLighting()
    this._setupInput()
    this._setupCollision()
    this._createDialogueOverlay()
    this._createMobileControls()

    this._running = true
    this._animate()

    // Fade in
    this._threeCanvas.style.opacity = '0'
    this._threeCanvas.style.transition = 'opacity 1.8s ease'
    requestAnimationFrame(() => { this._threeCanvas.style.opacity = '1' })

    // Opening typewriter hint
    this._showHint('Move: Arrow Keys / D-Pad  |  TALK: Enter / Button')

    // After 18s of idle, auto-trigger Act 2 for dramatic effect
    this._act2Timer = setTimeout(() => {
      if (this._act === 1 && !this._inDialogueFlow) this._triggerAct2()
    }, 25000)
  }

  shutdown() {
    this._running = false
    clearTimeout(this._act2Timer)
    if (this._renderer) {
      this._renderer.dispose()
      this._renderer.domElement?.remove()
    }
    ;['_dialogueEl','_hintEl','_mobileEl'].forEach(k => {
      if (this[k]) this[k].remove()
    })
    document.removeEventListener('keydown', this._keyHandler)
    document.removeEventListener('keyup',   this._keyHandler)
  }

  // ── Renderer ──────────────────────────────────────────────────────────────

  _initThreeRenderer() {
    const W = this.scale.width
    const H = this.scale.height

    this._scene    = new THREE.Scene()
    this._camera   = new THREE.PerspectiveCamera(62, W / H, 0.1, 80)
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })

    this._renderer.setSize(W, H)
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping
    this._renderer.toneMappingExposure = 1.2

    this._threeCanvas = this._renderer.domElement
    Object.assign(this._threeCanvas.style, {
      position: 'absolute', top: '0', left: '0',
      zIndex: '5', pointerEvents: 'none'
    })

    const phaserCanvas = this.game.canvas
    phaserCanvas.parentNode.insertBefore(this._threeCanvas, phaserCanvas.nextSibling)

    // Camera — pulled back so characters are BIG on screen
    this._camera.position.set(0, 2.8, 5.8)
    this._camera.lookAt(0, 1.4, 0)

    this._scene.fog = new THREE.FogExp2(0x07071a, 0.045)
    this._scene.background = new THREE.Color(0x06060f)
  }

  // ── Lab build ─────────────────────────────────────────────────────────────

  _buildLab() {
    // Floor
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x12122a, roughness: 0.28, metalness: 0.12,
      map: this._makeTileTexture()
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18, 22, 18), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this._scene.add(floor)

    // Glossy floor reflection
    const ref = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 18),
      new THREE.MeshStandardMaterial({ color: 0x2040a0, transparent: true, opacity: 0.07, roughness: 0.0, metalness: 1.0 })
    )
    ref.rotation.x = -Math.PI / 2
    ref.position.y = 0.003
    this._scene.add(ref)

    // Ceiling
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 18),
      new THREE.MeshStandardMaterial({ color: 0x0e0e1e, roughness: 1 })
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.y = 4.8
    this._scene.add(ceil)

    // Walls
    this._addWall(0,   2.4, -9,   22, 4.8, 0.2,  0x10102a) // back
    this._addWall(0,   2.4,  9,   22, 4.8, 0.2,  0x10102a) // front
    this._addWall(-11, 2.4,  0, 0.2, 4.8,  18,   0x0e0e25) // left
    this._addWall( 11, 2.4,  0, 0.2, 4.8,  18,   0x0e0e25) // right

    // Baseboard
    this._addWall(0,   0.07, -9, 22, 0.14, 0.25, 0x2525508)
    this._addWall(-11, 0.07,  0, 0.25, 0.14, 18, 0x252550)
    this._addWall( 11, 0.07,  0, 0.25, 0.14, 18, 0x252550)

    // Ceiling light strips
    ;[-5, -1.5, 2, 5.5].forEach(x => {
      ;[-3.5, 0, 3.5].forEach(z => this._addCeilingLight(x, z))
    })

    // Desks — fewer but more prominent, positioned behind NPCs
    ;[
      { x: -4.5, z: -4 }, { x: -1.5, z: -4 }, { x: 1.5, z: -4 }, { x: 4.5, z: -4 },
      { x: -4.5, z: -1.5 }, { x: -1.5, z: -1.5 }, { x: 1.5, z: -1.5 }, { x: 4.5, z: -1.5 },
    ].forEach(d => this._buildDesk(d.x, d.z))

    // Back wall features
    this._buildWhiteboard(-3.5, 2.5, -8.85)
    this._buildProjectorScreen(3.5, 2.5, -8.85)
    this._buildWindow(10.88, 2.2, -1.5)
    this._buildDoor(-10.88, 1.3, 1.5)
    this._buildServerRack(9.8, 0, -7.5)
    this._addCableRun()
    this._addWallPosters()
  }

  _addWall(x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
    )
    m.position.set(x, y, z)
    m.receiveShadow = true
    this._scene.add(m)
    return m
  }

  _buildDesk(x, z) {
    const g = new THREE.Group()

    // Surface
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x22183a, roughness: 0.38, metalness: 0.08 })
    )
    top.position.y = 0.76
    top.castShadow = true; top.receiveShadow = true
    g.add(top)

    // Legs
    ;[[-1.0,-0.38],[1.0,-0.38],[-1.0,0.38],[1.0,0.38]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.76, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x181830, metalness: 0.7, roughness: 0.3 })
      )
      leg.position.set(lx, 0.38, lz)
      g.add(leg)
    })

    // Monitor
    const mon = new THREE.Group()
    // Bezel
    mon.add(Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.5, 0.045),
        new THREE.MeshStandardMaterial({ color: 0x0c0c18, roughness: 0.15, metalness: 0.7 })),
      { castShadow: true }
    ))
    // Screen
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshStandardMaterial({
        color: 0x020210, emissive: new THREE.Color(0x0822aa),
        emissiveIntensity: 2.8, roughness: 0.0
      })
    )
    scr.position.z = 0.025
    mon.add(scr)
    // Code lines
    const cc = [0x00ff99, 0x44aaff, 0xff7733, 0xffee33, 0xffffff, 0xff44ff]
    for (let r = 0; r < 7; r++) {
      const len = 0.08 + Math.random() * 0.35
      const lm = new THREE.Mesh(
        new THREE.PlaneGeometry(len, 0.013),
        new THREE.MeshStandardMaterial({ emissive: new THREE.Color(cc[r % cc.length]), emissiveIntensity: 1.8 })
      )
      lm.position.set(-0.3 + len / 2, 0.16 - r * 0.052, 0.027)
      mon.add(lm)
    }
    // Stand
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.2, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.8, roughness: 0.2 })
    )
    neck.position.y = -0.34
    mon.add(neck)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.028, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.8 })
    )
    base.position.y = -0.45
    mon.add(base)
    mon.position.set(0, 1.22, -0.12)
    g.add(mon)

    // Keyboard
    g.add(Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.02, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x181826, roughness: 0.5, metalness: 0.3 })),
      { position: new THREE.Vector3(0, 0.782, 0.2) }
    ))

    // Mouse + pad
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0c0c20, roughness: 0.9 })
    )
    pad.rotation.x = -Math.PI / 2
    pad.position.set(0.4, 0.764, 0.19)
    g.add(pad)
    g.add(Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x101020, roughness: 0.4, metalness: 0.5 })),
      { position: new THREE.Vector3(0.4, 0.782, 0.19) }
    ))

    // CPU + LED
    const cpu = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.46, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x141422, roughness: 0.5, metalness: 0.6 })
    )
    cpu.position.set(1.04, 0.99, 0.04)
    cpu.castShadow = true
    g.add(cpu)
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 6, 6),
      new THREE.MeshStandardMaterial({ emissive: 0x00ff44, emissiveIntensity: 4 })
    )
    led.position.set(1.04, 0.78, -0.22)
    g.add(led)

    g.position.set(x, 0, z)
    g.castShadow = true
    this._scene.add(g)
    return g
  }

  _addCeilingLight(x, z) {
    const g = new THREE.Group()
    g.add(Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.065, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xcccce0, roughness: 0.25, metalness: 0.5 }))
    ))
    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.022, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xc8e4ff), emissiveIntensity: 5 })
    )
    tube.position.y = -0.028
    g.add(tube)
    g.position.set(x, 4.76, z)
    this._scene.add(g)
    const pl = new THREE.PointLight(0xa8c8ff, 0.8, 9)
    pl.position.set(x, 4.3, z)
    this._scene.add(pl)
  }

  _buildWhiteboard(x, y, z) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.0, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x28284a, metalness: 0.7, roughness: 0.3 })
    )
    frame.position.set(x, y, z)
    this._scene.add(frame)
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xf0f0ff, roughness: 0.9, map: this._makeWhiteboardTexture() })
    )
    board.position.set(x, y, z + 0.038)
    this._scene.add(board)
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.07, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x222238, metalness: 0.7 })
    )
    tray.position.set(x, y - 0.96, z + 0.07)
    this._scene.add(tray)
  }

  _buildProjectorScreen(x, y, z) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 1.9, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x080812 })
    )
    frame.position.set(x, y, z)
    this._scene.add(frame)
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.75),
      new THREE.MeshStandardMaterial({
        color: 0x03040e, emissive: new THREE.Color(0x0a1a45),
        emissiveIntensity: 1.8, roughness: 0.08, map: this._makeProjectorTexture()
      })
    )
    screen.position.set(x, y, z + 0.012)
    this._scene.add(screen)
  }

  _buildWindow(x, y, z) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.4, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x181830, roughness: 0.5 })
    )
    frame.position.set(x, y, z)
    this._scene.add(frame)
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x3060a0, transparent: true, opacity: 0.22, roughness: 0, emissive: new THREE.Color(0x102040), emissiveIntensity: 0.6 })
    )
    glass.rotation.y = -Math.PI / 2
    glass.position.set(x - 0.02, y, z)
    this._scene.add(glass)
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x030818, emissive: new THREE.Color(0x010410), emissiveIntensity: 1, map: this._makeNightSkyTexture() })
    )
    sky.rotation.y = -Math.PI / 2
    sky.position.set(x - 0.18, y, z)
    this._scene.add(sky)
  }

  _buildDoor(x, y, z) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x38200e, roughness: 0.65 })
    )
    door.position.set(x, y, z)
    door.castShadow = true
    this._scene.add(door)
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
    )
    handle.rotation.z = Math.PI / 2
    handle.position.set(x + 0.1, y, z + 0.5)
    this._scene.add(handle)
  }

  _buildServerRack(x, y, z) {
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 2.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x080812, metalness: 0.85, roughness: 0.28 })
    )
    rack.position.set(x, 1.2, z)
    rack.castShadow = true
    this._scene.add(rack)
    for (let u = 0; u < 12; u++) {
      const unit = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.15, 0.045),
        new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.6 })
      )
      unit.position.set(x, 0.18 + u * 0.19, z - 0.29)
      this._scene.add(unit)
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.013, 6, 6),
        new THREE.MeshStandardMaterial({ emissive: new THREE.Color(u % 3 === 0 ? 0xff3300 : 0x00ff55), emissiveIntensity: 4 })
      )
      led.position.set(x + 0.27, 0.18 + u * 0.19, z - 0.3)
      this._scene.add(led)
    }
  }

  _addCableRun() {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(19, 0.09, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x181832, metalness: 0.65 })
    )
    tray.position.set(0, 0.5, -8.8)
    this._scene.add(tray)
    ;[0x4455ff, 0xff3333, 0x33ff55, 0xffff33, 0xff33ff].forEach((c, i) => {
      const pts = []
      for (let t = 0; t <= 24; t++) {
        pts.push(new THREE.Vector3(-9.5 + t * 0.8, 0.46 + Math.sin(t * 0.85 + i) * 0.045, -8.73 - i * 0.013))
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.007, 4, false)
      this._scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })))
    })
  }

  _addWallPosters() {
    ;[
      { x: -8.2, y: 2.9, z: -8.82, label: 'PLACEMENT\nDRIVE\n2026', color: 0xee2222 },
      { x: -6.0, y: 2.9, z: -8.82, label: 'ACM\nCODING\nCLUB', color: 0x1188ee },
      { x: -8.8, y: 1.5, z: -8.82, label: 'CS DEPT\nNOTICE', color: 0x22bb55 },
    ].forEach(p => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.0),
        new THREE.MeshStandardMaterial({ map: this._makePosterTexture(p.label, p.color), roughness: 0.9 })
      )
      mesh.position.set(p.x, p.y, p.z + 0.025)
      this._scene.add(mesh)
    })
  }

  // ── Character construction (REDRAWN — large, expressive) ──────────────────

  _buildNPCs() {
    this._npcs = []
    NPC_DATA.forEach(data => {
      const npc = this._buildCharacter(data, false)
      npc.userData.presentInAct2 = data.presentInAct2
      this._npcs.push(npc)
    })
  }

  _buildPlayer() {
    this._player = this._buildCharacter({
      name: 'YOU',
      shirtColor: 0xddaa22,
      skinTone: 0xd4956a,
      hairColor: 0x120500,
      pantsColor: 0x1a1a3a,
      position: { x: 0, z: 4.2 },
      rotation: 0,
    }, true)
    this._playerSpeed = 0.075
    this._playerBobTime = 0
    this._keys = {}
  }

  // CHARACTER SCALE: ~1.0 world unit = body height ≈ visually large on narrow viewport
  _buildCharacter(data, isPlayer) {
    const g = new THREE.Group()
    const S = 1.45  // ← global scale multiplier: characters are BIG

    const skinM = new THREE.MeshStandardMaterial({ color: data.skinTone, roughness: 0.65 })
    const shirtM = new THREE.MeshStandardMaterial({ color: data.shirtColor, roughness: 0.78 })
    const pantsM = new THREE.MeshStandardMaterial({ color: data.pantsColor ?? 0x1a1a3a, roughness: 0.85 })
    const shoeM  = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.72 })
    const hairM  = new THREE.MeshStandardMaterial({ color: data.hairColor, roughness: 1.0 })

    const add = (geo, mat, px, py, pz, rx=0, ry=0, rz=0) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(px * S, py * S, pz * S)
      m.rotation.set(rx, ry, rz)
      m.castShadow = true
      g.add(m)
      return m
    }

    // ── HEAD (larger, rounder) ────────────────────────────────────────────
    const head = add(new THREE.SphereGeometry(0.195 * S, 20, 20), skinM, 0, 1.74, 0)

    // Hair cap
    add(new THREE.SphereGeometry(0.202 * S, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM, 0, 1.745, 0)

    // Eye whites
    ;[-0.075, 0.075].forEach(ex => {
      add(new THREE.SphereGeometry(0.048 * S, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfafafa }), ex, 1.74, 0.165)
      // Iris
      add(new THREE.SphereGeometry(0.034 * S, 10, 10), new THREE.MeshStandardMaterial({ color: data.hairColor || 0x1a0a00, roughness: 0.2 }), ex, 1.74, 0.195)
      // Pupil shine
      add(new THREE.SphereGeometry(0.012 * S, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }), ex + 0.01, 1.745, 0.205)
    })

    // Eyebrows
    ;[-0.075, 0.075].forEach(ex => {
      add(new THREE.BoxGeometry(0.065 * S, 0.018 * S, 0.01 * S), new THREE.MeshStandardMaterial({ color: data.hairColor }), ex, 1.80, 0.175)
    })

    // Nose
    add(new THREE.SphereGeometry(0.025 * S, 8, 8), skinM, 0, 1.69, 0.188)

    // Mouth
    const mouthG = new THREE.TorusGeometry(0.048 * S, 0.01 * S, 6, 12, Math.PI)
    add(mouthG, new THREE.MeshStandardMaterial({ color: 0x8b1a1a }), 0, 1.632, 0.175, 0, 0, Math.PI)

    // Ears
    ;[-1, 1].forEach(s => {
      add(new THREE.SphereGeometry(0.038 * S, 8, 8), skinM, s * 0.188, 1.73, 0.025)
    })

    // ── NECK ──────────────────────────────────────────────────────────────
    add(new THREE.CylinderGeometry(0.07 * S, 0.08 * S, 0.14 * S, 12), skinM, 0, 1.545, 0)

    // ── TORSO (wider, bulkier) ────────────────────────────────────────────
    add(new THREE.BoxGeometry(0.46 * S, 0.58 * S, 0.26 * S), shirtM, 0, 1.2, 0)

    // Shirt collar
    add(new THREE.TorusGeometry(0.115 * S, 0.024 * S, 6, 14, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }), 0, 1.47, 0.08, -0.4, 0, 0)

    // Shirt pocket
    add(new THREE.BoxGeometry(0.1 * S, 0.08 * S, 0.012 * S), shirtM, 0.12, 1.22, 0.132)

    // Buttons
    for (let b = 0; b < 3; b++) {
      add(new THREE.SphereGeometry(0.014 * S, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xdddddd }), 0, (1.38 - b * 0.11), 0.132)
    }

    // ── ARMS (thicker, more expressive) ───────────────────────────────────
    ;[-1, 1].forEach(side => {
      // Upper arm
      add(new THREE.CylinderGeometry(0.072 * S, 0.065 * S, 0.3 * S, 12), shirtM,
        side * 0.285, 1.21, 0, 0, 0, side * 0.22)
      // Forearm
      add(new THREE.CylinderGeometry(0.06 * S, 0.052 * S, 0.28 * S, 12), skinM,
        side * 0.34, 0.93, 0, 0, 0, side * 0.32)
      // Hand (larger)
      add(new THREE.SphereGeometry(0.066 * S, 10, 10), skinM, side * 0.4, 0.78, 0)
      // Fingers hint
      for (let f = 0; f < 3; f++) {
        add(new THREE.CylinderGeometry(0.016 * S, 0.012 * S, 0.06 * S, 6), skinM,
          side * (0.4 + f * 0.02), 0.72, 0.025 + f * 0.018)
      }
    })

    // ── WAIST / BELT ──────────────────────────────────────────────────────
    add(new THREE.BoxGeometry(0.48 * S, 0.07 * S, 0.28 * S),
      new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.45, metalness: 0.5 }), 0, 0.97, 0)
    // Buckle
    add(new THREE.BoxGeometry(0.09 * S, 0.06 * S, 0.035 * S),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 }), 0, 0.97, 0.145)

    // ── LEGS (thicker) ────────────────────────────────────────────────────
    ;[-0.115, 0.115].forEach(lx => {
      add(new THREE.CylinderGeometry(0.1 * S, 0.088 * S, 0.46 * S, 12), pantsM, lx, 0.76, 0)
      add(new THREE.CylinderGeometry(0.078 * S, 0.065 * S, 0.44 * S, 12), pantsM, lx, 0.36, 0)
      // Shoe
      add(new THREE.BoxGeometry(0.135 * S, 0.07 * S, 0.26 * S), shoeM, lx, 0.13, 0.045)
      // Shoe toe cap
      add(new THREE.SphereGeometry(0.068 * S, 8, 8), shoeM, lx, 0.14, 0.145)
    })

    // ── Ground shadow disc ────────────────────────────────────────────────
    const shadowD = new THREE.Mesh(
      new THREE.CircleGeometry(0.3 * S, 20),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    )
    shadowD.rotation.x = -Math.PI / 2
    shadowD.position.y = 0.006
    g.add(shadowD)

    // ── Name tag sprite ───────────────────────────────────────────────────
    const nameSprite = this._makeTextSprite(data.name, isPlayer ? '#ffcc00' : '#66ccff', 32)
    nameSprite.position.set(0, 3.15 * S * 0.95, 0)
    nameSprite.scale.set(1.6, 0.46, 1)
    g.add(nameSprite)

    // Interaction prompt (NPC only)
    let arrow = null
    if (!isPlayer) {
      arrow = this._makeTextSprite('▼ ENTER', '#ffff44', 26)
      arrow.position.set(0, 3.65 * S * 0.95, 0)
      arrow.scale.set(1.4, 0.38, 1)
      arrow.visible = false
      g.add(arrow)
    }

    g.position.set(data.position.x, 0, data.position.z)
    g.rotation.y = data.rotation || 0

    this._scene.add(g)

    g.userData = {
      name: data.name,
      dialogues: data.dialogues || [],
      isTrigger: data.isTrigger || false,
      isNPC: !isPlayer,
      arrow,
      dialogueIndex: 0,
      walkOffset: Math.random() * Math.PI * 2,
      baseScale: S
    }

    return g
  }

  // ── Lighting ──────────────────────────────────────────────────────────────

  _setupLighting() {
    this._scene.add(new THREE.AmbientLight(0x1a2045, 0.9))
    this._scene.add(Object.assign(new THREE.HemisphereLight(0x203065, 0x100815, 0.45)))

    const dir = new THREE.DirectionalLight(0xb0c8ff, 0.7)
    dir.position.set(-4, 9, 5)
    dir.castShadow = true
    dir.shadow.mapSize.width = dir.shadow.mapSize.height = 2048
    Object.assign(dir.shadow.camera, { near: 0.5, far: 45, left: -14, right: 14, top: 14, bottom: -14 })
    dir.shadow.bias = -0.002
    this._scene.add(dir)

    // Monitor glow lights
    ;[[-4.5,-4],[-1.5,-4],[1.5,-4],[4.5,-4],[-4.5,-1.5],[-1.5,-1.5],[1.5,-1.5],[4.5,-1.5]].forEach(([mx,mz]) => {
      const ml = new THREE.PointLight(0x0a2075, 0.35, 3)
      ml.position.set(mx, 1.45, mz)
      this._scene.add(ml)
    })

    // Character accent fill lights (make NPCs pop visually)
    ;[[-2.4,0.2],[-0.5,-1.2],[1.3,-0.6],[2.8,0.4]].forEach(([cx,cz]) => {
      const cl = new THREE.PointLight(0x4060cc, 0.5, 3.5)
      cl.position.set(cx, 2.2, cz + 0.8)
      this._scene.add(cl)
    })

    // Emergency red light (pulsing)
    this._emergencyLight = new THREE.PointLight(0xff1010, 0.0, 10)
    this._emergencyLight.position.set(0, 4.2, -2)
    this._scene.add(this._emergencyLight)
    this._emergencyTime = 0

    // Act 2 extra panic lights
    this._panicLights = []
    ;[[-5, 3.8, 2], [5, 3.8, -3]].forEach(([px, py, pz]) => {
      const pl = new THREE.PointLight(0xff2200, 0, 7)
      pl.position.set(px, py, pz)
      this._scene.add(pl)
      this._panicLights.push(pl)
    })
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    this._keys = {}
    this._keyHandler = (e) => {
      if (e.type === 'keydown') this._keys[e.code] = true
      if (e.type === 'keyup')   this._keys[e.code] = false
      if (e.type === 'keydown' && e.code === 'Enter') this._tryTalk()
    }
    document.addEventListener('keydown', this._keyHandler)
    document.addEventListener('keyup',   this._keyHandler)
  }

  _setupCollision() {
    this._collisionRadius = 0.55
    this._bounds = { minX: -10, maxX: 10, minZ: -7.5, maxZ: 5.8 }
  }

  // ── Mobile controls ───────────────────────────────────────────────────────

  _createMobileControls() {
    document.getElementById('lab-mobile')?.remove()
    this._mobileEl = document.createElement('div')
    this._mobileEl.id = 'lab-mobile'
    Object.assign(this._mobileEl.style, {
      position: 'absolute', bottom: '160px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', zIndex: '25', userSelect: 'none'
    })

    const btnStyle = (extra='') => `
      width:62px;height:62px;border-radius:50%;
      background:rgba(30,40,100,0.85);
      border:2px solid rgba(100,140,255,0.55);
      color:#88aaff;font-size:22px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;-webkit-tap-highlight-color:transparent;
      box-shadow:0 0 14px rgba(60,100,255,0.35);${extra}`

    const makeBtn = (label, code) => {
      const b = document.createElement('button')
      b.innerHTML = label
      b.style.cssText = btnStyle()
      b.addEventListener('touchstart', e => { e.preventDefault(); this._keys[code] = true })
      b.addEventListener('touchend',   e => { e.preventDefault(); this._keys[code] = false })
      b.addEventListener('mousedown',  () => this._keys[code] = true)
      b.addEventListener('mouseup',    () => this._keys[code] = false)
      return b
    }

    const row1 = document.createElement('div')
    row1.appendChild(makeBtn('▲', 'ArrowUp'))

    const row2 = document.createElement('div')
    row2.style.cssText = 'display:flex;gap:6px'
    row2.appendChild(makeBtn('◀', 'ArrowLeft'))
    row2.appendChild(makeBtn('◀', 'ArrowDown').cloneNode(true)) // placeholder spacer
    // re-add down btn
    const downBtn = makeBtn('▼', 'ArrowDown')
    row2.innerHTML = ''
    row2.appendChild(makeBtn('◀', 'ArrowLeft'))
    row2.appendChild(downBtn)
    row2.appendChild(makeBtn('▶', 'ArrowRight'))

    const row3 = document.createElement('div')
    row3.style.cssText = 'display:flex;gap:10px;margin-top:8px'
    const talkBtn = document.createElement('button')
    talkBtn.innerHTML = '💬 TALK'
    talkBtn.style.cssText = `width:130px;height:52px;border-radius:26px;
      background:rgba(40,80,200,0.9);border:2px solid #6688ff;
      color:#ffffff;font-size:16px;font-weight:bold;
      cursor:pointer;box-shadow:0 0 18px rgba(60,100,255,0.5);letter-spacing:1px;`
    talkBtn.addEventListener('touchstart', e => { e.preventDefault(); this._tryTalk() })
    talkBtn.addEventListener('click', () => this._tryTalk())
    row3.appendChild(talkBtn)

    this._mobileEl.appendChild(row1)
    this._mobileEl.appendChild(row2)
    this._mobileEl.appendChild(row3)
    this.game.canvas.parentNode.appendChild(this._mobileEl)
  }

  // ── Dialogue overlay ──────────────────────────────────────────────────────

  _createDialogueOverlay() {
    document.getElementById('lab-dialogue')?.remove()

    this._dialogueEl = document.createElement('div')
    this._dialogueEl.id = 'lab-dialogue'
    Object.assign(this._dialogueEl.style, {
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92vw',
      maxWidth: '720px',
      background: 'rgba(4,4,16,0.97)',
      border: '2px solid #3355aa',
      borderRadius: '12px',
      padding: '16px 20px 12px',
      color: '#d8e8ff',
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: '16px',        // ← LARGE, readable on phone
      lineHeight: '1.7',
      zIndex: '30',
      display: 'none',
      boxShadow: '0 0 40px rgba(30,60,255,0.4), inset 0 0 24px rgba(8,16,60,0.6)',
      letterSpacing: '0.04em'
    })

    this._dialogueName = document.createElement('div')
    Object.assign(this._dialogueName.style, {
      color: '#ffcc00',
      marginBottom: '8px',
      fontSize: '13px',
      fontWeight: 'bold',
      textShadow: '0 0 10px #ffcc00, 0 0 20px #ff8800'
    })

    this._dialogueText = document.createElement('div')
    Object.assign(this._dialogueText.style, {
      minHeight: '52px',
      fontSize: '16px',
      lineHeight: '1.7'
    })

    const hint = document.createElement('div')
    Object.assign(hint.style, {
      color: '#404070',
      fontSize: '11px',
      marginTop: '10px',
      textAlign: 'right'
    })
    hint.textContent = '[ ENTER / TALK ] continue'

    this._dialogueEl.appendChild(this._dialogueName)
    this._dialogueEl.appendChild(this._dialogueText)
    this._dialogueEl.appendChild(hint)
    this.game.canvas.parentNode.appendChild(this._dialogueEl)

    this._dialogueActive = false
    this._dialogueOnDone = null
    this._inDialogueFlow = false
  }

  _showDialogueLine(speakerName, text, isTrigger, onDone) {
    this._dialogueEl.style.display = 'block'
    // Panic lines get red name color
    this._dialogueName.style.color = isTrigger ? '#ff4444' : '#ffcc00'
    this._dialogueName.style.textShadow = isTrigger
      ? '0 0 12px #ff0000, 0 0 24px #ff4400'
      : '0 0 10px #ffcc00, 0 0 20px #ff8800'
    this._dialogueName.textContent = (isTrigger ? '🚨 ' : '▶ ') + speakerName
    this._dialogueText.textContent = ''
    this._dialogueActive = true
    this._typedFull = text

    // Typewriter — faster for panic lines
    let i = 0
    const speed = isTrigger ? 18 : 24
    const tick = () => {
      if (i < text.length) {
        this._dialogueText.textContent += text[i++]
        setTimeout(tick, speed)
      }
    }
    tick()

    this._dialogueOnDone = () => {
      this._dialogueActive = false
      this._dialogueEl.style.display = 'none'
      onDone?.()
    }
  }

  _showHint(msg) {
    document.getElementById('lab-hint')?.remove()
    this._hintEl = document.createElement('div')
    this._hintEl.id = 'lab-hint'
    Object.assign(this._hintEl.style, {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#3a5588',
      fontFamily: '"Nunito", sans-serif',
      fontSize: '12px',
      zIndex: '25',
      pointerEvents: 'none',
      transition: 'opacity 1.5s',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    })
    this._hintEl.textContent = msg
    this.game.canvas.parentNode.appendChild(this._hintEl)
    setTimeout(() => { if (this._hintEl) this._hintEl.style.opacity = '0' }, 5000)
  }

  // ── Act 2: Panic scene ────────────────────────────────────────────────────

  _triggerAct2() {
    if (this._act === 2) return
    this._act = 2
    this._emergencyFlashing = true

    // Screen flash
    const flash = document.createElement('div')
    Object.assign(flash.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(255,30,30,0.55)', zIndex: '40', pointerEvents: 'none',
      transition: 'opacity 0.5s'
    })
    this.game.canvas.parentNode.appendChild(flash)
    setTimeout(() => { flash.style.opacity = '0' }, 400)
    setTimeout(() => flash.remove(), 1000)

    // Show panic message overlay
    this._showPanicOverlay()

    // Hide missing NPCs with a fade/dissolve effect
    this._npcs.forEach(npc => {
      if (!npc.userData.presentInAct2) {
        this._dissolveCharacter(npc)
      }
    })

    // Camera shake
    this._cameraShake = 1.0
  }

  _dissolveCharacter(npc) {
    let alpha = 1.0
    const dissolve = () => {
      alpha -= 0.04
      npc.children.forEach(child => {
        if (child.material) {
          child.material.transparent = true
          child.material.opacity = Math.max(0, alpha)
        }
      })
      if (alpha > 0) requestAnimationFrame(dissolve)
      else npc.visible = false
    }
    dissolve()
  }

  _showPanicOverlay() {
    const overlay = document.createElement('div')
    overlay.id = 'lab-panic'
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(80,0,0,0.92)',
      border: '2px solid #ff3333',
      borderRadius: '10px',
      padding: '12px 22px',
      color: '#ff6666',
      fontFamily: '"Nunito", sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: '35',
      textAlign: 'center',
      boxShadow: '0 0 30px rgba(255,0,0,0.6)',
      animation: 'lab-pulse 0.7s infinite alternate',
      letterSpacing: '0.05em'
    })
    overlay.innerHTML = '🚨 EMERGENCY 🚨<br><span style="font-size:11px;color:#ff9999">SHIVANSH & ANMOL MISSING</span>'

    // Inject keyframe animation
    const style = document.createElement('style')
    style.textContent = `@keyframes lab-pulse {
      from { box-shadow: 0 0 20px rgba(255,0,0,0.5); }
      to   { box-shadow: 0 0 50px rgba(255,0,0,0.9), 0 0 80px rgba(255,50,0,0.4); }
    }`
    document.head.appendChild(style)

    this.game.canvas.parentNode.appendChild(overlay)
    this._panicOverlay = overlay

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.transition = 'opacity 1s'
        overlay.style.opacity = '0'
        setTimeout(() => overlay.remove(), 1000)
      }
    }, 4000)
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  _tryTalk() {
    // If typing in progress — skip to end
    if (this._dialogueActive && this._typedFull) {
      this._dialogueText.textContent = this._typedFull
      return
    }
    // If line done, waiting — advance
    if (this._dialogueOnDone && this._dialogueEl.style.display === 'block') {
      const fn = this._dialogueOnDone
      this._dialogueOnDone = null
      fn()
      return
    }
    if (this._inDialogueFlow) return

    // Find nearest NPC
    const px = this._player.position.x
    const pz = this._player.position.z
    let closest = null, closestDist = Infinity
    this._npcs.forEach(npc => {
      if (!npc.visible) return
      const dx = npc.position.x - px
      const dz = npc.position.z - pz
      const d  = Math.sqrt(dx * dx + dz * dz)
      if (d < 2.2 && d < closestDist) { closestDist = d; closest = npc }
    })
    if (!closest) return

    const ud = closest.userData
    this._inDialogueFlow = true

    // Face player toward NPC
    this._player.rotation.y = Math.atan2(closest.position.x - px, closest.position.z - pz)

    const playLine = (idx) => {
      if (idx >= ud.dialogues.length) {
        this._inDialogueFlow = false
        if (ud.isTrigger) {
          // Trigger Act 2 first, then game start
          this._triggerAct2()
          setTimeout(() => this._triggerGameStart(), 2800)
        }
        return
      }
      this._showDialogueLine(ud.name, ud.dialogues[idx], ud.isTrigger, () => playLine(idx + 1))
    }
    playLine(0)
  }

  _triggerGameStart() {
    this._showHint('🚨 STARTING MISSION...')
    clearTimeout(this._act2Timer)

    const fadeEl = (el) => {
      if (el) { el.style.transition = 'opacity 0.9s ease'; el.style.opacity = '0' }
    }
    setTimeout(() => {
      fadeEl(this._threeCanvas)
      fadeEl(this._dialogueEl)
      fadeEl(this._mobileEl)

      setTimeout(() => {
        this.shutdown()
        const dialogueSys = new DialogueSystem(gameState)
        dialogueSys.play('opening', () => {
          this.scene.start('CharSelectScene')
        })
      }, 950)
    }, 1200)
  }

  // ── Render loop ───────────────────────────────────────────────────────────

  _animate() {
    if (!this._running) return
    requestAnimationFrame(() => this._animate())

    const dt = 0.016
    this._emergencyTime += dt

    // ── Player movement ───────────────────────────────────────────────────
    if (!this._inDialogueFlow) {
      let dx = 0, dz = 0
      if (this._keys['ArrowLeft']  || this._keys['KeyA']) dx -= 1
      if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1
      if (this._keys['ArrowUp']    || this._keys['KeyW']) dz -= 1
      if (this._keys['ArrowDown']  || this._keys['KeyS']) dz += 1

      if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz)
        let nx = dx / len * this._playerSpeed
        let nz = dz / len * this._playerSpeed
        let newX = Math.max(this._bounds.minX, Math.min(this._bounds.maxX, this._player.position.x + nx))
        let newZ = Math.max(this._bounds.minZ, Math.min(this._bounds.maxZ, this._player.position.z + nz))

        let blocked = false
        this._npcs.forEach(npc => {
          if (!npc.visible) return
          const cdx = newX - npc.position.x
          const cdz = newZ - npc.position.z
          if (Math.sqrt(cdx * cdx + cdz * cdz) < this._collisionRadius) blocked = true
        })

        if (!blocked) {
          this._player.position.x = newX
          this._player.position.z = newZ
        }

        this._player.rotation.y = Math.atan2(dx, dz)
        this._playerBobTime += 0.2
        this._player.position.y = Math.abs(Math.sin(this._playerBobTime)) * 0.055
        this._animateWalk(this._player, this._playerBobTime)
      } else {
        this._player.position.y = 0
        this._playerBobTime = 0
      }
    }

    // ── NPC animation ─────────────────────────────────────────────────────
    this._npcs.forEach(npc => {
      if (!npc.visible) return
      const t = this._emergencyTime + npc.userData.walkOffset
      // Idle sway — more pronounced in Act 2
      const swayAmp = this._act === 2 && npc.userData.presentInAct2 ? 0.04 : 0.014
      npc.position.y = Math.sin(t * 0.9) * swayAmp

      // Panic bounce in Act 2
      if (this._act === 2 && npc.userData.isTrigger) {
        npc.rotation.y += Math.sin(t * 4) * 0.015
      }

      // Interaction arrow
      const dx = npc.position.x - this._player.position.x
      const dz = npc.position.z - this._player.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (npc.userData.arrow) {
        npc.userData.arrow.visible = dist < 2.2
        npc.userData.arrow.position.y = (3.65 * 1.45 * 0.95) + Math.sin(this._emergencyTime * 3.5) * 0.1
      }

      // Face player when close
      if (dist < 3.5) {
        const angle = Math.atan2(
          this._player.position.x - npc.position.x,
          this._player.position.z - npc.position.z
        )
        npc.rotation.y += (angle - npc.rotation.y) * 0.05
      }
    })

    // ── Emergency lights ──────────────────────────────────────────────────
    if (this._emergencyFlashing) {
      const pulse = (Math.sin(this._emergencyTime * 14) + 1) * 0.5
      this._emergencyLight.intensity = pulse * 2.2
      this._panicLights?.forEach((pl, i) => {
        pl.intensity = ((Math.sin(this._emergencyTime * 11 + i * Math.PI) + 1) * 0.5) * 1.6
      })
      // Flicker background color
      const r = Math.floor(10 + pulse * 18)
      this._scene.background = new THREE.Color(r / 255, 5 / 255, 5 / 255)
    } else {
      this._emergencyLight.intensity = Math.max(0, Math.sin(this._emergencyTime * 1.8)) * 0.06
    }

    // ── Camera shake ──────────────────────────────────────────────────────
    if (this._cameraShake > 0.01) {
      this._cameraShake *= 0.88
    } else {
      this._cameraShake = 0
    }
    const shk = this._cameraShake

    // ── Camera follow ─────────────────────────────────────────────────────
    const targetX = this._player.position.x * 0.32
    const targetZ = this._player.position.z * 0.28 + 5.8
    this._camera.position.x += (targetX - this._camera.position.x) * 0.05 + (Math.random() - 0.5) * shk * 0.06
    this._camera.position.z += (targetZ - this._camera.position.z) * 0.05 + (Math.random() - 0.5) * shk * 0.04
    this._camera.position.y = 2.8 + (Math.random() - 0.5) * shk * 0.03
    this._camera.lookAt(
      this._player.position.x * 0.5 + (Math.random() - 0.5) * shk * 0.05,
      1.4,
      this._player.position.z * 0.3 - 0.8
    )

    this._renderer.render(this._scene, this._camera)
  }

  _animateWalk(group, t) {
    group.children.forEach(child => {
      if (!child.isMesh) return
      const ax = Math.abs(child.position.x)
      const ay = child.position.y
      // Arms
      if (ax > 0.25 && ax < 0.65 && ay < 1.3 && ay > 0.65) {
        const side = child.position.x > 0 ? 1 : -1
        child.rotation.x = Math.sin(t + side * Math.PI) * 0.42
      }
      // Legs upper
      if (ax < 0.2 && ay > 0.55 && ay < 0.9) {
        const side = child.position.x > 0 ? 1 : -1
        child.rotation.x = Math.sin(t * 1.0 + side * Math.PI) * 0.35
      }
    })
  }

  // ── Procedural textures ───────────────────────────────────────────────────

  _makeTileTexture() {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#14142a'
    ctx.fillRect(0, 0, size, size)
    const ts = size / 4
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const bx = tx * ts, by = ty * ts
        const s = 18 + Math.floor(Math.random() * 7)
        ctx.fillStyle = `rgb(${s},${s},${s+14})`
        ctx.fillRect(bx+2, by+2, ts-4, ts-4)
        ctx.fillStyle = '#080818'
        ctx.fillRect(bx, by, ts, 2)
        ctx.fillRect(bx, by, 2, ts)
      }
    }
    const g = ctx.createRadialGradient(size/2, size/2, 8, size/2, size/2, size/1.4)
    g.addColorStop(0, 'rgba(70,85,150,0.14)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(7, 6)
    return tex
  }

  _makeWhiteboardTexture() {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 256
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#f2f2ff'
    ctx.fillRect(0, 0, 512, 256)
    ctx.font = 'bold 19px monospace'
    ctx.fillStyle = '#1a2090'
    ctx.fillText('PLACEMENT PREP 2026:', 16, 36)
    ctx.font = '15px monospace'
    const lines = [
      '✓ Arrays, Trees, Graphs, DP',
      '✓ System Design — basics',
      '? OOP & Design Patterns',
      '✗ Mock Interviews ← DO THIS!!',
      '!! RESUME — update NOW !!',
    ]
    lines.forEach((l, i) => {
      ctx.fillStyle = l.startsWith('✗') ? '#cc1a1a' : l.startsWith('!!') ? '#cc6600' : '#1a2060'
      ctx.fillText(l, 16, 68 + i * 30)
    })
    ctx.font = 'italic 13px serif'
    ctx.fillStyle = '#806020'
    ctx.fillText('O(n log n) << O(n²) — REMEMBER THIS', 16, 232)
    return new THREE.CanvasTexture(c)
  }

  _makeProjectorTexture() {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 360
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#04050e'
    ctx.fillRect(0, 0, 512, 360)
    ctx.fillStyle = '#263070'
    ctx.fillRect(0, 0, 512, 72)
    ctx.font = 'bold 22px Arial Narrow'
    ctx.fillStyle = '#fff'
    ctx.fillText('Campus Placements 2026 — CS Dept', 24, 46)
    ctx.font = '13px monospace'
    ctx.fillStyle = '#7090ee'
    ctx.fillText('Company Visit Schedule', 24, 92)
    ctx.fillStyle = '#1c2240'
    ctx.fillRect(16, 108, 478, 32)
    ctx.fillStyle = '#b0c4ff'
    ctx.font = '12px monospace'
    ;['Company','Date','Package','Status'].forEach((h,i) => ctx.fillText(h, 26+i*118, 130))
    ;[['Google','14 Jan','45 LPA','✓ Open'],['Amazon','18 Jan','32 LPA','✓ Open'],
      ['Infosys','21 Jan','8 LPA','✓ Open'],['???','TBD','?? LPA','⚠ UNKNOWN']].forEach((row,ri) => {
      ctx.fillStyle = ri % 2 === 0 ? '#0c0f1e' : '#10142a'
      ctx.fillRect(16, 144+ri*29, 478, 29)
      ctx.fillStyle = ri === 3 ? '#ff7733' : '#aadda0'
      ctx.font = '11px monospace'
      row.forEach((cell,ci) => ctx.fillText(cell, 26+ci*118, 163+ri*29))
    })
    ctx.font = 'italic 11px sans-serif'
    ctx.fillStyle = '#3a4870'
    ctx.fillText('Attendance mandatory. Formal dress code enforced.', 24, 345)
    return new THREE.CanvasTexture(c)
  }

  _makeNightSkyTexture() {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0,0,0,256)
    g.addColorStop(0,'#020718'); g.addColorStop(1,'#040e28')
    ctx.fillStyle = g; ctx.fillRect(0,0,128,256)
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.25+Math.random()*0.75})`
      ctx.beginPath()
      ctx.arc(Math.random()*128, Math.random()*256, 0.4+Math.random()*0.9, 0, Math.PI*2)
      ctx.fill()
    }
    const moon = ctx.createRadialGradient(98,38,2,98,38,22)
    moon.addColorStop(0,'rgba(220,225,255,0.95)')
    moon.addColorStop(0.45,'rgba(170,175,240,0.35)')
    moon.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle = moon; ctx.fillRect(76,18,44,62)
    return new THREE.CanvasTexture(c)
  }

  _makePosterTexture(label, bgColor) {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 160
    const ctx = c.getContext('2d')
    const r=(bgColor>>16)&255, g=(bgColor>>8)&255, b=bgColor&255
    ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0,0,128,160)
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(0,0,128,30)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'
    label.split('\n').forEach((ln,i) => ctx.fillText(ln, 10, 24+i*42))
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 3
    ctx.strokeRect(3,3,122,154)
    return new THREE.CanvasTexture(c)
  }

  _makeTextSprite(text, color='#ffffff', fontSize=26) {
    const c = document.createElement('canvas')
    c.width = 320; c.height = 80
    const ctx = c.getContext('2d')
    ctx.clearRect(0,0,320,80)
    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    ctx.beginPath()
    ctx.roundRect(4,4,312,72,8)
    ctx.fill()
    ctx.font = `bold ${fontSize}px "Nunito", sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fillText(text, 160, 42)
    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    return new THREE.Sprite(mat)
  }
}