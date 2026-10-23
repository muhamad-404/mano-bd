<template>
  <section class="screen start">
    <div ref="root" class="stack start__inner">
      <p class="start__eyebrow">{{ start.eyebrow }}</p>
      <h1 class="start__name">{{ start.name }}</h1>
      <p class="start__subtitle">{{ start.subtitle }}</p>
      <PrimaryButton icon="heart" class="start__cta" @click="onBegin">
        {{ start.cta }}
      </PrimaryButton>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import gsap from 'gsap'
import PrimaryButton from '../ui/PrimaryButton.vue'
import { start } from '../../content/story.js'
import { goTo, useGameStore } from '../../store/game.js'
import { start as startAudio } from '../../audio/audioManager.js'
import { unlock, pop } from '../../audio/synth.js'
import { burstHearts } from '../../utils/heartBurst.js'

const store = useGameStore()
const root = ref(null)

onMounted(async () => {
  await nextTick()
  const el = root.value
  if (!el) return
  const kids = el.children
  if (store.reducedMotion) {
    gsap.set(kids, { opacity: 1, y: 0 })
    return
  }
  gsap.fromTo(
    kids,
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
    },
  )
})

function onBegin() {
  unlock()
  startAudio()
  pop()
  burstHearts()
  goTo('intro')
}
</script>

<style scoped>
.start__inner {
  width: min(100%, 360px);
  text-align: center;
  align-items: center;
}

.start__eyebrow {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.start__name {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(3rem, 14vw, 4.25rem);
  font-weight: 400;
  line-height: 1.05;
  background: linear-gradient(135deg, var(--color-rose), var(--color-deep-rose));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.start__subtitle {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.8;
  max-width: 18rem;
}

.start__cta {
  margin-top: var(--space-3);
  min-width: min(100%, 240px);
}
</style>
