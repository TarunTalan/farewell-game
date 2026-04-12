// ─────────────────────────────────────────────────────────────────────────────
// DialogueSystem.js
// Drives all Pokemon-style dialogue scenes. Called by scenes via GameEvents.
// ─────────────────────────────────────────────────────────────────────────────
import { JUNIORS } from '../data/juniors.js'
import { SENIORS } from '../data/seniors.js'
import { DIALOGUES } from '../data/dialogue.js'

const TYPEWRITER_SPEED = 28 // ms per character

export class DialogueSystem {
  constructor(gameState) {
    this.gameState = gameState
    this.overlay    = document.getElementById('dialogue-overlay')
    this.portrait   = document.getElementById('dialogue-portrait')
    this.speakerEl  = document.getElementById('dialogue-speaker')
    this.textEl     = document.getElementById('dialogue-text')
    this.choicesEl  = document.getElementById('dialogue-choices')
    this.continueEl = document.getElementById('dialogue-continue')

    this._beats      = []
    this._beatIndex  = 0
    this._typing     = false
    this._typeTimer  = null
    this._onComplete = null

    // Tap anywhere in the dialogue box to advance
    this.overlay.addEventListener('pointerdown', () => this._onTap())
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Play a named dialogue script, then call onComplete when done */
  play(scriptName, onComplete) {
    const script = DIALOGUES[scriptName]
    if (!script) { onComplete?.(); return }

    this._beats = script
    this._beatIndex = 0
    this._onComplete = onComplete
    this.overlay.classList.add('active')
    this._showBeat()
  }

  /** Stop and hide immediately */
  stop() {
    clearTimeout(this._typeTimer)
    this.overlay.classList.remove('active')
    this._beats = []
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  _showBeat() {
    if (this._beatIndex >= this._beats.length) {
      this._finish()
      return
    }

    const beat = this._beats[this._beatIndex]

    // Inject runtime variables like {senior_name}
    let text = beat.text
    if (this.gameState.selectedSenior) {
      text = text.replace('{senior_name}', this.gameState.selectedSenior.name)
    }

    // Portrait
    this._setPortrait(beat.portrait)

    // Speaker label
    this.speakerEl.textContent = beat.speaker || ''

    // Choices (hidden until text finishes)
    this.choicesEl.innerHTML = ''
    this.continueEl.style.display = 'block'

    // Typewriter
    this._typing = true
    this.textEl.textContent = ''
    this._typeText(text, beat.choices)
  }

  _typeText(text, choices) {
    let i = 0
    const tick = () => {
      if (i >= text.length) {
        this._typing = false
        this.continueEl.style.display = choices ? 'none' : 'block'
        if (choices) this._showChoices(choices)
        return
      }
      this.textEl.textContent += text[i++]
      this._typeTimer = setTimeout(tick, TYPEWRITER_SPEED)
    }
    tick()
  }

  _showChoices(choices) {
    this.choicesEl.innerHTML = ''
    choices.forEach(choice => {
      const btn = document.createElement('button')
      btn.className = 'dialogue-choice-btn'
      btn.textContent = choice.label
      btn.addEventListener('pointerdown', () => {
        this.choicesEl.innerHTML = ''
        this._beatIndex++
        this._showBeat()
      })
      this.choicesEl.appendChild(btn)
    })
  }

  _onTap() {
    // If still typing — skip to end of current line
    if (this._typing) {
      clearTimeout(this._typeTimer)
      const beat = this._beats[this._beatIndex]
      let text = beat.text
      if (this.gameState.selectedSenior) {
        text = text.replace('{senior_name}', this.gameState.selectedSenior.name)
      }
      this.textEl.textContent = text
      this._typing = false
      const choices = beat.choices
      this.continueEl.style.display = choices ? 'none' : 'block'
      if (choices) this._showChoices(choices)
      return
    }
    // If choices are showing — wait for a choice
    if (this.choicesEl.children.length > 0) return

    // Advance
    this._beatIndex++
    this._showBeat()
  }

  _setPortrait(portraitId) {
    if (!portraitId) {
      this.portrait.innerHTML = '<span class="placeholder-face">📟</span>'
      return
    }

    // Try junior first, then senior
    const junior = JUNIORS.find(j => j.id === portraitId)
    const senior = SENIORS.find(s => s.id === portraitId)
    const char = junior || senior

    if (!char) {
      this.portrait.innerHTML = '<span class="placeholder-face">❓</span>'
      return
    }

    if (char.image) {
      const folder = junior ? 'juniors' : 'seniors'
      this.portrait.innerHTML = `<img src="/images/${folder}/${char.image}" alt="${char.name}" />`
    } else {
      this.portrait.innerHTML = `<span class="placeholder-face" style="font-size:72px">${char.emoji}</span>`
    }
  }

  _finish() {
    this.overlay.classList.remove('active')
    this._onComplete?.()
    this._onComplete = null
  }
}
