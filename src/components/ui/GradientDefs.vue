<template>
  <svg
    width="0"
    height="0"
    aria-hidden="true"
    focusable="false"
    class="gradient-defs"
  >
    <defs>
      <linearGradient id="grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF7EA8" />
        <stop offset="100%" stop-color="#E0457B" />
      </linearGradient>
      <linearGradient id="grad-lavender" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#CDB8FF" />
        <stop offset="100%" stop-color="#8F7BE8" />
      </linearGradient>
      <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD98A" />
        <stop offset="100%" stop-color="#FFB347" />
      </linearGradient>
      <linearGradient id="grad-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#BFE3FF" />
        <stop offset="100%" stop-color="#7DB8F0" />
      </linearGradient>
    </defs>
  </svg>
</template>

<style scoped>
.gradient-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
