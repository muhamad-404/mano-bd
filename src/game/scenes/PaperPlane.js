import Phaser from 'phaser'
import { chime, pop } from '../../audio/synth.js'
import { emit } from '../bridge.js'
import { LAST_MET } from '../../config.js'
import { daysBetween, nowKarachi } from '../../utils/dates.js'
import { prefersReducedMotion } from '../../utils/device.js'
import { generateTextures, TEX } from '../textures.js'
import BaseLevelScene from './BaseLevelScene.js'

export default class PaperPlane extends BaseLevelScene {
  constructor() {
    super('PaperPlane')
    this.plane = null
    this.starsFar = null
    this.starsNear = null
    this.wind = []
    this.nudgeX = 0
    this.distance = 0
    this.starScore = 0
    this.arrived = false
    this.startY = 0
    this.endY = 0
    this.flightSec = 60
    this.spawnAcc = 0
  }

  create() {
    try {
      generateTextures(this)
      this.createBackground()
      this.flightSec = this.levelConfig.durationSec || 60
      this.startY = this.scale.height - 120
      this.endY = 90
      this.distance = 0
      this.starScore = 0
      this.arrived = false
      this.nudgeX = 0
      this.spawnAcc = 0
      this.pointerX = this.scale.width / 2
      this.target = this.levelConfig.target || 7
      this.progress = 0

      this.createStarfields()
      this.createMarkers()
      this.createBasket()
      this.bindInput()
      this.emitDistance()
      this.showHint()
    } catch (err) {
      console.error('[PaperPlane] create failed', err)
      emit('level:error', { levelId: this.levelId, error: String(err) })
      return
    }

    this.events.on('pause', () => {
      this.pausedLogic = true
      emit('level:pause', { levelId: this.levelId })
    })
    this.events.on('resume', () => {
      this.pausedLogic = false
      emit('level:resume', { levelId: this.levelId })
    })
  }

  createBasket() {
    this.plane = this.add
      .image(this.scale.width / 2, this.startY, TEX.plane)
      .setDepth(6)
      .setScale(0.55)
    this.basket = this.plane
    this.basketLabel = null
  }

  createStarfields() {
    this.starsFar = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, TEX.starsFar)
      .setOrigin(0, 0)
      .setDepth(-18)
    this.starsNear = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, TEX.starsNear)
      .setOrigin(0, 0)
      .setDepth(-17)
      .setAlpha(0.85)

    if (!prefersReducedMotion()) {
      for (let i = 0; i < 6; i += 1) {
        const streak = this.add
          .rectangle(
            Phaser.Math.Between(20, this.scale.width - 20),
            Phaser.Math.Between(0, this.scale.height),
            2,
            18 + Math.random() * 24,
            0xffffff,
            0.25,
          )
          .setDepth(-10)
        streak.setData('vy', 80 + Math.random() * 60)
        this.wind.push(streak)
      }
    }
  }

  createMarkers() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const hx = this.scale.width / 2
    const hy = this.scale.height - 40
    const house = this.add.graphics().setDepth(2)
    house.fillStyle(0xffd98a, 0.9)
    house.fillRoundedRect(hx - 22, hy - 18, 44, 28, 4)
    house.fillStyle(0xff7ea8, 0.95)
    house.fillTriangle(hx - 28, hy - 18, hx + 28, hy - 18, hx, hy - 42)
    house.fillStyle(0xfff6ee, 0.85)
    house.fillCircle(hx, hy - 8, 5)

    this.add
      .text(hx, hy + 18, 'From Ahsan', {
        fontFamily: 'Dancing Script, Quicksand, cursive',
        fontSize: '16px',
        color: '#ffd98a',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(3)

    const glow = this.add
      .image(this.scale.width / 2, this.endY, TEX.softCircle)
      .setDepth(2)
      .setTint(0xffd98a)
      .setAlpha(0.55)
      .setScale(1.6)
    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      scale: 1.9,
      duration: 900,
      yoyo: true,
      repeat: -1,
    })
    this.add
      .text(this.scale.width / 2, this.endY - 36, 'To Mano', {
        fontFamily: 'Dancing Script, Quicksand, cursive',
        fontSize: '18px',
        color: '#fff6ee',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(3)
  }

  showHint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height * 0.45, this.levelConfig.hint || 'Drag to steer', {
        fontFamily: 'Quicksand, system-ui, sans-serif',
        fontSize: '18px',
        color: '#fff6ee',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(20)
    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 2500,
      duration: 400,
      onComplete: () => hint.destroy(),
    })
  }

  update(_time, delta) {
    if (this.pausedLogic || this.completing || this.arrived) return
    const dt = Math.min(delta, 40) / 1000
    this.updateFlight(dt)
    this.updateWind(dt)
    this.updateFloaters(dt)
    this.maybeSpawn(dt)
  }

  updateFlight(dt) {
    const rise = (this.startY - this.endY) / this.flightSec
    this.plane.y = Math.max(this.endY, this.plane.y - rise * dt)

    const lerp = 1 - Math.pow(0.001, dt)
    const targetX = Phaser.Math.Clamp(this.pointerX + this.nudgeX, 40, this.scale.width - 40)
    this.plane.x += (targetX - this.plane.x) * Math.min(1, lerp * 12)
    this.nudgeX *= 1 - Math.min(1, dt * 2.5)

    const span = this.startY - this.endY
    this.distance = Phaser.Math.Clamp((this.startY - this.plane.y) / span, 0, 1)
    this.emitDistance()

    if (this.starsFar) this.starsFar.tilePositionY -= 18 * dt
    if (this.starsNear) this.starsNear.tilePositionY -= 42 * dt

    if (this.distance >= 0.995) this.onArrive()
  }

  updateWind(dt) {
    for (const streak of this.wind) {
      streak.y += streak.getData('vy') * dt
      if (streak.y > this.scale.height + 20) {
        streak.y = -20
        streak.x = Phaser.Math.Between(20, this.scale.width - 20)
      }
    }
  }

  maybeSpawn(dt) {
    this.spawnAcc += dt
    if (this.spawnAcc < 0.9) return
    this.spawnAcc = 0
    if (Math.random() < (this.levelConfig.starChance || 0.35)) this.spawnFloater(TEX.star, 'star')
    if (Math.random() < 0.28) this.spawnFloater(TEX.cloud, 'cloud')
  }

  spawnFloater(tex, kind) {
    const item = this.acquire(tex)
    item.x = Phaser.Math.Between(50, this.scale.width - 50)
    item.y = this.plane.y - Phaser.Math.Between(140, 280)
    item.setData('kind', kind)
    item.setData('vy', 20 + Math.random() * 30)
    if (kind === 'cloud') {
      item.setTint(0xdde6f0)
      item.setAlpha(0.7)
      item.setScale(0.55)
    } else {
      item.clearTint()
      item.setAlpha(1)
      item.setScale(0.4)
    }
  }

  updateFloaters(dt) {
    for (const item of this.pool) {
      if (!item.active) continue
      item.y += (item.getData('vy') || 24) * dt
      const kind = item.getData('kind')
      const dx = item.x - this.plane.x
      const dy = item.y - this.plane.y
      const hit = dx * dx + dy * dy < 42 * 42
      if (hit) {
        if (kind === 'star') {
          pop()
          this.starScore += 1
          this.sparkleAt(item.x, item.y)
          this.progress = Math.min(this.target, this.starScore)
          this.emitProgress()
          this.release(item)
        } else {
          this.nudgeX += dx > 0 ? 50 : -50
          this.release(item)
        }
        continue
      }
      if (item.y > this.scale.height + 40) this.release(item)
    }
  }

  emitDistance() {
    emit('level:progress', {
      levelId: this.levelId,
      value: Math.round(this.distance * 100),
      max: 100,
      mode: 'distance',
      stars: this.starScore,
      starMax: this.target,
    })
  }

  onArrive() {
    if (this.arrived) return
    this.arrived = true
    this.pausedLogic = true
    chime()
    this.tweens.add({
      targets: this.plane,
      scale: 0.4,
      y: this.endY,
      duration: 500,
      ease: 'sine.out',
    })
    const burst = this.add.particles(this.scale.width / 2, this.endY, TEX.sparkle, {
      speed: { min: 30, max: 120 },
      scale: { start: 0.7, end: 0 },
      lifespan: 700,
      emitting: false,
    })
    burst.explode(24)
    const days = daysBetween(LAST_MET, nowKarachi())
    this.time.delayedCall(700, () => {
      burst.destroy()
      emit('level:arrival', { levelId: this.levelId, daysApart: days })
    })
  }

  finishAfterArrival() {
    emit('level:complete', { levelId: this.levelId })
  }

  forceComplete() {
    if (this.arrived || this.completing) {
      this.finishAfterArrival()
      return
    }
    this.plane.y = this.endY
    this.distance = 1
    this.onArrive()
  }
}
