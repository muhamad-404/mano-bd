<template>
  <div v-if="visible" class="hub">
    <IconButton
      aria-label="Open menu"
      icon="bars"
      grad="lavender"
      @click="open"
    />

    <div
      v-if="isOpen"
      class="hub__layer"
      @keydown.esc="close"
    >
      <div class="hub__backdrop" @click="close" />
      <div
        ref="sheet"
        class="hub__sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabindex="-1"
      >
        <button
          v-for="row in rows"
          :key="row.id"
          type="button"
          class="hub__row"
          :class="{ disabled: row.disabled }"
          :disabled="row.disabled"
          @click="onSelect(row)"
        >
          <span class="hub__icon" :class="`fa-grad-${row.grad}`" aria-hidden="true">
            <FaIcon :icon="['fas', row.disabled ? 'lock' : row.icon]" />
          </span>
          <span class="hub__copy">
            <span class="hub__title">{{ row.title }}</span>
            <span class="hub__sub">{{ row.subtitle }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import IconButton from '../ui/IconButton.vue'
import { goTo, progressText, useGameStore } from '../../store/game.js'

const store = useGameStore()
const isOpen = ref(false)
const sheet = ref(null)
let lastFocus = null

const HUB_SCENES = new Set(['timeline', 'quest', 'keepsakes', 'envelopes', 'reward'])

const visible = computed(() => HUB_SCENES.has(store.scene))

const rows = computed(() => [
  {
    id: 'timeline',
    title: 'Story',
    subtitle: 'Our timeline',
    icon: 'book-open',
    grad: 'rose',
    scene: 'timeline',
    disabled: false,
  },
  {
    id: 'quest',
    title: 'Quest',
    subtitle: 'Four chapters',
    icon: 'star',
    grad: 'gold',
    scene: 'quest',
    disabled: false,
  },
  {
    id: 'keepsakes',
    title: 'Keepsakes',
    subtitle: progressText.value,
    icon: 'gift',
    grad: 'lavender',
    scene: 'keepsakes',
    disabled: false,
  },
  {
    id: 'envelopes',
    title: 'Envelopes',
    subtitle: 'Open when...',
    icon: 'envelope',
    grad: 'sky',
    scene: 'envelopes',
    disabled: false,
  },
  {
    id: 'finale',
    title: 'Finale',
    subtitle: store.introSeen ? 'Birthday wish' : 'Finish the intro first',
    icon: 'cake-candles',
    grad: 'rose',
    scene: 'finale',
    disabled: !store.introSeen,
  },
])

function open() {
  lastFocus = document.activeElement
  isOpen.value = true
  nextTick(() => {
    const el = sheet.value
    if (!el) return
    el.focus()
    if (store.reducedMotion) {
      gsap.set(el, { y: 0, opacity: 1 })
      return
    }
    gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })
  })
}

function close() {
  const el = sheet.value
  const finish = () => {
    isOpen.value = false
    if (lastFocus?.focus) lastFocus.focus()
  }
  if (!el || store.reducedMotion) {
    finish()
    return
  }
  gsap.to(el, {
    y: 40,
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: finish,
  })
}

function onSelect(row) {
  if (row.disabled) return
  goTo(row.scene)
  close()
}

function onKey(e) {
  if (e.key === 'Escape' && isOpen.value) close()
}

watch(
  () => store.scene,
  () => {
    if (isOpen.value && !visible.value) close()
  },
)

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.hub {
  display: inline-flex;
}

.hub__layer {
  position: fixed;
  inset: 0;
  z-index: 45;
}

.hub__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(27, 21, 51, 0.4);
}

.hub__sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: min(70dvh, 480px);
  overflow-y: auto;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-4);
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
  outline: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.hub__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
  width: 100%;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.55);
  padding: var(--space-3);
  text-align: left;
  cursor: pointer;
  color: var(--color-night);
}

.hub__row.disabled {
  opacity: 0.5;
  cursor: default;
}

.hub__icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.hub__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hub__title {
  font-weight: 700;
}

.hub__sub {
  font-size: 0.82rem;
  opacity: 0.7;
}
</style>
