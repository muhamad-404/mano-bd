<template>
  <button
    type="button"
    class="envelope-card"
    :class="{ 'is-open': opened, 'is-active': active }"
    :aria-label="envelope.label"
    @click="$emit('select', envelope.id)"
  >
    <div class="envelope-card__body">
      <div class="envelope-card__flap" aria-hidden="true" />
      <div class="envelope-card__face">
        <span class="envelope-card__icon fa-grad-rose" aria-hidden="true">
          <FaIcon :icon="['fas', envelope.icon]" />
        </span>
        <span class="envelope-card__label">{{ envelope.label }}</span>
      </div>
      <span class="envelope-card__seal" aria-hidden="true">
        <FaIcon :icon="['fas', opened ? 'circle-check' : 'heart']" />
      </span>
    </div>
  </button>
</template>

<script setup>
defineProps({
  envelope: { type: Object, required: true },
  opened: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
})

defineEmits(['select'])
</script>

<style scoped>
.envelope-card {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
  color: var(--color-night);
}

.envelope-card__body {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(160deg, #fff6ee, #ffc9d9);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 24px rgba(27, 21, 51, 0.1);
  overflow: hidden;
  min-height: 110px;
  perspective: 600px;
}

.envelope-card__flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 48%;
  background: linear-gradient(180deg, #cdb8ff, #ff7ea8);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top center;
  transition: transform 0.6s var(--ease-out);
  z-index: 2;
}

.envelope-card.is-open .envelope-card__flap,
.envelope-card.is-active .envelope-card__flap {
  transform: rotateX(180deg);
}

.envelope-card__face {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4);
  min-height: 110px;
}

.envelope-card__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.envelope-card__label {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
}

.envelope-card__seal {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e0457b;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  z-index: 3;
  box-shadow: 0 4px 10px rgba(224, 69, 123, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .envelope-card__flap {
    transition: none;
  }
}
</style>
