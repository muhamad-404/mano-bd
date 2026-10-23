import Phaser from 'phaser'
import { chime, pop } from '../../audio/synth.js'
import { TEX } from '../textures.js'
import BaseLevelScene from './BaseLevelScene.js'

export default class CatchHearts extends BaseLevelScene {
  constructor() {
    super('CatchHearts')
    this.spawnAcc = 0
    this.nextSpawn = 1000
    this.missStreak = 0
    this.hint = null
    this.comboGlow = null
  }

  create() {
    super.create()
    const [lo, hi] = this.levelConfig.spawnMs || [900, 1400]
    this.nextSpawn = Phaser.Math.Between(lo, hi)
    this.spawnAcc = 0
    this.missStreak = 0
    this.combo = 0
    this.showHint()
  }

  createDecor() {
    if (this.levelConfig.palette !== 'evening') return
    this.drawSkyline()
  }

  drawSkyline() {
    const g = this.add.graphics().setDepth(-15).setAlpha(0.55)
    const ground = this.scale.height - 8
    const buildings = [
      { x: 10, w: 42, h: 70 },
      { x: 48, w: 36, h: 110 },
      { x: 90, w: 50, h: 85 },
      { x: 148, w: 44, h: 130 },
      { x: 200, w: 38, h: 95 },
      { x: 248, w: 55, h: 120 },
      { x: 310, w: 40, h: 78 },
      { x: 350, w: 36, h: 100 },
    ]
    g.fillStyle(0x2a2150, 0.85)
    for (const b of buildings) {
      const top = ground - b.h
      g.fillRect(b.x, top, b.w, b.h)
      g.fillStyle(0xffd98a, 0.35)
      for (let wy = top + 10; wy < ground - 12; wy += 14) {
        for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 10) {
          if (Math.random() > 0.45) g.fillRect(wx, wy, 4, 5)
        }
      }
      g.fillStyle(0x2a2150, 0.85)
    }
    // Clock tower
    const tx = 168
    const th = 160
    const ttop = ground - th
    g.fillStyle(0x1b1533, 0.9)
    g.fillRect(tx, ttop, 28, th)
    g.fillRect(tx - 6, ttop - 18, 40, 18)
    g.fillTriangle(tx - 4, ttop - 18, tx + 32, ttop - 18, tx + 14, ttop - 42)
    g.fillStyle(0xffd98a, 0.5)
    g.fillCircle(tx + 14, ttop + 28, 8)
  }

  showHint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const label = this.levelConfig.hint || 'Drag to move'
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, label, {
        fontFamily: 'Quicksand, system-ui, sans-serif',
        fontSize: '20px',
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
      this.spawnItem()
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

  spawnItem() {
    if (this.completing) return
    const [fLo, fHi] = this.levelConfig.fall || [90, 130]
    const chance = this.levelConfig.bonusStarChance || 0
    const isStar = chance > 0 && Math.random() < chance
    const item = this.acquire(isStar ? TEX.star : TEX.heart)
    item.x = Phaser.Math.Between(40, this.scale.width - 40)
    item.y = -30
    item.setData('fall', Phaser.Math.Between(fLo, fHi))
    item.setData('kind', isStar ? 'star' : 'heart')
    item.setData('value', isStar ? 2 : 1)
    item.setScale(isStar ? 0.42 : 0.48)
  }

  onCatch(item) {
    const value = item.getData('value') || 1
    const kind = item.getData('kind')
    if (kind === 'star') chime()
    else pop()

    this.missStreak = 0
    this.combo += 1
    this.updateComboGlow()
    this.sparkleAt(item.x, item.y)
    this.squashBasket()
    this.release(item)
    this.addProgress(value)
  }

  onMiss(item) {
    this.combo = 0
    this.clearComboGlow()
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

  updateComboGlow() {
    if (!this.basket || this.combo < 3) return
    this.basket.setTint(0xffd98a)
    if (this.comboGlow) this.comboGlow.destroy()
    this.comboGlow = this.add
      .image(this.basket.x, this.basket.y, TEX.softCircle)
      .setDepth(4)
      .setAlpha(0.35)
      .setScale(1.1)
      .setTint(0xffd98a)
    this.tweens.add({
      targets: this.comboGlow,
      alpha: 0.15,
      scale: 1.35,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  clearComboGlow() {
    if (this.basket) this.basket.clearTint()
    if (this.comboGlow) {
      this.comboGlow.destroy()
      this.comboGlow = null
    }
  }

  updateBasket(dt) {
    super.updateBasket(dt)
    if (this.comboGlow && this.basket) {
      this.comboGlow.x = this.basket.x
      this.comboGlow.y = this.basket.y
    }
  }
}
