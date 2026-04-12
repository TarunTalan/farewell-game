// ─────────────────────────────────────────────────────────────────────────────
// CharacterSelect.js
// Handles the senior selection carousel (HTML overlay, not Phaser)
// ─────────────────────────────────────────────────────────────────────────────
import { SENIORS } from '../data/seniors.js'

export class CharacterSelect {
  constructor(onSelect) {
    this.onSelect   = onSelect
    this.overlay    = document.getElementById('charselect-overlay')
    this.track      = document.getElementById('charselect-track')
    this.dotsEl     = document.getElementById('charselect-dots')
    this.confirmBtn = document.getElementById('charselect-confirm')
    this.prevBtn    = document.getElementById('arrow-prev')
    this.nextBtn    = document.getElementById('arrow-next')

    this.currentIndex = 0
    this._touchStartX = 0

    this._buildCards()
    this._buildDots()
    this._bindEvents()
  }

  show() {
    this.overlay.classList.add('active')
    this._updateCarousel()
  }

  hide() {
    this.overlay.classList.remove('active')
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  _buildCards() {
    this.track.innerHTML = ''
    SENIORS.forEach((senior, i) => {
      const card = document.createElement('div')
      card.className = 'senior-card'
      card.dataset.index = i

      let faceHTML = senior.image
        ? `<img src="/images/seniors/${senior.image}" alt="${senior.name}" />`
        : `<span style="font-size:52px">${senior.emoji}</span>`

      card.innerHTML = `
        <div class="card-face">${faceHTML}</div>
        <div class="card-name">${senior.name}</div>
        <div class="card-title">${senior.title}</div>
        <div class="card-bio">${senior.bio.replace(/\n/g, '<br>')}</div>
        <div class="card-power">${senior.power}</div>
      `
      card.addEventListener('pointerdown', () => {
        this.currentIndex = i
        this._updateCarousel()
      })
      this.track.appendChild(card)
    })
  }

  _buildDots() {
    this.dotsEl.innerHTML = ''
    SENIORS.forEach((_, i) => {
      const dot = document.createElement('div')
      dot.className = 'charselect-dot'
      dot.dataset.index = i
      this.dotsEl.appendChild(dot)
    })
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.prevBtn.addEventListener('pointerdown', () => {
      this.currentIndex = Math.max(0, this.currentIndex - 1)
      this._updateCarousel()
    })
    this.nextBtn.addEventListener('pointerdown', () => {
      this.currentIndex = Math.min(SENIORS.length - 1, this.currentIndex + 1)
      this._updateCarousel()
    })
    this.confirmBtn.addEventListener('pointerdown', () => {
      this.hide()
      this.onSelect(SENIORS[this.currentIndex])
    })

    // Swipe support
    this.track.addEventListener('touchstart', e => {
      this._touchStartX = e.touches[0].clientX
    }, { passive: true })
    this.track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - this._touchStartX
      if (Math.abs(dx) > 40) {
        if (dx < 0) this.currentIndex = Math.min(SENIORS.length - 1, this.currentIndex + 1)
        else        this.currentIndex = Math.max(0, this.currentIndex - 1)
        this._updateCarousel()
      }
    }, { passive: true })
  }

  // ── Update ────────────────────────────────────────────────────────────────

  _updateCarousel() {
    const cards = this.track.querySelectorAll('.senior-card')
    const cardWidth = 320 // card 280px + 2*20px margin
    const containerWidth = this.overlay.querySelector('#charselect-carousel').offsetWidth
    const offset = containerWidth / 2 - cardWidth / 2 - this.currentIndex * cardWidth
    this.track.style.transform = `translateX(${offset}px)`

    cards.forEach((c, i) => {
      c.classList.toggle('active-card', i === this.currentIndex)
    })

    const dots = this.dotsEl.querySelectorAll('.charselect-dot')
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === this.currentIndex)
    })
  }
}
