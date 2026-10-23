<template>
  <button
    type="button"
    class="primary-btn anim-shimmer press-scale"
    :class="{ 'is-disabled': disabled || loading }"
    :disabled="disabled || loading"
    @click="onClick"
  >
    <span v-if="icon" class="primary-btn__icon fa-grad-rose" aria-hidden="true">
      <FaIcon :icon="['fas', icon]" />
    </span>
    <span class="primary-btn__label">
      <slot>{{ loading ? 'Loading' : 'Continue' }}</slot>
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

function onClick(event) {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<style scoped>
.primary-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 52px;
  min-width: 44px;
  padding: 0 var(--space-5);
  border: none;
  border-radius: 999px;
  overflow: hidden;
  cursor: pointer;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: linear-gradient(135deg, var(--color-rose), var(--color-deep-rose));
  box-shadow: 0 10px 24px rgba(224, 69, 123, 0.35);
  transition: transform 0.18s var(--ease-out), opacity 0.18s var(--ease-out);
}

.primary-btn:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 3px;
}

.primary-btn.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-btn__icon {
  display: inline-flex;
  font-size: 1.1rem;
  line-height: 1;
}

.primary-btn__label {
  position: relative;
  z-index: 1;
}
</style>
