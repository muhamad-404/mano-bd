<template>
  <section class="finale screen" :class="[`is-${stage}`]">
    <div class="finale__stars" aria-hidden="true">
      <span v-for="(s, i) in stars" :key="i" class="finale__star" :style="s" />
    </div>

    <button
      type="button"
      class="finale__back"
      aria-label="Back to the quest"
      @click="leaveFinale"
    >
      <FaIcon :icon="['fas', 'chevron-left']" />
    </button>

    <canvas ref="confettiCanvas" class="finale__confetti" aria-hidden="true" />

    <div class="finale__stage">
      <div
        v-show="showCake"
        ref="cakeWrap"
        class="finale__cake-wrap"
        :class="{ 'is-listening': listening, 'is-glow': stage === 'blown' }"
      >
        <div v-if="listening" class="finale__pulse" aria-hidden="true" />
        <button
          type="button"
          class="finale__flame-hit"
          :aria-label="finale.tapFallback"
          :disabled="!canBlow"
          @click="onTapBlow"
        />
        <CakeSvg :lit="candleLit" />
      </div>

      <div v-if="stage === 'wish' || stage === 'intro'" class="finale__wish stack">
        <p v-show="stage === 'wish'" class="finale__wish-text">{{ finale.wishPrompt }}</p>
        <template v-if="stage === 'wish'">
          <PrimaryButton icon="wand-magic-sparkles" @click="startListening">
            {{ finale.blowButton }}
          </PrimaryButton>
          <button type="button" class="finale__link" @click="onTapBlow">
            {{ finale.tapFallback }}
          </button>
          <p v-if="micMessage" class="finale__hint">{{ micMessage }}</p>
          <p v-else-if="showListenHint" class="finale__hint">{{ finale.tapFallback }}</p>
        </template>
      </div>

      <div
        v-if="stage === 'fireworks' || stage === 'title'"
        ref="titleEl"
        class="finale__title"
        aria-live="polite"
      >
        <span class="finale__title-glow" aria-hidden="true" />
        <span
          v-for="(ch, i) in titleChars"
          :key="i"
          class="finale__title-char"
          :class="{ space: ch === ' ' }"
        >{{ ch === ' ' ? '\u00A0' : ch }}</span>
      </div>

      <div
        v-if="stage === 'letter' || stage === 'done'"
        class="finale__letter-page"
      >
        <GlassCard class="finale__letter" @click="skipTyping">
          <div ref="letterScroll" class="finale__letter-scroll" @scroll.passive="onLetterScroll">
            <h2 class="finale__letter-title">{{ letterTitle }}</h2>
            <div ref="typedHost" class="finale__typed" />
            <p v-show="showSignoff" class="finale__signoff">{{ signoff }}</p>
            <div v-if="stage === 'done'" class="finale__actions stack">
              <PrimaryButton @click.stop="replay">{{ finale.replay }}</PrimaryButton>
              <button
                v-if="voiceAvailable"
                type="button"
                class="finale__voice"
                @click.stop="toggleVoice"
              >
                <span class="fa-grad-gold" aria-hidden="true">
                  <FaIcon :icon="['fas', voicePlaying ? 'volume-xmark' : 'music']" />
                </span>
                {{ voicePlaying ? finale.voiceNotePause : finale.voiceNoteButton }}
              </button>
            </div>
          </div>
          <button
            v-if="showScrollHint"
            type="button"
            class="finale__scroll-hint"
            aria-label="More of the letter below"
            @click.stop="scrollLetterMore"
          >
            <FaIcon :icon="['fas', 'chevron-down']" />
            <span>More below</span>
          </button>
        </GlassCard>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import confetti from 'canvas-confetti'
import Typed from 'typed.js'
import gsap from 'gsap'
import { Howl } from 'howler'
import CakeSvg from '../ui/CakeSvg.vue'
import GlassCard from '../ui/GlassCard.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import { finale } from '../../content/story.js'
import { title as letterTitle, paragraphs, signoff } from '../../content/letter.js'
import { goTo, setFinaleSeen, useGameStore } from '../../store/game.js'
import { startBlowDetection } from '../../audio/mic.js'
import { chime, sparkle, whoosh } from '../../audio/synth.js'
import { duck, unduck } from '../../audio/audioManager.js'
import { isLowEnd, vibrate } from '../../utils/device.js'

const store = useGameStore()

const stage = ref('intro')
const candleLit = ref(true)
const listening = ref(false)
const micMessage = ref('')
const showListenHint = ref(false)
const showSignoff = ref(false)
const voiceAvailable = ref(false)
const voicePlaying = ref(false)

const cakeWrap = ref(null)
const confettiCanvas = ref(null)
const titleEl = ref(null)
const typedHost = ref(null)
const letterScroll = ref(null)
const showScrollHint = ref(false)
let letterHintTimer = 0

let micApi = null
let listenHintTimer = null
let typed = null
let voice = null
let fireFn = null
let fireworksTimer = null
let stageTimers = []
let titleTween = null
let cakeTween = null
let fpsFrames = 0
let fpsLast = 0
let particleScale = 1
let letterFinished = false

const titleChars = letterTitle.split('')
const showCake = computed(() =>
  ['intro', 'wish', 'blown', 'fireworks', 'title'].includes(stage.value),
)
const canBlow = computed(() => stage.value === 'wish')

const stars = Array.from({ length: 18 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 55}%`,
  animationDelay: `${Math.random() * 3}s`,
  animationDuration: `${2.2 + Math.random() * 2.5}s`,
  width: `${1.5 + Math.random() * 2.5}px`,
  height: `${1.5 + Math.random() * 2.5}px`,
}))

function later(fn, ms) {
  const id = setTimeout(fn, ms)
  stageTimers.push(id)
  return id
}

function clearStageTimers() {
  for (const id of stageTimers) clearTimeout(id)
  stageTimers = []
}

function stopMic() {
  if (micApi) {
    micApi.stop()
    micApi = null
  }
  listening.value = false
  if (listenHintTimer) {
    clearTimeout(listenHintTimer)
    listenHintTimer = null
  }
}

function snuffAndContinue() {
  if (stage.value !== 'wish') return
  stopMic()
  stage.value = 'blown'
  candleLit.value = false
  whoosh()
  later(() => {
    stage.value = 'fireworks'
    runFireworks()
  }, 1200)
}

function onTapBlow() {
  if (!canBlow.value) return
  snuffAndContinue()
}

function startListening() {
  if (!canBlow.value) return
  micMessage.value = ''
  showListenHint.value = false
  stopMic()
  listening.value = true
  listenHintTimer = setTimeout(() => {
    if (listening.value) showListenHint.value = true
  }, 6000)

  micApi = startBlowDetection({
    onBlow: () => snuffAndContinue(),
    onError: () => {
      listening.value = false
      micMessage.value = finale.micDenied
    },
  })
}

function baseParticleCount() {
  if (store.reducedMotion) return 8
  let n = 40
  if (isLowEnd()) n = Math.round(n / 2)
  return Math.max(4, Math.round(n * particleScale))
}

function runFireworks() {
  const canvas = confettiCanvas.value
  if (!canvas) {
    later(() => revealTitle(), 500)
    return
  }

  fireFn = confetti.create(canvas, { resize: true, useWorker: true })
  chime()
  vibrate(30)

  const colors = ['#FFD98A', '#FF7EA8', '#CDB8FF', '#BFE3FF']
  const start = performance.now()
  let burstIndex = 0
  fpsFrames = 0
  fpsLast = start

  const tickFps = (now) => {
    fpsFrames += 1
    if (now - fpsLast >= 500) {
      const fps = (fpsFrames * 1000) / (now - fpsLast)
      if (fps < 40) particleScale = Math.max(0.35, particleScale * 0.7)
      fpsFrames = 0
      fpsLast = now
    }
  }

  const launch = () => {
    const now = performance.now()
    if (now - start >= 5000) {
      if (fireworksTimer) clearTimeout(fireworksTimer)
      later(() => revealTitle(), 200)
      return
    }
    tickFps(now)
    const count = baseParticleCount()
    fireFn({
      particleCount: count,
      spread: 70 + Math.random() * 40,
      startVelocity: 28 + Math.random() * 18,
      origin: {
        x: 0.15 + Math.random() * 0.7,
        y: Math.random() * 0.55,
      },
      colors,
      disableForReducedMotion: true,
      ticks: store.reducedMotion ? 80 : 180,
    })
    if (burstIndex % 3 === 0) sparkle()
    if (burstIndex % 4 === 0) vibrate(30)
    burstIndex += 1
    const wait = 250 + Math.random() * 100
    fireworksTimer = setTimeout(launch, wait)
  }

  if (store.reducedMotion) {
    fireFn({
      particleCount: 12,
      spread: 55,
      origin: { x: 0.5, y: 0.35 },
      colors,
      disableForReducedMotion: false,
      ticks: 90,
    })
    later(() => revealTitle(), 900)
    return
  }

  launch()
}

async function revealTitle() {
  stage.value = 'title'
  await nextTick()
  const chars = titleEl.value?.querySelectorAll('.finale__title-char')
  if (!chars?.length) {
    later(() => startLetter(), 800)
    return
  }
  if (titleTween) titleTween.kill()
  if (store.reducedMotion) {
    gsap.set(chars, { opacity: 1, y: 0 })
    later(() => startLetter(), 900)
    return
  }
  gsap.set(chars, { opacity: 0, y: 18 })
  titleTween = gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.55,
    stagger: 0.035,
    ease: 'power2.out',
    onComplete: () => {
      later(() => startLetter(), 2500)
    },
  })
}

function updateScrollHint() {
  const el = letterScroll.value
  if (!el) {
    showScrollHint.value = false
    return
  }
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
  showScrollHint.value = remaining > 28
}

function onLetterScroll() {
  updateScrollHint()
}

function scrollLetterMore() {
  const el = letterScroll.value
  if (!el) return
  const step = Math.max(120, Math.round(el.clientHeight * 0.65))
  el.scrollBy({ top: step, behavior: store.reducedMotion ? 'auto' : 'smooth' })
  window.setTimeout(updateScrollHint, store.reducedMotion ? 0 : 320)
}

function armLetterHintWatch() {
  clearInterval(letterHintTimer)
  updateScrollHint()
  letterHintTimer = window.setInterval(updateScrollHint, 400)
}

function stopLetterHintWatch() {
  clearInterval(letterHintTimer)
  letterHintTimer = 0
  showScrollHint.value = false
}

async function startLetter() {
  stage.value = 'letter'
  showSignoff.value = false
  showScrollHint.value = false
  await nextTick()
  const el = typedHost.value
  if (!el) {
    finishLetter()
    return
  }
  el.textContent = ''
  if (typed) {
    typed.destroy()
    typed = null
  }

  const full = paragraphs.join('\n\n')
  armLetterHintWatch()
  if (store.reducedMotion) {
    el.textContent = full
    await nextTick()
    updateScrollHint()
    finishLetter()
    return
  }

  typed = new Typed(el, {
    strings: [full],
    typeSpeed: 22,
    showCursor: false,
    contentType: 'text',
    onComplete: () => finishLetter(),
  })
}

function skipTyping() {
  if (stage.value !== 'letter' || showSignoff.value) return
  if (typed) {
    typed.destroy()
    typed = null
  }
  if (typedHost.value) {
    typedHost.value.textContent = paragraphs.join('\n\n')
  }
  nextTick(() => {
    updateScrollHint()
    finishLetter()
  })
}

function finishLetter() {
  if (letterFinished) return
  letterFinished = true
  showSignoff.value = true
  stage.value = 'done'
  setFinaleSeen()
  nextTick(updateScrollHint)
}

function leaveFinale() {
  stopVoice()
  stopMic()
  stopLetterHintWatch()
  if (typed) {
    typed.destroy()
    typed = null
  }
  goTo('quest')
}

function replay() {
  stopVoice()
  stopMic()
  stopLetterHintWatch()
  if (typed) {
    typed.destroy()
    typed = null
  }
  if (fireFn) {
    fireFn.reset()
  }
  if (fireworksTimer) {
    clearTimeout(fireworksTimer)
    fireworksTimer = null
  }
  clearStageTimers()
  if (titleTween) titleTween.kill()
  candleLit.value = true
  micMessage.value = ''
  showListenHint.value = false
  showSignoff.value = false
  particleScale = 1
  letterFinished = false
  stage.value = 'intro'
  nextTick(() => enterCake())
}

function enterCake() {
  const el = cakeWrap.value
  if (!el) {
    later(() => {
      stage.value = 'wish'
    }, 400)
    return
  }
  if (cakeTween) cakeTween.kill()
  if (store.reducedMotion) {
    gsap.set(el, { opacity: 1, y: 0 })
    stage.value = 'wish'
    return
  }
  gsap.fromTo(
    el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power2.out',
      onComplete: () => {
        stage.value = 'wish'
      },
    },
  )
}

function probeVoice() {
  const src = `${import.meta.env.BASE_URL}audio/voice-note.mp3`
  voice = new Howl({
    src: [src],
    preload: true,
    html5: true,
    onload: () => {
      voiceAvailable.value = true
    },
    onloaderror: () => {
      voiceAvailable.value = false
      if (voice) {
        voice.unload()
        voice = null
      }
    },
    onend: () => {
      voicePlaying.value = false
      unduck(400)
    },
  })
}

function toggleVoice() {
  if (!voice || !voiceAvailable.value) return
  if (voice.playing()) {
    voice.pause()
    voicePlaying.value = false
    unduck(400)
    return
  }
  duck(0.12, 400)
  voice.play()
  voicePlaying.value = true
}

function stopVoice() {
  if (!voice) return
  try {
    voice.stop()
  } catch {
    /* ignore */
  }
  voicePlaying.value = false
  unduck(200)
}

onMounted(() => {
  probeVoice()
  enterCake()
})

onUnmounted(() => {
  stopMic()
  stopVoice()
  clearStageTimers()
  stopLetterHintWatch()
  if (listenHintTimer) clearTimeout(listenHintTimer)
  if (typed) {
    typed.destroy()
    typed = null
  }
  if (fireworksTimer) clearTimeout(fireworksTimer)
  if (fireFn) {
    fireFn.reset()
    fireFn = null
  }
  if (titleTween) titleTween.kill()
  if (cakeTween) cakeTween.kill()
  if (voice) {
    voice.unload()
    voice = null
  }
})
</script>

<style scoped>
.finale {
  justify-content: flex-start;
  align-items: center;
  align-self: stretch;
  width: 100%;
  max-width: 100%;
  min-height: 100dvh;
  height: 100dvh;
  max-height: 100dvh;
  box-sizing: border-box;
  padding-top: calc(var(--space-5) + var(--safe-top) + 52px);
  padding-right: calc(var(--space-4) + var(--safe-right));
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
  padding-left: calc(var(--space-4) + var(--safe-left));
  background:
    radial-gradient(ellipse at 50% 0%, #3a2a66 0%, transparent 55%),
    linear-gradient(180deg, #1b1533 0%, #2a1f4d 55%, #1b1533 100%);
  color: var(--color-cream);
  overflow: hidden;
}

.finale__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.finale__star {
  position: absolute;
  border-radius: 50%;
  background: #fff6ee;
  opacity: 0.45;
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.finale__confetti {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.finale__back {
  position: fixed;
  top: calc(var(--space-3) + var(--safe-top));
  left: calc(var(--space-4) + var(--safe-left));
  z-index: 25;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-cream);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.finale__stage {
  position: relative;
  z-index: 2;
  width: min(100%, 360px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
}

.finale__cake-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.finale__cake-wrap.is-glow {
  filter: drop-shadow(0 0 18px rgba(255, 217, 138, 0.35));
}

.finale__pulse {
  position: absolute;
  left: 50%;
  top: 18%;
  width: 72px;
  height: 72px;
  margin-left: -36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 217, 138, 0.65);
  animation: pulse-glow 1.4s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

.finale__flame-hit {
  position: absolute;
  left: 50%;
  top: 8%;
  transform: translateX(-50%);
  width: 64px;
  height: 72px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 3;
}

.finale__wish {
  width: 100%;
  align-items: center;
  text-align: center;
}

.finale__wish-text {
  margin: 0;
  font-family: var(--font-letter);
  font-size: clamp(1.6rem, 6vw, 2rem);
  font-weight: 700;
  color: var(--color-cream);
}

.finale__link {
  border: none;
  background: transparent;
  color: rgba(255, 246, 238, 0.8);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: 0.95rem;
  min-height: 44px;
  cursor: pointer;
  padding: 0 var(--space-3);
}

.finale__hint {
  margin: 0;
  font-size: 0.88rem;
  opacity: 0.75;
}

.finale__title {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.02em;
  max-width: 20ch;
  text-align: center;
  font-family: var(--font-title);
  font-size: clamp(1.6rem, 7vw, 2.2rem);
  line-height: 1.25;
  color: var(--color-cream);
  z-index: 6;
}

.finale__title-glow {
  position: absolute;
  inset: -20% -10%;
  background: radial-gradient(circle, rgba(255, 217, 138, 0.35), transparent 70%);
  pointer-events: none;
  z-index: -1;
}

.finale__title-char {
  display: inline-block;
  will-change: transform, opacity;
}

.finale__letter-page {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.finale__letter {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  max-height: none;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--color-night);
  text-align: left;
  box-sizing: border-box;
  padding: 0 !important;
  overflow: hidden;
}

.finale__letter-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: var(--space-5);
  padding-bottom: calc(var(--space-5) + 56px);
  box-sizing: border-box;
}

.finale__scroll-hint {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 3;
  min-height: 44px;
  min-width: 44px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(27, 21, 51, 0.88);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(27, 21, 51, 0.25);
  animation: finale-hint-bob 1.4s ease-in-out infinite;
}

.finale__scroll-hint span {
  white-space: nowrap;
}

@keyframes finale-hint-bob {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(5px);
  }
}

.finale__letter-title {
  margin: 0 0 var(--space-3);
  font-family: var(--font-title);
  font-size: 1.45rem;
  font-weight: 400;
  text-align: center;
  background: linear-gradient(135deg, var(--color-rose), var(--color-deep-rose));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.finale__typed {
  white-space: pre-wrap;
  font-family: var(--font-letter);
  font-size: 1.15rem;
  line-height: 1.55;
  min-height: 12em;
}

.finale__signoff {
  margin: var(--space-4) 0 0;
  font-family: var(--font-letter);
  font-size: 1.25rem;
  font-weight: 700;
  text-align: right;
}

.finale__actions {
  margin-top: var(--space-4);
  align-items: stretch;
}

.finale__voice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  border: none;
  background: transparent;
  color: var(--color-night);
  font-weight: 600;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .finale__star,
  .finale__pulse,
  .finale__scroll-hint {
    animation: none;
  }
}
</style>
