// ─────────────────────────────────────────────────────────────────────────────
// PowerupSystem.js
// Handles the junior squad summon — flash screen + in-game buff logic
// ─────────────────────────────────────────────────────────────────────────────
import { JUNIORS } from '../data/juniors.js'

const POWERUP_DURATION = 15000 // 15 seconds

export class PowerupSystem {
  constructor(gameState) {
    this.gameState = gameState
    this.flash     = document.getElementById('powerup-flash')
    this.juniorsEl = document.getElementById('powerup-juniors')
    this.isActive  = false
    this._timer    = null
  }

  // ── Trigger the summon sequence ───────────────────────────────────────────

  trigger(onComplete) {
    // Pick 3 juniors (use first 3, or random if more exist)
    const squad = this._pickSquad()

    // Build the flash UI
    this.juniorsEl.innerHTML = ''
    squad.forEach(junior => {
      const div = document.createElement('div')
      div.className = 'powerup-junior'

      let faceHTML = junior.image
        ? `<img src="/images/juniors/${junior.image}" alt="${junior.name}" />`
        : junior.emoji

      div.innerHTML = `
        <div class="powerup-junior-face">${faceHTML}</div>
        <div class="powerup-junior-name">${junior.name}</div>
      `
      this.juniorsEl.appendChild(div)
    })

    // Show flash
    this.flash.classList.add('active')

    // Hide after 2.5s, then activate buff
    setTimeout(() => {
      this.flash.classList.remove('active')
      this._activateBuff()
      onComplete?.()
    }, 2500)
  }

  // ── In-game buff ──────────────────────────────────────────────────────────

  _activateBuff() {
    this.isActive = true
    this.gameState.powerupActive = true

    // Show HUD indicator
    const indicator = document.getElementById('hud-power-indicator')
    if (indicator) indicator.classList.add('active')

    clearTimeout(this._timer)
    this._timer = setTimeout(() => {
      this.isActive = false
      this.gameState.powerupActive = false
      if (indicator) indicator.classList.remove('active')
    }, POWERUP_DURATION)
  }

  _pickSquad() {
    // If fewer than 3 juniors, repeat
    const pool = [...JUNIORS]
    while (pool.length < 3) pool.push(...JUNIORS)
    // Shuffle and take 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 3)
  }
}
