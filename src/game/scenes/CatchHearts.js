import Phaser from 'phaser'
import { pop } from '../../audio/synth.js'
import { TEX } from '../textures.js'
import BaseLevelScene from './BaseLevelScene.js'

export default class CatchHearts extends BaseLevelScene {
  constructor() {
    super('CatchHearts')
    this.spawnAcc = 0
    this.nextSpawn = 1000
    this.missStreak = 0
    this.hint = null
  }

  create() {
    super.create()
    const [lo, hi] = this.levelConfig.spawnMs || [900, 1400]
    this.nextSpawn = Phaser.Math.Between(lo, hi)
    this.spawnAcc = 0
    this.missStreak = 0
    this.showHint()
  }

  showHint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, 'Drag to move', {
        fontFamily: 'Quicksand, system-ui, sans-serif',
        fontSize: '22px',
        color: '#1b1533',
        resolution: dpr,
      })
      .setOrigin(0.5)
      .setAlpha(0.9)
      .setDepth(20)

    this.tweens.add({
      targets: this.hint,
      alpha: 0,
      delay: 2500,
      duration: 400,
      onComplete: () => {
        this.hint?.destroy()
        this.hint = null
      },
    })
  }

  updateFalling(dt) {
    this.spawnAcc += dt * 1000
    if (this.spawnAcc >= this.nextSpawn) {
      this.spawnAcc = 0
      const [lo, hi] = this.levelConfig.spawnMs || [900, 1400]
      this.nextSpawn = Phaser.Math.Between(lo, hi)
      this.spawnHeart()
    }

    const [fLo, fHi] = this.levelConfig.fall || [90, 130]
    const baseFall = (fLo + fHi) / 2

    for (const item of this.pool) {
      if (!item.active) continue
      const speed = (item.getData('fall') || baseFall) * this.fallScale
      item.y += speed * dt

      if (this.hitsBasket(item)) {
        this.onCatch(item)
        continue
      }

      if (item.y > this.scale.height - 24) {
        this.onMiss(item)
      }
    }
  }

  spawnHeart() {
    if (this.completing) return
    const [fLo, fHi] = this.levelConfig.fall || [90, 130]
    const heart = this.acquire(TEX.heart)
    heart.x = Phaser.Math.Between(40, this.scale.width - 40)
    heart.y = -30
    heart.setData('fall', Phaser.Math.Between(fLo, fHi))
    heart.setScale(0.48)
  }

  hitsBasket(item) {
    if (!this.basket) return false
    const bw = this.basket.displayWidth * 0.72
    const bh = this.basket.displayHeight * 0.45
    const bx = this.basket.x - bw / 2
    const by = this.basket.y - bh / 2
    const hw = item.displayWidth * 0.55
    const hh = item.displayHeight * 0.55
    const hx = item.x - hw / 2
    const hy = item.y - hh / 2
    return hx < bx + bw && hx + hw > bx && hy < by + bh && hy + hh > by
  }

  onCatch(item) {
    pop()
    this.missStreak = 0
    this.sparkleAt(item.x, item.y)
    this.squashBasket()
    this.release(item)
    this.addProgress(1)
  }

  onMiss(item) {
    this.missStreak += 1
    if (this.missStreak >= 4) {
      this.fallScale = Math.max(0.6, this.fallScale * 0.85)
      this.missStreak = 0
    }
    this.tweens.add({
      targets: item,
      alpha: 0,
      duration: 280,
      onComplete: () => this.release(item),
    })
  }

  sparkleAt(x, y) {
    const burst = this.add.particles(x, y, TEX.sparkle, {
      speed: { min: 20, max: 90 },
      scale: { start: 0.55, end: 0 },
      lifespan: 380,
      quantity: 6,
      emitting: false,
    })
    burst.explode(8)
    this.time.delayedCall(420, () => burst.destroy())
  }

  squashBasket() {
    if (!this.basket) return
    this.tweens.add({
      targets: this.basket,
      scaleY: 0.45,
      scaleX: 0.62,
      duration: 80,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }
}
