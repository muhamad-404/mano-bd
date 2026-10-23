<template>
  <section class="screen">
    <GlassCard class="intro-card stack">
      <p class="intro-card__title">More is coming</p>
      <p class="intro-card__body">This placeholder will become the story intro in Phase 3.</p>
      <PrimaryButton @click="goTo('finale')">Continue</PrimaryButton>
    </GlassCard>
  </section>
</template>

<script setup>
import GlassCard from '../ui/GlassCard.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import { goTo } from '../../store/game.js'
</script>

<style scoped>
.intro-card {
  width: min(100%, 340px);
  text-align: center;
  align-items: center;
}

.intro-card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.intro-card__body {
  margin: 0;
  opacity: 0.75;
}
</style>
