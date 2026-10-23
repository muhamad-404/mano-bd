<template>
  <span class="counter" aria-live="polite">{{ display }}{{ suffix }}</span>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'

const props = defineProps({
  to: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    default: 0.9,
  },
  suffix: {
    type: String,
    default: '',
  },
})

const store = useGameStore()
const display = ref(0)
let tween = null

function animateTo(target) {
  if (tween) tween.kill()
  if (store.reducedMotion) {
    display.value = Math.round(target)
    return
  }
  const state = { value: display.value }
  tween = gsap.to(state, {
    value: target,
    duration: props.duration,
    ease: 'power2.out',
    onUpdate() {
      display.value = Math.round(state.value)
    },
  })
}

onMounted(() => animateTo(props.to))

watch(
  () => props.to,
  (next) => animateTo(next),
)

onUnmounted(() => {
  if (tween) tween.kill()
})
</script>

<style scoped>
.counter {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
</style>
