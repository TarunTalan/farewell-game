import { CHARACTER_SCALE, NPC_DATA, PLAYER_CONFIG, PLAYER_SPEED } from './constants.js'
import { makeTextSprite } from './textures.js'

export function buildNPCs(scene, THREE) {
  scene._npcs = []
  NPC_DATA.forEach(data => {
    const npc = buildCharacter(scene, THREE, data, false)
    npc.userData.presentInAct2 = data.presentInAct2
    scene._npcs.push(npc)
  })
}

export function buildPlayer(scene, THREE) {
  scene._player = buildCharacter(scene, THREE, PLAYER_CONFIG, true)
  scene._playerSpeed = PLAYER_SPEED
  scene._playerBobTime = 0
  scene._keys = {}
}

function buildCharacter(scene, THREE, data, isPlayer) {
  const group = new THREE.Group()
  const scale = CHARACTER_SCALE

  const skinMaterial = new THREE.MeshStandardMaterial({ color: data.skinTone, roughness: 0.65 })
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: data.shirtColor, roughness: 0.78 })
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: data.pantsColor ?? 0x1a1a3a, roughness: 0.85 })
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.72 })
  const hairMaterial = new THREE.MeshStandardMaterial({ color: data.hairColor, roughness: 1.0 })

  const add = (geometry, material, px, py, pz, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(px * scale, py * scale, pz * scale)
    mesh.rotation.set(rx, ry, rz)
    mesh.castShadow = true
    group.add(mesh)
    return mesh
  }

  add(new THREE.SphereGeometry(0.195 * scale, 20, 20), skinMaterial, 0, 1.74, 0)
  add(new THREE.SphereGeometry(0.202 * scale, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMaterial, 0, 1.745, 0)

  ;[-0.075, 0.075].forEach(eyeX => {
    add(new THREE.SphereGeometry(0.048 * scale, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfafafa }), eyeX, 1.74, 0.165)
    add(new THREE.SphereGeometry(0.034 * scale, 10, 10), new THREE.MeshStandardMaterial({ color: data.hairColor || 0x1a0a00, roughness: 0.2 }), eyeX, 1.74, 0.195)
    add(new THREE.SphereGeometry(0.012 * scale, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }), eyeX + 0.01, 1.745, 0.205)
  })

  ;[-0.075, 0.075].forEach(eyeX => {
    add(new THREE.BoxGeometry(0.065 * scale, 0.018 * scale, 0.01 * scale), new THREE.MeshStandardMaterial({ color: data.hairColor }), eyeX, 1.8, 0.175)
  })

  add(new THREE.SphereGeometry(0.025 * scale, 8, 8), skinMaterial, 0, 1.69, 0.188)
  add(new THREE.TorusGeometry(0.048 * scale, 0.01 * scale, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8b1a1a }), 0, 1.632, 0.175, 0, 0, Math.PI)

  ;[-1, 1].forEach(side => {
    add(new THREE.SphereGeometry(0.038 * scale, 8, 8), skinMaterial, side * 0.188, 1.73, 0.025)
  })

  add(new THREE.CylinderGeometry(0.07 * scale, 0.08 * scale, 0.14 * scale, 12), skinMaterial, 0, 1.545, 0)
  add(new THREE.BoxGeometry(0.46 * scale, 0.58 * scale, 0.26 * scale), shirtMaterial, 0, 1.2, 0)
  add(new THREE.TorusGeometry(0.115 * scale, 0.024 * scale, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }), 0, 1.47, 0.08, -0.4, 0, 0)
  add(new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.012 * scale), shirtMaterial, 0.12, 1.22, 0.132)

  for (let button = 0; button < 3; button++) {
    add(new THREE.SphereGeometry(0.014 * scale, 6, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd }), 0, 1.38 - button * 0.11, 0.132)
  }

  ;[-1, 1].forEach(side => {
    add(new THREE.CylinderGeometry(0.072 * scale, 0.065 * scale, 0.3 * scale, 12), shirtMaterial, side * 0.285, 1.21, 0, 0, 0, side * 0.22)
    add(new THREE.CylinderGeometry(0.06 * scale, 0.052 * scale, 0.28 * scale, 12), skinMaterial, side * 0.34, 0.93, 0, 0, 0, side * 0.32)
    add(new THREE.SphereGeometry(0.066 * scale, 10, 10), skinMaterial, side * 0.4, 0.78, 0)
    for (let finger = 0; finger < 3; finger++) {
      add(new THREE.CylinderGeometry(0.016 * scale, 0.012 * scale, 0.06 * scale, 6), skinMaterial, side * (0.4 + finger * 0.02), 0.72, 0.025 + finger * 0.018)
    }
  })

  add(new THREE.BoxGeometry(0.48 * scale, 0.07 * scale, 0.28 * scale), new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.45, metalness: 0.5 }), 0, 0.97, 0)
  add(new THREE.BoxGeometry(0.09 * scale, 0.06 * scale, 0.035 * scale), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 }), 0, 0.97, 0.145)

  ;[-0.115, 0.115].forEach(legX => {
    add(new THREE.CylinderGeometry(0.1 * scale, 0.088 * scale, 0.46 * scale, 12), pantsMaterial, legX, 0.76, 0)
    add(new THREE.CylinderGeometry(0.078 * scale, 0.065 * scale, 0.44 * scale, 12), pantsMaterial, legX, 0.36, 0)
    add(new THREE.BoxGeometry(0.135 * scale, 0.07 * scale, 0.26 * scale), shoeMaterial, legX, 0.13, 0.045)
    add(new THREE.SphereGeometry(0.068 * scale, 8, 8), shoeMaterial, legX, 0.14, 0.145)
  })

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.3 * scale, 20),
    new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.006
  group.add(shadow)

  const nameSprite = makeTextSprite(THREE, data.name, isPlayer ? '#ffcc00' : '#66ccff', 32)
  nameSprite.position.set(0, 3.15 * scale * 0.95, 0)
  nameSprite.scale.set(1.6, 0.46, 1)
  group.add(nameSprite)

  let arrow = null
  if (!isPlayer) {
    arrow = makeTextSprite(THREE, '▼ ENTER', '#ffff44', 26)
    arrow.position.set(0, 3.65 * scale * 0.95, 0)
    arrow.scale.set(1.4, 0.38, 1)
    arrow.visible = false
    group.add(arrow)
  }

  group.position.set(data.position.x, 0, data.position.z)
  group.rotation.y = data.rotation || 0
  scene._scene.add(group)

  group.userData = {
    name: data.name,
    dialogues: data.dialogues || [],
    isTrigger: data.isTrigger || false,
    isNPC: !isPlayer,
    arrow,
    dialogueIndex: 0,
    walkOffset: Math.random() * Math.PI * 2,
    baseScale: scale
  }

  return group
}
