import Phaser from 'phaser'
import { PALETTES } from '../palettes.js'

export class YearTransitionScene extends Phaser.Scene {
  constructor() { super('YearTransition') }

  init(data) {
    this.nextYear  = data.year
    this.prevScore = data.score
  }

  create() {
    const W   = this.scale.width
    const H   = this.scale.height
    const pal = PALETTES[Math.min(this.nextYear, PALETTES.length - 1)]

    const yearTitles = [
      ['YEAR 1', 'AKGEC ARRIVAL', [
        'no SI ka sahaara',
        'akela insaan JEE se haara',
        'JEE deene ke baad AIIMS main admission hone se bachte hue',
        'ham aa tapke AKGEC'
      ], '#5b8cff'],
      ['YEAR 2', 'PROBATION HELL, SI HEAVEN', ['Probation ki yaad nhi aati sir/maam?', '"meet at 4"', 'weak memory hai aapki, lets work on that'], '#39ff14'],
      ['YEAR 3', 'PROJECT PANIC', ['Three deadlines. One missing teammate.', 'Can you survive the pressure?'], '#ff8800'],
      ['YEAR 4', 'THE FINAL WALK', ['The ultimate boss awaits before', 'the glorious gates of SI Lab.'], '#ffdd66'],
    ]

    const [yearLabel, subtitle, descLines, col] = yearTitles[Math.min(this.nextYear, 3)]

    // ── STUNNING BACKGROUND ──
    // Deep glowing background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x001100, 0x001100, 1)
    if (this.nextYear === 1) bg.fillGradientStyle(0x050a14, 0x050a14, 0x001a11, 0x001a11, 1)
    if (this.nextYear === 2) bg.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x110500, 0x110500, 1)
    bg.fillRect(0, 0, W, H)

    // Cinematic floating orbs/dust
    const ptimer = this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        const p = this.add.circle(
          Phaser.Math.Between(0, W), 
          Phaser.Math.Between(H, H + 50),
          Phaser.Math.FloatBetween(1, 4), 
          pal.accent,
          Phaser.Math.FloatBetween(0.1, 0.6)
        )
        this.tweens.add({ 
          targets: p, y: -50, x: p.x + Phaser.Math.Between(-50, 50),
          alpha: 0, duration: Phaser.Math.Between(4000, 8000), 
          ease: 'Sine.inOut', onComplete: () => p.destroy() 
        })
      }
    })

    // Subtly animating horizontal scanlines
    const scanlines = this.add.tileSprite(W/2, H/2, W, H, 'platform').setAlpha(0.02).setTint(pal.accent)
    this.tweens.add({ targets: scanlines, tilePositionY: '-=100', duration: 3000, repeat: -1 })

    if (this.nextYear === 0) {
      this._introAudio = this.sound.add('level1_intro')
      this._introAudio.play()
    }

    // ── TEXT ──
    const fs = n => Math.floor(W / n)

    const yearTxt = this.add.text(W / 2, H * 0.15, yearLabel, {
      fontFamily: '"Outfit", sans-serif', fontSize: `${Math.min(64, fs(5))}px`,
      color: col, stroke: '#000000', strokeThickness: 6,
      fontStyle: '900', letterSpacing: 8,
      shadow: { offsetX: 0, offsetY: 0, color: col, blur: 20, fill: true }
    }).setOrigin(0.5).setAlpha(0)

    const subTxt = this.add.text(W / 2, H * 0.28, subtitle, {
      fontFamily: '"Outfit", sans-serif', fontSize: `${Math.min(28, fs(16))}px`,
      color: '#ffffff', fontStyle: 'bold', letterSpacing: 3,
      align: 'center', wordWrap: { width: W * 0.9 },
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(0)

    const textItems = [yearTxt, subTxt]
    
    // Dynamic starting Y for descriptions based on subtitle height
    const descStartY = H * 0.28 + subTxt.height + 40
    
    descLines.forEach((line, i) => {
      const lineTxt = this.add.text(W / 2, descStartY + i * Math.max(35, H * 0.08), line, {
        fontFamily: '"Inter", sans-serif', fontSize: `${Math.max(15, fs(30))}px`,
        color: '#cbd5e1', align: 'center', fontStyle: 'italic',
        wordWrap: { width: W * 0.85 }
      }).setOrigin(0.5).setAlpha(0)
      textItems.push(lineTxt)
    })

    const tapTxt = this.add.text(W / 2, H - 80, 'TAP TO CONTINUE', {
      fontFamily: '"Nunito", sans-serif', fontSize: `${Math.min(24, fs(25))}px`,
      color: pal.accent, letterSpacing: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)
    textItems.push(tapTxt)

    textItems.forEach((item, i) => {
      this.tweens.add({ 
        targets: item, alpha: 1, y: item.y - 10,
        delay: i * 400, duration: 800, ease: 'Power2.out' 
      })
    })

    // Pulse tap text
    this.tweens.add({ targets: tapTxt, alpha: 0.2, duration: 1000, yoyo: true, repeat: -1, delay: textItems.length * 400 })

    this.input.once('pointerdown', () => {
      if (this._introAudio && this._introAudio.isPlaying) {
        this._introAudio.stop()
      }
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        ptimer.remove()
        this.scene.stop('GameScene')
        this.scene.start('GameScene', { year: this.nextYear })
        this.scene.stop()
      })
    })
  }
}
