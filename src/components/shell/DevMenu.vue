<template>
  <div v-if="isDev" class="dev-menu">
    <button
      type="button"
      class="dev-menu__toggle"
      aria-label="Open developer menu"
      @click="open = !open"
    >
      Dev
    </button>

    <div v-if="open" class="dev-menu__panel glass">
      <p class="dev-menu__meta">Karachi: {{ karachiNow }}</p>
      <p class="dev-menu__meta">FPS: {{ fps }}</p>
      <div class="dev-menu__row">
        <button type="button" @click="onPreview">Preview {{ store.previewMode ? 'on' : 'off' }}</button>
        <button type="button" @click="onReset">Reset</button>
      </div>
      <div class="dev-menu__row">
        <button type="button" @click="grantAllNotes">Grant all notes</button>
        <button type="button" @click="grantNotes(1)">Grant L1</button>
        <button type="button" @click="grantNotes(2)">Grant L2</button>
        <button type="button" @click="grantNotes(3)">Grant L3</button>
        <button type="button" @click="grantNotes(4)">Grant L4</button>
        <button type="button" @click="revealAllNotes">Reveal all</button>
        <button type="button" @click="resetNotes">Reset notes</button>
      </div>
      <div class="dev-menu__scenes">
        <button
          v-for="scene in SCENES"
          :key="scene"
          type="button"
          :class="{ active: store.scene === scene }"
          @click="goTo(scene)"
        >
          {{ scene }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import {
  SCENES,
  goTo,
  grantAllNotes,
  grantNotes,
  resetAll,
  resetNotes,
  revealAllNotes,
  setPreviewMode,
  useGameStore,
} from '../../store/game.js'
import { formatKarachiDateTime, nowKarachi } from '../../utils/dates.js'

const isDev = import.meta.env.DEV
const store = useGameStore()
const open = ref(false)
const karachiNow = ref('')
const fps = ref(0)

let raf = 0
let frames = 0
let last = performance.now()
let clock = 0

function onPreview() {
  setPreviewMode(!store.previewMode)
}

function onReset() {
  resetAll()
  goTo('gate')
}

function loop(ts) {
  frames += 1
  if (ts - last >= 500) {
    fps.value = Math.round((frames * 1000) / (ts - last))
    frames = 0
    last = ts
  }
  if (ts - clock >= 1000) {
    karachiNow.value = formatKarachiDateTime(nowKarachi())
    clock = ts
  }
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  if (!isDev) return
  karachiNow.value = formatKarachiDateTime(nowKarachi())
  raf = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.dev-menu {
  position: fixed;
  left: calc(var(--space-3) + var(--safe-left));
  bottom: calc(var(--space-3) + var(--safe-bottom));
  z-index: 50;
  font-size: 12px;
}

.dev-menu__toggle {
  min-width: 44px;
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(27, 21, 51, 0.75);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.dev-menu__panel {
  position: absolute;
  left: 0;
  bottom: 52px;
  width: min(78vw, 260px);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dev-menu__meta {
  margin: 0;
  opacity: 0.8;
}

.dev-menu__row,
.dev-menu__scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dev-menu__panel button {
  border: 1px solid rgba(27, 21, 51, 0.15);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 6px 10px;
  min-height: 32px;
  cursor: pointer;
  font-size: 11px;
}

.dev-menu__scenes button.active {
  background: var(--color-rose);
  color: #fff;
  border-color: transparent;
}
</style>
