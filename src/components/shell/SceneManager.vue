<template>
  <div class="scene-manager">
    <Transition :css="false" mode="out-in" @leave="onLeave" @enter="onEnter">
      <component :is="current" :key="store.scene" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, h } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'
import GateScreen from '../screens/GateScreen.vue'
import StartScreen from '../screens/StartScreen.vue'
import IntroScreen from '../screens/IntroScreen.vue'
import PlaceholderScreen from '../screens/PlaceholderScreen.vue'

const store = useGameStore()

function asyncPlaceholder(label) {
  return defineAsyncComponent({
    loader: () =>
      Promise.resolve({
        name: `Placeholder_${label}`,
        setup() {
          return () => h(PlaceholderScreen, { label })
        },
      }),
  })
}

const map = {
  gate: GateScreen,
  start: StartScreen,
  intro: IntroScreen,
  timeline: asyncPlaceholder('Timeline'),
  quest: asyncPlaceholder('Quest'),
  level: asyncPlaceholder('Level'),
  reward: asyncPlaceholder('Reward'),
  keepsakes: asyncPlaceholder('Keepsakes'),
  envelopes: asyncPlaceholder('Envelopes'),
  finale: asyncPlaceholder('Finale'),
}

const current = computed(() => map[store.scene] || GateScreen)

function onLeave(el, done) {
  if (store.reducedMotion) {
    gsap.to(el, { opacity: 0, duration: 0.2, onComplete: done })
    return
  }
  gsap.to(el, {
    opacity: 0,
    y: -12,
    duration: 0.35,
    ease: 'power2.in',
    onComplete: done,
  })
}

function onEnter(el, done) {
  if (store.reducedMotion) {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, onComplete: done })
    return
  }
  gsap.fromTo(
    el,
    { opacity: 0, y: 16 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: done,
    },
  )
}
</script>

<style scoped>
.scene-manager {
  position: relative;
  z-index: 2;
  min-height: 100dvh;
  width: 100%;
}
</style>
