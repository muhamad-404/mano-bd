<template>
  <section class="screen">
    <GlassCard class="placeholder">
      <p class="placeholder__label">{{ label }}</p>
      <p class="placeholder__hint">Coming in a later phase</p>
    </GlassCard>
  </section>
</template>

<script setup>
import GlassCard from '../ui/GlassCard.vue'

defineProps({
  label: {
    type: String,
    default: 'Soon',
  },
})
</script>

<style scoped>
.placeholder {
  text-align: center;
  max-width: 320px;
}

.placeholder__label {
  margin: 0 0 var(--space-2);
  font-weight: 700;
  font-size: 1.15rem;
}

.placeholder__hint {
  margin: 0;
  opacity: 0.7;
}
</style>
