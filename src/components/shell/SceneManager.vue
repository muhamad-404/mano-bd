<template>
  <div class="scene-manager">
    <Transition :css="false" mode="out-in" @leave="onLeave" @enter="onEnter">
      <component :is="current" :key="store.scene" />
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'
import GateScreen from '../screens/GateScreen.vue'
import StartScreen from '../screens/StartScreen.vue'
import IntroScreen from '../screens/IntroScreen.vue'
import StoryTimeline from '../screens/StoryTimeline.vue'
import Keepsakes from '../screens/Keepsakes.vue'
import Envelopes from '../screens/Envelopes.vue'
import FinaleScreen from '../screens/FinaleScreen.vue'
import QuestMap from '../screens/QuestMap.vue'
import RewardScreen from '../screens/RewardScreen.vue'
import GameHost from '../../game/GameHost.vue'

const store = useGameStore()

const map = {
  gate: GateScreen,
  start: StartScreen,
  intro: IntroScreen,
  timeline: StoryTimeline,
  quest: QuestMap,
  level: GameHost,
  reward: RewardScreen,
  keepsakes: Keepsakes,
  envelopes: Envelopes,
  finale: FinaleScreen,
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
