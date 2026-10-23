<template>
  <button
    type="button"
    class="icon-btn press-scale"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <span class="icon-btn__glyph" :class="gradClass" aria-hidden="true">
      <FaIcon :icon="resolvedIcon" />
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
  icon: {
    type: [String, Array],
    required: true,
  },
  grad: {
    type: String,
    default: 'rose',
  },
})

defineEmits(['click'])

const resolvedIcon = computed(() => {
  if (Array.isArray(props.icon)) return props.icon
  return ['fas', props.icon]
})

const gradClass = computed(() => `fa-grad-${props.grad}`)
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 8px 20px rgba(27, 21, 51, 0.1);
  cursor: pointer;
  color: var(--color-night);
  transition: transform 0.18s var(--ease-out);
}

.icon-btn:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

.icon-btn__glyph {
  display: inline-flex;
  font-size: 1.05rem;
  line-height: 1;
}

html.is-low-end .icon-btn {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
</style>
