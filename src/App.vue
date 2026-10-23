<template>
  <div class="app-root">
    <GradientDefs />
    <Preloader v-if="booting" @done="onBootDone" />
    <template v-else>
      <ParticleBackdrop v-show="showAmbient" />
      <FloatingHearts v-show="showAmbient" />
      <TopBar />
      <SceneManager />
      <component :is="DevMenu" v-if="isDev" />
    </template>
    <ErrorOverlay />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import GradientDefs from './components/ui/GradientDefs.vue'
import ParticleBackdrop from './components/shell/ParticleBackdrop.vue'
import FloatingHearts from './components/shell/FloatingHearts.vue'
import TopBar from './components/shell/TopBar.vue'
import SceneManager from './components/shell/SceneManager.vue'
import Preloader from './components/shell/Preloader.vue'
import ErrorOverlay from './components/shell/ErrorOverlay.vue'
import { useGameStore } from './store/game.js'
import { init as initAudio, setMuted } from './audio/audioManager.js'
import { isLowEnd } from './utils/device.js'
import { applyGsapDefaults, shouldReduceMotion } from './utils/motion.js'

const isDev = import.meta.env.DEV
const DevMenu = isDev
  ? defineAsyncComponent(() => import('./components/shell/DevMenu.vue'))
  : null

const store = useGameStore()
const booting = ref(true)

const AMBIENT_OFF = new Set(['finale', 'level'])
const showAmbient = computed(
  () => !AMBIENT_OFF.has(store.scene) && !shouldReduceMotion(),
)

function onBootDone() {
  booting.value = false
}

function syncMotion() {
  applyGsapDefaults(gsap)
  document.documentElement.classList.toggle('is-calm', shouldReduceMotion())
}

onMounted(() => {
  if (isLowEnd()) {
    document.documentElement.classList.add('is-low-end')
  }
  syncMotion()
  initAudio()
  setMuted(!store.soundOn)
})

watch(
  () => store.soundOn,
  (on) => setMuted(!on),
)

watch(
  () => [store.calmMode, store.reducedMotion],
  () => syncMotion(),
)
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100dvh;
  width: 100%;
  overflow-x: hidden;
}

@supports not (height: 100dvh) {
  .app-root {
    min-height: -webkit-fill-available;
  }
}
</style>
