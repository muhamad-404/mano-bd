import Phaser from 'phaser'
import { emit } from '../bridge.js'
import { generateTextures, TEX } from '../textures.js'

const PALETTE_BG = {
  dawn: TEX.bgDawn,
  evening: TEX.bgEvening,
  storm: TEX.bgStorm,
  night: TEX.bgNight,
}

export default class BaseLevelScene extends Phaser.Scene {
  constructor(key) {
    super(key)
    this.levelConfig = {}
    this.levelId = 1
    this.progress = 0
    this.target = 8
    this.pausedLogic = false
    this.completing = false
    this.basket = null
    this.pointerX = 195
    this.pool = []
    this.parallax = []
    this.fallScale = 1
  }

  init(data = {}) {
    this.levelConfig = data.config || {}
    this.levelId = data.levelId || 1
    this.progress = 0
    this.target = this.levelConfig.target || 8
    this.pausedLogic = false
    this.completing = false
    this.fallScale = 1
  }

  create() {
    generateTextures(this)
    this.createBackground()
    this.createParallax()
    this.createBasket()
    this.bindInput()
    this.emitProgress()

    this.events.on('pause', () => {
      this.pausedLogic = true
      emit('level:pause', { levelId: this.levelId })
    })
    this.events.on('resume', () => {
      this.pausedLogic = false
      emit('level:resume', { levelId: this.levelId })
    })
  }

  createBackground() {
    const key = PALETTE_BG[this.levelConfig.palette] || TEX.bgDawn
    const bg = this.add.image(0, 0, key).setOrigin(0, 0)
    bg.setDisplaySize(this.scale.width, this.scale.height)
    bg.setDepth(-20)
  }

  createParallax() {
    for (let i = 0; i < 6; i += 1) {
      const orb = this.add
        .image(
          Phaser.Math.Between(20, this.scale.width - 20),
          Phaser.Math.Between(40, this.scale.height - 80),
          TEX.softCircle,
        )
        .setAlpha(0.25 + Math.random() * 0.2)
        .setScale(0.6 + Math.random() * 1.2)
        .setDepth(-10)
      orb.setData('speed', 6 + Math.random() * 10)
      orb.setData('phase', Math.random() * Math.PI * 2)
      this.parallax.push(orb)
    }
  }

  createBasket() {
    const y = this.scale.height - 70
    this.basket = this.add.image(this.scale.width / 2, y, TEX.basket).setDepth(5)
    this.basket.setScale(0.55)
    this.pointerX = this.basket.x

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.basketLabel = this.add
      .text(this.basket.x, this.basket.y + 6, 'Mano', {
        fontFamily: 'Dancing Script, Quicksand, cursive',
        fontSize: '16px',
        color: '#1b1533',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(6)
  }

  bindInput() {
    const follow = (p) => {
      this.pointerX = Phaser.Math.Clamp(p.x, 36, this.scale.width - 36)
    }
    this.input.on('pointerdown', follow)
    this.input.on('pointermove', (p) => {
      if (p.isDown) follow(p)
    })
  }

  update(_time, delta) {
    if (this.pausedLogic || this.completing) return
    const dt = Math.min(delta, 40) / 1000
    this.updateBasket(dt)
    this.updateParallax(dt)
    this.updateFalling(dt)
  }

  updateBasket(dt) {
    if (!this.basket) return
    const lerp = 1 - Math.pow(0.001, dt)
    this.basket.x += (this.pointerX - this.basket.x) * Math.min(1, lerp * 14)
    if (this.basketLabel) {
      this.basketLabel.x = this.basket.x
      this.basketLabel.y = this.basket.y + 6
    }
  }

  updateParallax(dt) {
    for (const orb of this.parallax) {
      const phase = orb.getData('phase') + dt * 0.4
      orb.setData('phase', phase)
      orb.y += Math.sin(phase) * orb.getData('speed') * dt
      orb.x += Math.cos(phase * 0.7) * 8 * dt
      if (orb.y < -40) orb.y = this.scale.height + 20
      if (orb.y > this.scale.height + 40) orb.y = -20
    }
  }

  /** Override in subclasses */
  updateFalling(_dt) {}

  acquire(textureKey) {
    let item = this.pool.find((s) => !s.active)
    if (!item) {
      item = this.add.image(0, 0, textureKey).setDepth(2)
      this.pool.push(item)
    } else {
      item.setTexture(textureKey)
      item.setActive(true).setVisible(true)
    }
    item.setAlpha(1).setScale(0.5)
    return item
  }

  release(item) {
    item.setActive(false).setVisible(false)
  }

  emitProgress() {
    emit('level:progress', {
      levelId: this.levelId,
      value: this.progress,
      max: this.target,
    })
  }

  addProgress(n = 1) {
    if (this.completing) return
    this.progress = Math.min(this.target, this.progress + n)
    this.emitProgress()
    if (this.progress >= this.target) {
      this.complete()
    }
  }

  complete() {
    if (this.completing) return
    this.completing = true
    this.pausedLogic = true

    const burst = this.add.particles(this.scale.width / 2, this.scale.height / 2, TEX.sparkle, {
      speed: { min: 40, max: 160 },
      scale: { start: 0.7, end: 0 },
      lifespan: 700,
      quantity: 18,
      emitting: false,
    })
    burst.explode(24)

    this.time.delayedCall(1200, () => {
      burst.destroy()
      emit('level:complete', { levelId: this.levelId })
    })
  }

  pauseGame() {
    this.scene.pause()
  }

  resumeGame() {
    this.scene.resume()
  }
}
