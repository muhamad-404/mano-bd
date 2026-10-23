<template>
  <div
    ref="root"
    class="cake"
    :class="{ 'cake--float': !store.reducedMotion }"
    aria-hidden="true"
  >
    <svg class="cake__svg" viewBox="0 0 320 360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cake-plate" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF6EE" />
          <stop offset="100%" stop-color="#E8D7C8" />
        </linearGradient>
        <linearGradient id="cake-tier-a" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFC9D9" />
          <stop offset="100%" stop-color="#FF7EA8" />
        </linearGradient>
        <linearGradient id="cake-tier-b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E8DCFF" />
          <stop offset="100%" stop-color="#CDB8FF" />
        </linearGradient>
        <linearGradient id="cake-tier-c" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF6EE" />
          <stop offset="100%" stop-color="#F0E0D0" />
        </linearGradient>
        <linearGradient id="cake-frost" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#FFE8F0" />
        </linearGradient>
        <radialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFD98A" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#FFD98A" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Plate -->
      <ellipse cx="160" cy="330" rx="118" ry="18" fill="url(#cake-plate)" opacity="0.95" />
      <ellipse cx="160" cy="324" rx="108" ry="12" fill="#F5E6DA" />

      <!-- Bottom tier -->
      <rect x="52" y="248" width="216" height="72" rx="22" fill="url(#cake-tier-a)" />
      <path
        d="M60 248 C78 268 96 248 114 268 C132 248 150 268 168 248 C186 268 204 248 222 268 C240 248 258 260 260 248"
        fill="url(#cake-frost)"
      />
      <circle cx="90" cy="280" r="3.5" fill="#FFD98A" />
      <circle cx="130" cy="295" r="2.8" fill="#CDB8FF" />
      <rect x="168" y="274" width="7" height="4" rx="2" fill="#BFE3FF" />
      <circle cx="210" cy="288" r="3.2" fill="#FF7EA8" />
      <rect x="100" y="300" width="6" height="3.5" rx="1.5" fill="#FFF6EE" />

      <!-- Middle tier -->
      <rect x="78" y="188" width="164" height="64" rx="20" fill="url(#cake-tier-b)" />
      <path
        d="M86 188 C100 206 116 188 132 206 C148 188 164 206 180 188 C196 206 212 188 228 206 C236 194 240 198 242 188"
        fill="url(#cake-frost)"
      />
      <circle cx="110" cy="218" r="2.6" fill="#FFD98A" />
      <rect x="150" y="226" width="6" height="3.5" rx="1.5" fill="#E0457B" />
      <circle cx="195" cy="214" r="3" fill="#FFF6EE" />

      <!-- Top tier -->
      <rect x="108" y="138" width="104" height="54" rx="18" fill="url(#cake-tier-c)" />
      <path
        d="M116 138 C128 154 140 138 152 154 C164 138 176 154 188 138 C198 152 208 142 212 138"
        fill="url(#cake-frost)"
      />
      <circle cx="140" cy="164" r="2.4" fill="#FF7EA8" />
      <rect x="172" y="168" width="5" height="3" rx="1.5" fill="#CDB8FF" />

      <!-- Candle -->
      <rect x="154" y="88" width="12" height="52" rx="3" fill="#FFF6EE" />
      <rect x="154" y="88" width="12" height="52" rx="3" fill="#FFC9D9" opacity="0.35" />
      <rect x="157" y="82" width="6" height="8" rx="1.5" fill="#E0457B" />

      <!-- Glow + flame -->
      <g ref="flameGroup" class="cake__flame-group" :class="{ 'is-out': !lit }">
        <circle class="cake__glow" cx="160" cy="68" r="28" fill="url(#flame-glow)" />
        <g class="cake__flame">
          <path
            class="cake__flame-outer"
            d="M160 42 C148 58 146 70 160 78 C174 70 172 58 160 42 Z"
            fill="#FFB347"
          />
          <path
            class="cake__flame-inner"
            d="M160 52 C154 60 154 68 160 72 C166 68 166 60 160 52 Z"
            fill="#FFF6EE"
          />
        </g>
      </g>

      <!-- Smoke (shown when snuffed) -->
      <g ref="smokeGroup" class="cake__smoke" opacity="0">
        <path
          ref="smokeA"
          d="M158 80 C152 60 166 50 154 34"
          fill="none"
          stroke="#CDB8FF"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.55"
        />
        <path
          ref="smokeB"
          d="M164 82 C170 64 156 54 168 36"
          fill="none"
          stroke="#BFE3FF"
          stroke-width="2.5"
          stroke-linecap="round"
          opacity="0.45"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGameStore } from '../../store/game.js'

const props = defineProps({
  lit: {
    type: Boolean,
    default: true,
  },
})

const store = useGameStore()
const root = ref(null)
const flameGroup = ref(null)
const smokeGroup = ref(null)
const smokeA = ref(null)
const smokeB = ref(null)
let smokeTween = null

watch(
  () => props.lit,
  async (isLit, wasLit) => {
    if (isLit || wasLit === undefined) return
    await nextTick()
    if (smokeTween) smokeTween.kill()
    const group = smokeGroup.value
    const a = smokeA.value
    const b = smokeB.value
    if (!group) return
    gsap.set(group, { opacity: 1 })
    gsap.set([a, b], { opacity: 0.5, y: 0 })
    smokeTween = gsap
      .timeline()
      .to([a, b], {
        y: -36,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'power1.out',
      })
      .set(group, { opacity: 0 })
  },
)
</script>

<style scoped>
.cake {
  width: min(72vw, 260px);
  margin: 0 auto;
  will-change: transform;
}

.cake--float {
  animation: cake-float 5s var(--ease-in-out) infinite;
}

.cake__svg {
  display: block;
  width: 100%;
  height: auto;
}

.cake__flame {
  transform-origin: 160px 78px;
  transform-box: fill-box;
  animation: flame-flicker 0.55s ease-in-out infinite alternate;
}

.cake__flame-group.is-out .cake__flame,
.cake__flame-group.is-out .cake__glow {
  animation: none;
  transform: scale(0);
  opacity: 0;
  transition:
    transform 0.25s var(--ease-out),
    opacity 0.25s var(--ease-out);
}

.cake__flame-group:not(.is-out) .cake__flame,
.cake__flame-group:not(.is-out) .cake__glow {
  transition: none;
}

@keyframes cake-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes flame-flicker {
  0% {
    transform: scale(1, 1) skewX(-2deg);
  }
  100% {
    transform: scale(1.05, 0.92) skewX(3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cake--float,
  .cake__flame {
    animation: none;
  }
}
</style>
