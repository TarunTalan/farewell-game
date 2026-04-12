// ─────────────────────────────────────────────────────────────────────────────
// VideoSystem.js
// Shows the farewell video and then the end screen.
//
// HOW TO SET YOUR VIDEO:
//   Option A — YouTube:
//     Call VideoSystem.setYouTube('YOUR_VIDEO_ID')
//     e.g. setYouTube('dQw4w9WgXcQ')
//
//   Option B — self-hosted mp4:
//     Call VideoSystem.setLocal('/videos/farewell.mp4')
//     Drop the file in /public/videos/
// ─────────────────────────────────────────────────────────────────────────────

export class VideoSystem {
  constructor() {
    this.videoOverlay  = document.getElementById('video-overlay')
    this.videoIframe   = document.getElementById('farewell-video')
    this.skipBtn       = document.getElementById('video-skip')
    this.endscreen     = document.getElementById('endscreen-overlay')
    this.rsvpBtn       = document.getElementById('rsvp-btn')

    this._youtubeId = null
    this._localSrc  = null

    this.skipBtn.addEventListener('pointerdown', () => this._finish())
    this.rsvpBtn.addEventListener('pointerdown', () => {
      // ← Replace with your RSVP link or Google Form
      window.open('https://forms.google.com', '_blank')
    })
  }

  /** Set a YouTube video ID */
  setYouTube(videoId) {
    this._youtubeId = videoId
  }

  /** Set a local video path (e.g. '/videos/farewell.mp4') */
  setLocal(src) {
    this._localSrc = src
  }

  /** Show the video. Calls onComplete when done or skipped. */
  play(onComplete) {
    this._onComplete = onComplete
    this.videoOverlay.classList.add('active')

    if (this._youtubeId) {
      this.videoIframe.src =
        `https://www.youtube.com/embed/${this._youtubeId}?autoplay=1&rel=0`
    } else if (this._localSrc) {
      // Replace iframe with a <video> tag for local files
      const video = document.createElement('video')
      video.src = this._localSrc
      video.controls = true
      video.autoplay = true
      video.style.width = '100%'
      video.addEventListener('ended', () => this._finish())
      this.videoIframe.replaceWith(video)
    } else {
      // No video set — show a placeholder
      this.videoIframe.srcdoc = `
        <div style="background:#111;color:#f0c040;font-family:monospace;
          display:flex;align-items:center;justify-content:center;height:100%;
          font-size:16px;text-align:center;padding:24px;">
          📽️ Your farewell video will appear here.<br><br>
          Call VideoSystem.setYouTube('VIDEO_ID') or VideoSystem.setLocal('/path')
        </div>`
    }
  }

  _finish() {
    this.videoOverlay.classList.remove('active')
    this.videoIframe.src = 'about:blank'
    this._showEndScreen()
    this._onComplete?.()
  }

  _showEndScreen() {
    this.endscreen.classList.add('active')
    this._spawnConfetti()
  }

  _spawnConfetti() {
    // Simple CSS confetti — no library needed
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
