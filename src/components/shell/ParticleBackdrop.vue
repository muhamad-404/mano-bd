<template>
  <div class="particle-backdrop" aria-hidden="true">
    <VueParticles
      v-if="particleCount > 0"
      id="mano-particles"
      :options="options"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../store/game.js'
import { isLowEnd } from '../../utils/device.js'

const store = useGameStore()

const particleCount = computed(() => {
  if (store.reducedMotion) return 0
  return isLowEnd() ? 8 : 18
})

const options = computed(() => ({
  fullScreen: { enable: false },
  fpsLimit: 45,
  detectRetina: true,
  particles: {
    number: {
      value: particleCount.value,
      density: { enable: false },
    },
    color: {
      value: ['#FF7EA8', '#CDB8FF', '#FFD98A', '#BFE3FF'],
    },
    shape: {
      type: ['circle', 'star'],
    },
    opacity: {
      value: { min: 0.2, max: 0.7 },
      animation: {
        enable: true,
        speed: 0.6,
        sync: false,
      },
    },
    size: {
      value: { min: 1, max: 3.5 },
    },
    move: {
      enable: true,
      speed: 0.35,
      direction: 'none',
      outModes: { default: 'out' },
    },
  },
  interactivity: {
    detectsOn: 'canvas',
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
      resize: { enable: true },
    },
  },
}))
</script>

<style scoped>
.particle-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.particle-backdrop :deep(canvas),
.particle-backdrop :deep(#mano-particles) {
  width: 100% !important;
  height: 100% !important;
  pointer-events: none;
}
</style>
