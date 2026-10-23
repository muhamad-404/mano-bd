import { computed } from 'vue'
import { isLowEnd, prefersReducedMotion } from './device.js'
import { useGameStore } from '../store/game.js'

/** Single source of truth for gentle experience. */
export function shouldReduceMotion() {
  const store = useGameStore()
  return Boolean(store.reducedMotion || store.calmMode || isLowEnd())
}

export const reduceMotion = computed(() => shouldReduceMotion())

export function applyGsapDefaults(gsap) {
  if (!gsap) return
  if (shouldReduceMotion()) {
    gsap.defaults({ duration: 0.2, ease: 'none' })
    gsap.globalTimeline.timeScale(1.4)
  } else {
    gsap.defaults({ ease: 'power2.out' })
    gsap.globalTimeline.timeScale(1)
  }
}
