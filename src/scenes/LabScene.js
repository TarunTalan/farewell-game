// ─────────────────────────────────────────────────────────────────────────────
// LabScene.js — Ultra-Realistic 3D Computer Lab Scene (Three.js)
// Drop this file in place of the old LabScene.js
// Requires Three.js r128+ loaded before this module.
//
// HOW IT INTEGRATES WITH YOUR PHASER GAME:
//   • LabScene is a Phaser Scene that creates a THREE.js canvas overlay.
//   • When the scene shuts down, the Three.js renderer is fully disposed.
//   • On "game start" trigger, Three.js canvas is removed and Phaser resumes.
// ─────────────────────────────────────────────────────────────────────────────

import { DialogueSystem } from '../systems/DialogueSystem.js'
import { CharacterSelect } from '../systems/CharacterSelect.js'
import { gameState } from '../data/GameState.js'

// ── Three.js dynamic import helper ───────────────────────────────────────────
// If you already have Three globally (via <script>), remove this and use window.THREE
let THREE = null

async function loadThree() {
  if (window.THREE) { THREE = window.THREE; return }
  // CDN fallback
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.onload = () => { THREE = window.THREE; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── NPC data ─────────────────────────────────────────────────────────────────
const NPC_DATA = [
  {
    name: 'Ritik',
    color: 0x3a7bd5,
    skinTone: 0xd4956a,
    hairColor: 0x1a0a00,
    position: { x: -3.2, z: -1.0 },
    rotation: 0.3,
    dialogues: [
      'Bhai, placement ho gayi toh party, nahi hui toh bhi party! 🎉',
      'Tension mat le, HR bhi ek insaan hai... probably.',
      'Resume mein "team player" likha hai, toh chal khel team ke saath!'
    ],
    isTrigger: false   // funny NPCs
  },
  {
    name: 'Shivansh',
    color: 0xe05c3a,
    skinTone: 0xc87941,
    hairColor: 0x0a0500,
    position: { x: -1.0, z: -2.5 },
    rotation: -0.2,
    dialogues: [
      'Yaar, mera CGPA 6.2 hai... main Google mein apply kar raha hoon. 😎',
      'Interviewer ne pocha "weakness kya hai?" Maine bola "khaana zyada kha leta hoon".',
      'Reject hua toh next company, accept hua toh — bhi next company!'
    ],
    isTrigger: false
  },
  {
    name: 'Anmol',
    color: 0x27ae60,
    skinTone: 0xe8b89a,
    hairColor: 0x200a00,
    position: { x: 1.2, z: -1.8 },
    rotation: 0.5,
    dialogues: [
      'Ek baar mujhe internship mili thi. Bas ek baar. Sapna tha. 😭',
      'DSA easy hai bhai — bas pointers, recursion, trees, graphs yaad rakh.',
      'Chill maar. Worst case toh UPSC hai hi.'
    ],
    isTrigger: false
  },
  {
    name: 'Divyansh',
    color: 0x8e44ad,
    skinTone: 0xd48b6a,
    hairColor: 0x0d0600,
    position: { x: 3.0, z: -0.8 },
    rotation: -0.6,
    dialogues: [
      '⚠️ SIR PLZZZZ SUNIYE! LAB PE KHATRA HAI!',
      'Professor ne kaha hai kal VIVA hai... aur questions INTERNET pe nahi hain!',
      'BACHAO BHAI! Systems crash ho rahe hain, data wipe ho raha hai!\nAagar aaj yeh nahi ruka toh sab khatam! Game start karo ABHI!'
    ],
    isTrigger: true    // ← this one triggers game start after all 3 lines
  }
]

// ─────────────────────────────────────────────────────────────────────────────
export class LabScene extends Phaser.Scene {
  constructor() { super('LabScene') }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────

  async create() {
    // Fade the Phaser canvas out completely — Three.js takes over visually
    this.cameras.main.setAlpha(0)

    await loadThree()

    this._initThreeRenderer()
    this._buildLab()
    this._buildNPCs()
    this._buildPlayer()
    this._setupLighting()
    this._setupInput()
    this._setupCollision()

    // Overlay UI (dialogue box stays in DOM, above Three.js canvas)
    this._createDialogueOverlay()

    // Start render loop
    this._running = true
    this._animate()

    // Fade in Three.js canvas
    this._threeCanvas.style.opacity = '0'
    this._threeCanvas.style.transition = 'opacity 1.5s ease'
    requestAnimationFrame(() => {
      this._threeCanvas.style.opacity = '1'
    })

    // Instruction text
    this._showHint('Arrow Keys = Move  |  ENTER = Talk')
  }

  shutdown() {
    this._running = false
    if (this._renderer) {
      this._renderer.dispose()
      this._renderer.domElement.remove()
    }
    if (this._dialogueEl) this._dialogueEl.remove()
    if (this._hintEl) this._hintEl.remove()
    document.removeEventListener('keydown', this._keyHandler)
  }

  // ── Three.js renderer setup ───────────────────────────────────────────────

  _initThreeRenderer() {
    const W = this.scale.width
    const H = this.scale.height

    this._scene    = new THREE.Scene()
    this._camera   = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })

    this._renderer.setSize(W, H)
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping
    this._renderer.toneMappingExposure = 1.1

    this._threeCanvas = this._renderer.domElement
    this._threeCanvas.style.position = 'absolute'
    this._threeCanvas.style.top      = '0'
    this._threeCanvas.style.left     = '0'
    this._threeCanvas.style.zIndex   = '5'
    this._threeCanvas.style.pointerEvents = 'none'

    // Insert over Phaser canvas
    const phaserCanvas = this.game.canvas
    phaserCanvas.parentNode.insertBefore(this._threeCanvas, phaserCanvas.nextSibling)

    // Camera position — slightly elevated, looking into the lab
    this._camera.position.set(0, 3.5, 7)
    this._camera.lookAt(0, 1.2, 0)

    // Camera target for smooth follow
    this._camTarget = new THREE.Vector3(0, 3.5, 7)
    this._camLookAt = new THREE.Vector3(0, 1.2, 0)

    // Fog for depth
    this._scene.fog = new THREE.Fog(0x0a0a1e, 14, 28)
    this._scene.background = new THREE.Color(0x0a0a1e)
  }

  // ── Lab construction ──────────────────────────────────────────────────────

  _buildLab() {
    // ── Floor (tiled linoleum) ────────────────────────────────────────────
    const floorGeo  = new THREE.PlaneGeometry(20, 16, 20, 16)
    const floorMat  = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.3,
      metalness: 0.1,
    })
    // Add tile grid via canvas texture
    floorMat.map = this._makeTileTexture()
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this._scene.add(floor)

    // Floor reflection strip
    const refGeo = new THREE.PlaneGeometry(20, 16)
    const refMat = new THREE.MeshStandardMaterial({
      color: 0x3050a0,
      transparent: true,
      opacity: 0.08,
      roughness: 0.0,
      metalness: 0.9
    })
    const ref = new THREE.Mesh(refGeo, refMat)
    ref.rotation.x = -Math.PI / 2
    ref.position.y = 0.002
    this._scene.add(ref)

    // ── Ceiling ───────────────────────────────────────────────────────────
    const ceilGeo = new THREE.PlaneGeometry(20, 16)
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x141420, roughness: 1 })
    const ceil = new THREE.Mesh(ceilGeo, ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.y = 4.5
    this._scene.add(ceil)

    // ── Walls ─────────────────────────────────────────────────────────────
    this._addWall(0, 2.25, -8,   20, 4.5, 0.18,  0x16162a) // back
    this._addWall(0, 2.25,  8,   20, 4.5, 0.18,  0x16162a) // front (behind camera)
    this._addWall(-10, 2.25, 0,  0.18, 4.5, 16,  0x14142a) // left
    this._addWall( 10, 2.25, 0,  0.18, 4.5, 16,  0x14142a) // right

    // Baseboard trim
    this._addWall(0, 0.06, -8,   20, 0.12, 0.22, 0x2a2a50)
    this._addWall(-10, 0.06, 0,  0.22, 0.12, 16,  0x2a2a50)
    this._addWall( 10, 0.06, 0,  0.22, 0.12, 16,  0x2a2a50)

    // ── Ceiling fluorescent light fixtures ────────────────────────────────
    const lightPositions = [-6, -2, 2, 6]
    lightPositions.forEach(x => {
      this._addCeilingLight(x, -3)
      this._addCeilingLight(x,  0)
      this._addCeilingLight(x,  3)
    })

    // ── Computer desks (2 rows of 4 desks) ───────────────────────────────
    const deskConfigs = [
      // Back row
      { x: -5.5, z: -4.5 }, { x: -2.0, z: -4.5 },
      { x:  1.5, z: -4.5 }, { x:  5.0, z: -4.5 },
      // Middle row
      { x: -5.5, z: -1.5 }, { x: -2.0, z: -1.5 },
      { x:  1.5, z: -1.5 }, { x:  5.0, z: -1.5 },
    ]
    deskConfigs.forEach(d => this._buildDesk(d.x, d.z))

    // ── Back wall whiteboard ──────────────────────────────────────────────
    this._buildWhiteboard(-3, 2.4, -7.85)

    // ── Window on right wall ──────────────────────────────────────────────
    this._buildWindow(9.85, 2.2, -2)

    // ── Door on left wall ────────────────────────────────────────────────
    this._buildDoor(-9.85, 1.2, 1)

    // ── Overhead projector screen ─────────────────────────────────────────
    this._buildProjectorScreen(3.5, 2.4, -7.85)

    // ── Server rack in corner ─────────────────────────────────────────────
    this._buildServerRack(9.0, 0, -7.0)

    // ── Network cables on wall ────────────────────────────────────────────
    this._addCableRun()

    // ── Posters on back wall ──────────────────────────────────────────────
    this._addWallPosters()
  }

  // ── Lab elements ──────────────────────────────────────────────────────────

  _addWall(x, y, z, w, h, d, color) {
    const g = new THREE.BoxGeometry(w, h, d)
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 })
    const mesh = new THREE.Mesh(g, m)
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    this._scene.add(mesh)
    return mesh
  }

  _buildDesk(x, z) {
    const group = new THREE.Group()

    // Desktop surface
    const topGeo = new THREE.BoxGeometry(2.2, 0.05, 0.9)
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x2a2040, roughness: 0.4, metalness: 0.05
    })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.y = 0.75
    top.castShadow = true
    top.receiveShadow = true
    group.add(top)

    // Desk legs (4)
    const legGeo = new THREE.BoxGeometry(0.06, 0.75, 0.06)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a30, metalness: 0.6, roughness: 0.4 })
    const legPos = [[-0.95, -1.2], [0.95, -1.2], [-0.95, 1.2], [0.95, 1.2]]
    // actually relative to desk surface
    ;[[-0.95, -0.35], [0.95, -0.35], [-0.95, 0.35], [0.95, 0.35]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(lx, 0.375, lz)
      group.add(leg)
    })

    // Under-desk modesty panel
    const panelGeo = new THREE.BoxGeometry(2.2, 0.4, 0.04)
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e1e35 })
    const panel = new THREE.Mesh(panelGeo, panelMat)
    panel.position.set(0, 0.5, 0.43)
    group.add(panel)

    // ── Monitor ──────────────────────────────────────────────────────────
    const monitorGroup = new THREE.Group()

    // Screen bezel
    const bezelGeo = new THREE.BoxGeometry(0.72, 0.44, 0.04)
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.2, metalness: 0.6 })
    const bezel = new THREE.Mesh(bezelGeo, bezelMat)
    bezel.castShadow = true
    monitorGroup.add(bezel)

    // Screen glow (emissive panel)
    const screenGeo = new THREE.PlaneGeometry(0.64, 0.38)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      emissive: new THREE.Color(0x0a2060),
      emissiveIntensity: 2.5,
      roughness: 0.0,
      metalness: 0.0
    })
    const screen = new THREE.Mesh(screenGeo, screenMat)
    screen.position.z = 0.022
    monitorGroup.add(screen)

    // Code lines on screen (tiny rectangles)
    const codeColors = [0x00ff88, 0x4080ff, 0xff8040, 0xffff40, 0xffffff]
    for (let row = 0; row < 6; row++) {
      const lineLen = 0.1 + Math.random() * 0.3
      const lineGeo = new THREE.PlaneGeometry(lineLen, 0.012)
      const lineMat = new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(codeColors[row % codeColors.length]),
        emissiveIntensity: 1.5
      })
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.position.set(-0.28 + lineLen / 2, 0.14 - row * 0.05, 0.025)
      monitorGroup.add(line)
    }

    // Monitor stand neck
    const neckGeo = new THREE.BoxGeometry(0.06, 0.18, 0.06)
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, metalness: 0.7, roughness: 0.3 })
    const neck = new THREE.Mesh(neckGeo, neckMat)
    neck.position.y = -0.31
    monitorGroup.add(neck)

    // Stand base
    const baseGeo = new THREE.BoxGeometry(0.28, 0.025, 0.18)
    const baseMesh = new THREE.Mesh(baseGeo, neckMat)
    baseMesh.position.y = -0.4
    monitorGroup.add(baseMesh)

    monitorGroup.position.set(0, 1.15, -0.1)
    group.add(monitorGroup)

    // ── Keyboard ──────────────────────────────────────────────────────────
    const kbGeo = new THREE.BoxGeometry(0.6, 0.018, 0.22)
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 0.5, metalness: 0.3 })
    const kb = new THREE.Mesh(kbGeo, kbMat)
    kb.position.set(0, 0.779, 0.18)
    // Key bumps
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        const keyGeo = new THREE.BoxGeometry(0.038, 0.016, 0.038)
        const keyMat = new THREE.MeshStandardMaterial({ color: 0x252535, roughness: 0.8 })
        const key = new THREE.Mesh(keyGeo, keyMat)
        key.position.set(-0.25 + c * 0.046, 0.791, 0.08 + r * 0.05)
        group.add(key)
      }
    }
    group.add(kb)

    // ── Mouse ─────────────────────────────────────────────────────────────
    const mouseGeo = new THREE.BoxGeometry(0.1, 0.028, 0.14)
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x141422, roughness: 0.4, metalness: 0.4 })
    const mouse = new THREE.Mesh(mouseGeo, mouseMat)
    mouse.position.set(0.38, 0.779, 0.16)
    group.add(mouse)

    // ── CPU tower ─────────────────────────────────────────────────────────
    const cpuGeo = new THREE.BoxGeometry(0.18, 0.42, 0.35)
    const cpuMat = new THREE.MeshStandardMaterial({ color: 0x181828, roughness: 0.5, metalness: 0.5 })
    const cpu = new THREE.Mesh(cpuGeo, cpuMat)
    cpu.position.set(0.95, 0.96, 0.02)
    cpu.castShadow = true
    // Power LED
    const ledGeo = new THREE.SphereGeometry(0.012, 6, 6)
    const ledMat = new THREE.MeshStandardMaterial({ emissive: 0x00ff44, emissiveIntensity: 3 })
    const led = new THREE.Mesh(ledGeo, ledMat)
    led.position.set(0.95, 0.78, -0.21)
    group.add(led)
    group.add(cpu)

    // ── Mouse pad ─────────────────────────────────────────────────────────
    const padGeo = new THREE.PlaneGeometry(0.22, 0.18)
    const padMat = new THREE.MeshStandardMaterial({ color: 0x0d0d20, roughness: 0.9 })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.rotation.x = -Math.PI / 2
    pad.position.set(0.38, 0.753, 0.16)
    group.add(pad)

    group.position.set(x, 0, z)
    group.castShadow = true
    this._scene.add(group)
    return group
  }

  _addCeilingLight(x, z) {
    const group = new THREE.Group()

    // Fixture housing
    const houseGeo = new THREE.BoxGeometry(1.4, 0.06, 0.18)
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xd0d0e0, roughness: 0.3, metalness: 0.4 })
    const house = new THREE.Mesh(houseGeo, houseMat)
    group.add(house)

    // Tube glow
    const tubeGeo = new THREE.BoxGeometry(1.3, 0.02, 0.1)
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xd0e8ff),
      emissiveIntensity: 4
    })
    const tube = new THREE.Mesh(tubeGeo, tubeMat)
    tube.position.y = -0.025
    group.add(tube)

    group.position.set(x, 4.47, z)
    this._scene.add(group)

    // Actual point light
    const light = new THREE.PointLight(0xb0c8ff, 0.7, 8)
    light.position.set(x, 4.2, z)
    light.castShadow = false
    this._scene.add(light)
  }

  _buildWhiteboard(x, y, z) {
    // Frame
    const frameGeo = new THREE.BoxGeometry(3.6, 1.8, 0.06)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x303050, metalness: 0.7, roughness: 0.3 })
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.set(x, y, z)
    this._scene.add(frame)

    // Board surface
    const boardGeo = new THREE.PlaneGeometry(3.4, 1.6)
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      roughness: 0.9,
      metalness: 0
    })
    boardMat.map = this._makeWhiteboardTexture()
    const board = new THREE.Mesh(boardGeo, boardMat)
    board.position.set(x, y, z + 0.034)
    this._scene.add(board)

    // Tray
    const trayGeo = new THREE.BoxGeometry(3.4, 0.06, 0.12)
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x252535, metalness: 0.6 })
    const tray = new THREE.Mesh(trayGeo, trayMat)
    tray.position.set(x, y - 0.88, z + 0.06)
    this._scene.add(tray)
  }

  _buildProjectorScreen(x, y, z) {
    const screenGeo = new THREE.PlaneGeometry(2.4, 1.6)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      emissive: new THREE.Color(0x0a1a40),
      emissiveIntensity: 1.5,
      roughness: 0.1
    })
    screenMat.map = this._makeProjectorTexture()
    const screen = new THREE.Mesh(screenGeo, screenMat)
    screen.position.set(x, y, z + 0.01)
    this._scene.add(screen)

    // Frame
    const frameGeo = new THREE.BoxGeometry(2.5, 1.7, 0.05)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18 })
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.set(x, y, z)
    this._scene.add(frame)
  }

  _buildWindow(x, y, z) {
    // Frame
    const fGeo = new THREE.BoxGeometry(0.12, 2.2, 1.6)
    const fMat = new THREE.MeshStandardMaterial({ color: 0x1a1a38, roughness: 0.5 })
    const frame = new THREE.Mesh(fGeo, fMat)
    frame.position.set(x, y, z)
    this._scene.add(frame)

    // Glass panes
    const glassGeo = new THREE.PlaneGeometry(1.4, 2.0)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x4070a0,
      transparent: true,
      opacity: 0.25,
      roughness: 0.0,
      metalness: 0.0,
      emissive: new THREE.Color(0x102040),
      emissiveIntensity: 0.5
    })
    const glass = new THREE.Mesh(glassGeo, glassMat)
    glass.rotation.y = -Math.PI / 2
    glass.position.set(x - 0.02, y, z)
    this._scene.add(glass)

    // Night sky visible through window
    const skyGeo = new THREE.PlaneGeometry(1.4, 2.0)
    const skyMat = new THREE.MeshStandardMaterial({
      color: 0x040820,
      emissive: new THREE.Color(0x010510),
      emissiveIntensity: 1
    })
    skyMat.map = this._makeNightSkyTexture()
    const sky = new THREE.Mesh(skyGeo, skyMat)
    sky.rotation.y = -Math.PI / 2
    sky.position.set(x - 0.15, y, z)
    this._scene.add(sky)

    // Window light spill on floor
    const spillGeo = new THREE.PlaneGeometry(2.0, 1.8)
    const spillMat = new THREE.MeshStandardMaterial({
      color: 0x102030,
      transparent: true,
      opacity: 0.15
    })
    const spill = new THREE.Mesh(spillGeo, spillMat)
    spill.rotation.x = -Math.PI / 2
    spill.rotation.z = Math.PI / 2
    spill.position.set(x - 2, 0.01, z)
    this._scene.add(spill)
  }

  _buildDoor(x, y, z) {
    const doorGeo = new THREE.BoxGeometry(0.1, 2.4, 1.1)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.6 })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(x, y, z)
    door.castShadow = true
    this._scene.add(door)

    // Door panels
    const panelGeo = new THREE.BoxGeometry(0.06, 0.8, 0.45)
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0a, roughness: 0.8 })
    ;[0.25, -0.25].forEach(pz => {
      ;[0.4, -0.4].forEach(py => {
        const p = new THREE.Mesh(panelGeo, panelMat)
        p.position.set(x - 0.01, y + py, z + pz)
        this._scene.add(p)
      })
    })

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    const handle = new THREE.Mesh(handleGeo, handleMat)
    handle.rotation.z = Math.PI / 2
    handle.position.set(x + 0.08, y, z + 0.45)
    this._scene.add(handle)
  }

  _buildServerRack(x, y, z) {
    const rackGeo = new THREE.BoxGeometry(0.7, 2.2, 0.55)
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, metalness: 0.8, roughness: 0.3 })
    const rack = new THREE.Mesh(rackGeo, rackMat)
    rack.position.set(x, 1.1, z)
    rack.castShadow = true
    this._scene.add(rack)

    // Units with LED indicators
    for (let u = 0; u < 10; u++) {
      const unitGeo = new THREE.BoxGeometry(0.62, 0.14, 0.04)
      const unitMat = new THREE.MeshStandardMaterial({ color: 0x141425, metalness: 0.6 })
      const unit = new THREE.Mesh(unitGeo, unitMat)
      unit.position.set(x, 0.2 + u * 0.18, z - 0.26)
      this._scene.add(unit)

      // LED
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        new THREE.MeshStandardMaterial({
          emissive: new THREE.Color(u % 3 === 0 ? 0xff4400 : 0x00ff44),
          emissiveIntensity: 3
        })
      )
      led.position.set(x + 0.25, 0.2 + u * 0.18, z - 0.27)
      this._scene.add(led)
    }
  }

  _addCableRun() {
    // Horizontal cable tray on back wall
    const trayGeo = new THREE.BoxGeometry(18, 0.08, 0.12)
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1a1a30, metalness: 0.6 })
    const tray = new THREE.Mesh(trayGeo, trayMat)
    tray.position.set(0, 0.5, -7.8)
    this._scene.add(tray)

    // Individual cables (colorful wires)
    const cableColors = [0x4040ff, 0xff4040, 0x40ff40, 0xffff40, 0xff40ff]
    cableColors.forEach((c, i) => {
      const points = []
      for (let t = 0; t <= 20; t++) {
        points.push(new THREE.Vector3(
          -9 + t * 0.9,
          0.46 + Math.sin(t * 0.8 + i) * 0.04,
          -7.74 - i * 0.012
        ))
      }
      const curve = new THREE.CatmullRomCurve3(points)
      const cableGeo = new THREE.TubeGeometry(curve, 30, 0.006, 4, false)
      const cableMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })
      this._scene.add(new THREE.Mesh(cableGeo, cableMat))
    })
  }

  _addWallPosters() {
    const posters = [
      { x: -7.5, y: 2.8, z: -7.82, label: 'PLACEMENT\nDRIVE\n2026', color: 0xff3030 },
      { x: -5.0, y: 2.8, z: -7.82, label: 'ACM\nCODING\nCLUB', color: 0x30a0ff },
      { x: -8.0, y: 1.5, z: -7.82, label: 'CS DEPT\nNOTICE\nBOARD', color: 0x30d060 },
    ]

    posters.forEach(p => {
      const geo = new THREE.PlaneGeometry(0.7, 0.9)
      const tex = this._makePosterTexture(p.label, p.color)
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(p.x, p.y, p.z + 0.02)
      this._scene.add(mesh)
    })
  }

  // ── NPC construction ──────────────────────────────────────────────────────

  _buildNPCs() {
    this._npcs = []
    NPC_DATA.forEach(data => this._npcs.push(this._buildCharacter(data, false)))
  }

  _buildPlayer() {
    this._player = this._buildCharacter({
      name: 'You',
      color: 0xf0c040,
      skinTone: 0xd4956a,
      hairColor: 0x1a0a00,
      position: { x: 0, z: 3.5 },
      rotation: 0,
    }, true)

    this._playerSpeed   = 0.07
    this._playerBobTime = 0
    this._keys          = {}
  }

  _buildCharacter(data, isPlayer) {
    const group = new THREE.Group()
    const skin  = data.skinTone
    const shirt = data.color
    const hair  = data.hairColor

    // ── Head ──────────────────────────────────────────────────────────────
    const headGeo = new THREE.SphereGeometry(0.16, 16, 16)
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 })
    const head = new THREE.Mesh(headGeo, skinMat)
    head.position.y = 1.72
    head.castShadow = true
    group.add(head)

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.165, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)
    const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 1.0 })
    const hairMesh = new THREE.Mesh(hairGeo, hairMat)
    hairMesh.position.y = 1.73
    group.add(hairMesh)

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.028, 8, 8)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.3 })
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
    ;[-0.06, 0.06].forEach(ex => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeWhiteMat)
      white.position.set(ex, 1.73, 0.14)
      group.add(white)
      const pupil = new THREE.Mesh(eyeGeo, eyeMat)
      pupil.position.set(ex, 1.73, 0.17)
      group.add(pupil)
    })

    // Mouth
    const mouthGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 10, Math.PI)
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8b2020 })
    const mouth = new THREE.Mesh(mouthGeo, mouthMat)
    mouth.rotation.z = Math.PI
    mouth.position.set(0, 1.635, 0.155)
    group.add(mouth)

    // ── Neck ──────────────────────────────────────────────────────────────
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10)
    const neck = new THREE.Mesh(neckGeo, skinMat)
    neck.position.y = 1.54
    group.add(neck)

    // ── Torso ─────────────────────────────────────────────────────────────
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.52, 0.22)
    const torsoMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.8 })
    const torso = new THREE.Mesh(torsoGeo, torsoMat)
    torso.position.y = 1.22
    torso.castShadow = true
    group.add(torso)

    // Shirt collar
    const collarGeo = new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI)
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    const collar = new THREE.Mesh(collarGeo, collarMat)
    collar.rotation.x = -Math.PI / 4
    collar.position.set(0, 1.46, 0.07)
    group.add(collar)

    // Shirt button line
    for (let b = 0; b < 3; b++) {
      const btnGeo = new THREE.SphereGeometry(0.012, 6, 6)
      const btnMat = new THREE.MeshStandardMaterial({ color: 0xdddddd })
      const btn = new THREE.Mesh(btnGeo, btnMat)
      btn.position.set(0, 1.38 - b * 0.1, 0.112)
      group.add(btn)
    }

    // ── Arms ──────────────────────────────────────────────────────────────
    ;[-1, 1].forEach(side => {
      const upperArmGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.28, 10)
      const upperArm = new THREE.Mesh(upperArmGeo, torsoMat)
      upperArm.position.set(side * 0.25, 1.22, 0)
      upperArm.rotation.z = side * 0.18
      upperArm.castShadow = true
      group.add(upperArm)

      const forearmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.26, 10)
      const forearm = new THREE.Mesh(forearmGeo, skinMat)
      forearm.position.set(side * 0.3, 0.95, 0)
      forearm.rotation.z = side * 0.25
      group.add(forearm)

      // Hand
      const handGeo = new THREE.SphereGeometry(0.055, 8, 8)
      const hand = new THREE.Mesh(handGeo, skinMat)
      hand.position.set(side * 0.35, 0.82, 0)
      group.add(hand)
    })

    // ── Legs ──────────────────────────────────────────────────────────────
    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x1a1a40, roughness: 0.85 })
    ;[-0.1, 0.1].forEach(lx => {
      const upperLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.075, 0.42, 10), trouserMat
      )
      upperLeg.position.set(lx, 0.76, 0)
      upperLeg.castShadow = true
      group.add(upperLeg)

      const lowerLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.055, 0.40, 10), trouserMat
      )
      lowerLeg.position.set(lx, 0.38, 0)
      group.add(lowerLeg)

      // Shoe
      const shoeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.22)
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.7 })
      const shoe = new THREE.Mesh(shoeGeo, shoeMat)
      shoe.position.set(lx, 0.14, 0.04)
      group.add(shoe)
    })

    // ── Waist belt ────────────────────────────────────────────────────────
    const beltGeo = new THREE.BoxGeometry(0.4, 0.06, 0.24)
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.5, metalness: 0.4 })
    const belt = new THREE.Mesh(beltGeo, beltMat)
    belt.position.y = 0.97
    group.add(belt)

    // Belt buckle
    const buckleGeo = new THREE.BoxGeometry(0.08, 0.055, 0.03)
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    const buckle = new THREE.Mesh(buckleGeo, buckleMat)
    buckle.position.set(0, 0.97, 0.13)
    group.add(buckle)

    // ── Shadow disc ───────────────────────────────────────────────────────
    const shadowGeo = new THREE.CircleGeometry(0.22, 16)
    const shadowMat = new THREE.MeshStandardMaterial({
      color: 0x000000, transparent: true, opacity: 0.25
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.005
    group.add(shadow)

    // ── Name tag (floating text via canvas sprite) ─────────────────────
    const nameSprite = this._makeTextSprite(data.name, isPlayer ? '#f0c040' : '#80c0ff')
    nameSprite.position.y = 2.1
    nameSprite.scale.set(1.2, 0.35, 1)
    group.add(nameSprite)

    // Interaction arrow (for NPCs only)
    let arrow = null
    if (!isPlayer) {
      arrow = this._makeTextSprite('▼ ENTER', '#ffff40')
      arrow.position.y = 2.5
      arrow.scale.set(1.0, 0.3, 1)
      arrow.visible = false
      group.add(arrow)
    }

    // ── Position ──────────────────────────────────────────────────────────
    group.position.set(data.position.x, 0, data.position.z)
    group.rotation.y = data.rotation || 0

    this._scene.add(group)

    // Store metadata
    group.userData = {
      name: data.name,
      dialogues: data.dialogues || [],
      isTrigger: data.isTrigger || false,
      isNPC: !isPlayer,
      arrow,
      dialogueIndex: 0,
      group
    }

    // Walking animation time offset
    group.userData.walkOffset = Math.random() * Math.PI * 2

    return group
  }

  // ── Lighting ──────────────────────────────────────────────────────────────

  _setupLighting() {
    // Ambient — very dim, cool blue tint for night feel
    const ambient = new THREE.AmbientLight(0x1a2040, 0.8)
    this._scene.add(ambient)

    // Hemisphere — sky (cool) vs ground (warm dim)
    const hemi = new THREE.HemisphereLight(0x203060, 0x100810, 0.4)
    this._scene.add(hemi)

    // Main overhead directional
    const dir = new THREE.DirectionalLight(0xb0c0ff, 0.6)
    dir.position.set(-3, 8, 4)
    dir.castShadow = true
    dir.shadow.mapSize.width  = 2048
    dir.shadow.mapSize.height = 2048
    dir.shadow.camera.near = 0.5
    dir.shadow.camera.far  = 40
    dir.shadow.camera.left  = -12
    dir.shadow.camera.right  = 12
    dir.shadow.camera.top    = 12
    dir.shadow.camera.bottom = -12
    dir.shadow.bias = -0.002
    this._scene.add(dir)

    // Monitor glow point lights (subtle teal-ish from desk screens)
    const monitorPositions = [
      [-5.5,-4.5], [-2.0,-4.5], [1.5,-4.5], [5.0,-4.5],
      [-5.5,-1.5], [-2.0,-1.5], [1.5,-1.5], [5.0,-1.5],
    ]
    monitorPositions.forEach(([mx, mz]) => {
      const ml = new THREE.PointLight(0x0a2060, 0.3, 2.5)
      ml.position.set(mx, 1.4, mz)
      this._scene.add(ml)
    })

    // Red emergency light (pulsing) — adds drama
    this._emergencyLight = new THREE.PointLight(0xff1010, 0.0, 8)
    this._emergencyLight.position.set(0, 4.0, -3)
    this._scene.add(this._emergencyLight)
    this._emergencyTime = 0
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
    // Collision radii for NPCs and walls
    this._collisionRadius = 0.45
    this._bounds = { minX: -9, maxX: 9, minZ: -7, maxZ: 5.5 }
  }

  // ── Dialogue overlay ──────────────────────────────────────────────────────

  _createDialogueOverlay() {
    // Remove existing
    document.getElementById('lab-dialogue')?.remove()

    this._dialogueEl = document.createElement('div')
    this._dialogueEl.id = 'lab-dialogue'
    Object.assign(this._dialogueEl.style, {
      position: 'absolute',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '680px',
      maxWidth: '90vw',
      background: 'rgba(6,6,20,0.96)',
      border: '2px solid #4060a0',
      borderRadius: '8px',
      padding: '18px 24px',
      color: '#e0e8ff',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      lineHeight: '1.8',
      zIndex: '20',
      display: 'none',
      boxShadow: '0 0 30px rgba(40,80,255,0.35), inset 0 0 20px rgba(10,20,60,0.5)',
      letterSpacing: '0.05em'
    })

    this._dialogueName = document.createElement('div')
    Object.assign(this._dialogueName.style, {
      color: '#f0c040',
      marginBottom: '8px',
      fontSize: '10px',
      textShadow: '0 0 8px #f0c040'
    })

    this._dialogueText = document.createElement('div')
    this._dialogueText.style.minHeight = '48px'

    const hint = document.createElement('div')
    Object.assign(hint.style, {
      color: '#505080',
      fontSize: '8px',
      marginTop: '10px',
      textAlign: 'right'
    })
    hint.textContent = '[ ENTER ] next'

    this._dialogueEl.appendChild(this._dialogueName)
    this._dialogueEl.appendChild(this._dialogueText)
    this._dialogueEl.appendChild(hint)

    // Append to whatever element wraps the Phaser canvas
    this.game.canvas.parentNode.appendChild(this._dialogueEl)

    this._dialogueActive  = false
    this._dialogueQueue   = []
    this._currentNPCData  = null
  }

  _showDialogueLine(speakerName, text, onDone) {
    this._dialogueEl.style.display = 'block'
    this._dialogueName.textContent  = '▶ ' + speakerName
    this._dialogueText.textContent  = ''
    this._dialogueActive = true

    // Typewriter effect
    let i = 0
    const typed = text.split('')
    const tick = () => {
      if (i < typed.length) {
        this._dialogueText.textContent += typed[i++]
        setTimeout(tick, 28)
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
      top: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#4060a0',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      zIndex: '20',
      pointerEvents: 'none'
    })
    this._hintEl.textContent = msg
    this.game.canvas.parentNode.appendChild(this._hintEl)
    setTimeout(() => {
      if (this._hintEl) this._hintEl.style.opacity = '0'
      this._hintEl.style.transition = 'opacity 1.5s'
    }, 5000)
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  _tryTalk() {
    // If dialogue already open, advance it
    if (this._dialogueActive) {
      // Skip typewriter
      this._dialogueText.textContent = this._dialogueQueue[0] || ''
      return
    }
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
      const dx = npc.position.x - px
      const dz = npc.position.z - pz
      const d  = Math.sqrt(dx * dx + dz * dz)
      if (d < 1.8 && d < closestDist) {
        closestDist = d
        closest = npc
      }
    })

    if (!closest) return

    const ud = closest.userData
    this._inDialogueFlow = true

    const playLine = (idx) => {
      if (idx >= ud.dialogues.length) {
        this._inDialogueFlow = false
        // If this NPC is the trigger character, start the game!
        if (ud.isTrigger) {
          this._triggerGameStart()
        }
        return
      }
      this._showDialogueLine(ud.name, ud.dialogues[idx], () => {
        playLine(idx + 1)
      })
    }

    // Face player toward NPC
    const angle = Math.atan2(
      closest.position.x - px,
      closest.position.z - pz
    )
    this._player.rotation.y = angle

    playLine(0)
  }

  _triggerGameStart() {
    this._showHint('STARTING GAME...')

    // Flash red emergency lights
    this._emergencyFlashing = true

    this.time.delayedCall(2400, () => {
      // Fade out
      if (this._threeCanvas) {
        this._threeCanvas.style.transition = 'opacity 1s ease'
        this._threeCanvas.style.opacity = '0'
      }
      if (this._dialogueEl) {
        this._dialogueEl.style.transition = 'opacity 1s ease'
        this._dialogueEl.style.opacity = '0'
      }

      this.time.delayedCall(1000, () => {
        this.shutdown()

        const dialogueSys = new DialogueSystem(gameState)
        dialogueSys.play('opening', () => {
          const charSelect = new CharacterSelect((selectedSenior) => {
            gameState.selectedSenior = selectedSenior
            dialogueSys.play('selected', () => {
              this.scene.start('GameScene')
            })
          })
          charSelect.show()
        })
      })
    })
  }

  // ── Render / animation loop ───────────────────────────────────────────────

  _animate() {
    if (!this._running) return
    requestAnimationFrame(() => this._animate())

    const dt = 0.016 // ~60fps assumed
    this._emergencyTime += dt

    // ── Player movement ───────────────────────────────────────────────────
    if (!this._inDialogueFlow) {
      let dx = 0, dz = 0
      if (this._keys['ArrowLeft']  || this._keys['KeyA']) dx -= 1
      if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1
      if (this._keys['ArrowUp']    || this._keys['KeyW']) dz -= 1
      if (this._keys['ArrowDown']  || this._keys['KeyS']) dz += 1

      if (dx !== 0 || dz !== 0) {
        const len  = Math.sqrt(dx * dx + dz * dz)
        const nx   = dx / len * this._playerSpeed
        const nz   = dz / len * this._playerSpeed

        let newX = this._player.position.x + nx
        let newZ = this._player.position.z + nz

        // Boundary clamp
        newX = Math.max(this._bounds.minX, Math.min(this._bounds.maxX, newX))
        newZ = Math.max(this._bounds.minZ, Math.min(this._bounds.maxZ, newZ))

        // NPC collision
        let blocked = false
        this._npcs.forEach(npc => {
          const cdx = newX - npc.position.x
          const cdz = newZ - npc.position.z
          if (Math.sqrt(cdx * cdx + cdz * cdz) < this._collisionRadius) blocked = true
        })

        if (!blocked) {
          this._player.position.x = newX
          this._player.position.z = newZ
        }

        // Face direction of movement
        this._player.rotation.y = Math.atan2(dx, dz)

        // Walking bob
        this._playerBobTime += 0.18
        this._player.position.y = Math.abs(Math.sin(this._playerBobTime)) * 0.04

        // Arm swing via group children (crude but effective)
        this._animateWalk(this._player, this._playerBobTime)
      } else {
        this._player.position.y = 0
        this._playerBobTime     = 0
      }
    }

    // ── NPC idle sway ─────────────────────────────────────────────────────
    this._npcs.forEach(npc => {
      const t = this._emergencyTime + npc.userData.walkOffset
      npc.rotation.y = npc.userData.baseRotation ?? (npc.rotation.y)
      npc.position.y = Math.sin(t * 0.8) * 0.012

      // Show/hide interaction arrow
      const dx = npc.position.x - this._player.position.x
      const dz = npc.position.z - this._player.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (npc.userData.arrow) {
        npc.userData.arrow.visible = dist < 1.8
        npc.userData.arrow.position.y = 2.5 + Math.sin(this._emergencyTime * 3) * 0.08
      }

      // Make NPCs face player when nearby
      if (dist < 3.0) {
        const angle = Math.atan2(
          this._player.position.x - npc.position.x,
          this._player.position.z - npc.position.z
        )
        npc.rotation.y += (angle - npc.rotation.y) * 0.06
      }
    })

    // ── Emergency red light pulsing ───────────────────────────────────────
    if (this._emergencyFlashing) {
      this._emergencyLight.intensity = (Math.sin(this._emergencyTime * 12) + 1) * 1.2
    } else {
      // subtle very dim pulse always
      this._emergencyLight.intensity = Math.max(0, Math.sin(this._emergencyTime * 1.5)) * 0.05
    }

    // ── Camera smooth follow ──────────────────────────────────────────────
    const targetCamX = this._player.position.x * 0.35
    const targetCamZ = this._player.position.z * 0.3 + 7
    this._camera.position.x += (targetCamX - this._camera.position.x) * 0.04
    this._camera.position.z += (targetCamZ - this._camera.position.z) * 0.04
    this._camera.lookAt(
      this._player.position.x * 0.5,
      1.2,
      this._player.position.z * 0.3 - 1
    )

    // ── Monitor screen flicker (very subtle) ─────────────────────────────
    // (handled via emissiveIntensity randomisation would need refs — skipped for perf)

    this._renderer.render(this._scene, this._camera)
  }

  _animateWalk(group, t) {
    // Crude arm swing — rotate children that are arms
    // We don't keep individual refs so we do a positional hack on the group
    group.children.forEach(child => {
      if (child.isMesh) {
        // Identify arm meshes by their x position offset
        const ax = Math.abs(child.position.x)
        if (ax > 0.2 && ax < 0.42 && child.position.y < 1.3 && child.position.y > 0.7) {
          const side = child.position.x > 0 ? 1 : -1
          child.rotation.x = Math.sin(t + side * Math.PI) * 0.35
        }
      }
    })
  }

  // ── Procedural textures ───────────────────────────────────────────────────

  _makeTileTexture() {
    const size = 256
    const c    = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, size, size)

    // 4x4 tiles
    const tileSize = size / 4
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const bx = tx * tileSize
        const by = ty * tileSize

        // Slight variation per tile
        const shade = 20 + Math.floor(Math.random() * 6)
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 12})`
        ctx.fillRect(bx + 2, by + 2, tileSize - 4, tileSize - 4)

        // Grout lines
        ctx.fillStyle = '#0a0a18'
        ctx.fillRect(bx, by, tileSize, 2)
        ctx.fillRect(bx, by, 2, tileSize)
      }
    }

    // Subtle specular highlights on tile surface
    const grad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/1.5)
    grad.addColorStop(0, 'rgba(80,90,140,0.12)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 5)
    return tex
  }

  _makeWhiteboardTexture() {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 256
    const ctx = c.getContext('2d')

    ctx.fillStyle = '#f4f4ff'
    ctx.fillRect(0, 0, 512, 256)

    // Marker writing (code-like)
    ctx.font = 'bold 18px monospace'
    ctx.fillStyle = '#1a2080'
    ctx.fillText('PLACEMENT PREP CHECKLIST:', 20, 35)

    ctx.font = '15px monospace'
    ctx.fillStyle = '#203060'
    const lines2 = [
      '✓ DSA: Arrays, Linked Lists, Trees',
      '✓ System Design basics',
      '? OOP & Design Patterns',
      '✗ Mock Interviews ← DO THIS',
      '! RESUME — update ASAP!!',
    ]
    lines2.forEach((l, i) => {
      ctx.fillStyle = l.startsWith('✗') ? '#cc2020' : l.startsWith('!') ? '#cc6600' : '#203060'
      ctx.fillText(l, 20, 70 + i * 28)
    })

    // Scribbled formula
    ctx.font = 'italic 13px serif'
    ctx.fillStyle = '#806020'
    ctx.fillText('O(n log n) ~ O(n²) ??  Big-O !!', 20, 225)

    return new THREE.CanvasTexture(c)
  }

  _makeProjectorTexture() {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 360
    const ctx = c.getContext('2d')

    // Background
    ctx.fillStyle = '#05060f'
    ctx.fillRect(0, 0, 512, 360)

    // Title slide
    ctx.fillStyle = '#304080'
    ctx.fillRect(0, 0, 512, 70)

    ctx.font = 'bold 22px "Arial Narrow"'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Campus Placements 2026', 30, 45)

    ctx.font = '14px monospace'
    ctx.fillStyle = '#80a0ff'
    ctx.fillText('Company Visit Schedule — CS Dept', 30, 90)

    // Table header
    ctx.fillStyle = '#202840'
    ctx.fillRect(20, 110, 470, 30)
    ctx.fillStyle = '#c0d0ff'
    ctx.font = '12px monospace'
    ;['Company', 'Date', 'Package', 'Status'].forEach((h, i) => {
      ctx.fillText(h, 30 + i * 115, 130)
    })

    // Rows
    const rows = [
      ['Google', '14 Jan', '45 LPA', '✓ Open'],
      ['Amazon', '18 Jan', '32 LPA', '✓ Open'],
      ['TCS', '20 Jan', '7 LPA', '✓ Open'],
      ['Startup?', 'TBD', '?? LPA', '⚠ ???'],
    ]
    rows.forEach((row, ri) => {
      ctx.fillStyle = ri % 2 === 0 ? '#0d1020' : '#111525'
      ctx.fillRect(20, 145 + ri * 28, 470, 28)
      ctx.fillStyle = ri === 3 ? '#ff8040' : '#c0e0c0'
      ctx.font = '11px monospace'
      row.forEach((cell, ci) => {
        ctx.fillText(cell, 30 + ci * 115, 164 + ri * 28)
      })
    })

    // Footer
    ctx.font = 'italic 11px sans-serif'
    ctx.fillStyle = '#405080'
    ctx.fillText('Attendance mandatory. Formal dress required.', 30, 340)

    return new THREE.CanvasTexture(c)
  }

  _makeNightSkyTexture() {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 256
    const ctx = c.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0, '#030820')
    grad.addColorStop(1, '#050e30')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 256)

    // Stars
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`
      ctx.beginPath()
      ctx.arc(Math.random() * 128, Math.random() * 256, 0.5 + Math.random(), 0, Math.PI * 2)
      ctx.fill()
    }

    // Moon glow
    const moon = ctx.createRadialGradient(100, 40, 2, 100, 40, 20)
    moon.addColorStop(0, 'rgba(220,220,255,0.9)')
    moon.addColorStop(0.4, 'rgba(180,180,240,0.3)')
    moon.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = moon
    ctx.fillRect(80, 20, 40, 60)

    return new THREE.CanvasTexture(c)
  }

  _makePosterTexture(label, bgColor) {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 160
    const ctx = c.getContext('2d')

    const r = (bgColor >> 16) & 255
    const g = (bgColor >> 8)  & 255
    const b =  bgColor        & 255

    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, 0, 128, 160)

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 0, 128, 28)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px monospace'
    const lines3 = label.split('\n')
    lines3.forEach((ln, i) => {
      ctx.fillText(ln, 10, 22 + i * 40)
    })

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 3
    ctx.strokeRect(3, 3, 122, 154)

    return new THREE.CanvasTexture(c)
  }

  _makeTextSprite(text, color = '#ffffff') {
    const c = document.createElement('canvas')
    c.width = 256; c.height = 64
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, 256, 64)

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.beginPath()
    ctx.roundRect(4, 4, 248, 56, 6)
    ctx.fill()

    ctx.font = 'bold 20px "Press Start 2P", monospace'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillText(text, 128, 34)

    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    return new THREE.Sprite(mat)
  }
}