<template>
  <section class="host">
    <div ref="parentEl" class="host__canvas" :class="{ 'is-live': playing }" />

    <div v-if="!playing" class="host__overlay">
      <GlassCard v-if="level" class="host__card">
        <span class="host__chip">{{ level.dateLabel }}</span>
        <span class="host__icon fa-grad-rose" aria-hidden="true">
          <FaIcon :icon="['fas', level.icon]" />
        </span>
        <h1 class="host__title">{{ level.title }}</h1>
        <p class="host__text">{{ level.text }}</p>
        <p class="host__hint">{{ level.config?.hint || 'Drag to move' }}</p>
        <p v-if="loadError" class="host__error">Could not load the game. Check your connection and try again.</p>
        <div v-if="loading" class="host__loading" aria-live="polite" aria-label="Loading">
          <span class="host__ring" />
        </div>
        <PrimaryButton v-else :loading="loading" @click="startLevel">
          {{ loadError ? 'Retry' : 'Start' }}
        </PrimaryButton>
        <button type="button" class="host__back" @click="backToMap">Back to the map</button>
      </GlassCard>
      <GlassCard v-else class="host__card">
        <p>No level selected.</p>
        <PrimaryButton @click="backToMap">Back to the map</PrimaryButton>
      </GlassCard>
    </div>

    <div v-if="playing && !arrival" class="host__hud">
      <div v-if="progress.mode === 'distance'" class="host__distance" aria-label="Distance">
        <div class="host__distance-track">
          <div class="host__distance-fill" :style="{ transform: `scaleY(${progressRatio})` }" />
          <span
            class="host__distance-plane fa-grad-sky"
            :style="{ bottom: `${progressRatio * 100}%` }"
            aria-hidden="true"
          >
            <FaIcon :icon="['fas', 'paper-plane']" />
          </span>
        </div>
        <span class="host__distance-label">{{ progress.value }}%</span>
      </div>
      <div v-else class="host__progress" aria-label="Level progress">
        <span class="fa-grad-rose" aria-hidden="true">
          <FaIcon :icon="['fas', progressIcon]" />
        </span>
        <div class="host__bar">
          <div class="host__bar-fill" :style="{ transform: `scaleX(${progressRatio})` }" />
        </div>
        <span>{{ progress.value }}/{{ progress.max }}</span>
      </div>
      <IconButton aria-label="Pause" icon="pause" grad="lavender" @click="openPause" />
    </div>

    <div v-if="paused" class="host__pause" role="dialog" aria-modal="true" aria-label="Paused">
      <GlassCard class="host__pause-card">
        <h2>Paused</h2>
        <PrimaryButton @click="resumePause">Resume</PrimaryButton>
        <button type="button" class="host__back" @click="leaveToMap">Back to the map</button>
      </GlassCard>
    </div>

    <div v-if="arrival" class="host__arrival" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
      <GlassCard class="host__arrival-card">
        <h2 id="arrival-title">{{ planeArrival.title }}</h2>
        <p class="host__days">{{ counters.daysApart }}: {{ arrival.daysApart }}</p>
        <p class="host__arrival-line">{{ planeArrival.line }}</p>
        <PrimaryButton @click="onArrivalContinue">{{ planeArrival.cta }}</PrimaryButton>
      </GlassCard>
    </div>

    <p v-if="landscape" class="host__rotate" role="status">Turn your phone for the best view</p>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import GlassCard from '../components/ui/GlassCard.vue'
import PrimaryButton from '../components/ui/PrimaryButton.vue'
import IconButton from '../components/ui/IconButton.vue'
import { getLevel } from './levels.js'
import { on as bridgeOn, off as bridgeOff, emit as bridgeEmit } from './bridge.js'
import { goTo, useGameStore } from '../store/game.js'
import { unlock } from '../audio/synth.js'
import { counters, planeArrival } from '../content/story.js'

const store = useGameStore()
const parentEl = ref(null)
const playing = ref(false)
const loading = ref(false)
const loadError = ref(false)
const paused = ref(false)
const landscape = ref(false)
const arrival = ref(null)
const progress = reactive({ value: 0, max: 8, mode: 'count' })

let game = null
let sceneKey = 'CatchHearts'

const level = computed(() => getLevel(store.currentLevel))
const progressRatio = computed(() => {
  if (!progress.max) return 0
  return Math.min(1, progress.value / progress.max)
})
const progressIcon = computed(() => {
  if (level.value?.sceneKey === 'Storm') return 'star'
  return 'heart'
})

function onProgress(payload) {
  if (!payload) return
  progress.value = payload.value
  progress.max = payload.max
  progress.mode = payload.mode || 'count'
}

function onComplete() {
  arrival.value = null
  destroyGame()
  goTo('reward')
}

function onArrival(payload) {
  arrival.value = payload || { daysApart: 0 }
  paused.value = false
}

function onArrivalContinue() {
  const scene = game?.scene?.getScene(sceneKey)
  arrival.value = null
  if (scene?.finishAfterArrival) {
    scene.finishAfterArrival()
    return
  }
  onComplete()
}

function onLevelError() {
  loadError.value = true
  destroyGame()
}

function onForceComplete() {
  if (!game) return
  const scene = game.scene.getScene(sceneKey)
  if (scene?.forceComplete) scene.forceComplete()
  else if (scene?.finishAfterArrival) scene.finishAfterArrival()
}

function onVis() {
  if (document.hidden && playing.value && game) {
    openPause()
  }
}

function onOrient() {
  landscape.value = window.matchMedia('(orientation: landscape)').matches
}

async function startLevel() {
  if (!level.value || !parentEl.value) return
  unlock()
  loading.value = true
  loadError.value = false
  try {
    const { createGame } = await import('./createGame.js')
    destroyGame()
    progress.value = 0
    progress.mode = level.value.sceneKey === 'PaperPlane' ? 'distance' : 'count'
    progress.max = progress.mode === 'distance' ? 100 : level.value.config.target || 8
    sceneKey = level.value.sceneKey
    arrival.value = null
    game = createGame(parentEl.value, {
      levelId: level.value.id,
      config: level.value.config,
      sceneKey,
    })
    playing.value = true
    paused.value = false
  } catch (err) {
    console.error(err)
    loadError.value = true
    playing.value = false
  } finally {
    loading.value = false
  }
}

function destroyGame() {
  if (game) {
    try {
      game.destroy(true)
    } catch {
      /* ignore */
    }
    game = null
  }
  playing.value = false
  paused.value = false
  arrival.value = null
  if (parentEl.value) parentEl.value.innerHTML = ''
}

function openPause() {
  if (!game || paused.value) return
  paused.value = true
  const scene = game.scene.getScene(sceneKey)
  if (scene?.scene?.isActive()) scene.scene.pause()
  bridgeEmit('level:pause', { levelId: store.currentLevel })
}

function resumePause() {
  if (!game) return
  paused.value = false
  const scene = game.scene.getScene(sceneKey)
  if (scene?.scene) scene.scene.resume()
  bridgeEmit('level:resume', { levelId: store.currentLevel })
}

function leaveToMap() {
  destroyGame()
  goTo('quest')
}

function backToMap() {
  goTo('quest')
}

onMounted(() => {
  bridgeOn('level:progress', onProgress)
  bridgeOn('level:complete', onComplete)
  bridgeOn('level:error', onLevelError)
  bridgeOn('level:arrival', onArrival)
  bridgeOn('dev:force-complete', onForceComplete)
  document.addEventListener('visibilitychange', onVis)
  onOrient()
  window.addEventListener('orientationchange', onOrient)
  window.addEventListener('resize', onOrient)
})

onUnmounted(() => {
  bridgeOff('level:progress', onProgress)
  bridgeOff('level:complete', onComplete)
  bridgeOff('level:error', onLevelError)
  bridgeOff('level:arrival', onArrival)
  bridgeOff('dev:force-complete', onForceComplete)
  document.removeEventListener('visibilitychange', onVis)
  window.removeEventListener('orientationchange', onOrient)
  window.removeEventListener('resize', onOrient)
  destroyGame()
})
</script>

<style scoped>
.host {
  position: relative;
  height: 100dvh;
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  touch-action: none;
  color: var(--color-night);
}

.host__canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.host__canvas.is-live {
  background: transparent;
}

.host__canvas :deep(canvas) {
  display: block;
  margin: 0 auto;
  touch-action: none;
}

.host__overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: calc(var(--space-5) + var(--safe-top)) var(--space-4) calc(var(--space-5) + var(--safe-bottom));
  box-sizing: border-box;
}

.host__card {
  max-width: 340px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.host__chip {
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0.7;
}

.host__icon {
  font-size: 1.8rem;
}

.host__title {
  margin: 0;
  font-family: var(--font-title);
  font-size: 1.8rem;
  font-weight: 400;
}

.host__text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  opacity: 0.9;
}

.host__hint {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
}

.host__error {
  margin: 0;
  color: var(--color-deep-rose);
  font-size: 0.85rem;
}

.host__loading {
  min-height: 48px;
  display: grid;
  place-items: center;
}

.host__ring {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 3px solid rgba(255, 126, 168, 0.25);
  border-top-color: var(--color-rose);
  animation: host-spin 0.8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .host__ring {
    animation: none;
    border-top-color: var(--color-rose);
  }
}

@keyframes host-spin {
  to {
    transform: rotate(360deg);
  }
}

.host__back {
  min-height: 44px;
  border: none;
  background: transparent;
  color: var(--color-night);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.8;
}

.host__hud {
  position: absolute;
  top: calc(var(--space-3) + var(--safe-top));
  left: calc(var(--space-3) + var(--safe-left));
  right: calc(var(--space-3) + var(--safe-right));
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  pointer-events: none;
}

.host__hud > * {
  pointer-events: auto;
}

.host__progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  font-weight: 700;
  font-size: 0.85rem;
}

.host__bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(27, 21, 51, 0.12);
  overflow: hidden;
}

.host__bar-fill {
  width: 100%;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, #ff7ea8, #e0457b);
  transition: transform 0.2s var(--ease-out);
}

.host__pause {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  background: rgba(27, 21, 51, 0.35);
  padding: var(--space-4);
}

.host__pause-card {
  max-width: 280px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.host__pause-card h2 {
  margin: 0;
  font-family: var(--font-letter);
}

.host__distance {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  font-weight: 700;
  font-size: 0.8rem;
}

.host__distance-track {
  position: relative;
  width: 10px;
  height: 88px;
  border-radius: 999px;
  background: rgba(27, 21, 51, 0.12);
  overflow: visible;
}

.host__distance-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  transform-origin: bottom center;
  background: linear-gradient(180deg, #ff7ea8, #cdb8ff);
  border-radius: inherit;
}

.host__distance-plane {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  font-size: 0.75rem;
}

.host__distance-label {
  min-width: 2.5rem;
}

.host__arrival {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgba(27, 21, 51, 0.4);
}

.host__arrival-card {
  max-width: 320px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.host__arrival-card h2 {
  margin: 0;
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 400;
}

.host__days {
  margin: 0;
  font-weight: 700;
}

.host__arrival-line {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.1rem;
  line-height: 1.4;
}

.host__rotate {
  position: absolute;
  left: 50%;
  bottom: calc(var(--space-4) + var(--safe-bottom));
  transform: translateX(-50%);
  z-index: 6;
  margin: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(27, 21, 51, 0.85);
  color: #fff;
  font-size: 0.82rem;
  display: none;
}

@media (orientation: landscape) {
  .host__rotate {
    display: block;
  }
}
</style>
