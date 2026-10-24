<template>
  <section class="keepsakes screen has-topbar">
    <header class="keepsakes__header">
      <button type="button" class="keepsakes__back" aria-label="Back" @click="goBack">
        <FaIcon :icon="['fas', 'chevron-left']" />
      </button>
      <div class="keepsakes__progress" aria-label="Notes progress">
        <svg viewBox="0 0 72 72" class="keepsakes__ring" aria-hidden="true">
          <circle cx="36" cy="36" r="28" class="keepsakes__ring-bg" />
          <circle
            cx="36"
            cy="36"
            r="28"
            class="keepsakes__ring-fg"
            :stroke-dasharray="ringCirc"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <span class="keepsakes__count">{{ progressText }}</span>
      </div>
      <span class="keepsakes__spacer" />
    </header>

    <div class="keepsakes__grid">
      <button
        v-for="(card, index) in cards"
        :key="card.id"
        type="button"
        class="keepsakes__tile"
        :class="`is-${card.state}`"
        :aria-label="card.aria"
        @click="openCard(card)"
      >
        <template v-if="card.state === 'locked'">
          <span class="fa-grad-lavender" aria-hidden="true"><FaIcon :icon="['fas', 'lock']" /></span>
          <span class="keepsakes__meta">{{ card.hint }}</span>
        </template>
        <template v-else-if="card.state === 'sealed'">
          <span class="keepsakes__gift fa-grad-rose anim-pulse-glow" aria-hidden="true">
            <FaIcon :icon="['fas', 'gift']" />
          </span>
          <span class="keepsakes__meta">Scratch me</span>
        </template>
        <template v-else>
          <span class="keepsakes__badge">{{ index + 1 }}</span>
          <span class="keepsakes__preview">{{ card.preview }}</span>
        </template>
      </button>
    </div>

    <div
      v-if="modalOpen"
      class="keepsakes__modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keepsake-title"
      @keydown.esc="closeModal"
    >
      <div class="keepsakes__backdrop" @click="closeModal" />
      <div ref="dialogEl" class="keepsakes__sheet glass" tabindex="-1">
        <button type="button" class="keepsakes__close" aria-label="Close" @click="closeModal">
          <FaIcon :icon="['fas', 'xmark']" />
        </button>
        <h2 id="keepsake-title" class="keepsakes__modal-title">
          Note {{ activeIndex + 1 }}
        </h2>

        <ScratchCard
          v-if="modalMode === 'scratch' && activeNote"
          :key="activeNote.id"
          :note="activeNote"
          :width="scratchW"
          :height="180"
          @reveal="onRevealed"
        />
        <div v-else-if="activeNote" class="keepsakes__full">
          <p>{{ activeNote.text }}</p>
          <div class="keepsakes__nav">
            <button
              type="button"
              class="keepsakes__nav-btn"
              aria-label="Previous note"
              :disabled="!hasPrev"
              @click="nav(-1)"
            >
              <FaIcon :icon="['fas', 'chevron-left']" />
            </button>
            <button
              v-if="hasNextSealed"
              type="button"
              class="keepsakes__next"
              @click="openNextSealed"
            >
              Next
            </button>
            <button
              type="button"
              class="keepsakes__nav-btn"
              aria-label="Next note"
              :disabled="!hasNext"
              @click="nav(1)"
            >
              <FaIcon :icon="['fas', 'chevron-right']" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ScratchCard from '../ui/ScratchCard.vue'
import { notes, NOTE_REWARD_COUNTS } from '../../content/notes.js'
import {
  goTo,
  progressText,
  revealNote,
  unrevealedEarned,
  useGameStore,
} from '../../store/game.js'

const store = useGameStore()
const modalOpen = ref(false)
const modalMode = ref('scratch')
const activeId = ref(null)
const dialogEl = ref(null)
const scratchW = ref(280)
let lastFocus = null

const ringCirc = 2 * Math.PI * 28
const ringOffset = computed(() => {
  const ratio = store.earnedNoteIds.length / notes.length
  return ringCirc * (1 - ratio)
})

function levelForIndex(index) {
  let cursor = 0
  for (let level = 0; level < NOTE_REWARD_COUNTS.length; level += 1) {
    cursor += NOTE_REWARD_COUNTS[level]
    if (index < cursor) return level + 1
  }
  return NOTE_REWARD_COUNTS.length
}

const cards = computed(() =>
  notes.map((note, index) => {
    const earned = store.earnedNoteIds.includes(note.id)
    const revealed = store.revealedNoteIds.includes(note.id)
    let state = 'locked'
    if (revealed) state = 'revealed'
    else if (earned) state = 'sealed'
    const level = levelForIndex(index)
    return {
      ...note,
      state,
      hint: `Complete level ${level}`,
      preview: note.text.slice(0, 48) + (note.text.length > 48 ? '...' : ''),
      aria: state === 'locked' ? `Locked note ${index + 1}` : `Note ${index + 1}`,
    }
  }),
)

const activeNote = computed(() => notes.find((n) => n.id === activeId.value) || null)
const activeIndex = computed(() => notes.findIndex((n) => n.id === activeId.value))

const hasPrev = computed(() => activeIndex.value > 0)
const hasNext = computed(() => activeIndex.value < notes.length - 1 && activeIndex.value >= 0)
const hasNextSealed = computed(() => {
  const list = unrevealedEarned.value
  return list.some((id) => id !== activeId.value)
})

function goBack() {
  goTo('timeline')
}

function openCard(card) {
  if (card.state === 'locked') return
  activeId.value = card.id
  modalMode.value = card.state === 'sealed' ? 'scratch' : 'read'
  openModal()
}

function openModal() {
  lastFocus = document.activeElement
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => dialogEl.value?.focus())
}

function closeModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
  if (lastFocus && lastFocus.focus) lastFocus.focus()
}

function onRevealed(id) {
  revealNote(id)
  modalMode.value = 'read'
}

function openNextSealed() {
  const next = unrevealedEarned.value.find((id) => id !== activeId.value)
  if (!next) return
  activeId.value = next
  modalMode.value = 'scratch'
}

function nav(dir) {
  const i = activeIndex.value + dir
  if (i < 0 || i >= notes.length) return
  const note = notes[i]
  if (!store.earnedNoteIds.includes(note.id)) return
  activeId.value = note.id
  modalMode.value = store.revealedNoteIds.includes(note.id) ? 'read' : 'scratch'
}

function onKey(e) {
  if (e.key === 'Escape' && modalOpen.value) closeModal()
}

function measure() {
  scratchW.value = Math.min(280, Math.max(220, window.innerWidth - 72))
}

onMounted(() => {
  measure()
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', measure, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measure)
  document.body.style.overflow = ''
})

watch(modalOpen, (open) => {
  if (!open) document.body.style.overflow = ''
})
</script>

<style scoped>
.keepsakes {
  align-items: stretch;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: linear-gradient(180deg, #fff6ee 0%, #e8dcff 100%);
  color: var(--color-night);
}

.keepsakes__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100%, 420px);
  margin: 0 auto var(--space-4);
}

.keepsakes__back,
.keepsakes__close,
.keepsakes__nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(27, 21, 51, 0.12);
  background: rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.keepsakes__spacer {
  width: 44px;
}

.keepsakes__progress {
  position: relative;
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
}

.keepsakes__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.keepsakes__ring-bg {
  fill: none;
  stroke: rgba(27, 21, 51, 0.1);
  stroke-width: 6;
}

.keepsakes__ring-fg {
  fill: none;
  stroke: #e0457b;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s var(--ease-out);
}

.keepsakes__count {
  position: relative;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  max-width: 3.6rem;
  line-height: 1.2;
}

.keepsakes__grid {
  width: min(100%, 420px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
}

.keepsakes__tile {
  min-height: 110px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.55);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  cursor: pointer;
  color: var(--color-night);
}

.keepsakes__tile.is-locked {
  opacity: 0.55;
  cursor: default;
}

.keepsakes__meta {
  font-size: 0.78rem;
  font-weight: 600;
}

.keepsakes__gift {
  font-size: 1.4rem;
}

.keepsakes__badge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7ea8, #e0457b);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.keepsakes__preview {
  font-size: 0.78rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.keepsakes__modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.keepsakes__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(27, 21, 51, 0.45);
}

.keepsakes__sheet {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  max-height: min(88dvh, 640px);
  overflow-y: auto;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-5);
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
  outline: none;
}

.keepsakes__close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

.keepsakes__modal-title {
  margin: 0 0 var(--space-4);
  text-align: center;
  font-size: 1.1rem;
}

.keepsakes__full p {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.25rem;
  line-height: 1.45;
  text-align: center;
}

.keepsakes__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.keepsakes__next {
  min-height: 44px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7ea8, #e0457b);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.keepsakes__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
