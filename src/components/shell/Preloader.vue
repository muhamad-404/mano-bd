<template>
  <div class="preloader" role="status" aria-live="polite" aria-label="Loading">
    <span class="preloader__heart fa-grad-rose anim-pulse-glow" aria-hidden="true">
      <FaIcon :icon="['fas', 'heart']" />
    </span>
    <div class="preloader__bar" aria-hidden="true">
      <div class="preloader__fill" :style="{ transform: `scaleX(${progress})` }" />
    </div>
    <p class="preloader__label">{{ label }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { waitForAssets } from '../../boot/preload.js'

const emit = defineEmits(['done'])
const progress = ref(0.08)
const label = ref('Loading')

onMounted(async () => {
  try {
    await waitForAssets((p) => {
      progress.value = Math.max(progress.value, Math.min(1, p))
      if (p < 0.45) label.value = 'Loading fonts'
      else if (p < 0.9) label.value = 'Loading sound'
      else label.value = 'Almost ready'
    })
  } catch (err) {
    console.warn('[preloader]', err)
  }
  progress.value = 1
  label.value = 'Ready'
  emit('done')
})
</script>

<style scoped>
.preloader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background:
    radial-gradient(ellipse at 30% 20%, var(--color-blush) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--color-lavender) 0%, transparent 45%),
    linear-gradient(165deg, var(--color-cream), var(--color-sky));
  color: var(--color-night);
}

.preloader__heart {
  font-size: 2.4rem;
}

.preloader__bar {
  width: min(220px, 60vw);
  height: 4px;
  border-radius: 999px;
  background: rgba(27, 21, 51, 0.12);
  overflow: hidden;
}

.preloader__fill {
  width: 100%;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, #ff7ea8, #cdb8ff);
  transition: transform 0.25s var(--ease-out);
}

.preloader__label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.75;
}
</style>
