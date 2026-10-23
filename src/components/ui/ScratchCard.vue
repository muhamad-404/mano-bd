<template>
  <div class="scratch" :style="{ width: `${width}px`, height: `${height}px` }">
    <div class="scratch__note no-select">
      <p class="scratch__text">{{ note.text }}</p>
    </div>
    <canvas
      v-show="!cleared"
      ref="canvasEl"
      class="scratch__canvas"
      :style="{ opacity: coatOpacity }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'
import { sparkle } from '../../audio/synth.js'
import { dprCap, vibrate } from '../../utils/device.js'

const props = defineProps({
  note: { type: Object, required: true },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 200 },
  threshold: { type: Number, default: 0.5 },
})

const emit = defineEmits(['reveal'])

const store = useGameStore()
const canvasEl = ref(null)
const cleared = ref(false)
const coatOpacity = ref(1)

let ctx = null
let drawing = false
let lastX = 0
let lastY = 0
let moveCount = 0
let revealed = false
const brush = 22

function setupCanvas() {
  const canvas = canvasEl.value
  if (!canvas || cleared.value) return
  const dpr = dprCap(2)
  const w = props.width
  const h = props.height
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawCoat()
}

function drawCoat() {
  if (!ctx) return
  const w = props.width
  const h = props.height
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#FF7EA8')
  grad.addColorStop(1, '#CDB8FF')
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 47) % w
    const y = (i * 73) % h
    drawStar(x, y, 3 + (i % 3))
  }

  ctx.fillStyle = 'rgba(27,21,51,0.55)'
  ctx.font = '600 16px Quicksand, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Scratch here', w / 2, h / 2)
}

function drawStar(cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 4; i += 1) {
    const a = (Math.PI / 2) * i
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    ctx.lineTo(cx + Math.cos(a + Math.PI / 4) * (r * 0.4), cy + Math.sin(a + Math.PI / 4) * (r * 0.4))
  }
  ctx.closePath()
  ctx.fill()
}

function localPos(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * props.width,
    y: ((e.clientY - rect.top) / rect.height) * props.height,
  }
}

function scratchLine(x0, y0, x1, y1) {
  if (!ctx) return
  ctx.globalCompositeOperation = 'destination-out'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = brush
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

function sampleCleared() {
  if (!ctx || !canvasEl.value) return 0
  const dpr = dprCap(2)
  const step = Math.max(8, Math.round(8 * dpr))
  const { width, height } = canvasEl.value
  const data = ctx.getImageData(0, 0, width, height).data
  let total = 0
  let clear = 0
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      total += 1
      const i = (y * width + x) * 4 + 3
      if (data[i] < 40) clear += 1
    }
  }
  return total ? clear / total : 0
}

function finishReveal() {
  if (revealed) return
  revealed = true
  drawing = false
  sparkle()
  vibrate(20)

  const done = () => {
    cleared.value = true
    emit('reveal', props.note.id)
  }

  if (store.reducedMotion) {
    coatOpacity.value = 0
    done()
    return
  }

  const fade = { o: coatOpacity.value }
  gsap.to(fade, {
    o: 0,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: () => {
      coatOpacity.value = fade.o
    },
    onComplete: done,
  })
}

function maybeReveal() {
  if (revealed) return
  if (sampleCleared() >= props.threshold) finishReveal()
}

function onDown(e) {
  if (revealed || cleared.value) return
  drawing = true
  canvasEl.value.setPointerCapture(e.pointerId)
  const p = localPos(e)
  lastX = p.x
  lastY = p.y
  scratchLine(p.x, p.y, p.x + 0.01, p.y + 0.01)
  moveCount = 0
}

function onMove(e) {
  if (!drawing || revealed) return
  const p = localPos(e)
  scratchLine(lastX, lastY, p.x, p.y)
  lastX = p.x
  lastY = p.y
  moveCount += 1
  if (moveCount % 8 === 0) maybeReveal()
}

function onUp() {
  if (!drawing) return
  drawing = false
  maybeReveal()
}

function onResize() {
  if (!revealed && !cleared.value) setupCanvas()
}

onMounted(async () => {
  await nextTick()
  setupCanvas()
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize, { passive: true })
})

watch(
  () => [props.width, props.height, props.note?.id],
  async () => {
    if (revealed) return
    cleared.value = false
    coatOpacity.value = 1
    revealed = false
    await nextTick()
    setupCanvas()
  },
)

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
})
</script>

<style scoped>
.scratch {
  position: relative;
  margin: 0 auto;
  border-radius: var(--radius-md);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 10px 28px rgba(27, 21, 51, 0.16);
}

.scratch__note {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: #fff6ee;
  z-index: 0;
}

.scratch__text {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  color: var(--color-night);
}

.scratch__canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  touch-action: none;
  cursor: pointer;
}
</style>
