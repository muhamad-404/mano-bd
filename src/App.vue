<template>
  <div class="app-root">
    <GradientDefs />
    <ParticleBackdrop v-show="showAmbient" />
    <FloatingHearts v-show="showAmbient" />
    <TopBar />
    <SceneManager />
    <component :is="DevMenu" v-if="isDev" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import GradientDefs from './components/ui/GradientDefs.vue'
import ParticleBackdrop from './components/shell/ParticleBackdrop.vue'
import FloatingHearts from './components/shell/FloatingHearts.vue'
import TopBar from './components/shell/TopBar.vue'
import SceneManager from './components/shell/SceneManager.vue'
import { useGameStore } from './store/game.js'
import { init as initAudio, setMuted } from './audio/audioManager.js'
import { isLowEnd } from './utils/device.js'

const isDev = import.meta.env.DEV
const DevMenu = isDev
  ? defineAsyncComponent(() => import('./components/shell/DevMenu.vue'))
  : null

const store = useGameStore()
const showAmbient = computed(() => store.scene !== 'finale')

onMounted(() => {
  if (isLowEnd()) {
    document.documentElement.classList.add('is-low-end')
  }
  initAudio()
  setMuted(!store.soundOn)
})

watch(
  () => store.soundOn,
  (on) => setMuted(!on),
)
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100dvh;
  width: 100%;
  overflow-x: hidden;
}
</style>
