// ─────────────────────────────────────────────────────────────────────────────
// ui.js — Mobile controls, dialogue overlay, HUD helpers
// Attack wheel: 360° rotatable fire button (PUBG/BGMI style)
// ─────────────────────────────────────────────────────────────────────────────

/* ─── Inject shared CSS once ─────────────────────────────────────────────── */
function _injectUIStyles() {
  if (document.getElementById('ui-styles')) return
  const style = document.createElement('style')
  style.id = 'ui-styles'
  style.textContent = `
    /* ── Emergency pulse ── */
    @keyframes lab-pulse {
      from { box-shadow: 0 0 20px rgba(255,0,0,0.5); }
      to   { box-shadow: 0 0 50px rgba(255,0,0,0.9), 0 0 80px rgba(255,50,0,0.4); }
    }

    /* ── Laser bullet: a short bright bolt that flies outward and fades ── */
    @keyframes laser-bolt {
      0%   { opacity: 1;   transform: scaleX(0.2) translateX(0);     }
      40%  { opacity: 1;   transform: scaleX(1)   translateX(0);     }
      100% { opacity: 0;   transform: scaleX(1.6) translateX(38px);  }
    }

    /* ── Muzzle flash: quick bright burst at knob center ── */
    @keyframes muzzle-flash {
      0%   { opacity: 0.95; transform: scale(0.5); }
      40%  { opacity: 1;    transform: scale(1.4); }
      100% { opacity: 0;    transform: scale(0.2); }
    }

    /* ── Energy ring ripple on fire ── */
    @keyframes laser-ripple {
      0%   { opacity: 0.7; transform: scale(0.6); }
      100% { opacity: 0;   transform: scale(2.2); }
    }

    /* ── Idle glow: cool cyan-blue instead of orange (sci-fi energy cell) ── */
    @keyframes atk-idle-glow {
      0%   { box-shadow: 0 0 10px rgba(0,200,255,0.35), inset 0 0 8px rgba(0,160,255,0.15); }
      50%  { box-shadow: 0 0 22px rgba(0,220,255,0.55), inset 0 0 14px rgba(0,180,255,0.28); }
      100% { box-shadow: 0 0 10px rgba(0,200,255,0.35), inset 0 0 8px rgba(0,160,255,0.15); }
    }

    /* ── Active firing: rapid cyan strobing ── */
    @keyframes atk-fire-pulse {
      0%   { box-shadow: 0 0 18px rgba(0,220,255,0.8),  inset 0 0 12px rgba(0,180,255,0.5); }
      25%  { box-shadow: 0 0 55px rgba(80,240,255,1),   inset 0 0 28px rgba(0,220,255,0.9); }
      50%  { box-shadow: 0 0 24px rgba(0,200,255,0.75), inset 0 0 14px rgba(0,160,255,0.5); }
      75%  { box-shadow: 0 0 60px rgba(120,255,255,1),  inset 0 0 30px rgba(0,240,255,0.95); }
      100% { box-shadow: 0 0 18px rgba(0,220,255,0.8),  inset 0 0 12px rgba(0,180,255,0.5); }
    }

    /* ── D-pad button press ripple ── */
    @keyframes dpad-press {
      0%   { box-shadow: 0 0 0px rgba(0,200,255,0); }
      40%  { box-shadow: 0 0 18px rgba(0,200,255,0.9); }
      100% { box-shadow: 0 0 8px rgba(0,180,255,0.3); }
    }

    /* ── HUD fade in ── */
    @keyframes hud-fadein {
      from { opacity:0; transform: translateY(8px); }
      to   { opacity:1; transform: translateY(0); }
    }
  `
  document.head.appendChild(style)
}

/* ─── fireLaserBolt: spawns an animated laser projectile from the attack wheel ─ */
export function fireLaserBolt(scene) {
  const wrap = scene._attackWheelEl
  if (!wrap) return
  const angle = scene._attackAngle ?? -Math.PI / 2

  // Muzzle flash
  const flash = document.createElement('div')
  Object.assign(flash.style, {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #ffffff 0%, #00eeff 45%, rgba(0,200,255,0) 100%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%) scale(0.5)',
    pointerEvents: 'none',
    zIndex: '10',
    animation: 'muzzle-flash 0.18s ease-out forwards',
  })
  wrap.appendChild(flash)
  setTimeout(() => flash.remove(), 200)

  // Laser bolt
  const bolt = document.createElement('div')
  const boltLen = 34 + Math.random() * 12   // slight length variance
  const SIZE = parseFloat(wrap.style.width) || 148
  const cx = SIZE / 2, cy = SIZE / 2
  const ORBIT = 33   // match knob orbit

  // Position: start at knob, extend outward along angle
  const startX = cx + Math.cos(angle) * ORBIT
  const startY = cy + Math.sin(angle) * ORBIT

  Object.assign(bolt.style, {
    position: 'absolute',
    width: boltLen + 'px',
    height: '4px',
    borderRadius: '2px',
    background: 'linear-gradient(to right, rgba(0,220,255,0) 0%, rgba(0,220,255,0.7) 30%, #ffffff 60%, #aaffff 100%)',
    boxShadow: '0 0 6px 2px rgba(0,200,255,0.8), 0 0 16px 4px rgba(0,240,255,0.4)',
    left: startX + 'px',
    top: (startY - 2) + 'px',
    transformOrigin: 'left center',
    transform: `rotate(${angle}rad) scaleX(0.2)`,
    pointerEvents: 'none',
    zIndex: '9',
    opacity: '1',
    animation: 'laser-bolt 0.28s cubic-bezier(0.2,0,0.8,1) forwards',
  })
  wrap.appendChild(bolt)

  // Energy ripple ring
  const ripple = document.createElement('div')
  Object.assign(ripple.style, {
    position: 'absolute',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid rgba(0,230,255,0.8)',
    left: (startX - 14) + 'px',
    top: (startY - 14) + 'px',
    pointerEvents: 'none',
    zIndex: '8',
    animation: 'laser-ripple 0.32s ease-out forwards',
  })
  wrap.appendChild(ripple)

  setTimeout(() => { bolt.remove(); ripple.remove() }, 340)
}

/* ─── createMobileControls ───────────────────────────────────────────────── */
export function createMobileControls(scene) {
  _injectUIStyles()

  // Clean up any existing controls
  document.getElementById('lab-mobile')?.remove()
  document.getElementById('lab-attack-wheel')?.remove()

  // ── D-PAD (left side) — Modern game HUD style ──────────────────────────
  // Outer wrapper: sits bottom-left with slight padding from edge
  scene._mobileEl = document.createElement('div')
  scene._mobileEl.id = 'lab-mobile'
  Object.assign(scene._mobileEl.style, {
    position: 'absolute',
    bottom: '24px',
    left: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0px',
    zIndex: '25',
    userSelect: 'none',
    animation: 'hud-fadein 0.4s ease-out both',
  })

  // D-pad cross: 3×3 grid with center blank
  const DPAD_BTN = 52   // px per cell
  const GAP = 3

  const dpadGrid = document.createElement('div')
  dpadGrid.style.cssText = `
    display:grid;
    grid-template-columns:repeat(3,${DPAD_BTN}px);
    grid-template-rows:repeat(3,${DPAD_BTN}px);
    gap:${GAP}px;
    position:relative;`

  // Shared D-pad button factory
  const makeDpadBtn = (label, code, col, row) => {
    const btn = document.createElement('button')
    btn.innerHTML = label
    // Map SVG-style arrows → cleaner unicode
    const iconMap = { '▲': '▲', '▼': '▼', '◀': '◀', '▶': '▶' }
    btn.innerHTML = iconMap[label] ?? label
    btn.style.cssText = `
      width:${DPAD_BTN}px; height:${DPAD_BTN}px;
      grid-column:${col}; grid-row:${row};
      border-radius:${col === 2 ? '10px' : col === 1 ? '14px 6px 6px 14px' : '6px 14px 14px 6px'};
      background: rgba(8,18,40,0.82);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1.5px solid rgba(0,180,255,0.28);
      color: rgba(0,200,255,0.85);
      font-size: 17px;
      display:flex; align-items:center; justify-content:center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      box-shadow: 0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
      transition: background 0.08s, box-shadow 0.08s, transform 0.06s;
      outline: none;`

    // Special shape per direction
    if (row === 1 && col === 2) btn.style.borderRadius = '14px 14px 6px 6px'   // top
    if (row === 3 && col === 2) btn.style.borderRadius = '6px 6px 14px 14px'   // bottom
    if (row === 2 && col === 1) btn.style.borderRadius = '14px 6px 6px 14px'   // left
    if (row === 2 && col === 3) btn.style.borderRadius = '6px 14px 14px 6px'   // right

    const press = e => {
      e?.preventDefault()
      scene._keys[code] = true
      btn.style.background = 'rgba(0,160,255,0.22)'
      btn.style.boxShadow = '0 0 14px rgba(0,200,255,0.7), inset 0 0 6px rgba(0,180,255,0.4)'
      btn.style.transform = 'scale(0.93)'
      btn.style.color = '#ffffff'
    }
    const release = e => {
      e?.preventDefault()
      scene._keys[code] = false
      btn.style.background = 'rgba(8,18,40,0.82)'
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)'
      btn.style.transform = 'scale(1)'
      btn.style.color = 'rgba(0,200,255,0.85)'
    }
    btn.addEventListener('touchstart', press, { passive: false })
    btn.addEventListener('touchend', release, { passive: false })
    btn.addEventListener('touchcancel', release, { passive: false })
    btn.addEventListener('mousedown', press)
    btn.addEventListener('mouseup', release)
    btn.addEventListener('mouseleave', release)
    return btn
  }

  // Build cross: col/row positions (1-indexed)
  dpadGrid.appendChild(makeDpadBtn('▲', 'ArrowUp', 2, 1))
  dpadGrid.appendChild(makeDpadBtn('◀', 'ArrowLeft', 1, 2))
  // Center cell — decorative only
  const center = document.createElement('div')
  center.style.cssText = `
    grid-column:2;grid-row:2;border-radius:6px;
    background:rgba(0,120,200,0.12);
    border:1.5px solid rgba(0,180,255,0.18);`
  dpadGrid.appendChild(center)
  dpadGrid.appendChild(makeDpadBtn('▶', 'ArrowRight', 3, 2))
  dpadGrid.appendChild(makeDpadBtn('▼', 'ArrowDown', 2, 3))

  // ── TALK button — pill badge style, bottom of D-pad ──
  const talkBtn = document.createElement('button')
  talkBtn.innerHTML = '<span style="font-size:13px">💬</span> <span style="font-size:11px;letter-spacing:0.06em;font-weight:700">TALK</span>'
  talkBtn.style.cssText = `
    margin-top: 8px;
    width: ${DPAD_BTN * 3 + GAP * 2}px;
    height: 32px;
    border-radius: 16px;
    background: rgba(8,18,50,0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 1.5px solid rgba(80,130,255,0.45);
    color: rgba(120,170,255,0.9);
    font-family: "Nunito","Segoe UI",sans-serif;
    display:flex; align-items:center; justify-content:center; gap:5px;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 12px rgba(60,100,255,0.25);
    transition: background 0.1s, box-shadow 0.1s;
    outline: none;`
  talkBtn.addEventListener('touchstart', e => { e.preventDefault(); scene._tryTalk?.() }, { passive: false })
  talkBtn.addEventListener('click', () => scene._tryTalk?.())
  talkBtn.addEventListener('mousedown', () => {
    talkBtn.style.background = 'rgba(40,70,180,0.9)'
    talkBtn.style.boxShadow = '0 0 18px rgba(80,120,255,0.7)'
  })
  talkBtn.addEventListener('mouseup', () => {
    talkBtn.style.background = 'rgba(8,18,50,0.85)'
    talkBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5), 0 0 12px rgba(60,100,255,0.25)'
  })

  scene._mobileEl.appendChild(dpadGrid)
  scene._mobileEl.appendChild(talkBtn)
  scene.game.canvas.parentNode.appendChild(scene._mobileEl)

  // ── 360° ATTACK WHEEL (right side) ─────────────────────────────────────
  _createAttackWheel(scene)
}

/* ─── _createAttackWheel ──────────────────────────────────────────────────── */
function _createAttackWheel(scene) {
  // State exposed to GameScene:
  //   scene._attackAngle  — current aim angle in radians (0 = right, CCW+)
  //   scene._attackActive — true while finger/mouse is held on the wheel
  scene._attackAngle = -Math.PI / 2   // default: aim upward (like a gun)
  scene._attackActive = false

  const WHEEL_R = 70   // outer wheel radius (px)
  const KNOB_R = 22   // draggable inner knob radius (px)
  const SIZE = WHEEL_R * 2 + 8

  // Container
  const wrap = document.createElement('div')
  wrap.id = 'lab-attack-wheel'
  Object.assign(wrap.style, {
    position: 'absolute',
    bottom: '30px',
    right: '20px',
    width: SIZE + 'px',
    height: SIZE + 'px',
    zIndex: '25',
    userSelect: 'none',
    touchAction: 'none',
  })

  // SVG decorative back layer (tick marks + outer ring)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', SIZE)
  svg.setAttribute('height', SIZE)
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;'
  const cx = SIZE / 2, cy = SIZE / 2

  // Outer glow ring
  const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  outerRing.setAttribute('cx', cx)
  outerRing.setAttribute('cy', cy)
  outerRing.setAttribute('r', WHEEL_R - 1)
  outerRing.setAttribute('fill', 'none')
  outerRing.setAttribute('stroke', 'rgba(0,200,255,0.5)')
  outerRing.setAttribute('stroke-width', '2')
  svg.appendChild(outerRing)

  // Dashed secondary ring
  const dashRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  dashRing.setAttribute('cx', cx)
  dashRing.setAttribute('cy', cy)
  dashRing.setAttribute('r', WHEEL_R - 8)
  dashRing.setAttribute('fill', 'none')
  dashRing.setAttribute('stroke', 'rgba(0,180,255,0.22)')
  dashRing.setAttribute('stroke-width', '1')
  dashRing.setAttribute('stroke-dasharray', '4 6')
  svg.appendChild(dashRing)

  // Tick marks (every 30°)
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180
    const isMaj = deg % 90 === 0
    const r1 = WHEEL_R - 3
    const r2 = WHEEL_R - (isMaj ? 14 : 9)
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    tick.setAttribute('x1', cx + Math.cos(rad) * r1)
    tick.setAttribute('y1', cy + Math.sin(rad) * r1)
    tick.setAttribute('x2', cx + Math.cos(rad) * r2)
    tick.setAttribute('y2', cy + Math.sin(rad) * r2)
    tick.setAttribute('stroke', isMaj ? 'rgba(0,220,255,0.8)' : 'rgba(0,180,255,0.35)')
    tick.setAttribute('stroke-width', isMaj ? '2' : '1')
    svg.appendChild(tick)
  }

  // Direction line (from center to knob, updates with rotation)
  const dirLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  dirLine.setAttribute('stroke', 'rgba(0,220,255,0.55)')
  dirLine.setAttribute('stroke-width', '1.5')
  dirLine.setAttribute('stroke-dasharray', '3 4')
  svg.appendChild(dirLine)

  wrap.appendChild(svg)

  // Base circle (dark background bowl)
  const base = document.createElement('div')
  Object.assign(base.style, {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: (WHEEL_R * 2) + 'px',
    height: (WHEEL_R * 2) + 'px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 35%, rgba(0,40,80,0.92) 0%, rgba(0,10,22,0.97) 100%)',
    border: '2px solid rgba(0,180,255,0.45)',
    animation: 'atk-idle-glow 2.2s ease-in-out infinite',
  })
  wrap.appendChild(base)

  // "FIRE" label arc text using canvas
  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = SIZE
  labelCanvas.height = SIZE
  Object.assign(labelCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    opacity: '0.55',
  })
  const lctx = labelCanvas.getContext('2d')
  lctx.font = 'bold 9px monospace'
  lctx.fillStyle = '#00ddff'
  lctx.textAlign = 'center'
  // Draw text around top arc
  const label = 'F I R E'
  const arcR = WHEEL_R - 6
  const totalAngle = (label.length * 0.115)
  for (let i = 0; i < label.length; i++) {
    const charAngle = -Math.PI / 2 - totalAngle / 2 + (i + 0.5) * (totalAngle / label.length)
    lctx.save()
    lctx.translate(cx + Math.cos(charAngle) * arcR, cy + Math.sin(charAngle) * arcR)
    lctx.rotate(charAngle + Math.PI / 2)
    lctx.fillText(label[i], 0, 0)
    lctx.restore()
  }
  wrap.appendChild(labelCanvas)

  // ── Rotating knob ──
  const knob = document.createElement('div')
  Object.assign(knob.style, {
    position: 'absolute',
    width: (KNOB_R * 2) + 'px',
    height: (KNOB_R * 2) + 'px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 30%, #40e8ff 0%, #0099cc 55%, #003355 100%)',
    border: '2.5px solid rgba(100,240,255,0.9)',
    boxShadow: '0 0 14px rgba(0,200,255,0.7), inset 0 0 8px rgba(0,160,255,0.4)',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.05s linear',
    willChange: 'transform, left, top',
    zIndex: '2',
  })

  // Arrow SVG inside knob
  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  arrowSvg.setAttribute('width', KNOB_R * 2)
  arrowSvg.setAttribute('height', KNOB_R * 2)
  arrowSvg.style.cssText = 'pointer-events:none;'
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  // Triangle arrow pointing right (local +X), rotated via parent
  const ak = KNOB_R
  arrow.setAttribute('points', `${ak + ak * 0.52},${ak}  ${ak - ak * 0.3},${ak - ak * 0.44}  ${ak - ak * 0.3},${ak + ak * 0.44}`)
  arrow.setAttribute('fill', '#e0faff')
  arrow.setAttribute('stroke', 'rgba(100,240,255,0.8)')
  arrow.setAttribute('stroke-width', '1')
  arrowSvg.appendChild(arrow)
  knob.appendChild(arrowSvg)

  wrap.appendChild(knob)

  // ── Position knob helper ──
  const ORBIT = WHEEL_R * 0.48   // how far from center the knob orbits
  let currentAngle = scene._attackAngle   // in radians

  function _placeKnob(angle) {
    const kx = cx + Math.cos(angle) * ORBIT - KNOB_R
    const ky = cy + Math.sin(angle) * ORBIT - KNOB_R
    knob.style.left = kx + 'px'
    knob.style.top = ky + 'px'
    // Rotate arrow to point in angle direction (arrow SVG points right = 0 rad)
    knob.style.transform = `rotate(${angle}rad)`

    // Update direction line in SVG
    const lineStart = KNOB_R + 2
    dirLine.setAttribute('x1', cx + Math.cos(angle) * lineStart)
    dirLine.setAttribute('y1', cy + Math.sin(angle) * lineStart)
    dirLine.setAttribute('x2', cx + Math.cos(angle) * (WHEEL_R - 4))
    dirLine.setAttribute('y2', cy + Math.sin(angle) * (WHEEL_R - 4))
  }
  _placeKnob(currentAngle)

  // ── Touch / Mouse drag logic ──
  let dragging = false
  let activeTouchId = null

  function _getCenter() {
    const rect = wrap.getBoundingClientRect()
    return { x: rect.left + SIZE / 2, y: rect.top + SIZE / 2 }
  }

  function _angleFromPoint(clientX, clientY) {
    const c = _getCenter()
    return Math.atan2(clientY - c.y, clientX - c.x)
  }

  function _startInteraction(clientX, clientY) {
    dragging = true
    scene._attackActive = true
    base.style.animation = 'atk-fire-pulse 0.3s ease-in-out infinite'
    base.style.background = 'radial-gradient(circle at 38% 35%, rgba(0,80,140,0.95) 0%, rgba(0,20,40,0.98) 100%)'
    knob.style.boxShadow = '0 0 28px rgba(0,220,255,1), inset 0 0 16px rgba(0,180,255,0.7)'
    knob.style.cursor = 'grabbing'
    _updateAngle(clientX, clientY)
  }

  function _updateAngle(clientX, clientY) {
    const angle = _angleFromPoint(clientX, clientY)
    currentAngle = angle
    scene._attackAngle = angle
    _placeKnob(angle)
  }

  function _endInteraction() {
    dragging = false
    scene._attackActive = false
    base.style.animation = 'atk-idle-glow 2.2s ease-in-out infinite'
    base.style.background = 'radial-gradient(circle at 38% 35%, rgba(0,40,80,0.92) 0%, rgba(0,10,22,0.97) 100%)'
    knob.style.boxShadow = '0 0 14px rgba(0,200,255,0.7), inset 0 0 8px rgba(0,160,255,0.4)'
    knob.style.cursor = 'grab'
  }

  // Touch events
  wrap.addEventListener('touchstart', e => {
    e.preventDefault()
    if (activeTouchId !== null) return
    const touch = e.changedTouches[0]
    activeTouchId = touch.identifier
    _startInteraction(touch.clientX, touch.clientY)
  }, { passive: false })

  wrap.addEventListener('touchmove', e => {
    e.preventDefault()
    for (const touch of e.changedTouches) {
      if (touch.identifier === activeTouchId) {
        _updateAngle(touch.clientX, touch.clientY)
        break
      }
    }
  }, { passive: false })

  const _touchEnd = e => {
    e.preventDefault()
    for (const touch of e.changedTouches) {
      if (touch.identifier === activeTouchId) {
        activeTouchId = null
        _endInteraction()
        break
      }
    }
  }
  wrap.addEventListener('touchend', _touchEnd, { passive: false })
  wrap.addEventListener('touchcancel', _touchEnd, { passive: false })

  // Mouse events (desktop testing)
  wrap.addEventListener('mousedown', e => {
    e.preventDefault()
    _startInteraction(e.clientX, e.clientY)
  })

  window.addEventListener('mousemove', e => {
    if (!dragging) return
    _updateAngle(e.clientX, e.clientY)
  })

  window.addEventListener('mouseup', e => {
    if (!dragging) return
    _endInteraction()
  })

  scene.game.canvas.parentNode.appendChild(wrap)
  scene._attackWheelEl = wrap

  // Expose angle in degrees too for convenience
  Object.defineProperty(scene, '_attackAngleDeg', {
    get: () => (scene._attackAngle * 180 / Math.PI + 360) % 360,
    configurable: true,
  })
}

/* ─── createDialogueOverlay ──────────────────────────────────────────────── */
export function createDialogueOverlay(scene) {
  document.getElementById('lab-dialogue')?.remove()

  scene._dialogueEl = document.createElement('div')
  scene._dialogueEl.id = 'lab-dialogue'
  Object.assign(scene._dialogueEl.style, {
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
    fontSize: '16px',
    lineHeight: '1.7',
    zIndex: '30',
    display: 'none',
    boxShadow: '0 0 40px rgba(30,60,255,0.4), inset 0 0 24px rgba(8,16,60,0.6)',
    letterSpacing: '0.04em',
  })

  scene._dialogueName = document.createElement('div')
  Object.assign(scene._dialogueName.style, {
    color: '#ffcc00',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ffcc00, 0 0 20px #ff8800',
  })

  scene._dialogueText = document.createElement('div')
  Object.assign(scene._dialogueText.style, {
    minHeight: '52px',
    fontSize: '16px',
    lineHeight: '1.7',
  })

  const hint = document.createElement('div')
  Object.assign(hint.style, {
    color: '#404070',
    fontSize: '11px',
    marginTop: '10px',
    textAlign: 'right',
  })
  hint.textContent = '[ ENTER / TALK ] continue'

  scene._dialogueEl.appendChild(scene._dialogueName)
  scene._dialogueEl.appendChild(scene._dialogueText)
  scene._dialogueEl.appendChild(hint)
  scene.game.canvas.parentNode.appendChild(scene._dialogueEl)

  scene._dialogueActive = false
  scene._dialogueOnDone = null
  scene._inDialogueFlow = false
}

/* ─── showDialogueLine ───────────────────────────────────────────────────── */
export function showDialogueLine(scene, speakerName, text, isTrigger, onDone) {
  scene._dialogueEl.style.display = 'block'
  scene._dialogueName.style.color = isTrigger ? '#ff4444' : '#ffcc00'
  scene._dialogueName.style.textShadow = isTrigger
    ? '0 0 12px #ff0000, 0 0 24px #ff4400'
    : '0 0 10px #ffcc00, 0 0 20px #ff8800'
  scene._dialogueName.textContent = `${isTrigger ? '🚨' : '▶'} ${speakerName}`
  scene._dialogueText.textContent = ''
  scene._dialogueActive = true
  scene._typedFull = text

  let index = 0
  const speed = isTrigger ? 18 : 24
  const tick = () => {
    if (index < text.length) {
      scene._dialogueText.textContent += text[index++]
      setTimeout(tick, speed)
    }
  }
  tick()

  scene._dialogueOnDone = () => {
    scene._dialogueActive = false
    scene._dialogueEl.style.display = 'none'
    onDone?.()
  }
}

/* ─── showHint ───────────────────────────────────────────────────────────── */
export function showHint(scene, message) {
  document.getElementById('lab-hint')?.remove()
  scene._hintEl = document.createElement('div')
  scene._hintEl.id = 'lab-hint'
  Object.assign(scene._hintEl.style, {
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
    whiteSpace: 'nowrap',
  })
  scene._hintEl.textContent = message
  scene.game.canvas.parentNode.appendChild(scene._hintEl)
  setTimeout(() => { if (scene._hintEl) scene._hintEl.style.opacity = '0' }, 5000)
}

/* ─── showPanicOverlay ───────────────────────────────────────────────────── */
export function showPanicOverlay(scene) {
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
    letterSpacing: '0.05em',
  })
  overlay.innerHTML = '🚨 EMERGENCY 🚨<br><span style="font-size:11px;color:#ff9999">SHIVANSH & ANMOL MISSING</span>'

  scene.game.canvas.parentNode.appendChild(overlay)
  scene._panicOverlay = overlay

  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.transition = 'opacity 1s'
      overlay.style.opacity = '0'
      setTimeout(() => overlay.remove(), 1000)
    }
  }, 4000)
}