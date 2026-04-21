export const NPC_DATA = [
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
    presentInAct2: false
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
    presentInAct2: false
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

export const PLAYER_CONFIG = {
  name: 'YOU',
  shirtColor: 0xddaa22,
  skinTone: 0xd4956a,
  hairColor: 0x120500,
  pantsColor: 0x1a1a3a,
  position: { x: 0, z: 4.2 },
  rotation: 0,
}

export const LAB_DESKS = [
  { x: -4.5, z: -4 },
  { x: -1.5, z: -4 },
  { x: 1.5, z: -4 },
  { x: 4.5, z: -4 },
  { x: -4.5, z: -1.5 },
  { x: -1.5, z: -1.5 },
  { x: 1.5, z: -1.5 },
  { x: 4.5, z: -1.5 },
]

export const CEILING_LIGHT_X = [-5, -1.5, 2, 5.5]
export const CEILING_LIGHT_Z = [-3.5, 0, 3.5]

export const MONITOR_LIGHTS = [
  [-4.5, -4],
  [-1.5, -4],
  [1.5, -4],
  [4.5, -4],
  [-4.5, -1.5],
  [-1.5, -1.5],
  [1.5, -1.5],
  [4.5, -1.5],
]

export const CHARACTER_LIGHTS = [
  [-2.4, 0.2],
  [-0.5, -1.2],
  [1.3, -0.6],
  [2.8, 0.4],
]

export const PANIC_LIGHTS = [
  [-5, 3.8, 2],
  [5, 3.8, -3],
]

export const LAB_BOUNDS = { minX: -10, maxX: 10, minZ: -7.5, maxZ: 5.8 }
export const PLAYER_SPEED = 0.075
export const COLLISION_RADIUS = 0.55
export const TALK_DISTANCE = 2.2
export const FACE_DISTANCE = 3.5
export const CHARACTER_SCALE = 1.45
