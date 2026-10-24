<template>
  <header v-if="store.scene !== 'gate'" class="top-bar">
    <div v-if="showHub" class="top-bar__left">
      <HubMenu />
    </div>
    <div v-else class="top-bar__spacer" aria-hidden="true" />
    <div class="top-bar__right">
      <MuteButton />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import MuteButton from './MuteButton.vue'
import HubMenu from './HubMenu.vue'
import { useGameStore } from '../../store/game.js'

const store = useGameStore()

/** Hub is hidden on finale/level/intro — do not keep an empty hit target over Back. */
const showHub = computed(() =>
  ['timeline', 'quest', 'keepsakes', 'envelopes', 'reward'].includes(store.scene),
)
</script>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: calc(var(--space-3) + var(--safe-top));
  padding-right: calc(var(--space-4) + var(--safe-right));
  padding-bottom: var(--space-3);
  padding-left: calc(var(--space-4) + var(--safe-left));
  pointer-events: none;
}

.top-bar__left,
.top-bar__right {
  min-width: 44px;
  min-height: 44px;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
}

.top-bar__spacer {
  min-width: 44px;
  min-height: 44px;
  pointer-events: none;
}
</style>
