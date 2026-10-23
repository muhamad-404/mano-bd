<template>
  <section class="intro screen has-topbar" @click="onTap">
    <div class="intro__inner stack">
      <span class="intro__heart fa-grad-rose" aria-hidden="true">
        <FaIcon :icon="['fas', 'heart']" />
      </span>

      <div class="intro__lines" aria-live="polite">
        <template v-if="store.reducedMotion">
          <p
            v-for="(line, i) in visibleFadeLines"
            :key="i"
            class="intro__line"
          >
            {{ line }}
          </p>
        </template>
        <p v-else ref="typedEl" class="intro__line intro__typed" />
      </div>

      <PrimaryButton
        v-show="showContinue"
        class="intro__continue"
        @click.stop="onContinue"
      >
        Continue
      </PrimaryButton>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import Typed from 'typed.js'
import PrimaryButton from '../ui/PrimaryButton.vue'
import { opening } from '../../content/story.js'
import { goTo, setIntroSeen, useGameStore } from '../../store/game.js'

const store = useGameStore()
const typedEl = ref(null)
const showContinue = ref(false)
const visibleFadeLines = ref([])
const lineIndex = ref(0)

let typed = null
let pauseTimer = null
let waitingForAdvance = false
let fadeTimer = null

function clearTimers() {
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
  if (fadeTimer) {
    clearTimeout(fadeTimer)
    fadeTimer = null
  }
}

function revealContinue() {
  showContinue.value = true
  waitingForAdvance = false
  clearTimers()
}

function scheduleNextOrFinish(index) {
  waitingForAdvance = true
  clearTimers()
  if (index >= opening.length - 1) {
    pauseTimer = setTimeout(() => revealContinue(), 900)
    return
  }
  pauseTimer = setTimeout(() => {
    if (waitingForAdvance) startTypingLine(index + 1)
  }, 900)
}

function startTypingLine(index) {
  if (!typedEl.value) return
  if (typed) {
    typed.destroy()
    typed = null
  }
  waitingForAdvance = false
  typedEl.value.textContent = ''
  lineIndex.value = index

  if (index >= opening.length) {
    revealContinue()
    return
  }

  typed = new Typed(typedEl.value, {
    strings: [opening[index]],
    typeSpeed: 28,
    showCursor: false,
    contentType: 'text',
    onComplete: () => scheduleNextOrFinish(index),
  })
}

function startFadeSequence() {
  visibleFadeLines.value = []
  lineIndex.value = 0

  const step = () => {
    if (lineIndex.value >= opening.length) {
      revealContinue()
      return
    }
    visibleFadeLines.value = opening.slice(0, lineIndex.value + 1)
    lineIndex.value += 1
    fadeTimer = setTimeout(step, 700)
  }
  step()
}

function onTap() {
  if (showContinue.value) return

  if (store.reducedMotion) {
    clearTimers()
    if (lineIndex.value < opening.length) {
      // Complete current pending line and pause for another tap
      visibleFadeLines.value = opening.slice(0, lineIndex.value + 1)
      lineIndex.value += 1
      if (lineIndex.value >= opening.length) revealContinue()
      else waitingForAdvance = true
    } else if (waitingForAdvance) {
      startFadeFrom(lineIndex.value)
    }
    return
  }

  // Finish current typing instantly
  if (typed && !waitingForAdvance) {
    typed.destroy()
    typed = null
    if (typedEl.value) typedEl.value.textContent = opening[lineIndex.value]
    scheduleNextOrFinish(lineIndex.value)
    return
  }

  // Advance after a finished line
  if (waitingForAdvance) {
    clearTimers()
    const next = lineIndex.value + 1
    if (next >= opening.length) revealContinue()
    else startTypingLine(next)
  }
}

function startFadeFrom(index) {
  waitingForAdvance = false
  const step = () => {
    if (index >= opening.length) {
      lineIndex.value = opening.length
      revealContinue()
      return
    }
    visibleFadeLines.value = opening.slice(0, index + 1)
    lineIndex.value = index + 1
    index += 1
    if (index >= opening.length) {
      revealContinue()
      return
    }
    fadeTimer = setTimeout(step, 700)
  }
  step()
}

function onContinue() {
  setIntroSeen()
  goTo('timeline')
}

onMounted(async () => {
  await nextTick()
  if (store.reducedMotion) startFadeSequence()
  else startTypingLine(0)
})

onUnmounted(() => {
  clearTimers()
  if (typed) {
    typed.destroy()
    typed = null
  }
})
</script>

<style scoped>
.intro {
  background:
    radial-gradient(ellipse at 50% 0%, #3a2a66 0%, transparent 50%),
    linear-gradient(180deg, #1b1533 0%, #4a3568 45%, #ffc9d9 120%);
  color: var(--color-cream);
  text-align: center;
  cursor: pointer;
}

.intro__inner {
  width: min(100%, 340px);
  align-items: center;
}

.intro__heart {
  display: inline-flex;
  font-size: 2.4rem;
  line-height: 1;
}

.intro__lines {
  min-height: 7.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.intro__line {
  margin: 0;
  font-family: var(--font-letter);
  font-size: clamp(1.35rem, 5.8vw, 1.7rem);
  font-weight: 700;
  line-height: 1.35;
  max-width: 18ch;
}

.intro__typed {
  min-height: 4.2em;
}

.intro__continue {
  margin-top: var(--space-2);
  min-width: min(100%, 220px);
}
</style>
