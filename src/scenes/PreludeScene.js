import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'
import * as THREE from 'three'

// ─── Member data ──────────────────────────────────────────────────────────────
const MEMBERS = [
  {
    name: 'Divyansh',
    color: 0x7b2fbe, accent: '#a855f7',
    skin: 0xd4956a, hair: 0x1a0800,
    shirt: 0x4c1d95, pants: 0x1e1b4b,
    msg: 'yeh second year se\nkuchh nhi hoga...',
    role: 'THE BUG WHISPERER',
    features: { hair: 'spiky', eyes: 'cool', style: 'hoodie' }
  },
  {
    name: 'Sachi',
    color: 0x059669, accent: '#10b981',
    skin: 0xe0b080, hair: 0x2d1b0d,
    shirt: 0x064e3b, pants: 0x1a2e24,
    msg: 'Code toh chal rha tha,\npata nhi kya hua! 🤡',
    role: 'THE DEADLINE CRUSHER',
    female: true,
    features: { hair: 'long', eyes: 'kind', style: 'skirt' }
  },
  {
    name: 'Shivansh',
    color: 0xc2410c, accent: '#f97316',
    skin: 0xb87040, hair: 0x0d0500,
    shirt: 0x7c2d12, pants: 0x2d1008,
    msg: 'main itna OP\nkyu hu yawrrr 😎',
    role: 'THE ZEN MASTER',
    features: { hair: 'flat', eyes: 'calm', style: 'jacket' }
  },
  {
    name: 'Srayanash',
    color: 0xb91c1c, accent: '#ef4444',
    skin: 0xc8825a, hair: 0x150900,
    shirt: 0x7f1d1d, pants: 0x2d0a0a,
    msg: 'CRED ki party,\nGroww ki party,\nPW ki party...\nsabki party lega apun.',
    role: 'THE CHAOS AGENT',
    features: { hair: 'messy', eyes: 'neutral', style: 'polo' }
  },
]

// ─── Dialogue data (Specific Requested Script) ─────────────────────────────
const PHASE3_DIALOGUE = [
  { speaker: 'UNKNOWN CALLER', text: 'Hello, main CSI se bol rha hu...', portrait: null, color: '#ef4444', side: 'left' },
  { speaker: 'UNKNOWN CALLER', text: 'Aur maine tumhare members chura liye hia kyunki barbari to hamse hogi nhi...', portrait: null, color: '#ef4444', side: 'left' },
  { speaker: 'UNKNOWN CALLER', text: 'Ab agar wapas chahiye to Si ke saare achievements hamare naam kardo.', portrait: null, color: '#ef4444', side: 'left' },
  { speaker: 'DIVYANSH', text: 'Ruko zara... CSI? Achievements?\nTumhe lagta hai hum itne kamzor hain?', portrait: 0, color: '#a855f7', side: 'right' },
  { speaker: 'DIVYANSH', text: 'Ab sirf ek hi option hai...', portrait: 0, color: '#a855f7', side: 'right' },
  { speaker: 'DIVYANSH', text: 'Unhe bulana hi padega.....', portrait: 0, color: '#f59e0b', side: 'right' },
]

// ─── Shared Three.js renderer (singleton) ────────────────────────────────────
let _sharedRenderer = null
function getSharedRenderer() {
  if (!_sharedRenderer) {
    _sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  }
  return _sharedRenderer
}

function renderThreeJsTexture(width, height, renderFn) {
  const renderer = getSharedRenderer()
  renderer.setSize(width, height, false)
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000)
  camera.position.set(0, 0, 500)
  camera.lookAt(0, 0, 0)

  renderFn(scene, camera, renderer, width, height)
  renderer.render(scene, camera)
  const dataURL = renderer.domElement.toDataURL()
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
      else obj.material.dispose()
    }
  })
  return dataURL
}

// ─── Three.js character builder ────────────────────────────────────────────────
function buildCharacterDataURL(member) {
  return renderThreeJsTexture(256, 380, (scene, camera, renderer, W, H) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(50, 100, 100); scene.add(sun)
    const rim = new THREE.PointLight(member.color, 0.6, 400); rim.position.set(-60, 80, -40); scene.add(rim)

    const cx = 0, by = -H / 2 + 10
    
    // 1. SHOES (Realistic soles)
    ;[[-14, by + 5], [14, by + 5]].forEach(([ox, oy]) => {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 20), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }))
      shoe.position.set(ox, oy, 2); scene.add(shoe)
    })

    // 2. LEGS
    ;[[-14, by + 30], [14, by + 30]].forEach(([ox, oy]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 50, 16), new THREE.MeshStandardMaterial({ color: member.pants || 0x1e1b4b }))
      leg.position.set(ox, oy, 0); scene.add(leg)
    })

    // 3. TORSO & PREMIUM CLOTHING
    const style = member.features?.style || 'hoodie'
    let torsoGeo
    if (member.female) torsoGeo = new THREE.CylinderGeometry(16, 32, 80, 32)
    else torsoGeo = new THREE.CylinderGeometry(28, 25, 90, 32)
    
    const torso = new THREE.Mesh(torsoGeo, new THREE.MeshStandardMaterial({ color: member.shirt }))
    torso.position.set(cx, by + 95, 0); scene.add(torso)
    
    if (style === 'hoodie') {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(35, 20, 8), new THREE.MeshStandardMaterial({ color: member.shirt }))
      pouch.position.set(0, by + 80, 24); scene.add(pouch)
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2), new THREE.MeshBasicMaterial({ color: 0xeeeeee }))
      s1.position.set(6, by + 115, 28); scene.add(s1)
      const s2 = s1.clone(); s2.position.set(-6, by + 115, 28); scene.add(s2)
    } else if (style === 'jacket') {
      const zip = new THREE.Mesh(new THREE.BoxGeometry(3, 85, 4), new THREE.MeshStandardMaterial({ color: 0x111111 }))
      zip.position.set(0, by + 95, 27); scene.add(zip)
      const collar = new THREE.Mesh(new THREE.TorusGeometry(14, 5, 16, 32), new THREE.MeshStandardMaterial({ color: member.shirt }))
      collar.position.set(cx, by + 135, 0); collar.rotation.x = Math.PI/2; scene.add(collar)
    }

    // 4. ARMS & HANDS
    ;[[-36, by + 110], [36, by + 110]].forEach(([ox, oy], i) => {
      const armGroup = new THREE.Group()
      armGroup.position.set(ox, oy, 0); armGroup.rotation.z = i === 0 ? 0.35 : -0.35
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(7, 45, 4, 16), new THREE.MeshStandardMaterial({ color: member.shirt }))
      armGroup.add(arm)
      const hand = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshStandardMaterial({ color: member.skin }))
      hand.position.set(0, -28, 0); armGroup.add(hand)
      scene.add(armGroup)
    })

    // 5. HEAD & FACE
    const head = new THREE.Mesh(new THREE.SphereGeometry(32, 32, 32), new THREE.MeshStandardMaterial({ color: member.skin, roughness: 0.4 }))
    head.scale.set(1, 1.1, 1); head.position.set(cx, by + 155, 0); scene.add(head)
    
    ;[[-11, by + 160, 28], [11, by + 160, 28]].forEach(([ox, oy, oz]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }))
      eye.position.set(ox, oy, oz); scene.add(eye)
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      pupil.position.set(ox, oy, oz + 4.5); scene.add(pupil)
      const brow = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 3), new THREE.MeshStandardMaterial({ color: member.hair }))
      brow.position.set(ox, oy + 10, oz + 2); brow.rotation.z = ox > 0 ? 0.15 : -0.15; scene.add(brow)
    })

    const mouth = new THREE.Mesh(new THREE.TorusGeometry(8, 2, 8, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0x552222 }))
    mouth.position.set(cx, by + 142, 28); mouth.rotation.x = 0.2; mouth.rotation.z = Math.PI; scene.add(mouth)

    // 6. HAIR
    const hairMat = new THREE.MeshStandardMaterial({ color: member.hair, roughness: 0.5 })
    const h = member.features?.hair || 'default'
    if (h === 'long') {
      const top = new THREE.Mesh(new THREE.SphereGeometry(34, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat)
      top.position.set(cx, by + 160, 0); scene.add(top)
      const back = new THREE.Mesh(new THREE.CapsuleGeometry(28, 80, 8, 16), hairMat)
      back.position.set(cx, by + 120, -18); scene.add(back)
    } else if (h === 'spiky') {
      const top = new THREE.Mesh(new THREE.SphereGeometry(33, 32, 32), hairMat)
      top.position.set(cx, by + 160, 0); scene.add(top)
      for (let i = 0; i < 20; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(7, 26, 8), hairMat)
        const ang = Math.random() * Math.PI * 2
        s.position.set(cx + Math.cos(ang) * 24, by + 182, Math.sin(ang) * 24)
        s.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(s)
      }
    } else if (h === 'messy') {
      for (let i = 0; i < 12; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 16), hairMat)
        m.position.set(cx + (Math.random()-0.5) * 55, by + 175, (Math.random()-0.5) * 55); scene.add(m)
      }
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(33, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat)
      hair.position.set(cx, by + 160, 0); scene.add(hair)
    }
  })
}

// ─── High-Fidelity Hacker Builder (RESTORED TO PREVIOUS BEST VERSION) ─────────
function buildHackerDataURL(eyeColor = 0xff0000) {
  const ec = eyeColor
  const ecHex = '#' + ec.toString(16).padStart(6, '0')
  return renderThreeJsTexture(300, 420, (scene, camera, renderer, W, H) => {
    // Pitch-dark ambient — silhouette only
    scene.add(new THREE.AmbientLight(0x010101, 0.15))

    // Subtle colored rim light from behind for edge definition
    const rimLight = new THREE.DirectionalLight(ec, 0.08)
    rimLight.position.set(-80, 120, -60); scene.add(rimLight)
    const rimLight2 = new THREE.DirectionalLight(ec, 0.05)
    rimLight2.position.set(80, 80, -40); scene.add(rimLight2)

    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95, metalness: 0 })
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x030303 })

    const cx = 0, by = -H / 2 + 20

    // ── BODY: Broad menacing torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(42, 85, 180, 32),
      cloakMat
    )
    torso.position.set(cx, by + 70, 0); scene.add(torso)

    // ── SHOULDERS: Wide intimidating shoulders
    const shoulders = new THREE.Mesh(
      new THREE.CapsuleGeometry(38, 140, 8, 24),
      cloakMat
    )
    shoulders.rotation.z = Math.PI / 2
    shoulders.position.set(cx, by + 155, -5); scene.add(shoulders)

    // ── HOOD: Deep cowl shape
    const hoodPoints = []
    for (let i = 0; i < 18; i++) {
      const t = i / 18
      let rad
      if (t < 0.15)      rad = 70 - t * 50
      else if (t < 0.4)  rad = 62 * Math.cos((t - 0.15) * 1.2)
      else                rad = 50 * Math.cos((t - 0.15) * 1.3)
      hoodPoints.push(new THREE.Vector2(Math.max(rad, 2), i * 10))
    }
    const hood = new THREE.Mesh(new THREE.LatheGeometry(hoodPoints, 32), cloakMat)
    hood.position.set(cx, by + 150, 0); scene.add(hood)

    // ── HEAD: Invisible inside hood
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(48, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    head.position.set(cx, by + 230, -8); scene.add(head)

    // ── HOOD RIM: Subtle edge glow
    const rimGeoMat = new THREE.MeshBasicMaterial({ color: ec, transparent: true, opacity: 0.12 })
    const rim = new THREE.Mesh(new THREE.TorusGeometry(62, 2.5, 16, 48, Math.PI), rimGeoMat)
    rim.position.set(cx, by + 225, -5); rim.rotation.x = Math.PI / 2; scene.add(rim)

    // ── EYES: Detailed, menacing, human-like
    const eyeW = 38, eyeH = 14
    const eyePositions = [[-32, by + 232, 46], [32, by + 232, 46]]

    eyePositions.forEach(([ox, oy, oz], i) => {
      const eg = new THREE.Group()
      eg.position.set(ox, oy, oz)
      if (i === 1) eg.scale.x = -1

      // Eye socket shadow (dark recess)
      const socketShape = new THREE.Shape()
      socketShape.moveTo(-eyeW/2 - 6, 0)
      socketShape.quadraticCurveTo(0, eyeH + 8, eyeW/2 + 6, 0)
      socketShape.quadraticCurveTo(0, -eyeH * 0.6, -eyeW/2 - 6, 0)
      const socket = new THREE.Mesh(
        new THREE.ShapeGeometry(socketShape),
        new THREE.MeshBasicMaterial({ color: 0x050000 })
      )
      socket.position.z = -1; eg.add(socket)

      // Eye white (sclera) — very dark, barely visible
      const scleraShape = new THREE.Shape()
      scleraShape.moveTo(-eyeW/2, 0)
      scleraShape.quadraticCurveTo(0, eyeH, eyeW/2, 0)
      scleraShape.quadraticCurveTo(0, -eyeH * 0.35, -eyeW/2, 0)
      const sclera = new THREE.Mesh(
        new THREE.ShapeGeometry(scleraShape),
        new THREE.MeshBasicMaterial({ color: 0x1a0505 })
      )
      sclera.position.z = 0; eg.add(sclera)

      // Iris — the main glowing colored part
      const iris = new THREE.Mesh(
        new THREE.CircleGeometry(eyeH * 0.7, 32),
        new THREE.MeshBasicMaterial({ color: ec })
      )
      iris.position.set(2, 1, 1); eg.add(iris)

      // Iris glow ring (outer)
      const glowRing = new THREE.Mesh(
        new THREE.RingGeometry(eyeH * 0.55, eyeH * 0.85, 32),
        new THREE.MeshBasicMaterial({ color: ec, transparent: true, opacity: 0.4 })
      )
      glowRing.position.set(2, 1, 0.5); eg.add(glowRing)

      // Pupil — sharp black center
      const pupil = new THREE.Mesh(
        new THREE.CircleGeometry(eyeH * 0.28, 20),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      )
      pupil.position.set(2, 1, 2); eg.add(pupil)

      // Specular highlight (top-left glint)
      const glint = new THREE.Mesh(
        new THREE.CircleGeometry(2.5, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      )
      glint.position.set(-4, 4, 3); eg.add(glint)

      // Second smaller glint
      const glint2 = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
      )
      glint2.position.set(6, -2, 3); eg.add(glint2)

      // Upper eyelid — gives the menacing squint
      const lidShape = new THREE.Shape()
      lidShape.moveTo(-eyeW/2 - 4, eyeH + 6)
      lidShape.lineTo(eyeW/2 + 4, eyeH + 6)
      lidShape.lineTo(eyeW/2 + 4, eyeH * 0.45)
      lidShape.quadraticCurveTo(0, eyeH * 0.7, -eyeW/2 - 4, eyeH * 0.45)
      const lid = new THREE.Mesh(
        new THREE.ShapeGeometry(lidShape),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      )
      lid.position.z = 4; eg.add(lid)

      // Lower lid line
      const lowerLid = new THREE.Shape()
      lowerLid.moveTo(-eyeW/2 - 2, -eyeH * 0.5)
      lowerLid.lineTo(eyeW/2 + 2, -eyeH * 0.5)
      lowerLid.lineTo(eyeW/2 + 2, -eyeH * 0.15)
      lowerLid.quadraticCurveTo(0, -eyeH * 0.3, -eyeW/2 - 2, -eyeH * 0.15)
      const lLid = new THREE.Mesh(
        new THREE.ShapeGeometry(lowerLid),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      )
      lLid.position.z = 4; eg.add(lLid)

      scene.add(eg)
    })
  })
}

function buildMonitorDataURL() {
  return renderThreeJsTexture(120, 140, (scene, camera, renderer, W, H) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const cx = 0, by = -H / 2 + 10
    const base = new THREE.Mesh(new THREE.CylinderGeometry(28, 32, 4, 32), new THREE.MeshStandardMaterial({ color: 0xcccccc }))
    base.position.set(cx, by + 2, 0); scene.add(base)
    const pole = new THREE.Mesh(new THREE.BoxGeometry(6, 40, 6), new THREE.MeshStandardMaterial({ color: 0xbbbbbb }))
    pole.position.set(cx, by + 22, -4); scene.add(pole)
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(108, 62, 10), new THREE.MeshStandardMaterial({ color: 0xeeeeee }))
    bezel.position.set(cx, by + 70, 0); scene.add(bezel)
  })
}

function buildDeskDataURL() {
  return renderThreeJsTexture(160, 60, (scene, camera, renderer, W, H) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const cx = 0, by = -H / 2 + 6
    const top = new THREE.Mesh(new THREE.BoxGeometry(140, 8, 32), new THREE.MeshStandardMaterial({ color: 0x11111a }))
    top.position.set(cx, by + 24, 0); scene.add(top)
  })
}

function buildChairDataURL() {
  return renderThreeJsTexture(80, 110, (scene, camera, renderer, W, H) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const cx = 0, by = -H / 2 + 5
    const seat = new THREE.Mesh(new THREE.BoxGeometry(54, 10, 48), new THREE.MeshStandardMaterial({ color: 0x111111 }))
    seat.position.set(cx, by + 26, 0); scene.add(seat)
    const back = new THREE.Mesh(new THREE.BoxGeometry(50, 75, 10), new THREE.MeshStandardMaterial({ color: 0x080808 }))
    back.position.set(cx, by + 65, -18); scene.add(back)
  })
}

export class PreludeScene extends Phaser.Scene {
  constructor() { super('PreludeScene'); this._tw = []; this._tmr = []; this._callEnded = false }
  preload() { 
    this.load.image('divyansh_real', 'images/juniors/divyansh.png') 
    this.load.audio('chalo', 'audio/Chalo.mp3')
    this.load.audio('huh', 'audio/huh.mp3')
    this.load.audio('aaye', 'audio/aaye.mp3')
    this.load.audio('phone', 'audio/phone.mp3')
    this.load.audio('yap', 'audio/yap.mp3')
    this.load.audio('callend', 'audio/callend.mp3')
    this.load.video('introscene', 'audio/introscene.mp4')
    this.load.audio('background', 'audio/background.mp3')
    this.load.audio('rukozara', 'audio/Ruko-Jara.mp3')
    this.load.audio('uthalerebaba', 'audio/uthalerebaba.mp3')
  }
  create() {
    this.W = this.scale.width; this.H = this.scale.height; this._clearScene(); this._buildAllTextures()
    
    // Play background music continuously at 70% volume
    this._bgMusic = this.sound.add('background', { volume: 0.7, loop: true })
    this._bgMusic.play()

    this.cameras.main.fadeIn(1800, 0, 0, 0); this.cameras.main.setScroll(-100, 0)
    this._tw_add(this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 3000, ease: 'Cubic.easeOut' }))
    this.time.delayedCall(100, () => { this._phase1_labScene(); this._spawnAtmosphere() })
  }
  _spawnAtmosphere() {
    const { W, H } = this
    for (let i = 0; i < 25; i++) {
      const p = this.add.circle(Math.random() * W, Math.random() * H, Math.random() * 2, 0xffffff, 0.15).setDepth(100)
      this._tw_add(this.tweens.add({ targets: p, y: p.y - 100, alpha: 0, duration: 3000 + Math.random() * 2000, repeat: -1, delay: Math.random() * 2000 }))
    }
  }
  _buildAllTextures() {
    MEMBERS.forEach((m, i) => this.textures.addBase64(`char_${i}`, buildCharacterDataURL(m)))
    this.textures.addBase64('desk', buildDeskDataURL()); this.textures.addBase64('monitor', buildMonitorDataURL()); this.textures.addBase64('chair', buildChairDataURL())
    this.textures.addBase64('hacker_red', buildHackerDataURL(0xff0000)); this.textures.addBase64('hacker_green', buildHackerDataURL(0x00ff44))
    const g = this.add.graphics(); g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); g.generateTexture('particle', 8, 8); g.destroy()
  }
  _clearScene() { this._tw.forEach(t => t.stop()); this._tmr.forEach(t => t.remove()); this._tw = []; this._tmr = []; this.children.removeAll() }
  _tw_add(t) { this._tw.push(t); return t }
  _timer(ms, cb) { const t = this.time.delayedCall(ms, cb); this._tmr.push(t); return t }

  _phase1_labScene() {
    const { W, H } = this; const isMobile = W < 500
    this.add.rectangle(0, 0, W, H, 0x3e2723).setOrigin(0)
    const wallH = H * 0.63; this.add.rectangle(0, 0, W, wallH, 0xe3d5b8).setOrigin(0)
    
    // 1. PREMIUM WOODEN CUPBOARD (RESTORED)
    const cupW = 140, cupH = wallH * 0.9
    const cupContainer = this.add.container(20, wallH - cupH - 5).setDepth(1)
    const cupBG = this.add.graphics()
    const woodColor = 0x5d4037, darkWood = 0x3e2723
    cupBG.fillStyle(woodColor, 1).fillRoundedRect(0, 0, cupW, cupH, 4).lineStyle(3, darkWood, 1).strokeRoundedRect(0, 0, cupW, cupH, 4)
    const glassH = cupH * 0.66; cupBG.fillStyle(0x000000, 0.3).fillRect(10, 10, cupW - 20, glassH - 15)
    for (let s = 0; s < 3; s++) {
      const sy = 10 + (s * (glassH-15)/3)
      cupBG.lineStyle(2, darkWood, 0.8).strokeRect(10, sy, cupW - 20, (glassH-15)/3)
      for (let f = 0; f < 9; f++) {
        const fileColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xffffff, 0x6366f1]
        const fw = 7 + Math.random() * 5, fh = (glassH-15)/3 - 10 - Math.random() * 8
        cupBG.fillStyle(fileColors[Math.floor(Math.random() * fileColors.length)], 0.9).fillRect(15 + f * 13, sy + ((glassH-15)/3 - fh - 2), fw, fh)
      }
    }
    const glass = this.add.graphics().fillStyle(0xffffff, 0.1).fillRect(10, 10, cupW - 20, glassH - 15)
    glass.lineStyle(1, 0xffffff, 0.2).moveTo(15, 15).lineTo(cupW - 30, glassH - 30)
    cupBG.fillStyle(darkWood, 1).fillRoundedRect(10, glassH + 5, cupW - 20, cupH - glassH - 15, 2)
    cupBG.fillStyle(0xa1a1aa, 1).fillCircle(cupW/2 - 10, glassH + (cupH-glassH)/2, 3).fillCircle(cupW/2 + 10, glassH + (cupH-glassH)/2, 3)
    cupContainer.add([cupBG, glass])

    // 3. SI ACHIEVEMENTS BOARD (ALIGNED 2x2 GRID)
    const boardW = 240, boardH = 220, boardX = W - 140, boardY = wallH * 0.35
    const board = this.add.container(boardX, boardY).setDepth(1)
    const bG = this.add.graphics().fillStyle(0x422006, 1).fillRoundedRect(-boardW/2 - 5, -boardH/2 - 5, boardW + 10, boardH + 10, 4).fillStyle(0xbc8f8f, 1).fillRect(-boardW/2, -boardH/2, boardW, boardH)
    board.add([bG, this.add.text(0, -boardH/2 + 20, 'SI ACHIEVEMENTS', { fontFamily: '"Rajdhani", sans-serif', fontSize: '20px', fontStyle: 'bold', fill: '#3b2006' }).setOrigin(0.5)])
    
    const articles = [
      { t: "ICPC Regionals  #32\nParas, Ayush,\nAakarsh", x: -110, y: -50, c: 0xfff0b3, rot: -4 },
      { t: "springboot\ngsoc glaze", x: 0, y: -50, c: 0xffb3ba, rot: 5 },
      { t: "CODEFORCES\nGLOBAL RANK\n#12 IN ASIA", x: -110, y: 35, c: 0xb3e5fc, rot: 3 },
      { t: "Har baar\nwala SIH", x: 0, y: 35, c: 0xc8e6c9, rot: -5 }
    ]
    articles.forEach(art => {
      const artCont = this.add.container(art.x, art.y).setDepth(2)
      // Paper background and shadow
      artCont.add(this.add.graphics().fillStyle(0x000000, 0.15).fillRect(2, 2, 105, 75).fillStyle(art.c, 1).fillRect(0, 0, 105, 75))
      // Push pin
      artCont.add(this.add.circle(52, 8, 4, 0xef4444).setDepth(3))
      artCont.add(this.add.circle(50.5, 6.5, 1.5, 0xffa0a0).setDepth(4))
      // Stylish, rotated text
      artCont.add(this.add.text(52, 42, art.t, { 
        fontFamily: '"Comic Sans MS", "Caveat", cursive', 
        fontSize: '10px', 
        fill: '#1a1a2e', 
        align: 'center', 
        fontStyle: 'bold' 
      }).setOrigin(0.5).setAngle(art.rot))
      board.add(artCont)
    })

    // 5. FLOOR (RESTORED)
    const floorY = wallH - 5; this.add.rectangle(0, floorY, W, H - floorY, 0x0f172a).setOrigin(0)

    // 4. WORKSTATION BELOW BOARD (RESTORED - SITTING ON FLOOR LINE)
    const deskX = boardX, deskY = floorY
    this.add.image(deskX, deskY, 'desk').setScale(1.2).setOrigin(0.5, 1).setDepth(2)
    this.add.image(deskX - 45, deskY - 45, 'monitor').setScale(0.8).setOrigin(0.5, 1).setDepth(3)
    this.add.text(deskX - 45, deskY - 102, '> npm fly dev', { fontFamily: 'monospace', fontSize: '8px', fill: '#111111' }).setOrigin(0.5).setDepth(4)
    this.add.image(deskX + 45, deskY - 45, 'monitor').setScale(0.8).setOrigin(0.5, 1).setDepth(3)
    this.add.text(deskX + 45, deskY - 102, '> pip install pip', { fontFamily: 'monospace', fontSize: '7px', fill: '#111111' }).setOrigin(0.5).setDepth(4)

    // 5. CEILING FANS (RESTORED)
    for (let fx = W * 0.25; fx < W; fx += W * 0.5) {
      const rod = this.add.rectangle(fx, 0, 4, 30, 0x334155).setOrigin(0.5, 0).setDepth(9)
      const motor = this.add.circle(fx, 30, 12, 0x1e293b).setDepth(11)
      const blades = this.add.container(fx, 30).setDepth(10)
      for (let i = 0; i < 3; i++) blades.add(this.add.rectangle(0, 0, 14, 80, 0x2d3748).setOrigin(0.5, 0).setAngle(i * 120))
      this.tweens.add({ targets: blades, angle: 360, duration: 1200, repeat: -1 })
    }
    
    // 6. VERTICALLY SEPARATED ZONED SPAWN (Anti-Overlap)
    this._charObjects = []
    const zones = [
      { x: W * 0.5, y: H - 40 },        // Zone 1: ABSOLUTE BOTTOM (Divyansh)
      { x: W * 0.18, y: floorY + 110 }, // Zone 2: UPPER LEFT
      { x: W * 0.38, y: floorY + 125 }, // Zone 3: UPPER CENTER-LEFT (Shifted away from Divyansh)
      { x: W * 0.82, y: floorY + 110 }  // Zone 4: UPPER RIGHT
    ]

    MEMBERS.forEach((m, i) => {
      const zone = zones[i]
      const rx = zone.x + (Math.random() - 0.5) * 20
      const ry = zone.y + (Math.random() - 0.5) * 20
      const scale = isMobile ? 0.7 : 0.9
      
      const chair = this.add.image(rx + 20, ry + 10, 'chair').setOrigin(0.5, 1).setScale(scale).setAlpha(0).setDepth(ry)
      const char = this.add.image(rx, ry, `char_${i}`).setOrigin(0.5, 1).setScale(scale).setAlpha(0).setDepth(ry + 1)
      
      const firstName = m.name.split(' ')[0]
      const nameTxt = this.add.text(rx, ry + 15, firstName.toUpperCase(), {
        fontFamily: '"Rajdhani", "Arial", sans-serif', 
        fontSize: '11px', 
        fill: '#ffffff', 
        letterSpacing: 1,
        stroke: m.color, 
        strokeThickness: 2
      }).setOrigin(0.5, 0).setAlpha(0).setDepth(ry + 2)
      nameTxt.setShadow(0, 1, '#000000', 3, true)

      this.tweens.add({ targets: [char, chair], alpha: 1, y: { from: ry + 20, to: ry }, duration: 800, delay: i * 200 + 300, ease: 'Power2.easeOut' })
      this.tweens.add({ targets: nameTxt, alpha: 1, y: { from: ry + 35, to: ry + 15 }, duration: 800, delay: i * 200 + 300, ease: 'Power2.easeOut' })
      
      this._timer(2600 + i * 500, () => {
        // MAXIMUM SPEECH BUBBLE CLEARANCE
        const tierOffset = (i % 2 === 0) ? 190 : 360 
        const bub = this._buildSpeechBubble(rx, ry - tierOffset * scale, m.msg, m.color).setAlpha(0).setDepth(2000)
        this.tweens.add({ targets: bub, alpha: 1, y: bub.y - 15, duration: 500, ease: 'Back.out' })
        this._timer(3800, () => this.tweens.add({ targets: bub, alpha: 0, duration: 400, onComplete: () => bub.destroy() }))
      })
      this._charObjects.push({ char, chair, nameTxt, x: rx, charY: ry, scale, name: m.name })
    })
    this._timer(7500, () => this._divyanshBreak())
  }

  _divyanshBreak() {
    const { W } = this; const divObj = this._charObjects[0]; const { char, chair, x, charY, scale } = divObj
    const bub1 = this._buildSpeechBubble(x, charY - 210 * scale, 'ufff yeh ameeri....\nCrosmos ke paise aagye! 💸', 0x7b2fbe).setAlpha(0).setDepth(3000)
    this.tweens.add({ targets: bub1, alpha: 1, y: bub1.y - 15, duration: 400 })
    this._timer(2200, () => {
      this.tweens.add({ targets: bub1, alpha: 0, duration: 300, onComplete: () => bub1.destroy() })
      this.sound.play('chalo')
      
      // Move Divyansh (and his name tag) out of the scene
      this.tweens.add({ targets: [char, chair, divObj.nameTxt], x: -200, duration: 2000, ease: 'Power1.easeIn', onComplete: () => {
        
        // After Divyansh is completely out, play utha le re baba
        this.sound.play('uthalerebaba')

        // Then wait for the audio to play a bit (e.g. 1.2s) before making seniors disappear
        this._timer(1200, () => {
          this._charObjects.slice(1).forEach((obj, idx) => {
            this.tweens.add({ targets: [obj.char, obj.chair, obj.nameTxt], alpha: 0, scale: 0, y: obj.charY - 100, duration: 400, delay: idx * 100, ease: 'Back.in' })
          })
          
          this._timer(1000, () => {
            char.setVisible(true); chair.setVisible(true); char.setFlipX(true)
            this.tweens.add({ targets: [char, chair, divObj.nameTxt], x: W * 0.25, duration: 1500, ease: 'Power1.easeOut', onComplete: () => {
              this.sound.play('huh')
              const emo = this._buildSpeechBubble(W * 0.25, charY - 260 * scale, '!', 0xff0000).setAlpha(0).setDepth(5000)
              this.tweens.add({ targets: emo, alpha: 1, scale: 1.4, duration: 400, ease: 'Back.out' })
              this._timer(1200, () => { emo.destroy(); this._triggerKidnap() })
            }})
          })
        })
      }})
    })
  }

  _triggerKidnap() {
    const { W, H } = this; const hijack = this.add.rectangle(0, 0, W, H, 0xffffff, 0.95).setOrigin(0).setDepth(10000).setAlpha(0)
    this.tweens.add({ targets: hijack, alpha: 1, duration: 800 })
    const bigDiv = this.add.image(W / 2, H * 0.6, 'divyansh_real').setScale(0.4).setDepth(11000).setAlpha(0)
    
    // Stop the background music the moment the image pops up
    if (this._bgMusic) {
      this._bgMusic.stop()
      this._bgMusic = null
    }

    this.tweens.add({ targets: bigDiv, alpha: 1, y: H * 0.5, scale: 0.8, duration: 1000, ease: 'Cubic.easeOut' })
    this._timer(1000, () => {
      this.sound.play('aaye')
      const bub = this._buildSpeechBubble(W/2, H * 0.2, "Wait... where did\neveryone go??", 0x7b2fbe).setDepth(12000).setScale(2).setAlpha(0)
      this.tweens.add({ targets: bub, alpha: 1, scale: 2.3, duration: 600, ease: 'Back.out' })
      this._timer(3500, () => {
        this.tweens.add({ targets: [hijack, bigDiv, bub], alpha: 0, duration: 1000, onComplete: () => {
          hijack.destroy(); bigDiv.destroy(); bub.destroy(); this._phase3_phoneCall()
        }})
      })
    })
  }

  _buildSpeechBubble(x, y, text, color) {
    const container = this.add.container(x, y)
    const txt = this.add.text(0, 0, text, { fontFamily: '"Rajdhani", sans-serif', fontSize: '16px', fill: '#ffffff', align: 'center', lineSpacing: 4, fontStyle: 'bold' }).setOrigin(0.5)
    const bg = this.add.graphics(); const padding = 18; const bw = txt.width + padding * 2, bh = txt.height + padding * 2
    bg.fillStyle(0x000000, 0.85).fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12).lineStyle(3, color, 1).strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 12)
    bg.fillStyle(0x000000, 0.85).fillTriangle(-10, bh / 2, 10, bh / 2, 0, bh / 2 + 15).lineStyle(3, color, 1).lineBetween(-10, bh / 2, 0, bh / 2 + 15).lineBetween(10, bh / 2, 0, bh / 2 + 15)
    container.add([bg, txt]); return container
  }

  _phase3_phoneCall() {
    this._ringTone = this.sound.add('phone', { loop: true }); this._ringTone.play()
    this._clearScene(); const { W, H } = this; this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setDepth(0)

    // Subtle dark red ambient particles floating upward
    this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        const p = this.add.circle(
          Phaser.Math.Between(0, W), H + 10,
          Phaser.Math.FloatBetween(0.5, 2), 0xff0000,
          Phaser.Math.FloatBetween(0.03, 0.08)
        ).setDepth(1)
        this.tweens.add({
          targets: p, y: -20, x: p.x + Phaser.Math.Between(-30, 30),
          alpha: 0, duration: Phaser.Math.Between(4000, 7000),
          onComplete: () => p.destroy()
        })
      }
    })

    const hacker = this.add.image(W / 2, H / 2 - 30, 'hacker_red').setOrigin(0.5).setAlpha(0).setDepth(3).setScale(1.1)

    // Eye glow effect — a pulsing red glow behind the hacker face area
    const eyeGlow = this.add.circle(W / 2, H / 2 - 60, 50, 0xff0000, 0.06).setDepth(2)
    this.tweens.add({ targets: eyeGlow, alpha: 0.12, scale: 1.3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const csiText = this.add.text(W / 2, H / 2 + 100, 'CSI', { fontFamily: '"Rajdhani", sans-serif', fontSize: '56px', fontStyle: 'bold', fill: '#ff0000' }).setOrigin(0.5).setDepth(4).setAlpha(0)
    this.tweens.add({ targets: [hacker], alpha: 0.9, duration: 3000, ease: 'Power2', onComplete: () => {
      this.tweens.add({ targets: [csiText], alpha: 0.6, duration: 1500, ease: 'Sine.easeInOut' })
      this._timer(2000, () => this._spawnSlider(hacker, csiText))
    }})
  }

  _spawnSlider(hacker, csiText) {
    const { W, H } = this; const sliderContainer = this.add.container(0, H + 150).setDepth(20)
    const sliderY = 0, sliderW = Math.min(W * 0.78, 300), sliderX = W / 2, trackH = 64, trackL = sliderX - sliderW / 2, trackR = sliderX + sliderW / 2, thumbR = 28, thumbStartX = trackL + thumbR + 4, thumbEndX = trackR - thumbR - 4
    
    const trackG = this.add.graphics().fillStyle(0x080808, 0.9).fillRoundedRect(trackL, sliderY - trackH / 2, sliderW, trackH, trackH / 2).lineStyle(2, 0xff0000, 0.4).strokeRoundedRect(trackL, sliderY - trackH / 2, sliderW, trackH, trackH / 2)
    const hint = this.add.text(sliderX + 20, sliderY, '  slide to answer  ▶▶', { fontFamily: '"Nunito", sans-serif', fontSize: '13px', fill: '#ff0000', alpha: 0.5 }).setOrigin(0.5)
    
    const thumb = this.add.container(thumbStartX, sliderY).setDepth(21)
    const tCircle = this.add.graphics().fillStyle(0xcc0000).fillCircle(0, 0, thumbR).fillStyle(0xffffff).fillRoundedRect(-9, -10, 18, 20, 3)
    thumb.add(tCircle)
    
    sliderContainer.add([trackG, hint, thumb])
    
    this.tweens.add({ targets: sliderContainer, y: H - 120, duration: 1500, ease: 'Power3.easeOut' })
    
    thumb.setInteractive(new Phaser.Geom.Circle(0, 0, thumbR + 30), Phaser.Geom.Circle.Contains)
    this.input.setDraggable(thumb)

    thumb.on('drag', (pointer, dragX) => {
      thumb.x = Phaser.Math.Clamp(dragX, thumbStartX, thumbEndX)
    })

    thumb.on('dragend', () => {
      if (thumb.x > thumbEndX - 25) {
        if (this._ringTone) this._ringTone.stop()
        thumb.disableInteractive()
        this.tweens.add({ targets: sliderContainer, alpha: 0, duration: 300, onComplete: () => sliderContainer.destroy() })
        hacker.setTexture('hacker_green'); csiText.setFill('#00ff44'); this._timer(800, () => this._runCallDialogue())
      } else {
        this.tweens.add({ targets: thumb, x: thumbStartX, duration: 400, ease: 'Back.easeOut' })
      }
    })
  }

  _runCallDialogue() {
    let idx = 0; let isTyping = false;
    const panel = this._buildPokemonDialoguePanel().setAlpha(0)
    this.tweens.add({ targets: panel, alpha: 1, duration: 400 })

    const handleInput = () => {
      if (isTyping) {
        if (this._typeEvent) { this._typeEvent.remove(); this._typeEvent = null }
        const r = panel.getData('refs'); if(r && r.t) r.t.setText(PHASE3_DIALOGUE[idx].text); if(r && r.prompt) r.prompt.setVisible(true)
        isTyping = false; return
      }
      idx++;
      if (idx >= PHASE3_DIALOGUE.length) {
        this.input.off('pointerdown', handleInput)
        this.tweens.add({ targets: panel, alpha: 0, duration: 400, onComplete: () => { panel.destroy(); this._endCall() } })
      } else { showLine() }
    }

    const showLine = () => {
      if (idx >= PHASE3_DIALOGUE.length) return
      const lineData = PHASE3_DIALOGUE[idx]
      
      // Stop any existing yap before starting a new one
      if (this._activeYap) { this._activeYap.stop(); this._activeYap = null }
      
      // Play yap if it's the hacker speaking
      if (lineData.speaker === 'UNKNOWN CALLER') {
        this._activeYap = this.sound.add('yap', { volume: 1.2 })
        this._activeYap.play()
      } else if (lineData.speaker === 'DIVYANSH' && idx === 3) {
        this._rukoAudio = this.sound.add('rukozara', { volume: 1.5 })
        this._rukoAudio.play()
        
        // Only play the first 2 seconds of the meme audio
        this._timer(2000, () => {
          if (this._rukoAudio && this._rukoAudio.isPlaying) {
            this._rukoAudio.stop()
            this._rukoAudio = null
          }
        })
      }

      isTyping = true; this._fillPokemonDialogue(panel, lineData, () => { 
        isTyping = false;
        if (this._activeYap) { this._activeYap.stop(); this._activeYap = null }
      })
    }

    this.input.on('pointerdown', handleInput)
    showLine()
  }

  _endCall() { 
    const { W, H } = this; 
    
    // Ensure ruko zara stops when the call gets cut
    if (this._rukoAudio && this._rukoAudio.isPlaying) {
      this._rukoAudio.stop()
      this._rukoAudio = null
    }

    const t = this.add.text(W / 2, H / 2, 'CALL ENDED', { fontSize: '42px', fill: '#ff3333', fontStyle: 'bold', fontFamily: 'Impact' }).setOrigin(0.5).setDepth(100)
    this.cameras.main.shake(500, 0.01)
    
    for (let i = 0; i < 3; i++) {
      this._timer(i * 700, () => this.sound.play('callend'))
    }
    
    this._timer(2800, () => this._phase4_whoAreThey()) 
  }

  _phase4_whoAreThey() { 
    this._clearScene(); const { W, H } = this; this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
    const txt = this.add.text(W / 2, H / 2, 'Unhe?', { fontFamily: 'Impact', fontSize: '80px', fill: '#ffffff' }).setOrigin(0.5).setScale(0).setAlpha(0)
    
    this.tweens.add({ targets: txt, scale: 1.2, alpha: 1, duration: 600, ease: 'Back.out', onComplete: () => {
      this.cameras.main.flash(400, 255, 255, 255)
      this.cameras.main.shake(300, 0.02)
      this._timer(1200, () => {
        this.tweens.add({ targets: txt, scale: 4, alpha: 0, duration: 400, ease: 'Power2.easeIn', onComplete: () => this._phase5_theyReveal() })
      })
    }})
  }

  _phase5_theyReveal() {
    this._clearScene(); const { W, H } = this; 
    this.add.rectangle(0, 0, W, H, 0x020007).setOrigin(0)
    
    // 1. DIGITAL SCANLINES & VIGNETTE
    const scanlines = this.add.graphics().setDepth(100)
    for(let i=0; i<H; i+=4) scanlines.fillStyle(0x000000, 0.1).fillRect(0, i, W, 1)
    this.tweens.add({ targets: scanlines, alpha: 0.5, duration: 50, yoyo: true, repeat: -1 })
    
    const vignette = this.add.graphics().setDepth(101)
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6).fillRect(0, 0, W, H)

    // 2. RADIAL BURST & DIGITAL BITS
    const g = this.add.graphics().lineStyle(2, 0xffdd00, 0.2).setDepth(1)
    for(let i=0; i<60; i++){
      const ang = Math.random()*Math.PI*2, len = 200 + Math.random()*600
      g.lineBetween(W/2, H/2, W/2 + Math.cos(ang)*len, H/2 + Math.sin(ang)*len)
    }
    this.tweens.add({ targets: g, alpha: 0.05, duration: 80, yoyo: true, repeat: -1 })

    // 3. CINEMATIC LINES WITH HOLOGRAPHIC FX
    const lines = [
      { t: 'Ohhh themmm.....', s: Math.min(W * 0.08, 40), y: H * 0.25, d: 800, rot: -5 },
      { t: 'THE GREATEST', s: Math.min(W * 0.16, 80), y: H * 0.45, d: 1800, rot: 3 },
      { t: 'AND STRONGEST', s: Math.min(W * 0.16, 80), y: H * 0.65, d: 2800, rot: -2 },
      { t: 'MEMBERS.', s: Math.min(W * 0.20, 110), y: H * 0.85, d: 4000, rot: 0 }
    ]

    lines.forEach((l, idx) => {
      this._timer(l.d, () => {
        // Trigger intro audio exactly when the first text (Ohhh themmm) starts
        if (idx === 0) {
          const vid = this.add.video(0, 0, 'introscene').setVisible(false)
          vid.play()
        }
        
        // Impact Pulse
        this.cameras.main.flash(250, 255, 221, 0, true)
        this.cameras.main.shake(200, 0.02)
        
        // Digital Burst Particles
        for(let p=0; p<15; p++){
          const bit = this.add.rectangle(W/2, l.y, 8, 2, 0xffdd00).setDepth(15).setAngle(Math.random()*360)
          this.tweens.add({ targets: bit, x: W/2 + (Math.random()-0.5)*W, y: l.y + (Math.random()-0.5)*200, alpha: 0, duration: 600, ease: 'Power2.easeOut', onComplete: () => bit.destroy() })
        }

        // Main Hologram Text
        const t = this.add.text(W / 2, l.y, l.t, { 
          fontFamily: 'Impact', fontSize: l.s + 'px', fill: '#ffdd00', stroke: '#000000', strokeThickness: 14, align: 'center', wordWrap: { width: W - 40 }
        }).setOrigin(0.5).setAlpha(0).setScale(6).setDepth(20).setAngle(l.rot)
        
        // Shadow/Glow Trails
        for(let j=0; j<2; j++) {
          const shadow = this.add.text(W/2, l.y, l.t, { fontFamily: 'Impact', fontSize: l.s + 'px', fill: 0xff0000, alpha: 0.3 }).setOrigin(0.5).setScale(6).setDepth(19)
          this.tweens.add({ targets: shadow, scale: 1, alpha: 0, x: W/2 + (j===0?-20:20), duration: 800, ease: 'Expo.out' })
        }

        this.tweens.add({ 
          targets: t, alpha: 1, scale: 1, duration: 600, ease: 'Elastic.out(1, 0.4)',
          onUpdate: (tw) => { 
            if(Math.random() > 0.85) {
              t.setX(W/2 + (Math.random()-0.5)*15); t.setAlpha(Math.random()*0.5 + 0.5) 
            } else { t.setX(W/2); t.setAlpha(1) }
          }
        })
      })
    })

    this._timer(6500, () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0, (cam, pct) => {
        if (pct === 1) this.scene.start('CharSelectScene')
      })
    })
  }

  _buildPokemonDialoguePanel() {
    const { W, H } = this, pW = Math.min(W - 40, 500), pH = 130; const c = this.add.container(W / 2 - pW / 2, H - pH - 30).setDepth(100)
    const bg = this.add.graphics().fillStyle(0x000000, 0.4).fillRoundedRect(4, 4, pW, pH, 12).fillStyle(0x0a0a1a, 0.95).fillRoundedRect(0, 0, pW, pH, 12).lineStyle(2, 0x4488ff, 0.6).strokeRoundedRect(0, 0, pW, pH, 12)
    const port = this.add.image(65, 65, 'char_0').setScale(0.6).setVisible(false)
    const s = this.add.text(130, 18, '', { fontFamily: '"Rajdhani", sans-serif', fontSize: '20px', fontStyle: 'bold' });
    const t = this.add.text(130, 52, '', { fontFamily: '"Nunito", sans-serif', fontSize: '16px', wordWrap: { width: pW - 150 }, lineSpacing: 4 })
    const prompt = this.add.text(pW - 25, pH - 20, '▼ TAP TO CONTINUE', { fontFamily: '"Nunito", sans-serif', fontSize: '10px', fill: '#4488ff', alpha: 0.6 }).setOrigin(1, 0.5).setVisible(false)
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 })
    c.add([bg, port, s, t, prompt]); c.setData('refs', { s, t, port, prompt }); return c
  }

  _fillPokemonDialogue(c, data, done) {
    const r = c.getData('refs'); const isHacker = data.speaker === 'UNKNOWN CALLER'; r.prompt.setVisible(false)
    if (this._typeEvent) { this._typeEvent.remove(); this._typeEvent = null } // KILL PREVIOUS TYPEWRITER
    
    if (isHacker) { r.s.setText(''); r.port.setVisible(false); r.s.setX(25); r.t.setX(25); r.t.setWordWrapWidth(c.getBounds().width - 50) }
    else { r.s.setText(data.speaker).setStyle({ fill: data.color }).setX(130); r.port.setVisible(true).setTexture('char_0'); r.t.setX(130); r.t.setWordWrapWidth(c.getBounds().width - 150) }
    
    r.t.setText(''); let i = 0;
    this._typeEvent = this.time.addEvent({ delay: 35, repeat: data.text.length - 1, callback: () => { 
      if (r.t) r.t.setText(r.t.text + data.text[i]); 
      i++; 
      if (i === data.text.length) { r.prompt.setVisible(true); done() } 
    } })
  }

  _buildPrompt() { const t = this.add.text(this.W / 2, this.H * 0.8, '[ TAP TO CONTINUE ]', { fontSize: '16px', fill: '#ffcc00' }).setOrigin(0.5); this.tweens.add({ targets: t, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 }); return t }
}