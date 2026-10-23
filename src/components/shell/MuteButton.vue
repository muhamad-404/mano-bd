<template>
  <IconButton
    :aria-label="store.soundOn ? 'Mute music' : 'Unmute music'"
    :icon="store.soundOn ? 'volume-high' : 'volume-xmark'"
    grad="lavender"
    @click="onToggle"
  />
</template>

<script setup>
import IconButton from '../ui/IconButton.vue'
import { useGameStore, toggleSound } from '../../store/game.js'
import { setMuted } from '../../audio/audioManager.js'

const store = useGameStore()

function onToggle() {
  toggleSound()
  // soundOn is already the new value after toggle
  setMuted(!store.soundOn)
}
</script>
