import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'

// ─── Member data ──────────────────────────────────────────────────────────────
const MEMBERS = [
  {
    name: 'Divyansh',
    color: 0x7b2fbe, accent: '#a855f7',
    skin: 0xc8825a, hair: 0x1a0800,
    shirt: 0x4c1d95, pants: 0x1e1b4b,
    msg: 'yaar yeh bug kyu\naa raha hai??',
    role: 'THE BUG WHISPERER'
  },
  {
    name: 'Sachi',
    color: 0x059669, accent: '#10b981',
    skin: 0xe0b080, hair: 0x100800,
    shirt: 0x064e3b, pants: 0x1a2e24,
    msg: 'kal submission\nhai bruh 😭',
    role: 'THE DEADLINE CRUSHER'
  },
  {
    name: 'Shivansh',
    color: 0xc2410c, accent: '#f97316',
    skin: 0xb87040, hair: 0x0d0500,
    shirt: 0x7c2d12, pants: 0x2d1008,
    msg: 'chill karo bhai\nchai pilo ☕',
    role: 'THE ZEN MASTER'
  },
  {
    name: 'Srayanash',
    color: 0xb91c1c, accent: '#ef4444',
    skin: 0xc8825a, hair: 0x150900,
    shirt: 0x7f1d1d, pants: 0x2d0a0a,
    msg: '404: motivation\nnot found 💀',
    role: 'THE CHAOS AGENT'
  },
]

// ─── Dialogue data ─────────────────────────────────────────────────────────
const PHASE3_DIALOGUE = [
  { speaker: 'UNKNOWN CALLER', text: 'SI lab ke 3 bande hamare paas hai...', portrait: null, color: '#ef4444', side: 'left'  },
  { speaker: 'UNKNOWN CALLER', text: 'Ransom chahiye.\n Shivansh sir ke Claude account ke credentials bhejo... warna...', portrait: null, color: '#ef4444', side: 'left'  },
  { speaker: 'DIVYANSH',       text: 'Claude ke creds?\nTum jaante nahi kya maang rahe ho.', portrait: 0, color: '#a855f7', side: 'right' },
  { speaker: 'DIVYANSH',       text: 'Ab sirf ek hi option hai...', portrait: 0, color: '#a855f7', side: 'right' },
  { speaker: 'DIVYANSH',       text: 'Unhe bulana hi padega.....\n "UNHE" ', portrait: 0, color: '#f59e0b', side: 'right' },
]

export class PreludeScene extends Phaser.Scene {
  constructor() {
    super('PreludeScene')
    this._tw   = []
    this._tmr  = []
    this._dialogueActive = false
    this._dialogueQueue  = []
    this._callEnded = false
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  create() {
    this.W = this.scale.width
    this.H = this.scale.height
    this._buildAllTextures()
    this.cameras.main.fadeIn(1400, 0, 0, 0)
    this._phase1_labScene()

    // Skip button
    const skipBtn = this.add.text(this.W - 20, 20, 'SKIP INTRO ⏭', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: '#222222',
      padding: { x: 10, y: 6 }
    }).setOrigin(1, 0).setDepth(999).setInteractive()
    
    skipBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('CharSelectScene'))
    })
  }

  _replaceGeneratedTexture(g, key, width, height) {
    if (this.textures.exists(key)) this.textures.remove(key)
    g.generateTexture(key, width, height)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTURE BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════
  _buildAllTextures() {
    MEMBERS.forEach((m, i) => this._buildCharTexture(m, `char_${i}`))
    this._buildMonitor()
    this._buildDesk()
    this._buildChair()
    this._buildPhone()
    this._buildParticle()
    this._buildFloor()
    this._buildWall()
  }

  // 3D-ish isometric-style character with shading, highlights, depth
  _buildCharTexture(m, key) {
    const CW = 64, CH = 96
    const g = this.add.graphics()

    // ── Shadow ──────────────────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.35)
    g.fillEllipse(CW/2, CH - 4, 44, 10)

    // ── Shoes ───────────────────────────────────────────────────────────────
    const shoeColor = 0xe8e8e8
    // Left shoe — 3D effect with top/side face
    g.fillStyle(0x555555)
    g.fillRoundedRect(10, CH-17, 18, 9, 2)   // left side face
    g.fillStyle(shoeColor)
    g.fillRoundedRect(9, CH-21, 18, 9, 2)    // left top face
    g.fillStyle(0xaaaaaa, 0.5)
    g.fillRect(9, CH-21, 18, 3)              // shoe highlight
    // Right shoe
    g.fillStyle(0x555555)
    g.fillRoundedRect(36, CH-17, 18, 9, 2)
    g.fillStyle(shoeColor)
    g.fillRoundedRect(35, CH-21, 18, 9, 2)
    g.fillStyle(0xaaaaaa, 0.5)
    g.fillRect(35, CH-21, 18, 3)

    // ── Legs ────────────────────────────────────────────────────────────────
    const pantsLight = Phaser.Display.Color.IntegerToColor(m.pants)
    const pantsDark  = { r: Math.max(0,pantsLight.r-30), g: Math.max(0,pantsLight.g-30), b: Math.max(0,pantsLight.b-30) }
    // Left leg
    g.fillStyle(m.pants)
    g.fillRect(13, CH-42, 14, 24)
    g.fillStyle(Phaser.Display.Color.GetColor(pantsDark.r,pantsDark.g,pantsDark.b), 0.5)
    g.fillRect(13, CH-42, 5, 24)  // shadow side
    g.fillStyle(0xffffff, 0.08)
    g.fillRect(20, CH-42, 3, 24)  // highlight
    // Right leg
    g.fillStyle(m.pants)
    g.fillRect(37, CH-42, 14, 24)
    g.fillStyle(Phaser.Display.Color.GetColor(pantsDark.r,pantsDark.g,pantsDark.b), 0.5)
    g.fillRect(37, CH-42, 5, 24)
    g.fillStyle(0xffffff, 0.08)
    g.fillRect(44, CH-42, 3, 24)
    // Belt
    g.fillStyle(0x222222)
    g.fillRect(13, CH-44, 38, 4)
    g.fillStyle(0x888888, 0.6)
    g.fillRect(29, CH-44, 6, 4)   // buckle

    // ── Body / Shirt ─────────────────────────────────────────────────────────
    const shirtLight = Phaser.Display.Color.IntegerToColor(m.shirt)
    const shirtMid   = { r: Math.max(0,shirtLight.r+15), g: Math.max(0,shirtLight.g+15), b: Math.max(0,shirtLight.b+15) }
    const shirtDark  = { r: Math.max(0,shirtLight.r-20), g: Math.max(0,shirtLight.g-20), b: Math.max(0,shirtLight.b-20) }

    // Body cube — right face (darker)
    g.fillStyle(Phaser.Display.Color.GetColor(shirtDark.r,shirtDark.g,shirtDark.b))
    g.fillRect(50, CH-72, 6, 30)
    // Body cube — front face
    g.fillStyle(m.shirt)
    g.fillRoundedRect(12, CH-74, 40, 32, 3)
    // Left shadow
    g.fillStyle(Phaser.Display.Color.GetColor(shirtDark.r,shirtDark.g,shirtDark.b), 0.55)
    g.fillRoundedRect(12, CH-74, 12, 32, 3)
    // Chest highlight
    g.fillStyle(0xffffff, 0.10)
    g.fillRoundedRect(28, CH-72, 16, 12, 2)
    // Collar
    g.fillStyle(m.skin)
    g.fillTriangle(26, CH-74, 32, CH-60, 38, CH-74)
    g.fillStyle(0x000000, 0.15)
    g.fillTriangle(26, CH-74, 29, CH-68, 35, CH-74)
    // Colour accent stripe
    g.fillStyle(m.color, 0.85)
    g.fillRect(13, CH-52, 39, 4)
    g.fillStyle(0xffffff, 0.12)
    g.fillRect(13, CH-52, 39, 1)

    // ── Arms ─────────────────────────────────────────────────────────────────
    // Left arm (closer, lighter)
    g.fillStyle(m.shirt)
    g.fillRoundedRect(2, CH-72, 12, 22, 4)
    g.fillStyle(0xffffff, 0.12)
    g.fillRoundedRect(2, CH-72, 4, 22, 4)
    g.fillStyle(0x000000, 0.18)
    g.fillRoundedRect(9, CH-72, 5, 22, 4)
    // Right arm
    g.fillStyle(Phaser.Display.Color.GetColor(shirtDark.r,shirtDark.g,shirtDark.b))
    g.fillRoundedRect(50, CH-72, 12, 22, 4)
    g.fillStyle(0x000000, 0.22)
    g.fillRoundedRect(56, CH-72, 6, 22, 4)
    // Hands
    const skinDark = { r: Math.max(0,((m.skin>>16)&0xff)-20), g: Math.max(0,((m.skin>>8)&0xff)-20), b: Math.max(0,(m.skin&0xff)-20) }
    g.fillStyle(m.skin)
    g.fillCircle(8,  CH-49, 7)
    g.fillCircle(56, CH-49, 7)
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b), 0.4)
    g.fillCircle(11, CH-51, 5)
    g.fillCircle(59, CH-51, 5)
    // Knuckles
    g.fillStyle(0x000000, 0.12)
    for (let k = 0; k < 3; k++) {
      g.fillRect(5 + k*2, CH-47, 1, 2)
      g.fillRect(53 + k*2, CH-47, 1, 2)
    }

    // ── Neck ────────────────────────────────────────────────────────────────
    g.fillStyle(m.skin)
    g.fillRect(27, CH-80, 10, 8)
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b), 0.35)
    g.fillRect(27, CH-80, 4, 8)

    // ── Head ─────────────────────────────────────────────────────────────────
    // Head shadow side (right)
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b))
    g.fillRoundedRect(37, CH-110, 12, 32, 5)
    // Head front
    g.fillStyle(m.skin)
    g.fillRoundedRect(16, CH-112, 32, 34, 5)
    // Cheek highlight
    g.fillStyle(0xffffff, 0.12)
    g.fillCircle(22, CH-95, 7)
    // Cheek blush
    g.fillStyle(0xff8888, 0.15)
    g.fillCircle(20, CH-93, 5)
    g.fillCircle(44, CH-93, 5)
    // Ears
    g.fillStyle(m.skin)
    g.fillCircle(17, CH-98, 5)
    g.fillCircle(47, CH-98, 5)
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b), 0.3)
    g.fillCircle(18, CH-97, 3)
    g.fillCircle(46, CH-97, 3)

    // ── Eyes ─────────────────────────────────────────────────────────────────
    // Eye whites
    g.fillStyle(0xf8f8f8)
    g.fillRoundedRect(21, CH-105, 9, 8, 2)
    g.fillRoundedRect(34, CH-105, 9, 8, 2)
    // Iris
    g.fillStyle(0x2d1b4e)
    g.fillCircle(25, CH-101, 3)
    g.fillCircle(38, CH-101, 3)
    // Pupil
    g.fillStyle(0x050505)
    g.fillCircle(25, CH-101, 1.5)
    g.fillCircle(38, CH-101, 1.5)
    // Eye shine (big)
    g.fillStyle(0xffffff, 0.95)
    g.fillCircle(26, CH-103, 1.5)
    g.fillCircle(39, CH-103, 1.5)
    // Eye shine (small)
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(24, CH-100, 0.8)
    g.fillCircle(37, CH-100, 0.8)
    // Eyelid top shadow
    g.fillStyle(0x000000, 0.18)
    g.fillRect(21, CH-105, 9, 2)
    g.fillRect(34, CH-105, 9, 2)

    // ── Eyebrows ─────────────────────────────────────────────────────────────
    g.fillStyle(m.hair)
    // Left brow — slight arch
    g.fillRect(21, CH-109, 4, 2)
    g.fillRect(25, CH-110, 4, 2)
    g.fillRect(29, CH-109, 1, 2)
    // Right brow
    g.fillRect(34, CH-109, 4, 2)
    g.fillRect(38, CH-110, 4, 2)
    g.fillRect(42, CH-109, 1, 2)

    // ── Nose ─────────────────────────────────────────────────────────────────
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b), 0.45)
    g.fillTriangle(30, CH-100, 33, CH-93, 27, CH-93)
    g.fillStyle(0x000000, 0.10)
    g.fillCircle(28, CH-93, 2)
    g.fillCircle(34, CH-93, 2)

    // ── Mouth ────────────────────────────────────────────────────────────────
    g.fillStyle(0x8b3a1a)
    g.fillRoundedRect(25, CH-88, 14, 3, 1)
    g.fillStyle(0xffc0a0, 0.5)
    g.fillRect(27, CH-88, 10, 1)
    // Smile creases
    g.fillStyle(Phaser.Display.Color.GetColor(skinDark.r,skinDark.g,skinDark.b), 0.3)
    g.fillRect(24, CH-89, 2, 3)
    g.fillRect(38, CH-89, 2, 3)

    // ── Hair ─────────────────────────────────────────────────────────────────
    const hairLight = { r: Math.min(255,((m.hair>>16)&0xff)+25), g: Math.min(255,((m.hair>>8)&0xff)+25), b: Math.min(255,(m.hair&0xff)+25) }
    g.fillStyle(m.hair)
    // Hair back volume
    g.fillEllipse(32, CH-115, 42, 26)
    // Hair top cap
    g.fillRect(15, CH-113, 34, 12)
    // Sides
    g.fillRoundedRect(13, CH-112, 8, 20, 3)
    g.fillRoundedRect(43, CH-112, 8, 20, 3)
    // Hair highlight
    g.fillStyle(Phaser.Display.Color.GetColor(hairLight.r,hairLight.g,hairLight.b), 0.35)
    g.fillEllipse(26, CH-117, 16, 8)
    // Hair sheen
    g.fillStyle(0xffffff, 0.07)
    g.fillEllipse(23, CH-118, 10, 5)

    this._replaceGeneratedTexture(g, key, CW, CH)
    g.destroy()
  }

  _buildMonitor() {
    const g = this.add.graphics()
    const MW = 70, MH = 90
    // Stand cylinder with 3D look
    g.fillStyle(0x0d0d22)
    g.fillRect(MW/2-5, 72, 10, 14)
    g.fillStyle(0x1a1a3a, 0.5)
    g.fillRect(MW/2-5, 72, 4, 14)
    // Stand base
    g.fillStyle(0x0a0a1c)
    g.fillRoundedRect(MW/2-18, 82, 36, 6, 2)
    g.fillStyle(0x2a2a4a, 0.4)
    g.fillRect(MW/2-16, 82, 32, 2)

    // Monitor body — 3D depth effect
    g.fillStyle(0x0a0a1c)  // right side face
    g.fillRect(MW-4, 4, 4, 70)
    g.fillStyle(0x06060f)  // bottom face
    g.fillRect(0, 70, MW, 4)
    // Main bezel
    g.fillStyle(0x111124)
    g.fillRoundedRect(0, 0, MW-4, 72, 4)
    // Bezel inner
    g.fillStyle(0x080818)
    g.fillRoundedRect(2, 2, MW-8, 68, 3)
    // Screen
    g.fillStyle(0x030310)
    g.fillRect(5, 5, MW-18, 62)

    // Screen content — code editor
    const lineColors = [0x00ff88, 0x4488ff, 0xff8844, 0xffff55, 0xff66aa, 0x44ffff, 0xaa88ff]
    const indents = [0, 12, 24, 12, 0, 16, 8, 24, 0]
    for (let r = 0; r < 11; r++) {
      const col = lineColors[r % lineColors.length]
      const ind = indents[r % indents.length]
      const len = 15 + (r * 7) % 22
      g.fillStyle(col, 0.78)
      g.fillRect(7 + ind, 8 + r * 5, len, 2)
      // Dim secondary token
      if (r % 3 !== 0) {
        g.fillStyle(0x334466, 0.45)
        g.fillRect(7 + ind + len + 3, 8 + r * 5, Math.floor(len * 0.5), 2)
      }
    }
    // Active line highlight
    g.fillStyle(0x0d2444, 0.6)
    g.fillRect(5, 57, MW-18, 5)
    // Cursor
    g.fillStyle(0x00ff88)
    g.fillRect(7, 58, 6, 3)
    // Screen glow overlay
    g.fillStyle(0x002244, 0.15)
    g.fillRect(5, 5, MW-18, 10)

    // Notch/logo on bezel
    g.fillStyle(0x181830)
    g.fillRect(MW/2-14, 70, 28, 2)
    // Power LED
    g.fillStyle(0x00ee44)
    g.fillCircle(MW-10, 68, 2)
    g.fillStyle(0x88ffaa, 0.7)
    g.fillCircle(MW-10, 67, 1)

    // Screen reflection diagonal
    g.fillStyle(0xffffff, 0.025)
    g.fillTriangle(5, 5, 22, 5, 5, 25)

    this._replaceGeneratedTexture(g, 'monitor', MW, MH)
    g.destroy()
  }

  _buildDesk() {
    const g = this.add.graphics()
    const DW = 110, DH = 24
    // Desk front face (visible)
    g.fillStyle(0x0e0e28)
    g.fillRect(0, 6, DW, DH-6)
    // Desk top face — lighter
    g.fillStyle(0x1a1a38)
    g.fillRect(0, 0, DW, 8)
    // Top edge highlight
    g.fillStyle(0x3a3a6a, 0.8)
    g.fillRect(0, 0, DW, 2)
    // Surface gloss spec
    g.fillStyle(0xffffff, 0.06)
    g.fillRect(8, 1, 20, 3)
    // Desk edge depth line
    g.fillStyle(0x050510)
    g.fillRect(0, 6, DW, 2)
    // Table legs hint
    g.fillStyle(0x0a0a1e)
    g.fillRect(8, 8, 5, DH-8)
    g.fillRect(DW-13, 8, 5, DH-8)
    // Leg highlight
    g.fillStyle(0x1a1a3a, 0.5)
    g.fillRect(8, 8, 2, DH-8)
    g.fillRect(DW-13, 8, 2, DH-8)

    this._replaceGeneratedTexture(g, 'desk', DW, DH)
    g.destroy()
  }

  _buildChair() {
    const g = this.add.graphics()
    const CW = 52, CH = 68
    // Back rest — 3D box
    g.fillStyle(0x0a0a22)   // right face
    g.fillRect(38, 0, 6, 26)
    g.fillStyle(0x060612)   // top face
    g.fillRect(4, 0, 40, 5)
    g.fillStyle(0x151530)   // front face
    g.fillRoundedRect(4, 3, 34, 24, 3)
    // Back padding
    g.fillStyle(0x1e1e40, 0.8)
    g.fillRoundedRect(7, 6, 28, 16, 2)
    g.fillStyle(0x2a2a55, 0.35)
    g.fillRect(7, 6, 28, 4)
    // Headrest
    g.fillStyle(0x1a1a36)
    g.fillRoundedRect(11, 2, 20, 6, 2)

    // Seat — 3D box
    g.fillStyle(0x0a0a22)   // right face
    g.fillRect(42, 28, 6, 12)
    g.fillStyle(0x060612)
    g.fillRect(2, 28, 46, 5)   // top face
    g.fillStyle(0x151530)
    g.fillRoundedRect(2, 31, 40, 10, 2)  // front face
    g.fillStyle(0x2a2a50, 0.3)
    g.fillRect(4, 31, 36, 3)

    // Cylinder post
    g.fillStyle(0x0d0d22)
    g.fillRect(18, 41, 10, 12)
    g.fillStyle(0x2a2a44, 0.5)
    g.fillRect(18, 41, 4, 12)

    // Star base
    g.fillStyle(0x0a0a1e)
    const cx = 23, cy = 57
    const arms = 5
    for (let a = 0; a < arms; a++) {
      const angle = (a / arms) * Math.PI * 2 - Math.PI/2
      const x2 = cx + Math.cos(angle) * 16
      const y2 = cy + Math.sin(angle) * 8
      g.fillRect(Math.min(cx, x2), Math.min(cy, y2), Math.abs(x2-cx)+3, Math.abs(y2-cy)+3)
    }
    g.fillCircle(cx, cy, 7)

    // Wheels
    g.fillStyle(0x1a1a30)
    const wPos = [[9,63],[23,65],[37,63]]
    wPos.forEach(([wx,wy]) => {
      g.fillEllipse(wx, wy, 9, 5)
      g.fillStyle(0x2d2d4a, 0.6)
      g.fillEllipse(wx, wy-1, 5, 3)
      g.fillStyle(0x1a1a30)
    })

    this._replaceGeneratedTexture(g, 'chair', CW, CH)
    g.destroy()
  }

  _buildPhone() {
    const g = this.add.graphics()
    const PW = 52, PH = 90
    // Phone shadow right/bottom — 3D
    g.fillStyle(0x0a0a18)
    g.fillRoundedRect(4, 4, PW, PH, 9)
    // Body
    g.fillStyle(0x111122)
    g.fillRoundedRect(0, 0, PW, PH, 9)
    g.fillStyle(0x1a1a30)
    g.fillRoundedRect(1, 1, PW-2, PH-2, 8)
    // Side buttons
    g.fillStyle(0x080818)
    g.fillRoundedRect(-2, 22, 3, 10, 1)  // volume
    g.fillRoundedRect(-2, 36, 3, 8, 1)
    g.fillRoundedRect(PW-1, 28, 3, 14, 1)  // power
    // Camera notch
    g.fillStyle(0x080812)
    g.fillRoundedRect(15, 4, 22, 7, 3)
    g.fillStyle(0x0a0a1c)
    g.fillCircle(26, 7, 3)
    g.fillStyle(0x1c1c35, 0.7)
    g.fillCircle(26, 7, 1.5)  // lens
    g.fillStyle(0xffffff, 0.3)
    g.fillCircle(25, 6, 0.8)   // lens shine

    // Screen bezel
    g.fillStyle(0x040410)
    g.fillRoundedRect(4, 13, PW-8, PH-20, 4)

    // ── Screen content ──
    // BG
    g.fillStyle(0x0a0014)
    g.fillRect(5, 14, PW-10, PH-22)
    // Incoming call red overlay
    g.fillStyle(0x200000, 0.9)
    g.fillRect(5, 14, PW-10, 30)
    // Caller ID area — red gradient
    g.fillStyle(0x3a0000, 0.7)
    g.fillRect(5, 14, PW-10, 5)
    // Unknown icon circle
    g.fillStyle(0x550000, 0.9)
    g.fillCircle(26, 27, 9)
    g.fillStyle(0xcc2222, 0.6)
    g.fillCircle(26, 24, 4)  // head
    g.fillStyle(0xcc2222, 0.6)
    g.fillEllipse(26, 35, 12, 6)  // body

    // UNKNOWN text bars
    g.fillStyle(0xff3333, 0.6)
    g.fillRect(10, 41, 32, 2)
    g.fillStyle(0xaa2222, 0.4)
    g.fillRect(14, 45, 24, 2)
    // "INCOMING CALL" bar
    g.fillStyle(0x220000, 0.8)
    g.fillRect(5, 49, PW-10, 10)
    g.fillStyle(0xff2222, 0.25)
    g.fillRect(5, 49, PW-10, 2)
    // Accept / Decline buttons
    g.fillStyle(0x116622)
    g.fillCircle(15, 62, 7)
    g.fillStyle(0xcc2222)
    g.fillCircle(37, 62, 7)
    // Phone icons
    g.fillStyle(0xffffff, 0.9)
    g.fillRect(12, 61, 6, 2)
    g.fillRect(34, 61, 6, 2)
    g.fillRect(35, 60, 2, 4)
    // Screen bottom glow
    g.fillStyle(0x1a0000, 0.4)
    g.fillRect(5, 69, PW-10, PH-91)
    // Notification LED blinking
    g.fillStyle(0xff2200)
    g.fillCircle(PW-5, 5, 3)
    g.fillStyle(0xff8888, 0.7)
    g.fillCircle(PW-5, 4, 1.5)
    // Home bar
    g.fillStyle(0x222238)
    g.fillRoundedRect(17, PH-8, 18, 3, 1)

    this._replaceGeneratedTexture(g, 'phone', PW, PH)
    g.destroy()
  }

  _buildParticle() {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(4, 4, 4)
    this._replaceGeneratedTexture(g, 'particle', 8, 8)
    g.destroy()
  }

  _buildWall() {
    const g = this.add.graphics()
    const TW = 480, TH = 220
    // Deep space background
    for (let y = 0; y < TH; y += 4) {
      const t = y / TH
      const r = Math.round(4 + t * 4)
      const gb = Math.round(4 + t * 8)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gb, gb + 4))
      g.fillRect(0, y, TW, 4)
    }
    // Brick grid with proper 3D shadow
    const bW = 72, bH = 26
    for (let row = 0; row < 10; row++) {
      const off = row % 2 === 0 ? 0 : bW / 2
      for (let col = -1; col < 9; col++) {
        const bx = col * bW + off
        const by = row * bH
        // Brick shadow
        g.fillStyle(0x000000, 0.3)
        g.fillRect(bx + 2, by + 2, bW - 3, bH - 2)
        // Brick base
        const shade = ((row + col) % 2 === 0) ? 0x0d0d24 : 0x0b0b1e
        g.fillStyle(shade)
        g.fillRect(bx + 1, by + 1, bW - 3, bH - 3)
        // Brick top highlight
        g.fillStyle(0xffffff, 0.025)
        g.fillRect(bx + 2, by + 2, bW - 4, 3)
        // Mortar lines
        g.fillStyle(0x050510, 0.7)
        g.fillRect(bx, by, bW, 1)  // top
        g.fillRect(bx, by, 1, bH)  // left
      }
    }
    // Baseboard
    g.fillStyle(0x060612, 0.8)
    g.fillRect(0, TH - 12, TW, 12)
    g.fillStyle(0x1a1a3a, 0.4)
    g.fillRect(0, TH - 12, TW, 2)
    this._replaceGeneratedTexture(g, 'lab_wall', TW, TH)
    g.destroy()
  }

  _buildFloor() {
    const g = this.add.graphics()
    const TW = 480, TH = 120
    g.fillStyle(0x050710)
    g.fillRect(0, 0, TW, TH)
    const TS = 60
    for (let tx = 0; tx < TW; tx += TS) {
      for (let ty = 0; ty < TH; ty += TS) {
        const alt = (Math.floor(tx/TS) + Math.floor(ty/TS)) % 2
        g.fillStyle(alt ? 0x08081a : 0x07070f)
        g.fillRect(tx+1, ty+1, TS-2, TS-2)
        // Tile highlight corner
        g.fillStyle(0xffffff, 0.025)
        g.fillRect(tx+2, ty+2, 10, 10)
        // Grout
        g.fillStyle(0x020208, 0.9)
        g.fillRect(tx, ty, TS, 1)
        g.fillRect(tx, ty, 1, TS)
      }
    }
    // Floor reflection
    g.fillStyle(0x1a1a44, 0.08)
    g.fillRect(0, 0, TW, 6)
    this._replaceGeneratedTexture(g, 'lab_floor', TW, TH)
    g.destroy()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — SI LAB SCENE
  // ═══════════════════════════════════════════════════════════════════════════
  _phase1_labScene() {
    const { W, H } = this
    const isMobile = W < 500

    // ── Backgrounds ────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x04040e).setOrigin(0)
    const wallH = H * 0.63
    this.add.tileSprite(0, 0, W, wallH, 'lab_wall').setOrigin(0)
    const floorY = H * 0.68
    this.add.tileSprite(0, floorY, W, H - floorY, 'lab_floor').setOrigin(0)

    // Wall/floor junction
    const jG = this.add.graphics()
    jG.fillStyle(0x020208)
    jG.fillRect(0, floorY - 2, W, 4)

    // Ceiling lights
    this._ceilingLight(W * 0.25, 0, W * 0.35)
    this._ceilingLight(W * 0.75, 0, W * 0.30)

    // Ambient monitor glows on wall
    const wallGlows = isMobile
      ? [{ x: W*0.25, c: 0x0a2060 }, { x: W*0.75, c: 0x0a3a20 }]
      : [{ x: W*0.15, c: 0x0a1a60 }, { x: W*0.38, c: 0x0a3a20 }, { x: W*0.62, c: 0x220a40 }, { x: W*0.85, c: 0x1a1a50 }]
    wallGlows.forEach(({ x, c }) => {
      const wg = this.add.graphics()
      for (let r = 70; r > 0; r -= 6) {
        wg.fillStyle(c, 0.016 * (1 - r/70))
        wg.fillEllipse(x, H * 0.3, r * 3.5, r * 1.8)
      }
    })

    // ── Scene Title ─────────────────────────────────────────────────────────
    const tagline = this._label(W/2, H*0.04, '[ SI LAB  //  CS DEPT  //  LATE NIGHT ]', 7, '#0e1a44').setOrigin(0.5).setAlpha(0)
    this._tw_add(this.tweens.add({ targets: tagline, alpha: 1, duration: 700, delay: 400 }))

    const sceneTitle = this._label(W/2, H*0.095, 'A NORMAL NIGHT IN THE LAB', this._fs(2.6, 8, 18), '#1e2e77').setOrigin(0.5).setAlpha(0)
    this._tw_add(this.tweens.add({ targets: sceneTitle, alpha: 1, duration: 600, delay: 700 }))

    const titleLine = this.add.graphics().setAlpha(0)
    titleLine.lineStyle(1, 0x242e66, 0.5)
    titleLine.lineBetween(W*0.12, H*0.14, W*0.88, H*0.14)
    this._tw_add(this.tweens.add({ targets: titleLine, alpha: 1, duration: 400, delay: 1000 }))

    // ── Characters ──────────────────────────────────────────────────────────
    const slots = isMobile
      ? [{ x: W*0.25 }, { x: W*0.75 }]
      : [{ x: W*0.15 }, { x: W*0.38 }, { x: W*0.62 }, { x: W*0.85 }]
    const showCount = isMobile ? 4 : 4  // show all 4 even on mobile — compact spacing

    const deskY = H * 0.70
    const charY = H * 0.60

    // Determine x positions
    const xSlots = isMobile
      ? [W*0.22, W*0.44, W*0.66, W*0.88]
      : [W*0.14, W*0.37, W*0.63, W*0.86]

    this._charObjects = []

    MEMBERS.forEach((m, i) => {
      const x   = xSlots[i]
      const del = 900 + i * 280
      const scale = isMobile ? 0.55 : 0.70

      // Floor glow under each station
      const floorGlow = this.add.graphics().setAlpha(0).setDepth(2)
      for (let r = 30; r > 0; r -= 3) {
        floorGlow.fillStyle(m.color, 0.015 * (1 - r/30))
        floorGlow.fillEllipse(x, deskY + 8, r * 3, r * 0.9)
      }

      // Monitor glow (behind monitor)
      const monGlow = this.add.graphics().setAlpha(0).setDepth(3)
      for (let r = 36; r > 0; r -= 4) {
        monGlow.fillStyle(m.color, 0.03 * (1 - r/36))
        monGlow.fillEllipse(x, deskY - 30, r * 3.2, r * 1.6)
      }

      const chair = this.add.image(x + 3, deskY + 18, 'chair').setAlpha(0).setScale(scale * 0.80).setDepth(3)
      const desk  = this.add.image(x, deskY, 'desk').setAlpha(0).setScale(scale * 1.1).setDepth(4)
      const mon   = this.add.image(x, deskY - 28, 'monitor').setAlpha(0).setScale(scale * 0.80).setDepth(5)
      const char  = this.add.image(x, charY, `char_${i}`).setAlpha(0).setScale(scale).setDepth(5)
      const tag   = this._buildNameTag(x, deskY + 20, m.name, m.color).setAlpha(0).setDepth(7)

      this._tw_add(this.tweens.add({ targets: floorGlow, alpha: 1, duration: 300, delay: del - 100 }))
      this._tw_add(this.tweens.add({ targets: monGlow,   alpha: 1, duration: 350, delay: del }))
      this._tw_add(this.tweens.add({ targets: mon,       alpha: 1, duration: 300, delay: del + 50 }))
      this._tw_add(this.tweens.add({ targets: desk,      alpha: 1, duration: 280, delay: del + 80 }))
      this._tw_add(this.tweens.add({ targets: chair,     alpha: 1, duration: 280, delay: del + 100 }))
      this._tw_add(this.tweens.add({
        targets: char, alpha: 1, y: charY,
        duration: 420, ease: 'Back.out(1.8)', delay: del + 150
      }))
      this._tw_add(this.tweens.add({ targets: tag, alpha: 1, duration: 250, delay: del + 360 }))

      // Idle breathe
      this._tw_add(this.tweens.add({
        targets: char, scaleY: scale * 1.02, scaleX: scale * 0.99,
        duration: 1600 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: del + 600
      }))
      // Monitor glow breathe
      this._tw_add(this.tweens.add({
        targets: monGlow, alpha: 0.55,
        duration: 1800 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      }))

      this._charObjects.push({ char, mon, desk, chair, tag, x, charY, m })

      // Speech bubble after a delay
      this._timer(2200 + i * 480, () => {
        const bub = this._buildSpeechBubble(x, charY - Math.round(44 * scale) - 28, m.msg, m.color)
          .setAlpha(0).setDepth(9)
        this._tw_add(this.tweens.add({
          targets: bub, alpha: 1, y: bub.y - 4,
          duration: 380, ease: 'Back.out(1.4)'
        }))
        this._timer(3400, () => {
          this._tw_add(this.tweens.add({
            targets: bub, alpha: 0, y: bub.y - 8,
            duration: 340, ease: 'Power2',
            onComplete: () => bub.destroy()
          }))
        })
      })
    })

    // Floating vibe text
    this._timer(3000,  () => this._spawnFloat(W*0.50, H*0.28, 'hahaha 😂',   '#336633', 10))
    this._timer(3600,  () => this._spawnFloat(W*0.28, H*0.26, 'bhai 💀',     '#223355', 9))
    this._timer(4200,  () => this._spawnFloat(W*0.72, H*0.29, 'chal bhai!',  '#443322', 10))
    this._timer(4800,  () => this._spawnFloat(W*0.46, H*0.25, 'khatam? 😱',  '#554422', 9))
    this._timer(5200,  () => this._spawnFloat(W*0.62, H*0.24, 'deadline 😭', '#332244', 9))

    // Transition
    this._timer(7200, () => this._blackOut(800, () => this._phase2_disappear()))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — DISAPPEARANCE
  // ═══════════════════════════════════════════════════════════════════════════
  _phase2_disappear() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)

    // Glitch burst then rebuild
    this._glitchBurst(5, () => {
      this.add.rectangle(0, 0, W, H, 0x04040e).setOrigin(0)
      const wallH = H * 0.63
      this.add.tileSprite(0, 0, W, wallH, 'lab_wall').setOrigin(0).setAlpha(0.75)
      const floorY = H * 0.68
      this.add.tileSprite(0, floorY, W, H - floorY, 'lab_floor').setOrigin(0).setAlpha(0.85)
      const jG = this.add.graphics()
      jG.fillStyle(0x020208)
      jG.fillRect(0, floorY - 2, W, 4)
      this._ceilingLight(W * 0.25, 0, W * 0.35)

      // Red pulse atmosphere
      const redAtm = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0).setDepth(38)
      this._tw_add(this.tweens.add({
        targets: redAtm, fillAlpha: 0.042,
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      }))

      const isMobile = W < 500
      const deskY = H * 0.70
      const charY = H * 0.60
      const xSlots = isMobile
        ? [W*0.22, W*0.44, W*0.66, W*0.88]
        : [W*0.14, W*0.37, W*0.63, W*0.86]
      const scale  = isMobile ? 0.55 : 0.70

      xSlots.forEach((x, i) => {
        const isDivyansh = i === 0
        const ms = MEMBERS[i]

        // Always show desk
        this.add.image(x, deskY, 'desk').setScale(scale * 1.1).setDepth(4)

        if (isDivyansh) {
          const monGlow = this.add.graphics().setDepth(3)
          for (let r = 36; r > 0; r -= 4) {
            monGlow.fillStyle(0x0a1a6a, 0.03 * (1 - r/36))
            monGlow.fillEllipse(x, deskY - 30, r * 3.2, r * 1.6)
          }
          this.add.image(x, deskY - 28, 'monitor').setScale(scale * 0.80).setDepth(5)
          this.add.image(x + 3, deskY + 18, 'chair').setScale(scale * 0.80).setDepth(3)

          const char = this.add.image(x, charY, 'char_0').setScale(scale).setDepth(6)
          // Scared trembling
          this._tw_add(this.tweens.add({ targets: char, x: x + 2.5, duration: 48, yoyo: true, repeat: -1, ease: 'Linear' }))
          this._tw_add(this.tweens.add({ targets: char, angle: 1.5, duration: 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }))

          this._buildNameTag(x, deskY + 20, 'Divyansh', 0x7b2fbe).setDepth(7)

          this._timer(600, () => {
            const bub = this._buildSpeechBubble(x, charY - Math.round(44 * scale) - 28, '...woh kahan\ngaye?? 😱', 0x7b2fbe)
              .setAlpha(0).setDepth(10)
            this._tw_add(this.tweens.add({ targets: bub, alpha: 1, duration: 320 }))
          })
        } else {
          // Empty spot — toppled chair, scattered items, eerie glow
          this.add.image(x + Phaser.Math.Between(-12, 12), deskY + 22, 'chair')
            .setScale(scale * 0.80).setDepth(3).setAlpha(0.38)
            .setRotation(Phaser.Math.FloatBetween(-0.8, 0.8))
            .setTint(0x0a0a1a)

          // Scattered item (keyboard/mouse)
          this.add.rectangle(
            x + Phaser.Math.Between(-22, 22), deskY - 2,
            Phaser.Math.Between(28, 42), 8,
            0x0c0c20, 0.65
          ).setRotation(Phaser.Math.FloatBetween(-0.55, 0.55)).setDepth(5)

          // Eerie empty glow
          const emptyGlow = this.add.graphics().setDepth(3).setAlpha(0)
          for (let r = 28; r > 0; r -= 4) {
            emptyGlow.fillStyle(ms.color, 0.018 * (1 - r/28))
            emptyGlow.fillEllipse(x, charY, r * 2.5, r * 2.5)
          }
          this._tw_add(this.tweens.add({ targets: emptyGlow, alpha: 1, duration: 400, delay: 200 + i * 80 }))
          this._tw_add(this.tweens.add({ targets: emptyGlow, alpha: 0.3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }))

          // Big glowing ?
          const qBg = this.add.text(x, charY, '?', {
            fontFamily: '"Nunito", sans-serif',
            fontSize: this._fs(10, 24, 52), fill: ms.accent,
            stroke: '#000000', strokeThickness: 6,
          }).setOrigin(0.5).setAlpha(0).setDepth(7)
          this._tw_add(this.tweens.add({ targets: qBg, alpha: 0.5, duration: 480, delay: 280 + i * 90 }))
          this._tw_add(this.tweens.add({ targets: qBg, y: charY - 10, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 }))
        }
      })

      // ── MISSING alert panel ────────────────────────────────────────────────
      this._timer(500, () => {
        const pW = Math.min(W * 0.88, 380)
        const pX = W / 2, pY = H * 0.15

        const panelG = this.add.graphics().setDepth(22).setAlpha(0)
        panelG.fillStyle(0x0e0000, 0.96)
        panelG.fillRoundedRect(pX - pW/2, pY - 32, pW, 64, 6)
        panelG.lineStyle(2, 0xdd2222, 0.9)
        panelG.strokeRoundedRect(pX - pW/2, pY - 32, pW, 64, 6)
        // Left warning stripe
        panelG.fillStyle(0xcc1111)
        panelG.fillRoundedRect(pX - pW/2, pY - 32, 6, 64, 6)
        // Top stripe
        panelG.fillStyle(0x330000)
        panelG.fillRect(pX - pW/2 + 6, pY - 32, pW - 6, 5)
        // Warning stripes (diagonal)
        for (let stripe = 0; stripe < 8; stripe++) {
          panelG.fillStyle(0xaa0000, 0.06)
          panelG.fillRect(pX - pW/2 + 6 + stripe * 40, pY - 32, 20, 64)
        }
        this._tw_add(this.tweens.add({ targets: panelG, alpha: 1, duration: 380 }))

        const missTxt = this._label(pX, pY - 10, '⚠  3 MEMBERS MISSING', this._fs(3.2, 9, 20), '#dd2222')
          .setOrigin(0.5).setAlpha(0).setDepth(23)
        const namesTxt = this._label(pX, pY + 14, 'SACHI  ·  SHIVANSH  ·  SRAYANASH', this._fs(1.6, 7, 12), '#661010')
          .setOrigin(0.5).setAlpha(0).setDepth(23)

        this._tw_add(this.tweens.add({ targets: missTxt, alpha: 1, duration: 320, delay: 120 }))
        this._tw_add(this.tweens.add({ targets: namesTxt, alpha: 1, duration: 320, delay: 260 }))

        // Flicker the warning text
        this._timer(1200, () => {
          this._tw_add(this.tweens.add({
            targets: missTxt, alpha: 0.15, duration: 60, yoyo: true, repeat: 9, ease: 'Linear'
          }))
        })
      })

      this._timer(5000, () => this._blackOut(700, () => this._phase3_phoneCall()))
    })
  }
// ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — PHONE CALL  (full-screen hijack, slide-to-answer)
  // ═══════════════════════════════════════════════════════════════════════════
  _phase3_phoneCall() {
    this._clearScene()
    const { W, H } = this

    // ── 1. HARD BLACKOUT BASE ─────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setDepth(0)

    // ── 2. PHONE FRAME — fills entire screen ─────────────────────────────
    // Outer bezel (device body)
    const bezelColor = 0x0d0d12
    const bezelG = this.add.graphics().setDepth(1)
    bezelG.fillStyle(bezelColor)
    bezelG.fillRoundedRect(0, 0, W, H, 22)
    // Metallic edge highlight (top)
    bezelG.fillStyle(0x2a2a38, 0.7)
    bezelG.fillRoundedRect(0, 0, W, 3, { tl: 22, tr: 22, bl: 0, br: 0 })
    // Metallic edge highlight (sides)
    bezelG.fillStyle(0x1a1a26, 0.5)
    bezelG.fillRect(0, 0, 3, H)
    bezelG.fillRect(W - 3, 0, 3, H)
    // Bottom chin
    bezelG.fillStyle(0x080810, 0.8)
    bezelG.fillRect(0, H - 40, W, 40)

    // ── 3. CAMERA NOTCH (punch-hole style) ───────────────────────────────
    const notchG = this.add.graphics().setDepth(3)
    notchG.fillStyle(0x030308)
    notchG.fillCircle(W / 2, 22, 11)
    // Camera lens rings
    notchG.lineStyle(1, 0x1a1a28, 0.8)
    notchG.strokeCircle(W / 2, 22, 9)
    notchG.fillStyle(0x0a0a18)
    notchG.fillCircle(W / 2, 22, 7)
    notchG.fillStyle(0x111120, 0.6)
    notchG.fillCircle(W / 2, 22, 4)
    notchG.fillStyle(0xffffff, 0.06)
    notchG.fillCircle(W / 2 - 2, 20, 2)  // lens glint

    // ── 4. STATUS BAR ─────────────────────────────────────────────────────
    const statusG = this.add.graphics().setDepth(3)
    // Time
    const now = new Date()
    const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')
    this.add.text(14, 10, timeStr, {
      fontFamily: '"Nunito", sans-serif', fontSize: 11, fill: '#ffffff'
    }).setDepth(4)
    // Signal bars (right side)
    statusG.fillStyle(0xffffff, 0.8)
    ;[0,1,2,3].forEach(i => {
      const bh = 4 + i * 3
      statusG.fillRect(W - 50 + i * 6, 14 - bh + 8, 4, bh)
    })
    // WiFi icon
    statusG.lineStyle(1.5, 0xffffff, 0.7)
    statusG.arc(W - 20, 18, 7, -2.4, -0.7)
    statusG.arc(W - 20, 18, 4.5, -2.4, -0.7)
    statusG.fillStyle(0xffffff, 0.8)
    statusG.fillCircle(W - 20, 18, 1.5)
    // Battery
    statusG.fillStyle(0xffffff, 0.15)
    statusG.fillRoundedRect(W - 12, 11, 10, 14, 2)
    statusG.fillStyle(0x44ff44, 0.9)
    statusG.fillRoundedRect(W - 11, 12, 8, 9, 1)
    statusG.fillStyle(0xffffff, 0.4)
    statusG.fillRect(W - 9, 10, 4, 2)  // battery nub

    // ── 5. ANIMATED SCREEN WALLPAPER (blurred cityscape suggestion) ───────
    const wallG = this.add.graphics().setDepth(2)
    // Deep blue-black gradient base
    for (let y = 40; y < H - 40; y += 3) {
      const t   = (y - 40) / (H - 80)
      const r   = Math.round(2 + t * 8)
      const gb  = Math.round(4 + t * 18)
      wallG.fillStyle(Phaser.Display.Color.GetColor(r, gb, gb + 5))
      wallG.fillRect(0, y, W, 3)
    }
    // City silhouette strip (abstract blobs at bottom)
    wallG.fillStyle(0x020208)
    ;[ [W*0.05,H*0.75,W*0.08,H*0.15],[W*0.13,H*0.70,W*0.07,H*0.20],
       [W*0.20,H*0.68,W*0.06,H*0.22],[W*0.28,H*0.73,W*0.09,H*0.17],
       [W*0.38,H*0.65,W*0.10,H*0.25],[W*0.50,H*0.72,W*0.07,H*0.18],
       [W*0.58,H*0.67,W*0.11,H*0.23],[W*0.71,H*0.75,W*0.06,H*0.15],
       [W*0.78,H*0.70,W*0.08,H*0.20],[W*0.87,H*0.73,W*0.10,H*0.17],
    ].forEach(([bx,by,bw,bh]) => wallG.fillRect(bx, by, bw, bh))
    // Window lights in buildings
    wallG.fillStyle(0xffee88, 0.5)
    for (let i = 0; i < 30; i++) {
      wallG.fillRect(
        W * 0.05 + Math.random() * W * 0.90,
        H * 0.68 + Math.random() * H * 0.14,
        2, 2
      )
    }

    // ── 6. CALL SCREEN OVERLAY — frosted glass effect ─────────────────────
    // Blurred panel that covers top 60% of screen
    const glassG = this.add.graphics().setDepth(5)
    for (let y = 40; y < H * 0.58; y += 2) {
      const t = (y - 40) / (H * 0.58 - 40)
      glassG.fillStyle(0x080814, 0.88 - t * 0.15)
      glassG.fillRect(0, y, W, 2)
    }
    // Glass sheen
    glassG.fillStyle(0xffffff, 0.022)
    glassG.fillRect(0, 40, W, 3)

    // ── 7. INCOMING CALL LABEL (top, under notch) ─────────────────────────
    const callLabel = this.add.text(W / 2, 48, 'Incoming Call', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(3, 11, 18), fill: '#9999bb'
    }).setOrigin(0.5).setAlpha(0).setDepth(8)
    this._tw_add(this.tweens.add({ targets: callLabel, alpha: 1, duration: 400, delay: 200 }))

    // ── 8. CALLER AVATAR ─────────────────────────────────────────────────
    const avatarY = H * 0.22
    // Pulsing ring 1
    const ring1 = this.add.graphics().setDepth(6).setAlpha(0)
    ring1.lineStyle(2, 0xff2222, 0.3)
    ring1.strokeCircle(W / 2, avatarY, 56)
    // Pulsing ring 2
    const ring2 = this.add.graphics().setDepth(6).setAlpha(0)
    ring2.lineStyle(1.5, 0xff3333, 0.18)
    ring2.strokeCircle(W / 2, avatarY, 70)
    // Pulsing ring 3
    const ring3 = this.add.graphics().setDepth(6).setAlpha(0)
    ring3.lineStyle(1, 0xff4444, 0.08)
    ring3.strokeCircle(W / 2, avatarY, 86)

    // Avatar circle (caller photo placeholder)
    const avatarG = this.add.graphics().setDepth(7).setAlpha(0)
    // Avatar background
    avatarG.fillStyle(0x1a0810)
    avatarG.fillCircle(W / 2, avatarY, 48)
    // Subtle gradient on avatar
    for (let r = 48; r > 0; r -= 3) {
      avatarG.fillStyle(0x2a0a18, 0.04 * (1 - r/48))
      avatarG.fillCircle(W / 2, avatarY, r)
    }
    // Avatar border (glowing red)
    avatarG.lineStyle(3, 0xcc1111, 0.9)
    avatarG.strokeCircle(W / 2, avatarY, 49)
    avatarG.lineStyle(1, 0xff5555, 0.35)
    avatarG.strokeCircle(W / 2, avatarY, 52)
    // Unknown person icon inside avatar
    // Head
    avatarG.fillStyle(0x440010, 0.9)
    avatarG.fillCircle(W / 2, avatarY - 12, 16)
    // Body
    avatarG.fillStyle(0x440010, 0.75)
    avatarG.fillEllipse(W / 2, avatarY + 18, 44, 28)
    // Mask/shadow over face = unknown
    avatarG.fillStyle(0x000000, 0.55)
    avatarG.fillCircle(W / 2, avatarY - 12, 16)
    avatarG.fillEllipse(W / 2, avatarY + 18, 44, 28)
    // ? over face
    const qMark = this.add.text(W / 2, avatarY - 10, '?', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(6, 18, 36), fill: '#cc2222',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(9)

    // Reveal avatar
    this._tw_add(this.tweens.add({ targets: [avatarG, qMark], alpha: 1, duration: 500, delay: 300 }))
    this._tw_add(this.tweens.add({ targets: [ring1, ring2, ring3], alpha: 1, duration: 500, delay: 500 }))

    // Pulse rings outward
    this._tw_add(this.tweens.add({ targets: ring1, scaleX: 1.18, scaleY: 1.18, alpha: 0, duration: 1800, repeat: -1, ease: 'Power2', delay: 600 }))
    this._tw_add(this.tweens.add({ targets: ring2, scaleX: 1.22, scaleY: 1.22, alpha: 0, duration: 1800, repeat: -1, ease: 'Power2', delay: 950 }))
    this._tw_add(this.tweens.add({ targets: ring3, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 1800, repeat: -1, ease: 'Power2', delay: 1250 }))

    // ── 9. CALLER ID TEXT ─────────────────────────────────────────────────
    const callerName = this.add.text(W / 2, avatarY + 68, 'UNKNOWN', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(5, 16, 28), fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0).setDepth(8)

    const callerSub = this.add.text(W / 2, avatarY + 98, 'No Caller ID', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(2.5, 9, 14), fill: '#886688'
    }).setOrigin(0.5).setAlpha(0).setDepth(8)

    this._tw_add(this.tweens.add({ targets: [callerName, callerSub], alpha: 1, duration: 420, delay: 550 }))

    // ── 10. CALL TIMER (starts after answer — placeholder) ─────────────────
    const callTimerTxt = this.add.text(W / 2, avatarY + 118, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(2, 8, 12), fill: '#446644'
    }).setOrigin(0.5).setDepth(8)

    // ── 11. MUTE / SPEAKER BUTTONS (decorative, no function) ──────────────
    const btnY = H * 0.58
    const btnG = this.add.graphics().setDepth(8).setAlpha(0)
    // Mute button circle
    btnG.fillStyle(0x1a1a2a, 0.9)
    btnG.fillCircle(W * 0.25, btnY, 26)
    btnG.lineStyle(1, 0x333355, 0.6)
    btnG.strokeCircle(W * 0.25, btnY, 26)
    // Speaker button circle
    btnG.fillStyle(0x1a1a2a, 0.9)
    btnG.fillCircle(W * 0.75, btnY, 26)
    btnG.lineStyle(1, 0x333355, 0.6)
    btnG.strokeCircle(W * 0.75, btnY, 26)
    // Mute icon (mic outline)
    btnG.fillStyle(0x555577, 0.8)
    btnG.fillRoundedRect(W*0.25-6, btnY-14, 12, 18, 5)
    btnG.lineStyle(2, 0x555577, 0.6)
    btnG.arc(W*0.25, btnY+4, 10, Math.PI, 0)
    btnG.lineBetween(W*0.25, btnY+14, W*0.25, btnY+18)
    // Speaker icon (triangle)
    btnG.fillStyle(0x555577, 0.8)
    btnG.fillTriangle(W*0.75-8, btnY-8, W*0.75-8, btnY+8, W*0.75+2, btnY)
    btnG.fillRect(W*0.75+2, btnY-4, 4, 8)
    btnG.lineStyle(1.5, 0x555577, 0.5)
    btnG.arc(W*0.75+6, btnY, 6, -0.8, 0.8)
    btnG.arc(W*0.75+6, btnY, 10, -1.0, 1.0)

    const muteLabel = this.add.text(W * 0.25, btnY + 36, 'mute', {
      fontFamily: '"Nunito", sans-serif', fontSize: 9, fill: '#44445a'
    }).setOrigin(0.5).setAlpha(0).setDepth(9)
    const speakerLabel = this.add.text(W * 0.75, btnY + 36, 'speaker', {
      fontFamily: '"Nunito", sans-serif', fontSize: 9, fill: '#44445a'
    }).setOrigin(0.5).setAlpha(0).setDepth(9)

    this._tw_add(this.tweens.add({ targets: [btnG, muteLabel, speakerLabel], alpha: 1, duration: 400, delay: 900 }))

    // ── 12. SLIDE TO ANSWER BAR ───────────────────────────────────────────
    const sliderY   = H - 110
    const sliderW   = Math.min(W * 0.78, 300)
    const sliderX   = W / 2                      // centre X
    const trackH    = 62
    const trackR    = trackH / 2
    const trackL    = sliderX - sliderW / 2
    const trackR_   = sliderX + sliderW / 2
    const thumbR    = 27
    const thumbStartX = trackL + thumbR + 4
    const thumbEndX   = trackR_ - thumbR - 4

    // Track background
    const trackG = this.add.graphics().setDepth(10).setAlpha(0)
    // Track fill (dark)
    trackG.fillStyle(0x080812, 0.97)
    trackG.fillRoundedRect(trackL, sliderY - trackH/2, sliderW, trackH, trackR)
    // Track border
    trackG.lineStyle(2, 0x22aa44, 0.5)
    trackG.strokeRoundedRect(trackL, sliderY - trackH/2, sliderW, trackH, trackR)
    // Inner rim
    trackG.lineStyle(1, 0x114422, 0.35)
    trackG.strokeRoundedRect(trackL+3, sliderY-trackH/2+3, sliderW-6, trackH-6, trackR-3)

    // Slide hint label (arrows + text)
    const slideHintText = this.add.text(sliderX + 20, sliderY, '  slide to answer  ▶▶', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(2, 8, 12), fill: '#22aa44',
      alpha: 0.6
    }).setOrigin(0.5).setDepth(11).setAlpha(0)

    // Fill bar (shows progress)
    const fillBarG = this.add.graphics().setDepth(11).setAlpha(0)
    const updateFillBar = (thumbX) => {
      fillBarG.clear()
      const progress = (thumbX - thumbStartX) / (thumbEndX - thumbStartX)
      if (progress <= 0) return
      const fillW = (thumbX - trackL - thumbR) + thumbR
      fillBarG.fillStyle(0x22aa44, 0.22)
      fillBarG.fillRoundedRect(trackL, sliderY - trackH/2, fillW, trackH, trackR)
      // Green glow on fill
      fillBarG.fillStyle(0x00ff55, 0.05)
      fillBarG.fillRoundedRect(trackL, sliderY - trackH/2, fillW, trackH, trackR)
    }

    // Thumb (the green call button)
    const thumbG = this.add.graphics().setDepth(12).setAlpha(0)
    const drawThumb = (tx, pressed = false) => {
      thumbG.clear()
      // Outer glow
      for (let gr = thumbR + 10; gr > thumbR; gr -= 2) {
        thumbG.fillStyle(0x22aa44, 0.025 * (1 - (gr - thumbR) / 10))
        thumbG.fillCircle(tx, sliderY, gr)
      }
      // Shadow
      thumbG.fillStyle(0x000000, pressed ? 0.2 : 0.4)
      thumbG.fillCircle(tx + 3, sliderY + 3, thumbR)
      // Main circle (green)
      const baseColor = pressed ? 0x33cc55 : 0x22bb44
      thumbG.fillStyle(baseColor)
      thumbG.fillCircle(tx, sliderY, thumbR)
      // Sheen
      thumbG.fillStyle(0xffffff, pressed ? 0.1 : 0.22)
      thumbG.fillEllipse(tx - 7, sliderY - 10, thumbR * 0.9, thumbR * 0.55)
      // Inner ring
      thumbG.lineStyle(1.5, 0x55ff88, 0.35)
      thumbG.strokeCircle(tx, sliderY, thumbR - 5)
      // Phone icon (white)
      thumbG.fillStyle(0xffffff, 0.95)
      // Handset body
      thumbG.fillRoundedRect(tx - 9, sliderY - 10, 18, 20, 3)
      // Earpiece
      thumbG.fillStyle(baseColor)
      thumbG.fillRoundedRect(tx - 6, sliderY - 9, 12, 6, 2)
      // Mouthpiece
      thumbG.fillRoundedRect(tx - 6, sliderY + 3, 12, 6, 2)
    }

    // Decline button (right side, decorative)
    const declineG = this.add.graphics().setDepth(10).setAlpha(0)
    const declineY = sliderY
    declineG.fillStyle(0x0a0010, 0.9)
    declineG.fillCircle(trackR_ + 36, declineY, 26)
    declineG.lineStyle(2, 0xaa1111, 0.6)
    declineG.strokeCircle(trackR_ + 36, declineY, 26)
    // Red X (decline icon)
    declineG.lineStyle(3, 0xcc2222, 0.85)
    declineG.lineBetween(trackR_+28, declineY-8, trackR_+44, declineY+8)
    declineG.lineBetween(trackR_+44, declineY-8, trackR_+28, declineY+8)

    const declineLabel = this.add.text(trackR_ + 36, declineY + 38, 'decline', {
      fontFamily: '"Nunito", sans-serif', fontSize: 9, fill: '#441111'
    }).setOrigin(0.5).setDepth(11).setAlpha(0)

    // Reveal slider
    this._tw_add(this.tweens.add({ targets: [trackG, slideHintText, fillBarG, thumbG, declineG, declineLabel], alpha: 1, duration: 500, delay: 1200 }))
    this._tw_add(this.tweens.add({ targets: [trackG, slideHintText, fillBarG, thumbG, declineG, declineLabel], alpha: 0, duration: 0, delay: 0 }))
    this._timer(1200, () => {
      trackG.setAlpha(1)
      fillBarG.setAlpha(1)
      declineG.setAlpha(1)
      declineLabel.setAlpha(1)
      drawThumb(thumbStartX)
      thumbG.setAlpha(1)
      slideHintText.setAlpha(1)
      // Hint arrow pulse
      this._tw_add(this.tweens.add({
        targets: slideHintText, alpha: 0.15,
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      }))
      // Thumb idle glow pulse
      this._tw_add(this.tweens.add({
        targets: thumbG, alpha: 0.7,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      }))
    })

    // Bottom home bar
    const homeG = this.add.graphics().setDepth(10)
    homeG.fillStyle(0xffffff, 0.12)
    homeG.fillRoundedRect(W/2 - 50, H - 8, 100, 4, 2)

    // ── 13. SLIDE INTERACTION ──────────────────────────────────────────────
    let isDragging    = false
    let thumbX        = thumbStartX
    let answered      = false

    // Re-draw initial state
    this._timer(1210, () => { drawThumb(thumbStartX); updateFillBar(thumbStartX) })

    // Drag start
    const onDragStart = (ptr) => {
      if (answered) return
      const dx = ptr.x - thumbX
      const dy = ptr.y - sliderY
      if (Math.sqrt(dx*dx + dy*dy) < thumbR + 18) {
        isDragging = true
        thumbG.setAlpha(1)  // stop pulse
        slideHintText.setAlpha(0)
      }
    }

    const onDragMove = (ptr) => {
      if (!isDragging || answered) return
      thumbX = Phaser.Math.Clamp(ptr.x, thumbStartX, thumbEndX)
      drawThumb(thumbX, true)
      updateFillBar(thumbX)

      // Haptic-like: slight screen flash near end
      if (thumbX > thumbEndX - 20) {
        const f = this.add.rectangle(0,0,W,H,0x22aa44,0.04).setOrigin(0).setDepth(9999)
        this._tw_add(this.tweens.add({ targets: f, alpha: 0, duration: 80, onComplete: () => f.destroy() }))
      }
    }

    const onDragEnd = () => {
      if (!isDragging || answered) return
      isDragging = false

      if (thumbX >= thumbEndX - 8) {
        // ── ANSWERED ────────────────────────────────────────────────────
        answered = true
        this._onCallAnswered(
          thumbG, trackG, fillBarG, slideHintText, declineG, declineLabel,
          btnG, muteLabel, speakerLabel,
          callerName, callTimerTxt, callLabel, qMark, avatarG,
          ring1, ring2, ring3, callerSub
        )
      } else {
        // Snap back
        const snapBack = { val: thumbX }
        this._tw_add(this.tweens.add({
          targets: snapBack, val: thumbStartX,
          duration: 380, ease: 'Back.out(2.5)',
          onUpdate: () => {
            thumbX = snapBack.val
            drawThumb(thumbX)
            updateFillBar(thumbX)
          },
          onComplete: () => {
            // Resume hint
            this._tw_add(this.tweens.add({
              targets: slideHintText, alpha: 0.15,
              duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }))
            this._tw_add(this.tweens.add({
              targets: thumbG, alpha: 0.7,
              duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }))
          }
        }))
      }
    }

    this.input.on('pointerdown', onDragStart)
    this.input.on('pointermove', onDragMove)
    this.input.on('pointerup',   onDragEnd)

    // ── 14. VIBRATION / RINGING ANIMATION ────────────────────────────────
    this._timer(800, () => {
      const allElems = [bezelG, notchG, wallG, avatarG, qMark, callerName, callerSub]
      const vibeLoop = () => {
        if (answered) return
        this._tw_add(this.tweens.add({
          targets: allElems, x: '+=3',
          duration: 38, yoyo: true, repeat: 5, ease: 'Linear',
          onComplete: () => {
            if (!answered) this._timer(2400, vibeLoop)
          }
        }))
      }
      vibeLoop()
    })
  }

  // ── Called once the slider reaches the end ────────────────────────────────
  _onCallAnswered(
    thumbG, trackG, fillBarG, slideHintText, declineG, declineLabel,
    btnG, muteLabel, speakerLabel,
    callerName, callTimerTxt, callLabel, qMark, avatarG,
    ring1, ring2, ring3, callerSub
  ) {
    const { W, H } = this

    this.input.removeAllListeners()

    // ── Green flash confirmation ──────────────────────────────────────────
    const flash = this.add.rectangle(0, 0, W, H, 0x22ff55, 0).setOrigin(0).setDepth(9800)
    this._tw_add(this.tweens.add({
      targets: flash, fillAlpha: 0.28,
      duration: 160, yoyo: true, repeat: 1,
      onComplete: () => flash.destroy()
    }))

    // Slide elements out
    this._tw_add(this.tweens.add({
      targets: [thumbG, trackG, fillBarG, slideHintText, declineG, declineLabel],
      alpha: 0, duration: 300, ease: 'Power2'
    }))

    // ── CALL CONNECTED HEADER ─────────────────────────────────────────────
    this._tw_add(this.tweens.add({ targets: callLabel, alpha: 0, duration: 200 }))
    this._timer(220, () => {
      callLabel.setText('Call Connected')
      callLabel.setStyle({ fill: '#22aa44' })
      this._tw_add(this.tweens.add({ targets: callLabel, alpha: 1, duration: 300 }))
    })

    // Stop ring pulse, switch to steady connected glow
    this._tw_add(this.tweens.add({ targets: [ring1, ring2, ring3], alpha: 0, duration: 400 }))
    this._tw_add(this.tweens.add({ targets: qMark, alpha: 0, duration: 300 }))

    // Avatar border goes green
    avatarG.clear()
    avatarG.fillStyle(0x081a10)
    avatarG.fillCircle(W / 2, H * 0.22, 48)
    for (let r = 48; r > 0; r -= 3) {
      avatarG.fillStyle(0x0a2a10, 0.04 * (1 - r/48))
      avatarG.fillCircle(W / 2, H * 0.22, r)
    }
    avatarG.lineStyle(3, 0x22cc44, 0.9)
    avatarG.strokeCircle(W / 2, H * 0.22, 49)
    avatarG.lineStyle(1, 0x55ff88, 0.35)
    avatarG.strokeCircle(W / 2, H * 0.22, 52)
    // Silhouette
    avatarG.fillStyle(0x114422, 0.9)
    avatarG.fillCircle(W / 2, H*0.22 - 12, 16)
    avatarG.fillEllipse(W / 2, H*0.22 + 18, 44, 28)

    // ── CALL TIMER ────────────────────────────────────────────────────────
    let secs = 0
    const timerEvent = this.time.addEvent({
      delay: 1000, repeat: 60,
      callback: () => {
        secs++
        const m = Math.floor(secs / 60).toString().padStart(2,'0')
        const s = (secs % 60).toString().padStart(2,'0')
        callTimerTxt.setText(m + ':' + s)
      }
    })
    this._tmr.push(timerEvent)

    // ── SHOW MUTE/SPEAKER BUTTONS ─────────────────────────────────────────
    this._tw_add(this.tweens.add({ targets: [btnG, muteLabel, speakerLabel], alpha: 1, duration: 400, delay: 200 }))

    // ── SOUND WAVE ANIMATION (visual only) ───────────────────────────────
    const waveG = this.add.graphics().setDepth(8).setAlpha(0)
    this._tw_add(this.tweens.add({ targets: waveG, alpha: 1, duration: 300, delay: 300 }))

    const waveY  = H * 0.52
    const waveW  = Math.min(W * 0.7, 240)
    const bars   = 24
    const barPad = 3
    const barW   = (waveW - (bars - 1) * barPad) / bars

    let waveTime = 0
    const waveUpdate = this.time.addEvent({
      delay: 60, repeat: -1,
      callback: () => {
        if (this._callEnded) return
        waveG.clear()
        waveTime += 0.18
        for (let b = 0; b < bars; b++) {
          const bx  = W/2 - waveW/2 + b * (barW + barPad)
          const amp = 6 + Math.sin(waveTime + b * 0.55) * 10 + Math.sin(waveTime * 1.7 + b * 0.3) * 5
          const col = b % 3 === 0 ? 0x33ff66 : b % 3 === 1 ? 0x22cc44 : 0x118833
          waveG.fillStyle(col, 0.7)
          waveG.fillRoundedRect(bx, waveY - amp/2, barW, amp, 1)
          // Glow
          waveG.fillStyle(col, 0.15)
          waveG.fillRoundedRect(bx - 1, waveY - amp/2 - 2, barW + 2, amp + 4, 1)
        }
      }
    })
    this._tmr.push(waveUpdate)

    // End call button (big red circle, appears after connected)
    const endBtnY = H - 120
    const endBtnG = this.add.graphics().setDepth(12).setAlpha(0)
    endBtnG.fillStyle(0x0a0010, 0.95)
    endBtnG.fillCircle(W / 2, endBtnY, 32)
    endBtnG.lineStyle(2, 0xcc1111, 0.8)
    endBtnG.strokeCircle(W / 2, endBtnY, 32)
    // Hangup handset icon (rotated)
    endBtnG.fillStyle(0xcc1111, 0.9)
    endBtnG.fillRoundedRect(W/2-11, endBtnY-8, 22, 16, 4)
    endBtnG.fillStyle(0x0a0010, 0.9)
    endBtnG.fillRoundedRect(W/2-8, endBtnY-7, 8, 8, 2)
    endBtnG.fillRoundedRect(W/2+1, endBtnY-7, 8, 8, 2)
    const endLabel = this.add.text(W/2, endBtnY + 44, 'end call', {
      fontFamily: '"Nunito", sans-serif', fontSize: 9, fill: '#441111'
    }).setOrigin(0.5).setDepth(12).setAlpha(0)
    this._tw_add(this.tweens.add({ targets: [endBtnG, endLabel], alpha: 1, duration: 400, delay: 600 }))

    // ── DIALOGUE STARTS AUTOMATICALLY after 1.2s ─────────────────────────
    this._timer(1200, () => {
      this._callEnded = false
      this._runCallDialogue(PHASE3_DIALOGUE, endBtnG, endLabel, waveG, callTimerTxt, timerEvent, waveUpdate)
    })
  }

  // ── Dialogue runs on top of the call screen ───────────────────────────────
  _runCallDialogue(lines, endBtnG, endLabel, waveG, callTimerTxt, timerEvent, waveUpdate) {
    const { W, H } = this
    let lineIndex = 0

    const dialoguePanel = this._buildPokemonDialoguePanel()
    dialoguePanel.setAlpha(0).setDepth(60)
    this._tw_add(this.tweens.add({ targets: dialoguePanel, alpha: 1, duration: 280 }))

    const showLine = () => {
      if (lineIndex >= lines.length) {
        // All dialogue done — end call
        this._tw_add(this.tweens.add({
          targets: dialoguePanel, alpha: 0, duration: 260,
          onComplete: () => {
            dialoguePanel.destroy()
            this._endCall(endBtnG, endLabel, waveG, callTimerTxt, timerEvent, waveUpdate)
          }
        }))
        return
      }
      const lineData = lines[lineIndex]
      this._fillPokemonDialogue(dialoguePanel, lineData, () => {
        const advance = () => {
          this.input.off('pointerdown', advance)
          this.input.keyboard?.off('keydown-SPACE', advance)
          this.input.keyboard?.off('keydown-ENTER', advance)
          lineIndex++
          showLine()
        }
        const autoTimer = this._timer(3500, advance)
        this.input.once('pointerdown', () => { autoTimer?.remove(); advance() })
        this.input.keyboard?.once('keydown-SPACE', () => { autoTimer?.remove(); advance() })
        this.input.keyboard?.once('keydown-ENTER', () => { autoTimer?.remove(); advance() })
      })
    }
    showLine()
  }

  _endCall(endBtnG, endLabel, waveG, callTimerTxt, timerEvent, waveUpdate) {
    const { W, H } = this
    this._callEnded = true

    timerEvent?.remove()
    waveUpdate?.remove()

    // Waveform stops
    this._tw_add(this.tweens.add({ targets: waveG, alpha: 0, duration: 300 }))

    // Red flash
    const flash2 = this.add.rectangle(0,0,W,H,0xff1111,0).setOrigin(0).setDepth(9800)
    this._tw_add(this.tweens.add({
      targets: flash2, fillAlpha: 0.18,
      duration: 150, yoyo: true, repeat: 1,
      onComplete: () => flash2.destroy()
    }))

    // Call ended text
    const endedTxt = this.add.text(W/2, H*0.50, 'Call Ended', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: this._fs(3, 11, 18), fill: '#883333'
    }).setOrigin(0.5).setAlpha(0).setDepth(20)
    this._tw_add(this.tweens.add({ targets: endedTxt, alpha: 1, duration: 400 }))

    this._tw_add(this.tweens.add({ targets: [endBtnG, endLabel], alpha: 0, duration: 300 }))

    // Transition to phase 4
    this._timer(1400, () => {
      this._blackOut(700, () => this._phase4_whoAreThey())
    })
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // POKEMON-STYLE DIALOGUE ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  _runDialogueQueue(lines, startDelay, onFinish) {
    const { W, H } = this
    let lineIndex = 0

    const dialoguePanel = this._buildPokemonDialoguePanel()
    dialoguePanel.setAlpha(0)

    this._timer(startDelay, () => {
      this._tw_add(this.tweens.add({
        targets: dialoguePanel, alpha: 1, duration: 280, ease: 'Power2',
        onComplete: () => showLine()
      }))
    })

    const showLine = () => {
      if (lineIndex >= lines.length) {
        this._tw_add(this.tweens.add({
          targets: dialoguePanel, alpha: 0, duration: 260,
          onComplete: () => {
            dialoguePanel.destroy()
            onFinish?.()
          }
        }))
        return
      }
      const lineData = lines[lineIndex]
      this._fillPokemonDialogue(dialoguePanel, lineData, () => {
        // Tap / space to advance
        const advance = () => {
          this.input.off('pointerdown', advance)
          this.input.keyboard?.off('keydown-SPACE', advance)
          this.input.keyboard?.off('keydown-ENTER', advance)
          lineIndex++
          showLine()
        }
        // Auto-advance after 3.5s or wait for tap
        const autoTimer = this._timer(3500, advance)
        this.input.once('pointerdown', () => { autoTimer?.remove(); advance() })
        this.input.keyboard?.once('keydown-SPACE', () => { autoTimer?.remove(); advance() })
        this.input.keyboard?.once('keydown-ENTER', () => { autoTimer?.remove(); advance() })
      })
    }
  }

  _buildPokemonDialoguePanel() {
    const { W, H } = this
    const isMobile = W < 500
    const panelH   = isMobile ? H * 0.32 : H * 0.28
    const panelY   = H - panelH - 12
    const panelW   = W - 24

    const container = this.add.container(12, panelY).setDepth(50)

    // Panel shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.6)
    shadow.fillRoundedRect(4, 4, panelW, panelH, 10)

    // Main panel body
    const panel = this.add.graphics()
    panel.fillStyle(0x06060e, 0.97)
    panel.fillRoundedRect(0, 0, panelW, panelH, 10)

    // Top decorative bar
    panel.fillStyle(0x1a1a3a)
    panel.fillRoundedRect(0, 0, panelW, 6, { tl: 10, tr: 10, bl: 0, br: 0 })

    // Border (double line)
    panel.lineStyle(3, 0x3a3a6a, 0.9)
    panel.strokeRoundedRect(0, 0, panelW, panelH, 10)
    panel.lineStyle(1, 0x8888aa, 0.2)
    panel.strokeRoundedRect(3, 3, panelW - 6, panelH - 6, 8)

    // Portrait area
    const portraitSize  = isMobile ? 52 : 64
    const portraitX     = 12
    const portraitY     = 10
    const portraitPanel = this.add.graphics()
    portraitPanel.fillStyle(0x0a0a20)
    portraitPanel.fillRoundedRect(portraitX, portraitY, portraitSize, portraitSize, 6)
    portraitPanel.lineStyle(2, 0x3a3a6a, 0.8)
    portraitPanel.strokeRoundedRect(portraitX, portraitY, portraitSize, portraitSize, 6)
    // Portrait placeholder frame
    portraitPanel.lineStyle(1, 0x222244, 0.6)
    portraitPanel.lineBetween(portraitX+4, portraitY+4, portraitX+portraitSize-4, portraitY+portraitSize-4)
    portraitPanel.lineBetween(portraitX+4, portraitY+portraitSize-4, portraitX+portraitSize-4, portraitY+4)
    // "PHOTO" placeholder text
    const portraitPlaceholder = this.add.text(portraitX + portraitSize/2, portraitY + portraitSize/2, 'PHOTO', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 8, fill: '#222244'
    }).setOrigin(0.5)

    // Colour accent strip on left
    const accentStrip = this.add.graphics()
    accentStrip.fillStyle(0x7b2fbe, 1)  // default, updated per line
    accentStrip.fillRoundedRect(portraitX + portraitSize + 8, portraitY + 2, 3, portraitSize - 4, 2)

    // Speaker name badge
    const speakerBadge = this.add.graphics()
    const speakerText  = this.add.text(
      portraitX + portraitSize + 20,
      portraitY + 2, 'SPEAKER',
      { fontFamily: 'Impact, Arial Black, sans-serif', fontSize: isMobile ? 9 : 12, fill: '#aaaacc' }
    )

    // Dialogue text
    const textX = portraitX + portraitSize + 20
    const textY = portraitY + (isMobile ? 20 : 24)
    const textW = panelW - textX - 16
    const dialogueText = this.add.text(textX, textY, '', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: isMobile ? 12 : 16,
      fill: '#d8ddf0',
      wordWrap: { width: textW },
      lineSpacing: isMobile ? 6 : 8,
    })

    // Advance indicator (blinking ▼)
    const advanceArrow = this.add.text(panelW - 20, panelH - 20, '▼', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, fill: '#5555aa'
    }).setAlpha(0)
    this._tw_add(this.tweens.add({
      targets: advanceArrow, alpha: 0.1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    }))

    container.add([shadow, panel, portraitPanel, accentStrip, speakerBadge, speakerText, portraitPlaceholder, dialogueText, advanceArrow])

    // Store refs for updating
    container.setData('refs', {
      accentStrip, speakerText, dialogueText, advanceArrow,
      portraitPanel, portraitPlaceholder, portraitSize, portraitX, portraitY,
      isMobile, textX, textY, textW, panelW, panelH
    })

    return container
  }

  _fillPokemonDialogue(container, lineData, onDone) {
    const refs = container.getData('refs')
    const {
      accentStrip, speakerText, dialogueText, advanceArrow,
      portraitX, portraitY, portraitSize, isMobile
    } = refs

    // Stop any previous typing event tied to this dialogue panel before reusing it.
    const oldTypeInterval = container.getData('typeInterval')
    if (oldTypeInterval) {
      oldTypeInterval.remove()
      container.setData('typeInterval', null)
    }

    // Remove old portrait char if any
    const oldPortrait = container.getData('portraitChar')
    if (oldPortrait) oldPortrait.destroy()

    // Update speaker name
    speakerText.setText(lineData.speaker)
    speakerText.setStyle({ fill: lineData.color })

    // Update accent strip colour
    accentStrip.clear()
    const intCol = parseInt(lineData.color.replace('#', '0x'))
    accentStrip.fillStyle(intCol)
    accentStrip.fillRoundedRect(portraitX + portraitSize + 8, portraitY + 2, 3, portraitSize - 4, 2)

    // Draw portrait — if a member index given, show their char sprite, else show ? 
    if (lineData.portrait !== null && lineData.portrait !== undefined) {
      const m = MEMBERS[lineData.portrait]
      const pScale = isMobile ? 0.58 : 0.72
      const portraitChar = this.add.image(
        portraitX + portraitSize / 2,
        portraitY + portraitSize / 2 + 4,
        `char_${lineData.portrait}`
      ).setScale(pScale).setDepth(55)
      container.add(portraitChar)
      container.setData('portraitChar', portraitChar)
    } else {
      // Unknown caller — red pulsing ?
      const unk = this.add.text(
        portraitX + portraitSize / 2, portraitY + portraitSize / 2, '?',
        {
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: isMobile ? 20 : 26, fill: '#cc2222',
          stroke: '#000000', strokeThickness: 4
        }
      ).setOrigin(0.5).setDepth(55)
      this._tw_add(this.tweens.add({ targets: unk, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 }))
      container.add(unk)
      container.setData('portraitChar', unk)
    }

    // Typewriter effect
    advanceArrow.setAlpha(0)
    dialogueText.setText('')
    const fullText = lineData.text
    let charIdx    = 0
    const typeInterval = this.time.addEvent({
      delay: 25,
      repeat: fullText.length - 1,
      callback: () => {
        // Scene transitions can destroy the text/canvas while the timer is still alive.
        if (!container?.active || !dialogueText?.active || !dialogueText?.scene) {
          typeInterval.remove()
          container?.setData?.('typeInterval', null)
          return
        }
        charIdx++
        dialogueText.setText(fullText.substring(0, charIdx))
        if (charIdx >= fullText.length) {
          container.setData('typeInterval', null)
          // Show advance arrow
          this._tw_add(this.tweens.add({ targets: advanceArrow, alpha: 1, duration: 200 }))
          onDone?.()
        }
      }
    })
    container.setData('typeInterval', typeInterval)
    this._tmr.push(typeInterval)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — WHO ARE THEY?
  // ═══════════════════════════════════════════════════════════════════════════
  _phase4_whoAreThey() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
    this._grain()

    // Deep crimson background glow
    const redBg = this.add.graphics()
    for (let r = 140; r > 0; r -= 8) {
      redBg.fillStyle(0x1e0000, 0.018 * (1 - r/140))
      redBg.fillEllipse(W/2, H/2, r*3, r*2.2)
    }
    this._tw_add(this.tweens.add({
      targets: redBg, scaleX: 1.08, scaleY: 1.08,
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    }))

    // Chromatic aberration WHO ARE THEY text
    const style = { stroke: '#000000', strokeThickness: 6, lineSpacing: 10, align: 'center' }
    const sz    = this._fs(9.5, 24, 66)
    const msg   = 'WHO ARE\n"THEY" ???'

    const whoR  = this.add.text(W/2 + 5, H*0.40, msg, {
      fontFamily: '"Nunito", sans-serif', fontSize: sz, fill: '#ff0033',
      ...style
    }).setOrigin(0.5).setAlpha(0).setDepth(8)
    const whoB  = this.add.text(W/2 - 5, H*0.40, msg, {
      fontFamily: '"Nunito", sans-serif', fontSize: sz, fill: '#0033ff',
      ...style
    }).setOrigin(0.5).setAlpha(0).setDepth(8)
    const who   = this.add.text(W/2, H*0.40, msg, {
      fontFamily: '"Nunito", sans-serif', fontSize: sz, fill: '#ffffff',
      ...style
    }).setOrigin(0.5).setAlpha(0).setDepth(10)

    this._tw_add(this.tweens.add({ targets: whoR, alpha: 0.25, duration: 500 }))
    this._tw_add(this.tweens.add({ targets: whoB, alpha: 0.25, duration: 500 }))
    this._tw_add(this.tweens.add({ targets: who,  alpha: 1,    duration: 500, ease: 'Power2' }))

    // Jitter chroma aberrations
    this._tw_add(this.tweens.add({
      targets: whoR, x: W/2 + 6, duration: 80, yoyo: true, repeat: 30, ease: 'Linear'
    }))
    this._tw_add(this.tweens.add({
      targets: whoB, x: W/2 - 6, duration: 80, yoyo: true, repeat: 30, ease: 'Linear'
    }))

    // Flash strobes
    this._timer(600, () => {
      for (let i = 0; i < 4; i++) {
        this._timer(i * 90, () => {
          const f = this.add.rectangle(0, 0, W, H, 0xffffff, 0.06).setOrigin(0).setDepth(9900)
          this._tw_add(this.tweens.add({ targets: f, alpha: 0, duration: 60, onComplete: () => f.destroy() }))
        })
      }
    })
    this._timer(1200, () => {
      const strobe = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0).setDepth(9800)
      this._tw_add(this.tweens.add({
        targets: strobe, fillAlpha: 0.08, duration: 200, yoyo: true, repeat: 5
      }))
    })

    // Sub text
    this._timer(1000, () => {
      const sub = this._label(W/2, H * 0.70, '...who could possibly be strong enough?', this._fs(2, 7, 11), '#331111')
        .setOrigin(0.5).setAlpha(0).setDepth(9)
      this._tw_add(this.tweens.add({ targets: sub, alpha: 1, duration: 500 }))
      this._tw_add(this.tweens.add({ targets: sub, alpha: 0.25, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 }))
    })

    this._timer(3800, () => this._blackOut(700, () => this._phase5_theyReveal()))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — THE LEGENDS
  // ═══════════════════════════════════════════════════════════════════════════
  _phase5_theyReveal() {
    this._clearScene()
    const { W, H } = this

    this.add.rectangle(0, 0, W, H, 0x020007).setOrigin(0)
    this._grain()

    // Purple cosmic nebula
    const nebG = this.add.graphics().setDepth(0)
    for (let r = 200; r > 0; r -= 10) {
      nebG.fillStyle(0x120022, 0.010 * (1 - r/200))
      nebG.fillEllipse(W/2, H*0.44, r*2.5, r*1.8)
    }
    // Secondary warm nebula
    for (let r = 130; r > 0; r -= 10) {
      nebG.fillStyle(0x221000, 0.008 * (1 - r/130))
      nebG.fillEllipse(W*0.55, H*0.38, r*2.8, r*1.4)
    }

    // Star field
    const starG = this.add.graphics().setDepth(0).setAlpha(0.7)
    for (let i = 0; i < 200; i++) {
      const sz   = Math.random() * 1.6 + 0.2
      const alp  = Math.random() * 0.8 + 0.1
      const colv = Math.random() < 0.3 ? 0xddddff : Math.random() < 0.5 ? 0xffddaa : 0xffffff
      starG.fillStyle(colv, alp)
      starG.fillCircle(Math.random() * W, Math.random() * H * 0.85, sz)
    }
    // Twinkling
    this._tw_add(this.tweens.add({ targets: starG, alpha: 0.4, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }))

    // Sequence of reveal texts
    const seq = [
      { text: 'THEY refer to...',        col: '#2d3a55', sz: 2.8, delay: 250  },
      { text: 'THE STRONGEST',           col: '#7733aa', sz: 7.5, delay: 1700 },
      { text: 'MEMBERS OF SI LAB.',      col: '#8844bb', sz: 5.5, delay: 3200 },
      { text: '— THE G.O.A.T.S —',       col: '#cc8800', sz: 5.5, delay: 4800 },
      { text: 'THE LEGENDS.',            col: '#ffcc00', sz: 9.5, delay: 6300 },
      { text: 'THE ONES WHO GUIDED US.', col: '#887755', sz: 2.8, delay: 7900 },
    ]

    seq.forEach(({ text, col, sz, delay }) => {
      const size  = this._fs(sz, sz * 2.4, sz * 5.2)
      const yBase = H * 0.44
      const t     = this.add.text(W/2, yBase + 16, text, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: size, fill: col, align: 'center',
        stroke: '#000000', strokeThickness: 3, lineSpacing: 8,
      }).setOrigin(0.5).setAlpha(0).setDepth(10)

      this._timer(delay, () => {
        this._tw_add(this.tweens.add({
          targets: t, alpha: 1, y: yBase,
          duration: 380, ease: 'Back.out(1.4)'
        }))
        this._timer(1050, () => {
          this._tw_add(this.tweens.add({
            targets: t, alpha: 0, y: yBase - 10, scaleX: 0.9, scaleY: 0.9,
            duration: 360, ease: 'Power2',
            onComplete: () => t.destroy()
          }))
        })
      })
    })

    // ── FINAL REVEAL ──────────────────────────────────────────────────────
    this._timer(9500, () => {
      // Expanding light ring burst
      const burstG = this.add.graphics().setAlpha(0).setDepth(4)
      for (let r = 5; r <= 6; r++) {
        burstG.lineStyle(r * 2, 0xffcc00, 0.05 - r * 0.005)
        burstG.strokeCircle(W/2, H*0.42, 0)
      }
      this._tw_add(this.tweens.add({ targets: burstG, alpha: 1, duration: 300 }))
      this._tw_add(this.tweens.add({ targets: burstG, scaleX: 4, scaleY: 4, alpha: 0, duration: 1000, ease: 'Power2' }))

      // Rotating god rays
      const raysG = this.add.graphics().setAlpha(0).setDepth(2)
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2
        const len   = Math.max(W, H) * 0.7
        const thick = i % 3 === 0 ? 4 : 2
        const a     = i % 3 === 0 ? 0.055 : 0.022
        raysG.lineStyle(thick, 0xffcc00, a)
        raysG.lineBetween(W/2, H*0.42, W/2 + Math.cos(angle)*len, H*0.42 + Math.sin(angle)*len)
      }
      this._tw_add(this.tweens.add({ targets: raysG, alpha: 1, duration: 900 }))
      this._tw_add(this.tweens.add({
        targets: raysG, rotation: Math.PI * 2,
        duration: 15000, repeat: -1, ease: 'Linear'
      }))

      // Glow halo
      const glowG = this.add.graphics().setAlpha(0).setDepth(3)
      for (let r = 140; r > 0; r -= 8) {
        glowG.fillStyle(0xffcc00, 0.007 * (1 - r/140))
        glowG.fillCircle(W/2, H*0.42, r)
      }
      this._tw_add(this.tweens.add({ targets: glowG, alpha: 1, duration: 700, delay: 200 }))
      // Breathe
      this._tw_add(this.tweens.add({
        targets: glowG, scaleX: 1.12, scaleY: 1.12,
        duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700
      }))

      // "T H E Y" — layered shadow + main
      const shadowTxt = this.add.text(W/2 + 5, H*0.39 + 5, 'T H E Y', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: this._fs(11.5, 32, 96), fill: '#ff5500',
        stroke: '#000000', strokeThickness: 12
      }).setOrigin(0.5).setAlpha(0).setDepth(4)

      const mainTxt = this.add.text(W/2, H*0.39, 'T H E Y', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: this._fs(11.5, 32, 96), fill: '#ffdd00',
        stroke: '#000000', strokeThickness: 8
      }).setOrigin(0.5).setAlpha(0).setDepth(5)

      this._tw_add(this.tweens.add({ targets: shadowTxt, alpha: 0.55, duration: 750, ease: 'Back.out(1.3)' }))
      this._tw_add(this.tweens.add({ targets: mainTxt,   alpha: 1,    duration: 750, ease: 'Back.out(1.3)' }))

      // Eternal pulse
      this._tw_add(this.tweens.add({
        targets: [mainTxt, shadowTxt], scaleX: 1.04, scaleY: 1.04,
        duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900
      }))

      // Subtitle
      const sub = this._label(W/2, H*0.61, '— THE SENIORS WHO CHANGED EVERYTHING —', this._fs(2, 6, 12), '#443322')
        .setOrigin(0.5).setAlpha(0).setDepth(6)
      this._tw_add(this.tweens.add({ targets: sub, alpha: 1, duration: 650, delay: 500 }))

      // Shimmer on subtitle
      this._tw_add(this.tweens.add({
        targets: sub, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1400
      }))

      // Continue prompt
      this._timer(1800, () => {
        const prompt = this._buildPrompt()
        this._tw_add(this.tweens.add({ targets: prompt, alpha: 1, duration: 600 }))

        const advance = () => {
          this.input.removeAllListeners()
          this.input.keyboard?.removeAllListeners()
          this._blackOut(650, () => this.scene.start('CharSelectScene'))
        }
        this.input.once('pointerdown', advance)
        this.input.keyboard?.once('keydown-ENTER', advance)
        this.input.keyboard?.once('keydown-SPACE', advance)
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  _buildNameTag(x, y, name, color) {
    const container = this.add.container(x, y)
    const hex       = '#' + color.toString(16).padStart(6, '0')
    const tw        = Math.max(name.length * 7 + 20, 50)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    bg.fillRoundedRect(-tw/2, -10, tw, 20, 4)
    // Colour top strip
    bg.fillStyle(color, 0.85)
    bg.fillRect(-tw/2, -10, tw, 4)
    // Border
    bg.lineStyle(1, color, 0.6)
    bg.strokeRoundedRect(-tw/2, -10, tw, 20, 4)

    const nameT = this.add.text(0, 2, name, {
      fontFamily: '"Nunito", sans-serif', fontSize: 8, fill: '#ccccdd'
    }).setOrigin(0.5)

    container.add([bg, nameT])
    return container
  }

  _buildSpeechBubble(x, y, text, color) {
    const container = this.add.container(x, y)
    const hex    = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color
    const intCol = typeof color === 'number' ? color : parseInt(color.replace('#', '0x'))
    const lines  = text.split('\n')
    const bh     = lines.length * 13 + 22
    const bw     = 140

    const bg = this.add.graphics()
    // Shadow
    bg.fillStyle(0x000000, 0.45)
    bg.fillRoundedRect(-bw/2+3, -bh/2+3, bw, bh, 7)
    // Main bubble
    bg.fillStyle(0x07070f, 0.96)
    bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 7)
    // Top colour bar
    bg.fillStyle(intCol, 0.75)
    bg.fillRoundedRect(-bw/2, -bh/2, bw, 5, { tl: 7, tr: 7, bl: 0, br: 0 })
    // Border
    bg.lineStyle(1.5, intCol, 0.7)
    bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 7)
    // Inner highlight
    bg.lineStyle(1, 0xffffff, 0.04)
    bg.strokeRoundedRect(-bw/2+2, -bh/2+2, bw-4, bh-4, 5)
    // Tail
    bg.fillStyle(0x07070f, 0.96)
    bg.fillTriangle(-8, bh/2, 8, bh/2, 0, bh/2+12)
    bg.lineStyle(1.5, intCol, 0.5)
    bg.lineBetween(-8, bh/2, 0, bh/2+12)
    bg.lineBetween(8, bh/2, 0, bh/2+12)

    const t = this.add.text(0, 0, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: 9, fill: '#bcc8dc', align: 'center', lineSpacing: 4
    }).setOrigin(0.5)

    container.add([bg, t])
    return container
  }

  _buildPrompt() {
    const { W, H }    = this
    const isMobile    = this.sys.game.device.input.touch
    const label       = isMobile ? '[ TAP TO CONTINUE ]' : '[ PRESS ENTER OR SPACE ]'
    const container   = this.add.container(W/2, H*0.82).setAlpha(0).setDepth(20)
    const bw          = Math.min(W * 0.7, 280)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.70)
    bg.fillRoundedRect(-bw/2, -20, bw, 40, 6)
    bg.lineStyle(1, 0xffcc00, 0.5)
    bg.strokeRoundedRect(-bw/2, -20, bw, 40, 6)
    // Top strip
    bg.fillStyle(0xffcc00, 0.15)
    bg.fillRect(-bw/2, -20, bw, 4)

    const t = this.add.text(0, 0, label, {
      fontFamily: '"Nunito", sans-serif', fontSize: 9, fill: '#ccaa33'
    }).setOrigin(0.5)

    container.add([bg, t])
    this._tw_add(this.tweens.add({
      targets: container, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500
    }))
    return container
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DECORATORS
  // ═══════════════════════════════════════════════════════════════════════════
  _ceilingLight(x, y, width) {
    const { H } = this
    const g     = this.add.graphics()
    // Tube body
    g.fillStyle(0xc8dfff, 0.05)
    g.fillRect(x - width/2, y, width, 5)
    // Tube bright centre
    g.fillStyle(0xc8dfff, 0.85)
    g.fillRect(x - width/2 + 2, y + 1, width - 4, 2.5)
    // Tube end caps
    g.fillStyle(0x8899bb, 0.7)
    g.fillRect(x - width/2, y, 4, 5)
    g.fillRect(x + width/2 - 4, y, 4, 5)
    // Light cone
    for (let i = 0; i < 32; i++) {
      const t  = i / 32
      const cw = width * 0.55 * (1 + t * 1.6)
      const cy = y + 5 + t * H * 0.48
      const a  = 0.06 * (1 - t) * (1 - t)
      g.fillStyle(0xaac4ff, a)
      g.fillRect(x - cw/2, cy, cw, 4)
    }
  }

  _grain() {
    const { W, H } = this
    const g        = this.add.graphics().setDepth(9100).setAlpha(0.025)
    for (let i = 0; i < 2200; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.55 + 0.15)
      g.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 1, 1)
    }
  }

  _glitchBurst(count, onDone) {
    const { W, H } = this
    let done       = 0
    const flash    = () => {
      const bg = this.add.rectangle(0, 0, W, H, 0xffffff, 0.90).setOrigin(0).setDepth(9999)
      // Glitch slices
      for (let i = 0; i < 7; i++) {
        const sl = this.add.rectangle(
          Phaser.Math.Between(0, W),
          Phaser.Math.Between(0, H),
          Phaser.Math.Between(W*0.20, W),
          Phaser.Math.Between(2, 12),
          Phaser.Utils.Array.GetRandom([0xff00ff, 0x00ffff, 0xff0000, 0x00ff00, 0xffff00]),
          Phaser.Math.FloatBetween(0.6, 1.0)
        ).setOrigin(Phaser.Math.FloatBetween(0, 1), 0.5).setDepth(10000)
        this._tw_add(this.tweens.add({
          targets: sl, alpha: 0, duration: Phaser.Math.Between(60, 150),
          onComplete: () => sl.destroy()
        }))
        // Horizontal offset slice
        const sl2 = this.add.rectangle(
          Phaser.Math.Between(0, W * 0.3),
          sl.y + Phaser.Math.Between(-4, 4),
          Phaser.Math.Between(W*0.05, W*0.4), 6,
          0xffffff, 0.2
        ).setDepth(10001)
        this._tw_add(this.tweens.add({
          targets: sl2, x: sl2.x + Phaser.Math.Between(20, 80), alpha: 0,
          duration: Phaser.Math.Between(40, 100), onComplete: () => sl2.destroy()
        }))
      }
      this._tw_add(this.tweens.add({
        targets: bg, alpha: 0, duration: 100, ease: 'Linear',
        onComplete: () => {
          bg.destroy()
          done++
          if (done < count) this._timer(Phaser.Math.Between(50, 140), flash)
          else onDone?.()
        }
      }))
    }
    flash()
  }

  _spawnFloat(x, y, text, color, size = 10) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: size, fill: color
    }).setOrigin(0.5).setAlpha(0).setDepth(14)
    this._tw_add(this.tweens.add({
      targets: t, alpha: 1, y: y - 6, duration: 550, ease: 'Power2',
      onComplete: () => {
        this._tw_add(this.tweens.add({
          targets: t, alpha: 0, y: y - 22, duration: 900, delay: 1000, ease: 'Power1',
          onComplete: () => t.destroy()
        }))
      }
    }))
  }

  _blackOut(dur, cb) {
    const o = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0).setOrigin(0).setDepth(9990)
    this._tw_add(this.tweens.add({ targets: o, fillAlpha: 1, duration: dur, ease: 'Linear', onComplete: cb }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  _clearScene() {
    this._tw.forEach(t => { try { t?.stop?.() } catch(e){} })
    this._tw = []
    this._tmr.forEach(t => { try { t?.remove?.() } catch(e){} })
    this._tmr = []
    this.children.list.slice().forEach(c => { try { c.destroy() } catch(e){} })
  }

  _label(x, y, str, size = 10, fill = '#ffffff') {
    return this.add.text(x, y, str, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: size, fill, resolution: 2,
    })
  }

  _tw_add(tw) {
    this._tw.push(tw)
    return tw
  }

  _timer(delay, cb) {
    const t = this.time.delayedCall(delay, cb)
    this._tmr.push(t)
    return t
  }

  _fs(vw, minPx = 8, maxPx = 64) {
    return Math.max(minPx, Math.min(maxPx, Math.round(this.W * vw / 100)))
  }

  shutdown() {
    this._tw.forEach(t => { try { t?.stop?.() } catch(e){} })
    this._tmr.forEach(t => { try { t?.remove?.() } catch(e){} })
  }
}
