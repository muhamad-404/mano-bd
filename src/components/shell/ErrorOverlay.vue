<template>
  <div
    v-if="visible"
    class="error-overlay"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="error-title"
    aria-describedby="error-desc"
  >
    <div class="error-overlay__card glass">
      <h2 id="error-title">Something went wrong</h2>
      <p id="error-desc">Please reload the page. Your progress on this device is usually kept.</p>
      <button type="button" class="error-overlay__btn" @click="reload">Reload</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const visible = ref(false)

function show(detail) {
  if (detail) console.error('[app]', detail)
  visible.value = true
}

function reload() {
  window.location.reload()
}

function onError(event) {
  show(event?.error || event?.message || event)
}

function onRejection(event) {
  show(event?.reason || event)
}

onMounted(() => {
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  window.__manoShowError = show
})

onUnmounted(() => {
  window.removeEventListener('error', onError)
  window.removeEventListener('unhandledrejection', onRejection)
  delete window.__manoShowError
})

defineExpose({ show })
</script>

<style scoped>
.error-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: rgba(27, 21, 51, 0.45);
}

.error-overlay__card {
  max-width: 320px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  color: var(--color-night);
}

.error-overlay__card h2 {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.5rem;
}

.error-overlay__card p {
  margin: 0;
  line-height: 1.45;
}

.error-overlay__btn {
  min-height: 44px;
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #ff7ea8, #e0457b);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
</style>
