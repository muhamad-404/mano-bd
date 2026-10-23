<template>
  <section ref="root" class="timeline has-topbar" @scroll.passive="onScroll">
    <div
      class="timeline__parallax"
      aria-hidden="true"
      :style="{
        '--p1': `${parallax.p1}px`,
        '--p2': `${parallax.p2}px`,
        '--p3': `${parallax.p3}px`,
      }"
    >
      <div class="timeline__blob timeline__blob--a" />
      <div class="timeline__blob timeline__blob--b" />
      <div class="timeline__blob timeline__blob--c" />
    </div>

    <div
      v-show="showHint"
      class="timeline__hint"
      aria-hidden="true"
    >
      <FaIcon :icon="['fas', 'chevron-down']" class="anim-float" />
    </div>

    <div class="timeline__track">
      <svg
        class="timeline__line"
        :viewBox="`0 0 40 ${lineHeight}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="timeline-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FF7EA8" />
            <stop offset="100%" stop-color="#E0457B" />
          </linearGradient>
        </defs>
        <line
          x1="20"
          y1="0"
          x2="20"
          :y2="lineHeight"
          stroke="rgba(27,21,51,0.12)"
          stroke-width="4"
          stroke-linecap="round"
        />
        <line
          ref="progressLine"
          x1="20"
          y1="0"
          x2="20"
          :y2="lineHeight"
          stroke="url(#timeline-stroke)"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="lineLength"
          :stroke-dashoffset="dashOffset"
        />
      </svg>

      <article
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :ref="(el) => setChapterRef(el, index)"
        class="timeline__chapter"
      >
        <div class="timeline__node fa-grad-rose" aria-hidden="true">
          <FaIcon :icon="['fas', chapter.icon]" />
        </div>
        <GlassCard class="timeline__card">
          <span class="timeline__date">{{ chapter.dateLabel }}</span>
          <h2 class="timeline__title">{{ chapter.title }}</h2>
          <p class="timeline__text">{{ chapter.text }}</p>
        </GlassCard>
      </article>
    </div>

    <div ref="countersEl" class="timeline__counters">
      <GlassCard
        v-for="item in counterItems"
        :key="item.label"
        class="timeline__counter-card"
      >
        <p class="timeline__counter-label">{{ item.label }}</p>
        <p class="timeline__counter-value">
          <Counter v-if="countersActive" :to="item.value" :duration="1.1" />
          <span v-else>0</span>
        </p>
      </GlassCard>
    </div>

    <div class="timeline__footer stack">
      <p class="timeline__closing">{{ timelineClosing }}</p>
      <PrimaryButton @click="onContinue">Continue</PrimaryButton>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import gsap from 'gsap'
import GlassCard from '../ui/GlassCard.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import Counter from '../ui/Counter.vue'
import { chapters, counters, timelineClosing } from '../../content/story.js'
import { AGE, COUPLE_START, LAST_MET } from '../../config.js'
import { daysBetween } from '../../utils/dates.js'
import { isLowEnd } from '../../utils/device.js'
import { goTo, useGameStore } from '../../store/game.js'

const store = useGameStore()
const root = ref(null)
const progressLine = ref(null)
const countersEl = ref(null)
const chapterEls = []
const showHint = ref(true)
const countersActive = ref(false)
const lineHeight = ref(1200)
const lineLength = ref(1200)
const dashOffset = ref(1200)
const parallax = reactive({ p1: 0, p2: 0, p3: 0 })

let raf = 0
let scrollPending = false
let observers = []
const revealed = new Set()

const counterItems = computed(() => [
  { label: counters.daysTogether, value: daysBetween(COUPLE_START) },
  { label: counters.daysApart, value: daysBetween(LAST_MET) },
  { label: counters.turning, value: AGE },
])

const enableParallax = computed(
  () => !store.reducedMotion && !isLowEnd(),
)

function setChapterRef(el, index) {
  if (el) chapterEls[index] = el
}

function measureLine() {
  const track = root.value?.querySelector('.timeline__track')
  if (!track) return
  const h = Math.max(track.scrollHeight, 800)
  lineHeight.value = h
  lineLength.value = h
  updateProgress()
}

function updateProgress() {
  const el = root.value
  if (!el) return
  const max = Math.max(1, el.scrollHeight - el.clientHeight)
  const progress = Math.min(1, Math.max(0, el.scrollTop / max))
  dashOffset.value = lineLength.value * (1 - progress)

  if (enableParallax.value) {
    const y = el.scrollTop
    parallax.p1 = y * -0.08
    parallax.p2 = y * -0.15
    parallax.p3 = y * -0.22
  } else {
    parallax.p1 = 0
    parallax.p2 = 0
    parallax.p3 = 0
  }

  if (showHint.value && el.scrollTop > 12) {
    showHint.value = false
  }
}

function onScroll() {
  if (scrollPending) return
  scrollPending = true
  raf = requestAnimationFrame(() => {
    scrollPending = false
    updateProgress()
  })
}

function revealCard(el, index) {
  if (revealed.has(index)) return
  revealed.add(index)
  const card = el.querySelector('.timeline__card')
  const node = el.querySelector('.timeline__node')
  const targets = [node, card].filter(Boolean)
  if (store.reducedMotion) {
    gsap.set(targets, { opacity: 1, y: 0 })
    return
  }
  gsap.fromTo(
    targets,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
    },
  )
}

function setupObservers() {
  chapterEls.forEach((el, index) => {
    if (!el) return
    gsap.set(el.querySelectorAll('.timeline__card, .timeline__node'), {
      opacity: store.reducedMotion ? 1 : 0,
      y: store.reducedMotion ? 0 : 24,
    })
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealCard(el, index)
            io.unobserve(el)
          }
        }
      },
      { root: root.value, threshold: 0.28 },
    )
    io.observe(el)
    observers.push(io)
  })

  if (countersEl.value) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            countersActive.value = true
            io.disconnect()
          }
        }
      },
      { root: root.value, threshold: 0.35 },
    )
    io.observe(countersEl.value)
    observers.push(io)
  }
}

function onContinue() {
  goTo('quest')
}

onMounted(async () => {
  await nextTick()
  measureLine()
  setupObservers()
  updateProgress()
  window.addEventListener('resize', measureLine, { passive: true })
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('resize', measureLine)
  for (const io of observers) io.disconnect()
  observers = []
})
</script>

<style scoped>
.timeline {
  position: relative;
  z-index: 1;
  height: 100dvh;
  max-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-5);
  padding-top: calc(var(--space-7) + var(--safe-top) + 44px);
  padding-right: calc(var(--space-5) + var(--safe-right));
  padding-bottom: calc(var(--space-7) + var(--safe-bottom));
  padding-left: calc(var(--space-5) + var(--safe-left));
  box-sizing: border-box;
  background: linear-gradient(180deg, #fff6ee 0%, #e8dcff 45%, #ffc9d9 100%);
  color: var(--color-night);
}

.timeline__parallax {
  position: sticky;
  top: 0;
  height: 0;
  pointer-events: none;
  z-index: 0;
}

.timeline__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(28px);
  opacity: 0.45;
  will-change: transform;
}

.timeline__blob--a {
  width: 180px;
  height: 180px;
  left: -40px;
  top: 80px;
  background: radial-gradient(circle, #ff7ea8, transparent 70%);
  transform: translate3d(0, var(--p1), 0);
}

.timeline__blob--b {
  width: 220px;
  height: 220px;
  right: -60px;
  top: 280px;
  background: radial-gradient(circle, #cdb8ff, transparent 70%);
  transform: translate3d(0, var(--p2), 0);
}

.timeline__blob--c {
  width: 160px;
  height: 160px;
  left: 20%;
  top: 520px;
  background: radial-gradient(circle, #bfe3ff, transparent 70%);
  transform: translate3d(0, var(--p3), 0);
}

.timeline__hint {
  position: sticky;
  top: 8px;
  z-index: 3;
  display: flex;
  justify-content: center;
  color: var(--color-deep-rose);
  font-size: 1.25rem;
  margin-bottom: var(--space-3);
  pointer-events: none;
}

.timeline__track {
  position: relative;
  z-index: 1;
  width: min(100%, 360px);
  margin: 0 auto;
  padding-left: 36px;
}

.timeline__line {
  position: absolute;
  left: 8px;
  top: 0;
  width: 40px;
  height: 100%;
  pointer-events: none;
}

.timeline__chapter {
  position: relative;
  margin-bottom: var(--space-6);
}

.timeline__node {
  position: absolute;
  left: -36px;
  top: 18px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 4px rgba(255, 126, 168, 0.25), 0 8px 20px rgba(27, 21, 51, 0.12);
  font-size: 1.05rem;
  z-index: 2;
}

.timeline__card {
  color: var(--color-night);
}

.timeline__date {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-deep-rose);
  background: rgba(255, 126, 168, 0.15);
  border-radius: 999px;
  padding: 4px 10px;
  margin-bottom: var(--space-2);
}

.timeline__title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-title);
  font-size: clamp(1.35rem, 5vw, 1.65rem);
  font-weight: 400;
  line-height: 1.2;
}

.timeline__text {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 0.98rem;
  line-height: 1.55;
  color: rgba(27, 21, 51, 0.88);
}

.timeline__counters {
  position: relative;
  z-index: 1;
  width: min(100%, 360px);
  margin: var(--space-5) auto;
  display: grid;
  gap: var(--space-3);
}

.timeline__counter-card {
  text-align: center;
}

.timeline__counter-label {
  margin: 0 0 var(--space-1);
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.75;
}

.timeline__counter-value {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-deep-rose);
}

.timeline__footer {
  position: relative;
  z-index: 1;
  width: min(100%, 360px);
  margin: 0 auto var(--space-5);
  align-items: center;
  text-align: center;
}

.timeline__closing {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.25rem;
  font-weight: 700;
  max-width: 22ch;
}

@media (prefers-reduced-motion: reduce) {
  .timeline__blob {
    filter: blur(18px);
    transform: none !important;
  }

  .timeline__hint .anim-float {
    animation: none;
  }
}
</style>
