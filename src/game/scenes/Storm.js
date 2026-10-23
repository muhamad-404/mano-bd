import Phaser from 'phaser'
import { chime, softHit } from '../../audio/synth.js'
import { emit } from '../bridge.js'
import { isLowEnd, prefersReducedMotion, vibrate } from '../../utils/device.js'
import { TEX } from '../textures.js'
import BaseLevelScene from './BaseLevelScene.js'

const RAINBOW = [0xff6b6b, 0xff9f43, 0xffd98a, 0x7bed9f, 0xbfe3ff, 0x70a1ff, 0xcdb8ff]

export default class Storm extends BaseLevelScene {
  constructor() {
    super('Storm')
    this.spawnAcc = 0
    this.nextSpawn = 1000
    this.clouds = []
    this.rain = []
    this.slowUntil = 0
    this.flash = null
    this.dawnOverlay = null
  }

  create() {
    super.create()
    const [lo, hi] = this.levelConfig.spawnMs || [900, 1400]
    this.nextSpawn = Phaser.Math.Between(lo, hi)
    this.spawnAcc = 0
    this.slowUntil = 0
    this.createRain()
    this.createClouds()
    this.createDawnOverlay()
    this.showHint()
  }

  createDawnOverlay() {
    this.dawnOverlay = this.add
      .image(0, 0, TEX.bgDawn)
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-19)
      .setAlpha(0)
  }

  createRain() {
    if (prefersReducedMotion()) return
    const count = isLowEnd() ? 18 : 36
    for (let i = 0; i < count; i += 1) {
      const drop = this.add
        .image(
          Phaser.Math.Between(0, this.scale.width),
          Phaser.Math.Between(0, this.scale.height),
          TEX.rain,
        )
        .setDepth(-5)
        .setAlpha(0.45)
        .setScale(1, 1.2)
        .setRotation(0.25)
      drop.setData('vy', 180 + Math.random() * 120)
      drop.setData('vx', 40 + Math.random() * 30)
      this.rain.push(drop)
    }
  }

  createClouds() {
    const rows = [120, 220, 320, 420]
    for (let i = 0; i < rows.length; i += 1) {
      const cloud = this.add
        .image(-40 - i * 80, rows[i], TEX.cloud)
        .setDepth(1)
        .setTint(0x4a5568)
        .setAlpha(0.78)
        .setScale(0.85 + Math.random() * 0.35)
      cloud.setData('vx', 28 + i * 8)
      cloud.setData('baseScale', cloud.scaleX)
      this.clouds.push(cloud)
    }
  }

  showHint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height * 0.4, this.levelConfig.hint || 'Catch the stars', {
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

  updateFalling(dt) {
    this.updateRain(dt)
    this.updateClouds(dt)
    this.updateSlow()

    this.spawnAcc += dt * 1000
    if (this.spawnAcc >= this.nextSpawn) {
      this.spawnAcc = 0
      const [lo, hi] = this.levelConfig.spawnMs || [900, 1400]
      this.nextSpawn = Phaser.Math.Between(lo, hi)
      this.spawnStar()
    }

    const [fLo, fHi] = this.levelConfig.fall || [70, 110]
    const baseFall = (fLo + fHi) / 2

    for (const item of this.pool) {
      if (!item.active) continue
      item.y += (item.getData('fall') || baseFall) * this.fallScale * dt
      item.rotation += dt * 0.4
      const pulse = 0.42 + Math.sin(this.time.now / 280 + item.x) * 0.04
      item.setScale(pulse)

      if (this.hitsBasket(item)) {
        this.onCatchStar(item)
        continue
      }
      if (item.y > this.scale.height - 20) {
        this.tweens.add({
          targets: item,
          alpha: 0,
          duration: 240,
          onComplete: () => this.release(item),
        })
      }
    }
  }

  updateRain(dt) {
    const rainFactor = 1 - this.progress / Math.max(1, this.target)
    for (const drop of this.rain) {
      drop.setAlpha(0.15 + 0.35 * rainFactor)
      if (rainFactor < 0.05) {
        drop.setVisible(false)
        continue
      }
      drop.setVisible(true)
      drop.x += drop.getData('vx') * dt * rainFactor
      drop.y += drop.getData('vy') * dt * rainFactor
      if (drop.y > this.scale.height + 10) {
        drop.y = -10
        drop.x = Phaser.Math.Between(-20, this.scale.width)
      }
      if (drop.x > this.scale.width + 20) drop.x = -10
    }
  }

  updateClouds(dt) {
    const fade = this.progress / Math.max(1, this.target)
    for (const cloud of this.clouds) {
      cloud.x += cloud.getData('vx') * dt
      const base = cloud.getData('baseScale') || 1
      cloud.setScale(base * (1 - fade * 0.55))
      cloud.setAlpha(0.78 * (1 - fade * 0.85))
      if (cloud.x > this.scale.width + 80) {
        cloud.x = -80
        cloud.y = Phaser.Math.Between(100, 420)
      }
      if (this.basket && this.circleHits(cloud, this.basket, 40) && this.time.now > this.slowUntil) {
        this.onCloudHit()
      }
    }
  }

  updateSlow() {
    this.moveSpeed = this.time.now < this.slowUntil ? 0.5 : 1
  }

  circleHits(a, b, pad) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const r = (a.displayWidth + b.displayWidth) * 0.28 + pad
    return dx * dx + dy * dy < r * r
  }

  onCloudHit() {
    this.slowUntil = this.time.now + 1200
    this.moveSpeed = 0.5
    softHit()
    if (!this.flash) {
      this.flash = this.add
        .rectangle(
          this.scale.width / 2,
          this.scale.height / 2,
          this.scale.width,
          this.scale.height,
          0x8899aa,
          0.28,
        )
        .setDepth(30)
    }
    this.flash.setAlpha(0.28)
    this.tweens.add({ targets: this.flash, alpha: 0, duration: 400 })
  }

  spawnStar() {
    if (this.completing) return
    const [fLo, fHi] = this.levelConfig.fall || [70, 110]
    const star = this.acquire(TEX.star)
    star.x = Phaser.Math.Between(40, this.scale.width - 40)
    star.y = -30
    star.setData('fall', Phaser.Math.Between(fLo, fHi))
    star.setTint(0xfff0c8)
    star.setScale(0.48)
  }

  onCatchStar(item) {
    chime()
    vibrate(15)
    this.sparkleAt(item.x, item.y)
    this.squashBasket()
    this.release(item)
    this.addProgress(1)
    this.lightenSky()
  }

  lightenSky() {
    const t = this.progress / Math.max(1, this.target)
    if (this.dawnOverlay) {
      this.tweens.add({ targets: this.dawnOverlay, alpha: t * 0.92, duration: 350, ease: 'sine.out' })
    }
    if (this.bg) {
      this.tweens.add({ targets: this.bg, alpha: 1 - t * 0.35, duration: 350 })
    }
  }

  drawRainbow(onDone) {
    const cx = this.scale.width / 2
    const cy = this.scale.height * 0.72
    const g = this.add.graphics().setDepth(8).setAlpha(0)
    for (let i = 0; i < RAINBOW.length; i += 1) {
      const r = 160 - i * 12
      g.lineStyle(10, RAINBOW[i], 0.85)
      g.beginPath()
      g.arc(cx, cy, r, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false)
      g.strokePath()
    }
    // Warm rays
    const rays = this.add.graphics().setDepth(7).setAlpha(0)
    rays.fillStyle(0xffd98a, 0.18)
    for (let i = -3; i <= 3; i += 1) {
      rays.fillTriangle(cx, cy - 40, cx + i * 36 - 10, 40, cx + i * 36 + 10, 40)
    }

    this.tweens.add({
      targets: [g, rays],
      alpha: 1,
      duration: prefersReducedMotion() ? 200 : 900,
      ease: 'sine.out',
      onComplete: onDone,
    })
  }

  complete() {
    if (this.completing) return
    this.completing = true
    this.pausedLogic = true

    this.drawRainbow(() => {
      chime()
      const burst = this.add.particles(this.scale.width / 2, this.scale.height * 0.35, TEX.sparkle, {
        speed: { min: 40, max: 140 },
        scale: { start: 0.7, end: 0 },
        lifespan: 800,
        emitting: false,
      })
      burst.explode(28)
      this.time.delayedCall(1200, () => {
        burst.destroy()
        emit('level:complete', { levelId: this.levelId })
      })
    })
  }
}
