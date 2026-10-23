<template>
  <section class="envelopes screen has-topbar">
    <header class="envelopes__header">
      <button type="button" class="envelopes__back" aria-label="Back" @click="goTo('timeline')">
        <FaIcon :icon="['fas', 'chevron-left']" />
      </button>
      <h1 class="envelopes__title">Open when...</h1>
      <span class="envelopes__spacer" />
    </header>

    <div class="envelopes__list">
      <EnvelopeCard
        v-for="item in envelopes"
        :key="item.id"
        :envelope="item"
        :opened="store.envelopesOpened.includes(item.id)"
        :active="activeId === item.id && sheetOpen"
        @select="openEnvelopeSheet"
      />
    </div>

    <div
      v-if="sheetOpen && active"
      class="envelopes__modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'env-title'"
      @keydown.esc="closeSheet"
    >
      <div class="envelopes__backdrop" @click="closeSheet" />
      <div ref="sheetEl" class="envelopes__sheet" tabindex="-1">
        <button type="button" class="envelopes__close" aria-label="Close" @click="closeSheet">
          <FaIcon :icon="['fas', 'xmark']" />
        </button>
        <GlassCard class="envelopes__paper">
          <h2 id="env-title" class="envelopes__sheet-title">{{ active.label }}</h2>
          <p class="envelopes__sheet-text">{{ active.text }}</p>
          <button
            v-if="audioReady"
            type="button"
            class="envelopes__audio"
            @click="toggleAudio"
          >
            <span class="fa-grad-gold" aria-hidden="true">
              <FaIcon :icon="['fas', audioPlaying ? 'volume-xmark' : 'music']" />
            </span>
            {{ audioPlaying ? 'Pause' : 'Play' }}
          </button>
        </GlassCard>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Howl } from 'howler'
import EnvelopeCard from '../ui/EnvelopeCard.vue'
import GlassCard from '../ui/GlassCard.vue'
import { envelopes } from '../../content/envelopes.js'
import { duck, unduck } from '../../audio/audioManager.js'
import { goTo, openEnvelope, useGameStore } from '../../store/game.js'

const store = useGameStore()
const sheetOpen = ref(false)
const activeId = ref(null)
const sheetEl = ref(null)
const audioReady = ref(false)
const audioPlaying = ref(false)

let howl = null
let lastFocus = null

const active = computed(() => envelopes.find((e) => e.id === activeId.value) || null)

function openEnvelopeSheet(id) {
  activeId.value = id
  openEnvelope(id)
  sheetOpen.value = true
  lastFocus = document.activeElement
  document.body.style.overflow = 'hidden'
  teardownAudio()
  nextTick(() => {
    sheetEl.value?.focus()
    probeAudio()
  })
}

function closeSheet() {
  sheetOpen.value = false
  document.body.style.overflow = ''
  teardownAudio()
  if (lastFocus?.focus) lastFocus.focus()
}

function probeAudio() {
  audioReady.value = false
  if (!active.value?.audio) return
  const src = `${import.meta.env.BASE_URL}${active.value.audio}`
  howl = new Howl({
    src: [src],
    preload: true,
    html5: true,
    onload: () => {
      audioReady.value = true
    },
    onloaderror: () => {
      audioReady.value = false
      teardownAudio()
    },
    onend: () => {
      audioPlaying.value = false
      unduck(400)
    },
  })
}

function toggleAudio() {
  if (!howl || !audioReady.value) return
  if (howl.playing()) {
    howl.pause()
    audioPlaying.value = false
    unduck(400)
    return
  }
  duck(0.12, 400)
  howl.play()
  audioPlaying.value = true
}

function teardownAudio() {
  if (howl) {
    try {
      howl.stop()
      howl.unload()
    } catch {
      /* ignore */
    }
    howl = null
  }
  audioPlaying.value = false
  audioReady.value = false
  unduck(200)
}

function onKey(e) {
  if (e.key === 'Escape' && sheetOpen.value) closeSheet()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
  teardownAudio()
})
</script>

<style scoped>
.envelopes {
  align-items: stretch;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: linear-gradient(180deg, #fff6ee 0%, #bfe3ff 100%);
  color: var(--color-night);
}

.envelopes__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100%, 420px);
  margin: 0 auto var(--space-4);
}

.envelopes__back,
.envelopes__close {
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

.envelopes__spacer {
  width: 44px;
}

.envelopes__title {
  margin: 0;
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 400;
}

.envelopes__list {
  width: min(100%, 420px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-7);
}

.envelopes__modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.envelopes__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(27, 21, 51, 0.45);
}

.envelopes__sheet {
  position: relative;
  z-index: 1;
  width: min(100%, 380px);
  max-height: min(85dvh, 620px);
  overflow-y: auto;
  outline: none;
}

.envelopes__close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  z-index: 2;
}

.envelopes__paper {
  background: #fff6ee;
  color: var(--color-night);
}

.envelopes__sheet-title {
  margin: 0 0 var(--space-3);
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  opacity: 0.75;
}

.envelopes__sheet-text {
  margin: 0;
  font-family: var(--font-letter);
  font-size: 1.35rem;
  line-height: 1.5;
  text-align: center;
}

.envelopes__audio {
  margin-top: var(--space-5);
  width: 100%;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  background: transparent;
  font-weight: 700;
  cursor: pointer;
  color: var(--color-night);
}
</style>
