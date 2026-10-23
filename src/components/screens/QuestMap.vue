<template>
  <section ref="root" class="quest screen has-topbar">
    <header class="quest__header">
      <h1 class="quest__title">Our Quest</h1>
      <p class="quest__progress" aria-label="Notes progress">
        <span class="fa-grad-rose" aria-hidden="true"><FaIcon :icon="['fas', 'heart']" /></span>
        <span>{{ progressText }}</span>
      </p>
    </header>

    <div ref="scroller" class="quest__scroller">
      <div ref="trackEl" class="quest__track" :style="{ height: `${trackH}px` }">
        <svg class="quest__svg" :viewBox="`0 0 ${svgW} ${trackH}`" aria-hidden="true">
          <defs>
            <linearGradient id="quest-rose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff7ea8" />
              <stop offset="100%" stop-color="#e0457b" />
            </linearGradient>
          </defs>
          <path
            :d="pathD"
            fill="none"
            stroke="rgba(27,21,51,0.22)"
            stroke-width="4"
            stroke-dasharray="8 10"
            stroke-linecap="round"
          />
          <path
            v-if="donePathD"
            :d="donePathD"
            fill="none"
            stroke="url(#quest-rose)"
            stroke-width="5"
            stroke-linecap="round"
          />
        </svg>

        <button
          v-for="node in nodes"
          :key="node.id"
          type="button"
          class="quest__node"
          :class="[`is-${node.state}`, { 'anim-pulse-glow': node.state === 'available' }]"
          :style="nodeStyle(node)"
          :aria-label="node.aria"
          @click="onNode(node)"
        >
          <span class="quest__node-glow" aria-hidden="true" />
          <span class="quest__node-icon" :class="`fa-grad-${node.grad}`" aria-hidden="true">
            <FaIcon :icon="['fas', node.icon]" />
          </span>
        </button>

        <div
          v-for="node in nodes"
          :key="`card-${node.id}`"
          class="quest__card-wrap"
          :class="node.side"
          :style="cardStyle(node)"
        >
          <GlassCard class="quest__card" padding="12px">
            <span class="quest__chip">{{ node.dateLabel }}</span>
            <h2 class="quest__card-title">{{ node.title }}</h2>
            <p class="quest__card-sub">{{ node.subtitle }}</p>
            <p v-if="node.toast" class="quest__toast">{{ node.toast }}</p>
          </GlassCard>
        </div>

        <button
          v-if="allDone"
          type="button"
          class="quest__finale anim-pulse-glow"
          :style="finaleStyle"
          aria-label="The Birthday"
          @click="goTo('finale')"
        >
          <span class="fa-grad-rose" aria-hidden="true"><FaIcon :icon="['fas', 'cake-candles']" /></span>
          <span>The Birthday</span>
        </button>
      </div>
    </div>

    <footer class="quest__links">
      <button type="button" class="quest__link" @click="goTo('keepsakes')">
        <FaIcon :icon="['fas', 'gift']" />
        Keepsakes
      </button>
      <button type="button" class="quest__link" @click="goTo('envelopes')">
        <FaIcon :icon="['fas', 'envelope']" />
        Envelopes
      </button>
    </footer>

    <p v-if="shakeMsg" class="quest__banner" role="status">{{ shakeMsg }}</p>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import GlassCard from '../ui/GlassCard.vue'
import { levels } from '../../game/levels.js'
import { goTo, progressText, setCurrentLevel, useGameStore } from '../../store/game.js'

const store = useGameStore()
const root = ref(null)
const scroller = ref(null)
const trackEl = ref(null)
const svgW = 360
const trackH = 980
const trackWidth = ref(360)
const points = ref([])
const shakeMsg = ref('')
let shakeTimer = 0

const pathD =
  'M 180 40 C 80 120, 280 200, 180 280 S 60 400, 180 480 S 300 600, 180 680 S 80 800, 180 900'

const lengths = [0.12, 0.38, 0.62, 0.86]

function measurePoints() {
  if (typeof document === 'undefined') return []
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', `0 0 ${svgW} ${trackH}`)
  svg.setAttribute('width', String(svgW))
  svg.setAttribute('height', String(trackH))
  svg.style.cssText = 'position:absolute;left:-9999px;top:0;opacity:0;pointer-events:none'
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', pathD)
  svg.appendChild(path)
  document.body.appendChild(svg)
  const total = path.getTotalLength() || 1
  const pts = lengths.map((t) => {
    const p = path.getPointAtLength(total * t)
    return { x: p.x, y: p.y, t }
  })
  document.body.removeChild(svg)
  return pts
}

function syncTrackWidth() {
  const w = trackEl.value?.clientWidth || scroller.value?.clientWidth || 360
  trackWidth.value = Math.max(280, w)
}

function scaleX(x) {
  return (x / svgW) * trackWidth.value
}

function nodeState(level) {
  const done = store.levelsCompleted.includes(level.id)
  if (done) return 'done'
  if (!level.ready) return 'soon'
  const prevDone = level.id === 1 || store.levelsCompleted.includes(level.id - 1)
  if (!prevDone) return 'locked'
  return 'available'
}

const nodes = computed(() =>
  levels.map((level, i) => {
    const pt = points.value[i] || { x: 180, y: 120 + i * 200 }
    const state = nodeState(level)
    const side = pt.x < svgW / 2 ? 'right' : 'left'
    const icon =
      state === 'done' ? 'circle-check' : state === 'locked' || state === 'soon' ? 'lock' : level.icon
    const toast = state === 'soon' ? 'Coming soon' : ''
    return {
      ...level,
      x: pt.x,
      y: pt.y,
      side,
      state,
      icon,
      grad: state === 'done' ? 'rose' : state === 'available' ? 'gold' : 'lavender',
      toast,
      aria: `${level.title}: ${state === 'available' ? 'available' : state === 'done' ? 'completed' : state === 'soon' ? 'coming soon' : 'locked'}`,
    }
  }),
)

function nodeStyle(node) {
  return {
    left: `${scaleX(node.x)}px`,
    top: `${node.y}px`,
  }
}

function cardStyle(node) {
  const nx = scaleX(node.x)
  const cardW = 150
  const left = node.side === 'right' ? nx + 34 : nx - cardW - 34
  return {
    left: `${Math.max(0, Math.min(left, trackWidth.value - cardW))}px`,
    top: `${node.y - 28}px`,
    width: `${cardW}px`,
  }
}

const finaleStyle = computed(() => ({
  left: `${scaleX(180)}px`,
  top: `${trackH - 70}px`,
}))

const donePathD = computed(() => {
  const doneCount = store.levelsCompleted.filter((id) => id >= 1 && id <= 4).length
  if (doneCount <= 0 || typeof document === 'undefined') return ''
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(svgW))
  svg.setAttribute('height', String(trackH))
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', pathD)
  svg.appendChild(path)
  document.body.appendChild(svg)
  const total = path.getTotalLength() || 1
  const endT = lengths[Math.min(doneCount, lengths.length) - 1]
  const end = total * endT
  const step = 8
  let d = ''
  for (let len = 0; len <= end; len += step) {
    const p = path.getPointAtLength(Math.min(len, end))
    d += len === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`
  }
  document.body.removeChild(svg)
  return d
})

const allDone = computed(() => levels.every((l) => store.levelsCompleted.includes(l.id)))

function currentFocusId() {
  const available = nodes.value.find((n) => n.state === 'available')
  if (available) return available.id
  const lastDone = [...store.levelsCompleted].sort((a, b) => b - a)[0]
  return lastDone || 1
}

function scrollToCurrent() {
  const el = scroller.value
  if (!el) return
  const id = currentFocusId()
  const node = nodes.value.find((n) => n.id === id)
  if (!node) return
  const top = Math.max(0, node.y - el.clientHeight * 0.35)
  if (store.reducedMotion) {
    el.scrollTop = top
    return
  }
  gsap.to(el, { scrollTop: top, duration: 0.55, ease: 'power2.out' })
}

function onNode(node) {
  if (node.state === 'soon') {
    shakeMsg.value = 'Coming soon'
    clearTimeout(shakeTimer)
    shakeTimer = window.setTimeout(() => {
      shakeMsg.value = ''
    }, 1800)
    return
  }
  if (node.state === 'locked') {
    shakeMsg.value = 'Finish the previous chapter first'
    clearTimeout(shakeTimer)
    shakeTimer = window.setTimeout(() => {
      shakeMsg.value = ''
    }, 1800)
    const btn = root.value?.querySelector(`.quest__node.is-locked`)
    if (btn && !store.reducedMotion) {
      gsap.fromTo(btn, { x: 0 }, { x: 6, duration: 0.08, yoyo: true, repeat: 5, clearProps: 'x' })
    }
    return
  }
  if (node.state === 'done' || node.state === 'available') {
    if (!node.ready) return
    setCurrentLevel(node.id)
    goTo('level')
  }
}

function onResize() {
  syncTrackWidth()
}

onMounted(async () => {
  points.value = measurePoints()
  await nextTick()
  syncTrackWidth()
  window.addEventListener('resize', onResize, { passive: true })
  await nextTick()
  scrollToCurrent()
})

watch(
  () => store.levelsCompleted.slice(),
  () => nextTick(scrollToCurrent),
)

onUnmounted(() => {
  clearTimeout(shakeTimer)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.quest {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 100dvh;
  padding: calc(var(--space-7) + var(--safe-top) + 44px) var(--space-4) calc(var(--space-4) + var(--safe-bottom));
  box-sizing: border-box;
  color: var(--color-night);
  overflow: hidden;
}

.quest__header {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.quest__title {
  margin: 0;
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 400;
}

.quest__progress {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.quest__scroller {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.quest__track {
  position: relative;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  /* In-flow spacer so absolute kids do not collapse the track width */
  min-width: 280px;
}

.quest__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.quest__node {
  position: absolute;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 24px rgba(27, 21, 51, 0.12);
  cursor: pointer;
  z-index: 2;
  display: grid;
  place-items: center;
  color: var(--color-night);
  padding: 0;
}

.quest__node.is-locked,
.quest__node.is-soon {
  opacity: 0.55;
}

.quest__node.is-done {
  background: linear-gradient(135deg, #ff7ea8, #e0457b);
  color: #fff;
}

.quest__node.is-available .quest__node-glow {
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 126, 168, 0.45), transparent 70%);
  z-index: -1;
}

.quest__node-icon {
  font-size: 1.25rem;
}

.quest__card-wrap {
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
}

.quest__card {
  text-align: left;
}

.quest__chip {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.7;
  margin-bottom: 4px;
}

.quest__card-title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-family: var(--font-letter);
  font-weight: 600;
}

.quest__card-sub {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  opacity: 0.8;
}

.quest__toast {
  margin: 6px 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-deep-rose);
}

.quest__finale {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 160px;
  min-height: 56px;
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #ff7ea8, #cdb8ff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  z-index: 3;
}

.quest__links {
  flex: 0 0 auto;
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  padding-top: var(--space-3);
  width: 100%;
}

.quest__link {
  min-height: 44px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-night);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.quest__banner {
  position: fixed;
  left: 50%;
  bottom: calc(88px + var(--safe-bottom));
  transform: translateX(-50%);
  margin: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(27, 21, 51, 0.88);
  color: #fff;
  font-size: 0.85rem;
  z-index: 30;
  max-width: 90vw;
  text-align: center;
}
</style>
