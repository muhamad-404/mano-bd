<template>
  <div class="glass glass-card" :style="paddingStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  padding: {
    type: [String, Number],
    default: null,
  },
})

const paddingStyle = computed(() => {
  if (props.padding == null) return undefined
  const value = typeof props.padding === 'number' ? `${props.padding}px` : props.padding
  return { padding: value }
})
</script>

<style scoped>
.glass-card {
  padding: var(--space-5);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
