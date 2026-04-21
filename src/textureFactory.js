import Phaser from 'phaser'
import { PALETTES } from './palettes.js'
import { YEAR_ENEMIES } from './enemyConfig.js'

/**
 * Texture generation and management utilities
 */

export function replaceTexture(scene, key, drawFn) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key)
  }
  const g = scene.make.graphics({ add: false })
  drawFn(g)
  g.destroy()
}

export function ensureTextures(scene) {
  replaceTexture(scene, 'player', (g) => {
    g.fillStyle(0x2255cc)
    g.fillRect(2, 10, 12, 10)
    g.fillStyle(0xffcc99)
    g.fillRect(3, 2, 10, 9)
    g.fillStyle(0x222222)
    g.fillRect(3, 2, 10, 3)
    g.fillStyle(0x111111)
    g.fillRect(5, 7, 2, 2)
    g.fillRect(9, 7, 2, 2)
    g.fillStyle(0x1a1a4a)
    g.fillRect(2, 20, 5, 6)
    g.fillRect(9, 20, 5, 6)
    g.fillStyle(0x222222)
    g.fillRect(1, 24, 6, 3)
    g.fillRect(9, 24, 6, 3)
    g.fillStyle(0x994400)
    g.fillRect(13, 10, 5, 8)
    g.generateTexture('player', 20, 28)
  })

  replaceTexture(scene, 'player_jump', (g) => {
    g.fillStyle(0x2255cc)
    g.fillRect(2, 10, 12, 10)
    g.fillStyle(0xffcc99)
    g.fillRect(3, 2, 10, 9)
    g.fillStyle(0x222222)
    g.fillRect(3, 2, 10, 3)
    g.fillStyle(0x111111)
    g.fillRect(5, 7, 2, 2)
    g.fillRect(9, 7, 2, 2)
    g.fillStyle(0x2255cc)
    g.fillRect(0, 6, 3, 8)
    g.fillRect(13, 6, 3, 8)
    g.fillStyle(0xffcc99)
    g.fillRect(0, 4, 3, 4)
    g.fillRect(13, 4, 3, 4)
    g.fillStyle(0x1a1a4a)
    g.fillRect(2, 20, 5, 6)
    g.fillRect(9, 20, 5, 6)
    g.fillStyle(0x222222)
    g.fillRect(1, 24, 6, 3)
    g.fillRect(9, 24, 6, 3)
    g.fillStyle(0x994400)
    g.fillRect(13, 10, 5, 8)
    g.generateTexture('player_jump', 20, 28)
  })

  replaceTexture(scene, 'ground', (g) => {
    g.fillStyle(0x334455)
    g.fillRect(0, 0, 32, 16)
    g.fillStyle(0x3d5566)
    g.fillRect(0, 0, 32, 4)
    g.fillStyle(0x2a3a48)
    g.fillRect(1, 5, 30, 1)
    g.fillRect(1, 9, 30, 1)
    g.fillStyle(0x4a6677, 0.5)
    for (let i = 0; i < 32; i += 4) g.fillRect(i, 0, 2, 16)
    g.generateTexture('ground', 32, 16)
  })

  replaceTexture(scene, 'platform', (g) => {
    g.fillStyle(0x445566)
    g.fillRect(0, 0, 64, 12)
    g.fillStyle(0x556677)
    g.fillRect(0, 0, 64, 4)
    g.fillStyle(0x334455)
    g.fillRect(0, 8, 64, 4)
    g.generateTexture('platform', 64, 12)
  })

  replaceTexture(scene, 'pickup', (g) => {
    const pts = []
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const radius = i % 2 === 0 ? 12 : 6
      pts.push(new Phaser.Geom.Point(16 + Math.cos(angle) * radius, 16 + Math.sin(angle) * radius))
    }
    g.fillStyle(0xffdd00)
    g.fillPoints(pts, true)
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(16, 16, 4)
    g.generateTexture('pickup', 32, 32)
  })

  replaceTexture(scene, 'pickup_hp', (g) => {
    g.fillStyle(0xff3333)
    g.fillRect(12, 4, 8, 24)
    g.fillRect(4, 12, 24, 8)
    g.fillStyle(0xffffff, 0.6)
    g.fillRect(14, 6, 4, 20)
    g.fillRect(6, 14, 20, 4)
    g.generateTexture('pickup_hp', 32, 32)
  })

  replaceTexture(scene, 'projectile', (g) => {
    g.fillStyle(0xff4444)
    g.fillEllipse(6, 3, 12, 6)
    g.fillStyle(0xffaaaa, 0.7)
    g.fillEllipse(5, 3, 7, 3)
    g.generateTexture('projectile', 12, 6)
  })

  replaceTexture(scene, 'boss_proj', (g) => {
    g.fillStyle(0xff0000)
    g.fillCircle(8, 8, 8)
    g.fillStyle(0xff8800, 0.7)
    g.fillCircle(8, 8, 5)
    g.fillStyle(0xffff00, 0.9)
    g.fillCircle(8, 8, 2)
    g.generateTexture('boss_proj', 16, 16)
  })

  replaceTexture(scene, 'particle', (g) => {
    g.fillStyle(0xffffff)
    g.fillCircle(4, 4, 4)
    g.generateTexture('particle', 8, 8)
  })

  // Background textures
  for (let y = 0; y < 4; y++) {
    replaceTexture(scene, `bg_${y}`, (g) => {
      const pal = PALETTES[y]
      g.fillStyle(pal.sky)
      g.fillRect(0, 0, 160, 100)

      if (y === 0) {
        g.fillStyle(0xffffff, 0.8)
        for (let i = 0; i < 30; i++) g.fillRect((Math.random() * 160) | 0, (Math.random() * 60) | 0, 1, 1)
        g.fillStyle(0xeeeebb)
        g.fillCircle(130, 15, 8)
        g.fillStyle(pal.sky)
        g.fillCircle(134, 13, 6)
        g.fillStyle(0x0a1235)
        g.fillRect(0, 55, 30, 45)
        g.fillRect(35, 60, 25, 40)
        g.fillRect(65, 50, 20, 50)
        g.fillRect(90, 58, 28, 42)
        g.fillRect(125, 52, 35, 48)
        g.fillStyle(0x0a1538)
        g.fillRect(67, 40, 26, 30)
        g.fillStyle(0xffffff, 0.15)
        g.fillRect(75, 42, 10, 5)
      } else if (y === 1) {
        g.lineStyle(1, 0x003300, 0.5)
        for (let i = 0; i < 160; i += 16) g.lineBetween(i, 0, i, 100)
        for (let i = 0; i < 100; i += 16) g.lineBetween(0, i, 160, i)
        g.fillStyle(0x00ff00, 0.04)
        g.fillRect(0, 0, 160, 100)
        g.fillStyle(0x061806)
        g.fillRect(0, 60, 40, 40)
        g.fillRect(50, 65, 30, 35)
        g.fillRect(90, 55, 35, 45)
        g.fillRect(130, 62, 30, 38)
        g.fillStyle(0x003300)
        g.fillRect(5, 40, 25, 18)
        g.fillRect(55, 45, 20, 15)
        g.fillRect(95, 38, 25, 16)
        g.fillStyle(0x00ff00, 0.3)
        g.fillRect(6, 41, 23, 16)
        g.fillRect(56, 46, 18, 13)
        g.fillRect(96, 39, 23, 14)
      } else if (y === 2) {
        g.fillGradientStyle(0x2a1a00, 0x2a1a00, 0x7a3300, 0x7a3300)
        g.fillRect(0, 0, 160, 60)
        g.fillStyle(0xff6600, 0.8)
        g.fillCircle(80, 50, 18)
        g.fillStyle(0xffaa00, 0.5)
        g.fillCircle(80, 50, 28)
        g.fillStyle(0x1a0d00)
        g.fillRect(0, 55, 20, 45)
        g.fillRect(25, 48, 15, 52)
        g.fillRect(45, 60, 30, 40)
        g.fillRect(85, 52, 20, 48)
        g.fillRect(115, 58, 45, 42)
        g.lineStyle(2, 0x1a0d00)
        g.lineBetween(30, 48, 30, 20)
        g.lineBetween(30, 20, 60, 20)
        g.lineBetween(60, 20, 60, 35)
      } else {
        g.fillGradientStyle(0x1a0000, 0x1a0000, 0x550000, 0x550000)
        g.fillRect(0, 0, 160, 100)
        g.fillStyle(0x330000, 0.7)
        g.fillEllipse(30, 20, 50, 20)
        g.fillEllipse(80, 15, 60, 22)
        g.fillEllipse(140, 22, 40, 18)
        g.lineStyle(2, 0xff4400, 0.6)
        g.lineBetween(60, 20, 55, 35)
        g.lineBetween(55, 35, 63, 35)
        g.lineBetween(63, 35, 58, 50)
        g.fillStyle(0x0d0000)
        g.fillRect(0, 45, 25, 55)
        g.fillRect(30, 38, 20, 62)
        g.fillRect(55, 50, 30, 50)
        g.fillRect(90, 35, 25, 65)
        g.fillRect(120, 42, 40, 58)
        g.fillStyle(0xff8800, 0.4)
        for (let bx = 2; bx < 160; bx += 8) {
          for (let by = 40; by < 100; by += 8) {
            if (Math.random() > 0.6) g.fillRect(bx, by, 3, 3)
          }
        }
      }

      g.generateTexture(`bg_${y}`, 160, 100)
    })
  }

  // Enemy textures
  for (let i = 0; i < YEAR_ENEMIES.length; i++) {
    YEAR_ENEMIES[i].forEach((cfg, j) => {
      replaceTexture(scene, `enemy_${i}_${j}`, (g) => {
        const s = cfg.size
        const c = cfg.color
        g.fillStyle(c)
        g.fillRect(2, 4, s - 4, s - 4)
        g.lineStyle(2, Phaser.Display.Color.ValueToColor(c).darken(30).color)
        g.strokeRect(2, 4, s - 4, s - 4)
        g.fillStyle(0xffffff)
        g.fillRect(4, 7, 5, 4)
        g.fillRect(s - 9, 7, 5, 4)
        g.fillStyle(0x000000)
        g.fillRect(5, 8, 3, 3)
        g.fillRect(s - 8, 8, 3, 3)
        g.fillStyle(0xff0000)
        g.fillRect(6, 9, 1, 1)
        g.fillRect(s - 7, 9, 1, 1)
        g.fillStyle(0x000000)
        g.fillRect(5, s - 7, s - 10, 2)
        g.fillStyle(0xffffff)
        g.fillRect(6, s - 7, 2, 2)
        g.fillRect(9, s - 7, 2, 2)
        g.fillRect(12, s - 7, 2, 2)
        g.fillStyle(c)
        g.fillRect(2, s - 2, 5, 5)
        g.fillRect(s - 7, s - 2, 5, 5)
        g.generateTexture(`enemy_${i}_${j}`, s + 2, s + 2)
      })
    })
  }

  // Boss texture
  replaceTexture(scene, 'boss', (g) => {
    g.fillStyle(0x111111)
    g.fillRect(10, 25, 60, 50)
    g.fillStyle(0xdd0000)
    g.fillRect(35, 25, 10, 35)
    g.fillStyle(0x990000)
    g.fillRect(37, 40, 6, 20)
    g.fillStyle(0xffcc88)
    g.fillRect(15, 4, 50, 22)
    g.fillStyle(0x111111)
    g.fillRect(15, 4, 50, 5)
    g.fillStyle(0xff0000)
    g.fillRect(20, 12, 10, 7)
    g.fillRect(50, 12, 10, 7)
    g.fillStyle(0x000000)
    g.fillRect(23, 13, 4, 5)
    g.fillRect(53, 13, 4, 5)
    g.fillStyle(0x111111)
    g.fillRect(18, 10, 14, 3)
    g.fillRect(48, 10, 14, 3)
    g.fillStyle(0x222222)
    g.fillRect(25, 22, 30, 3)
    g.fillStyle(0xffffff)
    g.fillRect(26, 22, 5, 2)
    g.fillRect(32, 22, 5, 2)
    g.fillRect(38, 22, 5, 2)
    g.fillRect(44, 22, 5, 2)
    g.fillStyle(0xffffff)
    g.fillRect(25, 24, 12, 6)
    g.fillRect(43, 24, 12, 6)
    g.fillStyle(0x111111)
    g.fillRect(0, 28, 12, 35)
    g.fillRect(68, 28, 12, 35)
    g.fillStyle(0xffcc88)
    g.fillRect(0, 60, 12, 8)
    g.fillRect(68, 60, 12, 8)
    g.fillStyle(0x884400)
    g.fillRect(66, 50, 16, 22)
    g.fillStyle(0xaa6600)
    g.fillRect(67, 51, 14, 4)
    g.lineStyle(1, 0x664400)
    g.strokeRect(66, 50, 16, 22)
    g.fillStyle(0x111111)
    g.fillRect(10, 73, 25, 10)
    g.fillRect(45, 73, 25, 10)
    g.fillStyle(0x000000)
    g.fillRect(8, 80, 28, 5)
    g.fillRect(44, 80, 28, 5)
    g.generateTexture('boss', 80, 88)
  })

  // SI door texture
  replaceTexture(scene, 'si_door', (g) => {
    g.fillStyle(0x1a3a5a)
    g.fillRect(0, 0, 80, 100)
    g.fillStyle(0x2255aa)
    g.fillRect(4, 4, 72, 92)
    g.lineStyle(3, 0x44aaff)
    g.strokeRect(15, 30, 50, 70)
    g.fillStyle(0x44aaff, 0.3)
    g.fillRect(16, 31, 48, 68)
    g.fillStyle(0x00ffff)
    g.fillRect(20, 10, 40, 14)
    g.fillStyle(0x001133)
    g.fillRect(22, 12, 36, 10)
    g.fillStyle(0xffcc00)
    g.fillCircle(57, 65, 4)
    g.generateTexture('si_door', 80, 100)
  })
}
