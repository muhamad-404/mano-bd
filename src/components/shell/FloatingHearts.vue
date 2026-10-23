<template>
  <div class="floating-hearts" aria-hidden="true">
    <svg
      v-for="heart in hearts"
      :key="heart.id"
      class="floating-hearts__item"
      :class="{ 'is-burst': heart.burst }"
      :viewBox="'0 0 24 24'"
      :style="heart.style"
    >
      <path :fill="heart.fill" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'
import { isLowEnd } from '../../utils/device.js'
import { heartBurstTick } from '../../utils/heartBurst.js'

const store = useGameStore()
const hearts = ref([])
let idSeq = 0

function ambientCount() {
  if (store.reducedMotion) return 0
  return isLowEnd() ? 6 : 10
}

function makeAmbient() {
  const count = ambientCount()
  const list = []
  for (let i = 0; i < count; i += 1) {
    const size = 14 + Math.random() * 18
    const left = Math.random() * 100
    const duration = 10 + Math.random() * 10
    const delay = Math.random() * -duration
    const fill = Math.random() > 0.5 ? 'url(#grad-rose)' : 'url(#grad-lavender)'
    list.push({
      id: `a-${idSeq++}`,
      burst: false,
      fill,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        opacity: 0.35 + Math.random() * 0.35,
      },
    })
  }
  hearts.value = list
}

function runBurst() {
  if (store.reducedMotion) return
  const burstCount = isLowEnd() ? 6 : 12
  const created = []
  for (let i = 0; i < burstCount; i += 1) {
    const size = 16 + Math.random() * 20
    const item = {
      id: `b-${idSeq++}`,
      burst: true,
      fill: Math.random() > 0.5 ? 'url(#grad-rose)' : 'url(#grad-lavender)',
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${40 + Math.random() * 20}%`,
        bottom: '28%',
        opacity: 0,
        transform: 'translate(-50%, 0) scale(0.6)',
      },
    }
    created.push(item)
    hearts.value.push(item)
  }

  requestAnimationFrame(() => {
    const nodes = document.querySelectorAll('.floating-hearts__item.is-burst')
    nodes.forEach((node, index) => {
      const dx = (Math.random() - 0.5) * 160
      const dy = -120 - Math.random() * 160
      gsap.fromTo(
        node,
        { opacity: 0, x: 0, y: 0, scale: 0.6 },
        {
          opacity: 0.9,
          x: dx,
          y: dy,
          scale: 1,
          duration: 0.9,
          ease: 'power2.out',
          delay: index * 0.02,
          onComplete() {
            gsap.to(node, {
              opacity: 0,
              duration: 0.35,
              onComplete() {
                hearts.value = hearts.value.filter((h) => h.id !== created[index]?.id)
              },
            })
          },
        },
      )
    })
  })
}

onMounted(() => makeAmbient())

watch(
  () => store.reducedMotion,
  () => makeAmbient(),
)

watch(heartBurstTick, () => runBurst())

onUnmounted(() => {
  hearts.value = []
})
</script>

<style scoped>
.floating-hearts {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.floating-hearts__item {
  position: absolute;
  bottom: -40px;
  will-change: transform, opacity;
}

.floating-hearts__item:not(.is-burst) {
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes rise {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0;
  }
  10% {
    opacity: 0.55;
  }
  100% {
    transform: translate3d(0, -110dvh, 0);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-hearts__item:not(.is-burst) {
    animation: none;
    display: none;
  }
}
</style>
