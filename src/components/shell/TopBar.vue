<template>
  <header v-if="store.scene !== 'gate'" class="top-bar">
    <div class="top-bar__left">
      <HubMenu />
    </div>
    <div class="top-bar__right">
      <MuteButton />
    </div>
  </header>
</template>

<script setup>
import MuteButton from './MuteButton.vue'
import HubMenu from './HubMenu.vue'
import { useGameStore } from '../../store/game.js'

const store = useGameStore()
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
</style>
