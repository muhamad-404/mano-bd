export const TEX = {
  heart: 'mano-heart',
  star: 'mano-star',
  sparkle: 'mano-sparkle',
  basket: 'mano-basket',
  softCircle: 'mano-soft-circle',
  cloud: 'mano-cloud',
  plane: 'mano-plane',
  bgDawn: 'mano-bg-dawn',
  bgEvening: 'mano-bg-evening',
  bgStorm: 'mano-bg-storm',
  bgNight: 'mano-bg-night',
  rain: 'mano-rain',
  starsFar: 'mano-stars-far',
  starsNear: 'mano-stars-near',
}

function drawHeart(g, cx, cy, s) {
  // Phaser 4 Graphics has no bezierCurveTo — two lobes + triangle tip.
  g.fillStyle(0xff7ea8, 1)
  g.fillCircle(cx - s * 0.28, cy - s * 0.18, s * 0.34)
  g.fillCircle(cx + s * 0.28, cy - s * 0.18, s * 0.34)
  g.fillTriangle(
    cx - s * 0.58,
    cy - s * 0.02,
    cx + s * 0.58,
    cy - s * 0.02,
    cx,
    cy + s * 0.48,
  )
  g.fillStyle(0xffc9d9, 0.55)
  g.fillCircle(cx - s * 0.34, cy - s * 0.28, s * 0.12)
}

function drawStar(g, cx, cy, r, color, alpha = 1) {
  g.fillStyle(color, alpha)
  g.beginPath()
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const b = a + Math.PI / 5
    const x1 = cx + Math.cos(a) * r
    const y1 = cy + Math.sin(a) * r
    const x2 = cx + Math.cos(b) * (r * 0.42)
    const y2 = cy + Math.sin(b) * (r * 0.42)
    if (i === 0) g.moveTo(x1, y1)
    else g.lineTo(x1, y1)
    g.lineTo(x2, y2)
  }
  g.closePath()
  g.fillPath()
}

function drawSparkle(g, cx, cy, r) {
  g.fillStyle(0xfff6ee, 0.95)
  g.beginPath()
  g.moveTo(cx, cy - r)
  g.lineTo(cx + r * 0.22, cy)
  g.lineTo(cx, cy + r)
  g.lineTo(cx - r * 0.22, cy)
  g.closePath()
  g.fillPath()
  g.beginPath()
  g.moveTo(cx - r, cy)
  g.lineTo(cx, cy + r * 0.22)
  g.lineTo(cx + r, cy)
  g.lineTo(cx, cy - r * 0.22)
  g.closePath()
  g.fillPath()
}

function drawBasket(g, w, h) {
  const x = w / 2
  const y = h / 2
  g.fillStyle(0xcdb8ff, 1)
  g.fillRoundedRect(x - w * 0.38, y - h * 0.08, w * 0.76, h * 0.42, 14)
  g.fillStyle(0xff7ea8, 1)
  g.fillRoundedRect(x - w * 0.4, y - h * 0.18, w * 0.8, h * 0.16, 10)
  g.lineStyle(3, 0xe0457b, 0.85)
  g.strokeRoundedRect(x - w * 0.4, y - h * 0.18, w * 0.8, h * 0.16, 10)
}

function drawSoftCircle(g, size) {
  const c = size / 2
  g.fillStyle(0xffffff, 0.35)
  g.fillCircle(c, c, size * 0.42)
  g.fillStyle(0xffffff, 0.18)
  g.fillCircle(c, c, size * 0.48)
}

function drawCloud(g, w, h) {
  g.fillStyle(0xffffff, 0.85)
  g.fillCircle(w * 0.32, h * 0.55, h * 0.28)
  g.fillCircle(w * 0.5, h * 0.42, h * 0.34)
  g.fillCircle(w * 0.68, h * 0.55, h * 0.26)
  g.fillRoundedRect(w * 0.22, h * 0.5, w * 0.56, h * 0.32, 12)
}

function drawPlane(g, w, h) {
  g.fillStyle(0xbfe3ff, 1)
  g.beginPath()
  g.moveTo(w * 0.12, h * 0.55)
  g.lineTo(w * 0.78, h * 0.28)
  g.lineTo(w * 0.62, h * 0.55)
  g.lineTo(w * 0.78, h * 0.78)
  g.closePath()
  g.fillPath()
  g.fillStyle(0xff7ea8, 1)
  g.fillTriangle(w * 0.78, h * 0.28, w * 0.92, h * 0.4, w * 0.72, h * 0.42)
}

function bake(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return
  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  draw(g)
  g.generateTexture(key, width, height)
  g.destroy()
}

function bakeGradient(scene, key, colors) {
  if (scene.textures.exists(key)) return
  const w = 8
  const h = 256
  const canvas = scene.textures.createCanvas(key, w, h)
  const ctx = canvas.getContext()
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  colors.forEach(([stop, color]) => grad.addColorStop(stop, color))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  canvas.refresh()
}

/**
 * Generate all procedural textures at 2x for crisp DPR phones.
 * @param {Phaser.Scene} scene
 */
export function generateTextures(scene) {
  bake(scene, TEX.heart, 96, 96, (g) => drawHeart(g, 48, 50, 40))
  bake(scene, TEX.star, 80, 80, (g) => {
    drawStar(g, 40, 40, 32, 0xffd98a)
    drawStar(g, 40, 40, 16, 0xfff6ee, 0.55)
  })
  bake(scene, TEX.sparkle, 48, 48, (g) => drawSparkle(g, 24, 24, 18))
  bake(scene, TEX.basket, 160, 100, (g) => drawBasket(g, 160, 100))
  bake(scene, TEX.softCircle, 96, 96, (g) => drawSoftCircle(g, 96))
  bake(scene, TEX.cloud, 160, 90, (g) => drawCloud(g, 160, 90))
  bake(scene, TEX.plane, 120, 70, (g) => drawPlane(g, 120, 70))

  bakeGradient(scene, TEX.bgDawn, [
    [0, '#ffc9d9'],
    [0.45, '#ffe0c8'],
    [1, '#e8d9ff'],
  ])
  bakeGradient(scene, TEX.bgEvening, [
    [0, '#ff9a6b'],
    [0.35, '#ff7ea8'],
    [0.7, '#cdb8ff'],
    [1, '#4a3a78'],
  ])
  bakeGradient(scene, TEX.bgStorm, [
    [0, '#9bb0d0'],
    [0.5, '#6a7a9a'],
    [1, '#2a3148'],
  ])
  bakeGradient(scene, TEX.bgNight, [
    [0, '#2a2150'],
    [0.55, '#1b1533'],
    [1, '#0d0a1a'],
  ])

  bake(scene, TEX.rain, 4, 16, (g) => {
    g.fillStyle(0xbfe3ff, 0.55)
    g.fillRect(1, 0, 2, 14)
  })

  bakeStarfield(scene, TEX.starsFar, 256, 256, 40, 0.35)
  bakeStarfield(scene, TEX.starsNear, 256, 256, 28, 0.7)
}

function bakeStarfield(scene, key, w, h, count, alpha) {
  if (scene.textures.exists(key)) return
  const canvas = scene.textures.createCanvas(key, w, h)
  const ctx = canvas.getContext()
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 0.6 + Math.random() * 1.4
    ctx.fillStyle = `rgba(255, 246, 238, ${alpha * (0.4 + Math.random() * 0.6)})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  canvas.refresh()
}

export default generateTextures
