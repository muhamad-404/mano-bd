import Phaser from 'phaser'
import { chime, pop, softHit } from '../../audio/synth.js'
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
    this.nudgeX = 0
    this.distance = 0
    this.starScore = 0
    this.arrived = false
    this.startY = 0
    this.endY = 0
    this.flightSec = 72
    this.spawnAcc = 0
    this.gustAcc = 0
    this.lastEmittedPct = -1
    this.riseMul = 1
    this.trail = null
    this.destGlow = null
    this.wind = []
  }

  create() {
    try {
      generateTextures(this)
      this.createBackground()
      this.flightSec = this.levelConfig.durationSec || 72
      this.startY = this.scale.height - 130
      this.endY = 96
      this.distance = 0
      this.starScore = 0
      this.arrived = false
      this.nudgeX = 0
      this.spawnAcc = 0
      this.gustAcc = 0
      this.riseMul = 1
      this.lastEmittedPct = -1
      this.pointerX = this.scale.width / 2
      this.target = this.levelConfig.target || 8
      this.progress = 0
      this.wind = []

      this.createStarfields()
      this.createMarkers()
      this.createBasket()
      this.createTrail()
      this.bindInput()
      this.emitDistance(true)
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
      .image(this.scale.width / 2, this.startY, TEX.planeUp)
      .setDepth(8)
      .setScale(0.48)
    this.basket = this.plane
    this.basketLabel = null

    if (!prefersReducedMotion()) {
      this.tweens.add({
        targets: this.plane,
        scaleX: 0.5,
        scaleY: 0.46,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }
  }

  createTrail() {
    if (prefersReducedMotion()) return
    this.trail = this.add.particles(0, 0, TEX.sparkle, {
      follow: this.plane,
      followOffset: { x: 0, y: 28 },
      speed: { min: 8, max: 28 },
      angle: { min: 70, max: 110 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.55, end: 0 },
      lifespan: 480,
      frequency: 70,
      blendMode: 'ADD',
      tint: [0xffd98a, 0xffc9d9, 0xbfe3ff],
    })
    this.trail.setDepth(7)
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
      .setAlpha(0.9)

    if (!prefersReducedMotion()) {
      for (let i = 0; i < 5; i += 1) {
        const streak = this.add
          .rectangle(
            Phaser.Math.Between(24, this.scale.width - 24),
            Phaser.Math.Between(0, this.scale.height),
            1.5,
            14 + Math.random() * 20,
            0xffffff,
            0.18,
          )
          .setDepth(-9)
        streak.setData('vy', 90 + Math.random() * 70)
        this.wind.push(streak)
      }
    }
  }

  createMarkers() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const hx = this.scale.width / 2
    const hy = this.scale.height - 52

    // Warm ground wash behind the house
    this.add
      .image(hx, hy + 8, TEX.softCircle)
      .setDepth(1)
      .setTint(0xffd98a)
      .setAlpha(0.28)
      .setScale(1.8)

    this.add
      .image(hx, hy - 8, TEX.house)
      .setDepth(3)
      .setScale(0.72)

    this.add
      .text(hx, hy + 36, 'From Ahsan', {
        fontFamily: 'Dancing Script, Quicksand, cursive',
        fontSize: '17px',
        color: '#ffd98a',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(4)

    this.destGlow = this.add
      .image(this.scale.width / 2, this.endY, TEX.softCircle)
      .setDepth(2)
      .setTint(0xffd98a)
      .setAlpha(0.42)
      .setScale(1.55)

    if (!prefersReducedMotion() && this.destGlow) {
      this.tweens.add({
        targets: this.destGlow,
        alpha: 0.28,
        scale: 1.85,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }

    this.add
      .image(this.scale.width / 2, this.endY - 2, TEX.heart)
      .setDepth(3)
      .setScale(0.28)
      .setAlpha(0.9)

    this.add
      .text(this.scale.width / 2, this.endY - 40, 'To Mano', {
        fontFamily: 'Dancing Script, Quicksand, cursive',
        fontSize: '20px',
        color: '#fff6ee',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(4)
  }

  showHint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, this.levelConfig.hint || 'Drag to steer', {
        fontFamily: 'Quicksand, system-ui, sans-serif',
        fontSize: '17px',
        color: '#fff6ee',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0)

    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 280,
      yoyo: true,
      hold: 1800,
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
    this.maybeGust(dt)
  }

  updateFlight(dt) {
    const baseRise = (this.startY - this.endY) / this.flightSec
    // Mid-flight gets slightly faster so late game feels exciting
    const pace = 0.85 + this.distance * 0.35
    this.plane.y = Math.max(this.endY, this.plane.y - baseRise * this.riseMul * pace * dt)
    this.riseMul = Phaser.Math.Linear(this.riseMul, 1, Math.min(1, dt * 1.8))

    const lerp = 1 - Math.pow(0.001, dt)
    const targetX = Phaser.Math.Clamp(this.pointerX + this.nudgeX, 36, this.scale.width - 36)
    const prevX = this.plane.x
    this.plane.x += (targetX - this.plane.x) * Math.min(1, lerp * 11)
    this.nudgeX *= 1 - Math.min(1, dt * 2.2)

    // Bank into turns while nose stays mostly upward
    const vx = this.plane.x - prevX
    const bank = Phaser.Math.Clamp(vx * 9, -26, 26)
    this.plane.angle = Phaser.Math.Linear(this.plane.angle, bank, Math.min(1, dt * 10))

    const span = this.startY - this.endY
    this.distance = Phaser.Math.Clamp((this.startY - this.plane.y) / span, 0, 1)
    this.emitDistance()

    if (this.starsFar) this.starsFar.tilePositionY -= 14 * dt * (0.8 + this.distance)
    if (this.starsNear) this.starsNear.tilePositionY -= 32 * dt * (0.8 + this.distance)

    if (this.distance >= 0.995) this.onArrive()
  }

  updateWind(dt) {
    for (const streak of this.wind) {
      streak.y += streak.getData('vy') * dt * (1 + this.distance)
      if (streak.y > this.scale.height + 24) {
        streak.y = -24
        streak.x = Phaser.Math.Between(24, this.scale.width - 24)
      }
    }
  }

  maybeGust(dt) {
    const every = this.levelConfig.gustEverySec || 4.5
    this.gustAcc += dt
    if (this.gustAcc < every) return
    this.gustAcc = 0
    const strength = 70 + this.distance * 90
    this.nudgeX += Math.random() < 0.5 ? -strength : strength
  }

  maybeSpawn(dt) {
    this.spawnAcc += dt
    const interval = Phaser.Math.Linear(0.95, 0.55, this.distance)
    if (this.spawnAcc < interval) return
    this.spawnAcc = 0
    const starChance = this.levelConfig.starChance || 0.42
    const cloudChance = this.levelConfig.cloudChance || 0.48
    if (Math.random() < starChance) this.spawnFloater(TEX.star, 'star')
    if (Math.random() < cloudChance) this.spawnFloater(TEX.cloud, 'cloud')
    // Occasional dense cloud pack in the upper half
    if (this.distance > 0.35 && Math.random() < 0.18) {
      this.spawnFloater(TEX.cloud, 'cloud')
      this.spawnFloater(TEX.cloud, 'cloud')
    }
  }

  spawnFloater(tex, kind) {
    const item = this.acquire(tex)
    item.x = Phaser.Math.Between(48, this.scale.width - 48)
    item.y = this.plane.y - Phaser.Math.Between(120, 300)
    item.setData('kind', kind)
    item.setData('vy', 28 + Math.random() * 40 + this.distance * 20)
    item.setData('vx', (Math.random() - 0.5) * 30)
    if (kind === 'cloud') {
      item.setTint(0xdde6f0)
      item.setAlpha(0.78)
      item.setScale(0.5 + Math.random() * 0.2)
    } else {
      item.clearTint()
      item.setAlpha(1)
      item.setScale(0.38)
      if (!prefersReducedMotion()) {
        this.tweens.add({
          targets: item,
          angle: 360,
          duration: 4200,
          repeat: -1,
        })
      }
    }
  }

  updateFloaters(dt) {
    for (const item of this.pool) {
      if (!item.active) continue
      item.y += (item.getData('vy') || 28) * dt
      item.x += (item.getData('vx') || 0) * dt
      const kind = item.getData('kind')
      const dx = item.x - this.plane.x
      const dy = item.y - this.plane.y
      const hitR = kind === 'cloud' ? 46 : 40
      const hit = dx * dx + dy * dy < hitR * hitR
      if (hit) {
        if (kind === 'star') {
          pop()
          this.starScore += 1
          this.sparkleAt(item.x, item.y)
          this.progress = Math.min(this.target, this.starScore)
          this.plane.y = Math.max(this.endY, this.plane.y - 18)
          this.riseMul = Math.min(1.55, this.riseMul + 0.2)
          this.emitDistance(true)
          this.release(item)
        } else {
          softHit()
          this.nudgeX += dx > 0 ? 85 : -85
          this.riseMul = 0.35
          if (!prefersReducedMotion()) {
            this.cameras.main.shake(90, 0.004)
          }
          this.release(item)
        }
        continue
      }
      if (item.y > this.scale.height + 48 || item.x < -40 || item.x > this.scale.width + 40) {
        this.release(item)
      }
    }
  }

  emitDistance(force = false) {
    const pct = Math.round(this.distance * 100)
    if (!force && pct === this.lastEmittedPct) return
    this.lastEmittedPct = pct
    emit('level:progress', {
      levelId: this.levelId,
      value: pct,
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
    if (this.trail) {
      this.trail.stop()
    }
    chime()
    this.tweens.add({
      targets: this.plane,
      scale: 0.36,
      angle: 0,
      y: this.endY,
      x: this.scale.width / 2,
      duration: 520,
      ease: 'sine.out',
    })
    const burst = this.add.particles(this.scale.width / 2, this.endY, TEX.sparkle, {
      speed: { min: 40, max: 140 },
      scale: { start: 0.75, end: 0 },
      lifespan: 750,
      emitting: false,
      tint: [0xffd98a, 0xff7ea8, 0xffffff],
    })
    burst.explode(28)
    const days = daysBetween(LAST_MET, nowKarachi())
    this.time.delayedCall(750, () => {
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
