export function makeTileTexture(THREE) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#14142a'
  ctx.fillRect(0, 0, size, size)
  const tileSize = size / 4

  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const x = tx * tileSize
      const y = ty * tileSize
      const shade = 18 + Math.floor(Math.random() * 7)
      ctx.fillStyle = `rgb(${shade},${shade},${shade + 14})`
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
      ctx.fillStyle = '#080818'
      ctx.fillRect(x, y, tileSize, 2)
      ctx.fillRect(x, y, 2, tileSize)
    }
  }

  const glow = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 1.4)
  glow.addColorStop(0, 'rgba(70,85,150,0.14)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(7, 6)
  return texture
}

export function makeWhiteboardTexture(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
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

  lines.forEach((line, index) => {
    ctx.fillStyle = line.startsWith('✗') ? '#cc1a1a' : line.startsWith('!!') ? '#cc6600' : '#1a2060'
    ctx.fillText(line, 16, 68 + index * 30)
  })

  ctx.font = 'italic 13px serif'
  ctx.fillStyle = '#806020'
  ctx.fillText('O(n log n) << O(n²) — REMEMBER THIS', 16, 232)
  return new THREE.CanvasTexture(canvas)
}

export function makeProjectorTexture(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 360
  const ctx = canvas.getContext('2d')
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
  ;['Company', 'Date', 'Package', 'Status'].forEach((header, index) => ctx.fillText(header, 26 + index * 118, 130))
  ;[
    ['Google', '14 Jan', '45 LPA', '✓ Open'],
    ['Amazon', '18 Jan', '32 LPA', '✓ Open'],
    ['Infosys', '21 Jan', '8 LPA', '✓ Open'],
    ['???', 'TBD', '?? LPA', '⚠ UNKNOWN'],
  ].forEach((row, rowIndex) => {
    ctx.fillStyle = rowIndex % 2 === 0 ? '#0c0f1e' : '#10142a'
    ctx.fillRect(16, 144 + rowIndex * 29, 478, 29)
    ctx.fillStyle = rowIndex === 3 ? '#ff7733' : '#aadda0'
    ctx.font = '11px monospace'
    row.forEach((cell, cellIndex) => ctx.fillText(cell, 26 + cellIndex * 118, 163 + rowIndex * 29))
  })
  ctx.font = 'italic 11px sans-serif'
  ctx.fillStyle = '#3a4870'
  ctx.fillText('Attendance mandatory. Formal dress code enforced.', 24, 345)
  return new THREE.CanvasTexture(canvas)
}

export function makeNightSkyTexture(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#020718')
  gradient.addColorStop(1, '#040e28')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 256)

  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.75})`
    ctx.beginPath()
    ctx.arc(Math.random() * 128, Math.random() * 256, 0.4 + Math.random() * 0.9, 0, Math.PI * 2)
    ctx.fill()
  }

  const moon = ctx.createRadialGradient(98, 38, 2, 98, 38, 22)
  moon.addColorStop(0, 'rgba(220,225,255,0.95)')
  moon.addColorStop(0.45, 'rgba(170,175,240,0.35)')
  moon.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = moon
  ctx.fillRect(76, 18, 44, 62)
  return new THREE.CanvasTexture(canvas)
}

export function makePosterTexture(THREE, label, bgColor) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 160
  const ctx = canvas.getContext('2d')
  const r = (bgColor >> 16) & 255
  const g = (bgColor >> 8) & 255
  const b = bgColor & 255
  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, 128, 160)
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.fillRect(0, 0, 128, 30)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px monospace'
  label.split('\n').forEach((line, index) => ctx.fillText(line, 10, 24 + index * 42))
  ctx.strokeStyle = 'rgba(255,255,255,0.38)'
  ctx.lineWidth = 3
  ctx.strokeRect(3, 3, 122, 154)
  return new THREE.CanvasTexture(canvas)
}

export function makeTextSprite(THREE, text, color = '#ffffff', fontSize = 26) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 320, 80)
  ctx.fillStyle = 'rgba(0,0,0,0.62)'
  ctx.beginPath()
  ctx.roundRect(4, 4, 312, 72, 8)
  ctx.fill()
  ctx.font = `bold ${fontSize}px "Nunito", sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  ctx.fillText(text, 160, 42)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  return new THREE.Sprite(material)
}
