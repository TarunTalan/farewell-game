// ─────────────────────────────────────────────────────────────────────────────
// HUD.js — manages the on-screen health bar, zone label, score
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES = [
  { year: 'YEAR 1', name: 'Confusion Zone',  color: '#70d0ff' },
  { year: 'YEAR 2', name: 'Lab Survival',    color: '#50ff90' },
  { year: 'YEAR 3', name: 'Project Panic',   color: '#ff9070' },
  { year: 'YEAR 4', name: 'Placement Hell',  color: '#ff5050' },
]

export class HUD {
  constructor(gameState) {
    this.gameState = gameState
    this.hudEl      = document.getElementById('hud')
    this.healthBar  = document.getElementById('hud-health-bar')
    this.zoneLabel  = document.getElementById('hud-zone')
    this.scoreEl    = document.getElementById('hud-score')
    this.bannerEl   = document.getElementById('zone-banner')
    this.bannerYear = document.getElementById('zone-banner-year')
    this.bannerName = document.getElementById('zone-banner-name')
  }

  show() { this.hudEl.classList.add('active') }
  hide() { this.hudEl.classList.remove('active') }

  setZone(zoneIndex) {
    const zone = ZONES[zoneIndex]
    if (!zone) return
    this.zoneLabel.textContent = `${zone.year} — ${zone.name}`
    this._flashBanner(zone)
  }

  setHealth(current, max) {
    const pct = Math.max(0, (current / max) * 100)
    this.healthBar.style.width = pct + '%'
    // Color shift: green → yellow → red
    if (pct > 60)       this.healthBar.style.background = 'linear-gradient(90deg, #50d090, #30b070)'
    else if (pct > 30)  this.healthBar.style.background = 'linear-gradient(90deg, #f0c040, #d09020)'
    else                this.healthBar.style.background = 'linear-gradient(90deg, #ff5050, #cc2020)'
  }

  setScore(score) {
    this.scoreEl.textContent = `SCORE: ${score}`
  }

  _flashBanner(zone) {
    this.bannerYear.textContent = zone.year
    this.bannerName.textContent = zone.name
    this.bannerEl.classList.add('show')
    setTimeout(() => this.bannerEl.classList.remove('show'), 2800)
  }
}
