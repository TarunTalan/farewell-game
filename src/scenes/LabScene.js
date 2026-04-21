// ─────────────────────────────────────────────────────────────────────────────
// LabScene.js — Cinematic Computer Lab Scene (Three.js + Phaser)
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser'
import { gameState } from '../data/GameState.js'
import { DialogueSystem } from '../systems/DialogueSystem.js'
import { buildLab, initThreeRenderer } from './lab/builders.js'
import { buildNPCs, buildPlayer } from './lab/characters.js'
import {
  CHARACTER_LIGHTS,
  CHARACTER_SCALE,
  COLLISION_RADIUS,
  FACE_DISTANCE,
  LAB_BOUNDS,
  MONITOR_LIGHTS,
  PANIC_LIGHTS,
  TALK_DISTANCE,
} from './lab/constants.js'
import { loadThree } from './lab/threeLoader.js'
import {
  createDialogueOverlay,
  createMobileControls,
  showDialogueLine,
  showHint,
  showPanicOverlay,
} from './lab/ui.js'

export class LabScene extends Phaser.Scene {
  constructor() {
    super('LabScene')
    this._act = 1
  }

  async create() {
    this.cameras.main.setAlpha(0)
    this.THREE = await loadThree()

    initThreeRenderer(this, this.THREE)
    buildLab(this, this.THREE)
    buildNPCs(this, this.THREE)
    buildPlayer(this, this.THREE)
    this._setupLighting()
    this._setupInput()
    this._setupCollision()
    createDialogueOverlay(this)
    createMobileControls(this)

    this._running = true
    this._animate()

    this._threeCanvas.style.opacity = '0'
    this._threeCanvas.style.transition = 'opacity 1.8s ease'
    requestAnimationFrame(() => { this._threeCanvas.style.opacity = '1' })

    showHint(this, 'Move: Arrow Keys / D-Pad  |  TALK: Enter / Button')

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
    ;['_dialogueEl', '_hintEl', '_mobileEl', '_panicOverlay'].forEach(key => {
      if (this[key]) this[key].remove()
    })
    document.removeEventListener('keydown', this._keyHandler)
    document.removeEventListener('keyup', this._keyHandler)
  }

  _setupLighting() {
    const THREE = this.THREE

    this._scene.add(new THREE.AmbientLight(0x1a2045, 0.9))
    this._scene.add(new THREE.HemisphereLight(0x203065, 0x100815, 0.45))

    const dir = new THREE.DirectionalLight(0xb0c8ff, 0.7)
    dir.position.set(-4, 9, 5)
    dir.castShadow = true
    dir.shadow.mapSize.width = 2048
    dir.shadow.mapSize.height = 2048
    Object.assign(dir.shadow.camera, { near: 0.5, far: 45, left: -14, right: 14, top: 14, bottom: -14 })
    dir.shadow.bias = -0.002
    this._scene.add(dir)

    MONITOR_LIGHTS.forEach(([mx, mz]) => {
      const light = new THREE.PointLight(0x0a2075, 0.35, 3)
      light.position.set(mx, 1.45, mz)
      this._scene.add(light)
    })

    CHARACTER_LIGHTS.forEach(([cx, cz]) => {
      const light = new THREE.PointLight(0x4060cc, 0.5, 3.5)
      light.position.set(cx, 2.2, cz + 0.8)
      this._scene.add(light)
    })

    this._emergencyLight = new THREE.PointLight(0xff1010, 0, 10)
    this._emergencyLight.position.set(0, 4.2, -2)
    this._scene.add(this._emergencyLight)
    this._emergencyTime = 0

    this._panicLights = []
    PANIC_LIGHTS.forEach(([px, py, pz]) => {
      const light = new THREE.PointLight(0xff2200, 0, 7)
      light.position.set(px, py, pz)
      this._scene.add(light)
      this._panicLights.push(light)
    })
  }

  _setupInput() {
    this._keys = {}
    this._keyHandler = event => {
      if (event.type === 'keydown') this._keys[event.code] = true
      if (event.type === 'keyup') this._keys[event.code] = false
      if (event.type === 'keydown' && event.code === 'Enter') this._tryTalk()
    }
    document.addEventListener('keydown', this._keyHandler)
    document.addEventListener('keyup', this._keyHandler)
  }

  _setupCollision() {
    this._collisionRadius = COLLISION_RADIUS
    this._bounds = { ...LAB_BOUNDS }
  }

  _triggerAct2() {
    if (this._act === 2) return
    this._act = 2
    this._emergencyFlashing = true

    const flash = document.createElement('div')
    Object.assign(flash.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(255,30,30,0.55)',
      zIndex: '40',
      pointerEvents: 'none',
      transition: 'opacity 0.5s'
    })
    this.game.canvas.parentNode.appendChild(flash)
    setTimeout(() => { flash.style.opacity = '0' }, 400)
    setTimeout(() => flash.remove(), 1000)

    showPanicOverlay(this)

    this._npcs.forEach(npc => {
      if (!npc.userData.presentInAct2) this._dissolveCharacter(npc)
    })

    this._cameraShake = 1
  }

  _dissolveCharacter(npc) {
    let alpha = 1
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

  _tryTalk() {
    if (this._dialogueActive && this._typedFull) {
      this._dialogueText.textContent = this._typedFull
      return
    }

    if (this._dialogueOnDone && this._dialogueEl.style.display === 'block') {
      const done = this._dialogueOnDone
      this._dialogueOnDone = null
      done()
      return
    }

    if (this._inDialogueFlow) return

    const px = this._player.position.x
    const pz = this._player.position.z
    let closest = null
    let closestDist = Infinity

    this._npcs.forEach(npc => {
      if (!npc.visible) return
      const dx = npc.position.x - px
      const dz = npc.position.z - pz
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < TALK_DISTANCE && dist < closestDist) {
        closest = npc
        closestDist = dist
      }
    })

    if (!closest) return

    const data = closest.userData
    this._inDialogueFlow = true
    this._player.rotation.y = Math.atan2(closest.position.x - px, closest.position.z - pz)

    const playLine = index => {
      if (index >= data.dialogues.length) {
        this._inDialogueFlow = false
        if (data.isTrigger) {
          this._triggerAct2()
          setTimeout(() => this._triggerGameStart(), 2800)
        }
        return
      }

      showDialogueLine(this, data.name, data.dialogues[index], data.isTrigger, () => playLine(index + 1))
    }

    playLine(0)
  }

  _triggerGameStart() {
    showHint(this, '🚨 STARTING MISSION...')
    clearTimeout(this._act2Timer)

    const fadeEl = element => {
      if (element) {
        element.style.transition = 'opacity 0.9s ease'
        element.style.opacity = '0'
      }
    }

    setTimeout(() => {
      fadeEl(this._threeCanvas)
      fadeEl(this._dialogueEl)
      fadeEl(this._mobileEl)

      setTimeout(() => {
        this.shutdown()
        const dialogueSystem = new DialogueSystem(gameState)
        dialogueSystem.play('opening', () => {
          this.scene.start('CharSelectScene')
        })
      }, 950)
    }, 1200)
  }

  _animate() {
    if (!this._running) return
    requestAnimationFrame(() => this._animate())

    const THREE = this.THREE
    const dt = 0.016
    this._emergencyTime += dt

    if (!this._inDialogueFlow) {
      let dx = 0
      let dz = 0
      if (this._keys.ArrowLeft || this._keys.KeyA) dx -= 1
      if (this._keys.ArrowRight || this._keys.KeyD) dx += 1
      if (this._keys.ArrowUp || this._keys.KeyW) dz -= 1
      if (this._keys.ArrowDown || this._keys.KeyS) dz += 1

      if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz)
        const moveX = (dx / len) * this._playerSpeed
        const moveZ = (dz / len) * this._playerSpeed
        const newX = Math.max(this._bounds.minX, Math.min(this._bounds.maxX, this._player.position.x + moveX))
        const newZ = Math.max(this._bounds.minZ, Math.min(this._bounds.maxZ, this._player.position.z + moveZ))

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

    this._npcs.forEach(npc => {
      if (!npc.visible) return

      const t = this._emergencyTime + npc.userData.walkOffset
      const swayAmp = this._act === 2 && npc.userData.presentInAct2 ? 0.04 : 0.014
      npc.position.y = Math.sin(t * 0.9) * swayAmp

      if (this._act === 2 && npc.userData.isTrigger) {
        npc.rotation.y += Math.sin(t * 4) * 0.015
      }

      const dx = npc.position.x - this._player.position.x
      const dz = npc.position.z - this._player.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (npc.userData.arrow) {
        npc.userData.arrow.visible = dist < TALK_DISTANCE
        npc.userData.arrow.position.y = (3.65 * CHARACTER_SCALE * 0.95) + Math.sin(this._emergencyTime * 3.5) * 0.1
      }

      if (dist < FACE_DISTANCE) {
        const angle = Math.atan2(
          this._player.position.x - npc.position.x,
          this._player.position.z - npc.position.z
        )
        npc.rotation.y += (angle - npc.rotation.y) * 0.05
      }
    })

    if (this._emergencyFlashing) {
      const pulse = (Math.sin(this._emergencyTime * 14) + 1) * 0.5
      this._emergencyLight.intensity = pulse * 2.2
      this._panicLights.forEach((light, index) => {
        light.intensity = ((Math.sin(this._emergencyTime * 11 + index * Math.PI) + 1) * 0.5) * 1.6
      })
      const r = Math.floor(10 + pulse * 18)
      this._scene.background = new THREE.Color(r / 255, 5 / 255, 5 / 255)
    } else {
      this._emergencyLight.intensity = Math.max(0, Math.sin(this._emergencyTime * 1.8)) * 0.06
    }

    if (this._cameraShake > 0.01) this._cameraShake *= 0.88
    else this._cameraShake = 0

    const shake = this._cameraShake
    const targetX = this._player.position.x * 0.32
    const targetZ = this._player.position.z * 0.28 + 5.8

    this._camera.position.x += (targetX - this._camera.position.x) * 0.05 + (Math.random() - 0.5) * shake * 0.06
    this._camera.position.z += (targetZ - this._camera.position.z) * 0.05 + (Math.random() - 0.5) * shake * 0.04
    this._camera.position.y = 2.8 + (Math.random() - 0.5) * shake * 0.03
    this._camera.lookAt(
      this._player.position.x * 0.5 + (Math.random() - 0.5) * shake * 0.05,
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

      if (ax > 0.25 && ax < 0.65 && ay < 1.3 && ay > 0.65) {
        const side = child.position.x > 0 ? 1 : -1
        child.rotation.x = Math.sin(t + side * Math.PI) * 0.42
      }

      if (ax < 0.2 && ay > 0.55 && ay < 0.9) {
        const side = child.position.x > 0 ? 1 : -1
        child.rotation.x = Math.sin(t + side * Math.PI) * 0.35
      }
    })
  }
}
