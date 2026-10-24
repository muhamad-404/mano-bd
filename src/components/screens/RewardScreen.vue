<template>
  <section class="reward">
    <div class="reward__inner">
      <GlassCard v-if="phase === 'intro'" class="reward__card">
        <span class="fa-grad-rose reward__icon" aria-hidden="true">
          <FaIcon :icon="['fas', 'gift']" />
        </span>
        <h1 class="reward__title">Chapter complete</h1>
        <p class="reward__copy">
          You earned {{ grantedCount }} new {{ grantedCount === 1 ? 'note' : 'notes' }}.
        </p>
        <PrimaryButton class="reward__cta" @click="beginScratch">
          {{ grantedCount > 0 ? 'Scratch your notes' : 'Back to the map' }}
        </PrimaryButton>
      </GlassCard>

      <GlassCard v-else-if="phase === 'scratch' && activeNote" class="reward__card">
        <h2 class="reward__note-title">New note</h2>
        <ScratchCard
          :key="activeNote.id"
          :note="activeNote"
          :width="scratchW"
          :height="180"
          @reveal="onRevealed"
        />
        <p v-if="revealedHere" class="reward__body">{{ activeNote.text }}</p>
        <PrimaryButton v-if="revealedHere" class="reward__cta" @click="nextCard">
          {{ hasMore ? 'Next card' : 'Back to the map' }}
        </PrimaryButton>
      </GlassCard>

      <GlassCard v-else class="reward__card">
        <h1 class="reward__title">All set</h1>
        <PrimaryButton class="reward__cta" @click="toMap">Back to the map</PrimaryButton>
      </GlassCard>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import GlassCard from '../ui/GlassCard.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import ScratchCard from '../ui/ScratchCard.vue'
import { notes } from '../../content/notes.js'
import {
  completeLevel,
  goTo,
  grantNotes,
  revealNote,
  useGameStore,
} from '../../store/game.js'

const store = useGameStore()
const phase = ref('intro')
const levelId = ref(null)
const queueIds = ref([])
const cursor = ref(0)
const revealedHere = ref(false)
const scratchW = ref(260)

const grantedCount = computed(() => queueIds.value.length)
const activeNote = computed(() => notes.find((n) => n.id === queueIds.value[cursor.value]) || null)
const hasMore = computed(() => cursor.value < queueIds.value.length - 1)

function beginScratch() {
  if (!queueIds.value.length) {
    toMap()
    return
  }
  phase.value = 'scratch'
  revealedHere.value = false
}

function onRevealed() {
  const id = activeNote.value?.id
  if (id) revealNote(id)
  revealedHere.value = true
}

function nextCard() {
  if (hasMore.value) {
    cursor.value += 1
    revealedHere.value = false
    return
  }
  toMap()
}

function toMap() {
  goTo('quest')
}

function measureScratch() {
  // Card content width ≈ viewport minus screen + glass padding
  scratchW.value = Math.min(280, Math.max(220, window.innerWidth - 72))
}

onMounted(() => {
  measureScratch()
  const id = store.currentLevel
  levelId.value = id
  if (id) {
    queueIds.value = grantNotes(id)
    completeLevel(id)
  } else {
    queueIds.value = []
  }
})
</script>

<style scoped>
.reward {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: calc(var(--space-5) + var(--safe-top) + 52px);
  padding-right: calc(var(--space-4) + var(--safe-right));
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
  padding-left: calc(var(--space-4) + var(--safe-left));
  color: var(--color-night);
  overflow-x: hidden;
}

.reward__inner {
  width: min(100%, 340px);
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.reward__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.reward__cta {
  align-self: center;
  max-width: 100%;
}

.reward__icon {
  font-size: 2rem;
}

.reward__title {
  margin: 0;
  font-family: var(--font-title);
  font-size: 1.8rem;
  font-weight: 400;
}

.reward__note-title {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.4rem;
}

.reward__copy,
.reward__body {
  margin: 0;
  line-height: 1.45;
}

.reward__body {
  font-family: var(--font-letter);
  font-size: 1.15rem;
}
</style>
