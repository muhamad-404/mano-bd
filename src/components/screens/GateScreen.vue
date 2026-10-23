<template>
  <section class="screen gate">
    <div class="stack gate__inner">
      <div class="gate__lock anim-pulse-glow fa-grad-lavender" aria-hidden="true">
        <FaIcon :icon="['fas', 'lock']" />
      </div>
      <h1 class="gate__title">{{ gate.title }}</h1>
      <p class="gate__subtitle">{{ gate.subtitle }}</p>

      <div class="gate__countdown" role="timer" aria-live="polite">
        <GlassCard
          v-for="unit in units"
          :key="unit.label"
          class="gate__unit"
          padding="12px"
        >
          <p class="gate__value">{{ unit.value }}</p>
          <p class="gate__label">{{ unit.label }}</p>
        </GlassCard>
      </div>

      <p class="gate__unlock">Unlocks {{ unlockLabel }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GlassCard from '../ui/GlassCard.vue'
import { gate } from '../../content/story.js'
import { UNLOCK_AT } from '../../config.js'
import { useGameStore, goTo } from '../../store/game.js'
import { formatKarachiDateTime, msUntil, nowKarachi, pad2, splitDuration } from '../../utils/dates.js'
import { burstHearts } from '../../utils/heartBurst.js'
import { sparkle } from '../../audio/synth.js'

const store = useGameStore()
const remaining = ref(Math.max(0, msUntil(UNLOCK_AT)))
let timer = null
let finished = false

const unlockLabel = computed(() => formatKarachiDateTime(new Date(UNLOCK_AT)))

const units = computed(() => {
  const parts = splitDuration(remaining.value)
  return [
    { label: 'Days', value: pad2(parts.days) },
    { label: 'Hours', value: pad2(parts.hours) },
    { label: 'Minutes', value: pad2(parts.minutes) },
    { label: 'Seconds', value: pad2(parts.seconds) },
  ]
})

function maybeSkip() {
  if (store.previewMode || nowKarachi().getTime() >= new Date(UNLOCK_AT).getTime()) {
    goTo('start')
    return true
  }
  return false
}

function tick() {
  remaining.value = Math.max(0, msUntil(UNLOCK_AT))
  if (remaining.value <= 0 && !finished) {
    finished = true
    sparkle()
    burstHearts()
    goTo('start')
  }
}

onMounted(() => {
  if (maybeSkip()) return
  tick()
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.gate__inner {
  width: min(100%, 360px);
  text-align: center;
  align-items: center;
}

.gate__lock {
  display: inline-flex;
  font-size: 2.4rem;
  line-height: 1;
  margin-bottom: var(--space-2);
}

.gate__title {
  margin: 0;
  font-family: var(--font-ui);
  font-size: clamp(1.35rem, 5.5vw, 1.7rem);
  font-weight: 700;
  color: var(--color-night);
}

.gate__subtitle {
  margin: 0;
  opacity: 0.75;
  font-size: 0.98rem;
}

.gate__countdown {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
  width: 100%;
  margin-top: var(--space-2);
}

.gate__unit {
  text-align: center;
  min-width: 0;
}

.gate__value {
  margin: 0;
  font-size: clamp(1.1rem, 4.5vw, 1.35rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.gate__label {
  margin: var(--space-1) 0 0;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.65;
}

.gate__unlock {
  margin: var(--space-2) 0 0;
  font-size: 0.82rem;
  opacity: 0.65;
}
</style>
