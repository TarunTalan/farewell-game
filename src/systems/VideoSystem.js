// ─────────────────────────────────────────────────────────────────────────────
// VideoSystem.js — Shows the final RSVP endscreen overlay
// ─────────────────────────────────────────────────────────────────────────────

export class VideoSystem {
  constructor() {
    this.endscreen = document.getElementById('endscreen-overlay')
    this.rsvpBtn   = document.getElementById('rsvp-btn')

    if (!this.endscreen || !this.rsvpBtn) return

    this.rsvpBtn.addEventListener('pointerdown', () => {
      // ← Replace with your RSVP link or Google Form
      window.open('https://forms.google.com', '_blank')

      // Hide everything so nothing is left on screen
      this.endscreen.classList.remove('active')
      document.body.style.background = '#000000'
    })
  }

  /** Show the endscreen overlay directly */
  play() {
    this.endscreen.classList.add('active')
    this._spawnConfetti()
  }

  _spawnConfetti() {
    const colors = ['#f0c040', '#70d0ff', '#ff70b0', '#50ff90', '#ff9070']
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;
        left:${Math.random() * 100}vw;
        top:-10px;
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        z-index:300;
        pointer-events:none;
        animation: confettiFall ${1.5 + Math.random() * 2}s ease-in forwards;
        animation-delay:${Math.random() * 1.5}s;
      `
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 4000)
    }

    // Inject keyframes once
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style')
      style.id = 'confetti-style'
      style.textContent = `
        @keyframes confettiFall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }
}
