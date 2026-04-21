export function createMobileControls(scene) {
  document.getElementById('lab-mobile')?.remove()
  scene._mobileEl = document.createElement('div')
  scene._mobileEl.id = 'lab-mobile'
  Object.assign(scene._mobileEl.style, {
    position: 'absolute',
    bottom: '160px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    zIndex: '25',
    userSelect: 'none'
  })

  const buttonStyle = () => `
    width:62px;height:62px;border-radius:50%;
    background:rgba(30,40,100,0.85);
    border:2px solid rgba(100,140,255,0.55);
    color:#88aaff;font-size:22px;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;-webkit-tap-highlight-color:transparent;
    box-shadow:0 0 14px rgba(60,100,255,0.35);`

  const makeButton = (label, code) => {
    const button = document.createElement('button')
    button.innerHTML = label
    button.style.cssText = buttonStyle()
    button.addEventListener('touchstart', event => { event.preventDefault(); scene._keys[code] = true })
    button.addEventListener('touchend', event => { event.preventDefault(); scene._keys[code] = false })
    button.addEventListener('mousedown', () => { scene._keys[code] = true })
    button.addEventListener('mouseup', () => { scene._keys[code] = false })
    return button
  }

  const row1 = document.createElement('div')
  row1.appendChild(makeButton('▲', 'ArrowUp'))

  const row2 = document.createElement('div')
  row2.style.cssText = 'display:flex;gap:6px'
  row2.appendChild(makeButton('◀', 'ArrowLeft'))
  row2.appendChild(makeButton('▼', 'ArrowDown'))
  row2.appendChild(makeButton('▶', 'ArrowRight'))

  const row3 = document.createElement('div')
  row3.style.cssText = 'display:flex;gap:10px;margin-top:8px'
  const talkButton = document.createElement('button')
  talkButton.innerHTML = '💬 TALK'
  talkButton.style.cssText = `width:130px;height:52px;border-radius:26px;
    background:rgba(40,80,200,0.9);border:2px solid #6688ff;
    color:#ffffff;font-size:16px;font-weight:bold;
    cursor:pointer;box-shadow:0 0 18px rgba(60,100,255,0.5);letter-spacing:1px;`
  talkButton.addEventListener('touchstart', event => { event.preventDefault(); scene._tryTalk() })
  talkButton.addEventListener('click', () => scene._tryTalk())
  row3.appendChild(talkButton)

  scene._mobileEl.appendChild(row1)
  scene._mobileEl.appendChild(row2)
  scene._mobileEl.appendChild(row3)
  scene.game.canvas.parentNode.appendChild(scene._mobileEl)
}

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
    letterSpacing: '0.04em'
  })

  scene._dialogueName = document.createElement('div')
  Object.assign(scene._dialogueName.style, {
    color: '#ffcc00',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ffcc00, 0 0 20px #ff8800'
  })

  scene._dialogueText = document.createElement('div')
  Object.assign(scene._dialogueText.style, {
    minHeight: '52px',
    fontSize: '16px',
    lineHeight: '1.7'
  })

  const hint = document.createElement('div')
  Object.assign(hint.style, {
    color: '#404070',
    fontSize: '11px',
    marginTop: '10px',
    textAlign: 'right'
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
    whiteSpace: 'nowrap'
  })
  scene._hintEl.textContent = message
  scene.game.canvas.parentNode.appendChild(scene._hintEl)
  setTimeout(() => { if (scene._hintEl) scene._hintEl.style.opacity = '0' }, 5000)
}

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
    letterSpacing: '0.05em'
  })
  overlay.innerHTML = '🚨 EMERGENCY 🚨<br><span style="font-size:11px;color:#ff9999">SHIVANSH & ANMOL MISSING</span>'

  const style = document.createElement('style')
  style.textContent = `@keyframes lab-pulse {
    from { box-shadow: 0 0 20px rgba(255,0,0,0.5); }
    to { box-shadow: 0 0 50px rgba(255,0,0,0.9), 0 0 80px rgba(255,50,0,0.4); }
  }`
  document.head.appendChild(style)

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
