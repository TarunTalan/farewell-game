import { CEILING_LIGHT_X, CEILING_LIGHT_Z, LAB_DESKS } from './constants.js'
import {
  makeNightSkyTexture,
  makePosterTexture,
  makeProjectorTexture,
  makeTileTexture,
  makeWhiteboardTexture,
} from './textures.js'

export function initThreeRenderer(scene, THREE) {
  const width = scene.scale.width
  const height = scene.scale.height

  scene._scene = new THREE.Scene()
  scene._camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 80)
  scene._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })

  scene._renderer.setSize(width, height)
  scene._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  scene._renderer.shadowMap.enabled = true
  scene._renderer.shadowMap.type = THREE.PCFSoftShadowMap
  scene._renderer.toneMapping = THREE.ACESFilmicToneMapping
  scene._renderer.toneMappingExposure = 1.2

  scene._threeCanvas = scene._renderer.domElement
  Object.assign(scene._threeCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: '5',
    pointerEvents: 'none'
  })

  const phaserCanvas = scene.game.canvas
  phaserCanvas.parentNode.insertBefore(scene._threeCanvas, phaserCanvas.nextSibling)

  scene._camera.position.set(0, 2.8, 5.8)
  scene._camera.lookAt(0, 1.4, 0)
  scene._scene.fog = new THREE.FogExp2(0x07071a, 0.045)
  scene._scene.background = new THREE.Color(0x06060f)
}

export function buildLab(scene, THREE) {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x12122a,
    roughness: 0.28,
    metalness: 0.12,
    map: makeTileTexture(THREE)
  })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18, 22, 18), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene._scene.add(floor)

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18),
    new THREE.MeshStandardMaterial({ color: 0x2040a0, transparent: true, opacity: 0.07, roughness: 0, metalness: 1 })
  )
  reflection.rotation.x = -Math.PI / 2
  reflection.position.y = 0.003
  scene._scene.add(reflection)

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18),
    new THREE.MeshStandardMaterial({ color: 0x0e0e1e, roughness: 1 })
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = 4.8
  scene._scene.add(ceiling)

  addWall(scene, THREE, 0, 2.4, -9, 22, 4.8, 0.2, 0x10102a)
  addWall(scene, THREE, 0, 2.4, 9, 22, 4.8, 0.2, 0x10102a)
  addWall(scene, THREE, -11, 2.4, 0, 0.2, 4.8, 18, 0x0e0e25)
  addWall(scene, THREE, 11, 2.4, 0, 0.2, 4.8, 18, 0x0e0e25)
  addWall(scene, THREE, 0, 0.07, -9, 22, 0.14, 0.25, 0x2525508)
  addWall(scene, THREE, -11, 0.07, 0, 0.25, 0.14, 18, 0x252550)
  addWall(scene, THREE, 11, 0.07, 0, 0.25, 0.14, 18, 0x252550)

  CEILING_LIGHT_X.forEach(x => {
    CEILING_LIGHT_Z.forEach(z => addCeilingLight(scene, THREE, x, z))
  })

  LAB_DESKS.forEach(desk => buildDesk(scene, THREE, desk.x, desk.z))
  buildWhiteboard(scene, THREE, -3.5, 2.5, -8.85)
  buildProjectorScreen(scene, THREE, 3.5, 2.5, -8.85)
  buildWindow(scene, THREE, 10.88, 2.2, -1.5)
  buildDoor(scene, THREE, -10.88, 1.3, 1.5)
  buildServerRack(scene, THREE, 9.8, 0, -7.5)
  addCableRun(scene, THREE)
  addWallPosters(scene, THREE)
}

function addWall(scene, THREE, x, y, z, w, h, d, color) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  )
  wall.position.set(x, y, z)
  wall.receiveShadow = true
  scene._scene.add(wall)
}

function buildDesk(scene, THREE, x, z) {
  const group = new THREE.Group()

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.06, 1),
    new THREE.MeshStandardMaterial({ color: 0x22183a, roughness: 0.38, metalness: 0.08 })
  )
  top.position.y = 0.76
  top.castShadow = true
  top.receiveShadow = true
  group.add(top)

  ;[[-1, -0.38], [1, -0.38], [-1, 0.38], [1, 0.38]].forEach(([legX, legZ]) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.76, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x181830, metalness: 0.7, roughness: 0.3 })
    )
    leg.position.set(legX, 0.38, legZ)
    group.add(leg)
  })

  const monitor = new THREE.Group()
  monitor.add(Object.assign(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.5, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x0c0c18, roughness: 0.15, metalness: 0.7 })
    ),
    { castShadow: true }
  ))

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x020210,
      emissive: new THREE.Color(0x0822aa),
      emissiveIntensity: 2.8,
      roughness: 0
    })
  )
  screen.position.z = 0.025
  monitor.add(screen)

  const colors = [0x00ff99, 0x44aaff, 0xff7733, 0xffee33, 0xffffff, 0xff44ff]
  for (let row = 0; row < 7; row++) {
    const length = 0.08 + Math.random() * 0.35
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(length, 0.013),
      new THREE.MeshStandardMaterial({ emissive: new THREE.Color(colors[row % colors.length]), emissiveIntensity: 1.8 })
    )
    line.position.set(-0.3 + length / 2, 0.16 - row * 0.052, 0.027)
    monitor.add(line)
  }

  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.2, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.8, roughness: 0.2 })
  )
  neck.position.y = -0.34
  monitor.add(neck)

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.028, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.8 })
  )
  base.position.y = -0.45
  monitor.add(base)
  monitor.position.set(0, 1.22, -0.12)
  group.add(monitor)

  group.add(Object.assign(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.02, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x181826, roughness: 0.5, metalness: 0.3 })
    ),
    { position: new THREE.Vector3(0, 0.782, 0.2) }
  ))

  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0c0c20, roughness: 0.9 })
  )
  pad.rotation.x = -Math.PI / 2
  pad.position.set(0.4, 0.764, 0.19)
  group.add(pad)

  group.add(Object.assign(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.03, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x101020, roughness: 0.4, metalness: 0.5 })
    ),
    { position: new THREE.Vector3(0.4, 0.782, 0.19) }
  ))

  const cpu = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.46, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x141422, roughness: 0.5, metalness: 0.6 })
  )
  cpu.position.set(1.04, 0.99, 0.04)
  cpu.castShadow = true
  group.add(cpu)

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 6, 6),
    new THREE.MeshStandardMaterial({ emissive: 0x00ff44, emissiveIntensity: 4 })
  )
  led.position.set(1.04, 0.78, -0.22)
  group.add(led)

  group.position.set(x, 0, z)
  group.castShadow = true
  scene._scene.add(group)
}

function addCeilingLight(scene, THREE, x, z) {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.065, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xcccce0, roughness: 0.25, metalness: 0.5 })
  ))
  const tube = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.022, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xc8e4ff), emissiveIntensity: 5 })
  )
  tube.position.y = -0.028
  group.add(tube)
  group.position.set(x, 4.76, z)
  scene._scene.add(group)

  const light = new THREE.PointLight(0xa8c8ff, 0.8, 9)
  light.position.set(x, 4.3, z)
  scene._scene.add(light)
}

function buildWhiteboard(scene, THREE, x, y, z) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x28284a, metalness: 0.7, roughness: 0.3 })
  )
  frame.position.set(x, y, z)
  scene._scene.add(frame)

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xf0f0ff, roughness: 0.9, map: makeWhiteboardTexture(THREE) })
  )
  board.position.set(x, y, z + 0.038)
  scene._scene.add(board)

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.07, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x222238, metalness: 0.7 })
  )
  tray.position.set(x, y - 0.96, z + 0.07)
  scene._scene.add(tray)
}

function buildProjectorScreen(scene, THREE, x, y, z) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.9, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x080812 })
  )
  frame.position.set(x, y, z)
  scene._scene.add(frame)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.75),
    new THREE.MeshStandardMaterial({
      color: 0x03040e,
      emissive: new THREE.Color(0x0a1a45),
      emissiveIntensity: 1.8,
      roughness: 0.08,
      map: makeProjectorTexture(THREE)
    })
  )
  screen.position.set(x, y, z + 0.012)
  scene._scene.add(screen)
}

function buildWindow(scene, THREE, x, y, z) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 2.4, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x181830, roughness: 0.5 })
  )
  frame.position.set(x, y, z)
  scene._scene.add(frame)

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x3060a0, transparent: true, opacity: 0.22, roughness: 0, emissive: new THREE.Color(0x102040), emissiveIntensity: 0.6 })
  )
  glass.rotation.y = -Math.PI / 2
  glass.position.set(x - 0.02, y, z)
  scene._scene.add(glass)

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x030818, emissive: new THREE.Color(0x010410), emissiveIntensity: 1, map: makeNightSkyTexture(THREE) })
  )
  sky.rotation.y = -Math.PI / 2
  sky.position.set(x - 0.18, y, z)
  scene._scene.add(sky)
}

function buildDoor(scene, THREE, x, y, z) {
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.6, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x38200e, roughness: 0.65 })
  )
  door.position.set(x, y, z)
  door.castShadow = true
  scene._scene.add(door)

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
  )
  handle.rotation.z = Math.PI / 2
  handle.position.set(x + 0.1, y, z + 0.5)
  scene._scene.add(handle)
}

function buildServerRack(scene, THREE, x, y, z) {
  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 2.4, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x080812, metalness: 0.85, roughness: 0.28 })
  )
  rack.position.set(x, 1.2, z)
  rack.castShadow = true
  scene._scene.add(rack)

  for (let unit = 0; unit < 12; unit++) {
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.15, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.6 })
    )
    face.position.set(x, 0.18 + unit * 0.19, z - 0.29)
    scene._scene.add(face)

    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 6, 6),
      new THREE.MeshStandardMaterial({ emissive: new THREE.Color(unit % 3 === 0 ? 0xff3300 : 0x00ff55), emissiveIntensity: 4 })
    )
    led.position.set(x + 0.27, 0.18 + unit * 0.19, z - 0.3)
    scene._scene.add(led)
  }
}

function addCableRun(scene, THREE) {
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(19, 0.09, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x181832, metalness: 0.65 })
  )
  tray.position.set(0, 0.5, -8.8)
  scene._scene.add(tray)

  ;[0x4455ff, 0xff3333, 0x33ff55, 0xffff33, 0xff33ff].forEach((color, index) => {
    const points = []
    for (let step = 0; step <= 24; step++) {
      points.push(new THREE.Vector3(-9.5 + step * 0.8, 0.46 + Math.sin(step * 0.85 + index) * 0.045, -8.73 - index * 0.013))
    }
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.007, 4, false)
    scene._scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.8 })))
  })
}

function addWallPosters(scene, THREE) {
  ;[
    { x: -8.2, y: 2.9, z: -8.82, label: 'PLACEMENT\nDRIVE\n2026', color: 0xee2222 },
    { x: -6, y: 2.9, z: -8.82, label: 'ACM\nCODING\nCLUB', color: 0x1188ee },
    { x: -8.8, y: 1.5, z: -8.82, label: 'CS DEPT\nNOTICE', color: 0x22bb55 },
  ].forEach(poster => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1),
      new THREE.MeshStandardMaterial({ map: makePosterTexture(THREE, poster.label, poster.color), roughness: 0.9 })
    )
    mesh.position.set(poster.x, poster.y, poster.z + 0.025)
    scene._scene.add(mesh)
  })
}
