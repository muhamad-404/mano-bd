<template>
  <main class="setup">
    <svg width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF7EA8" />
          <stop offset="100%" stop-color="#E0457B" />
        </linearGradient>
      </defs>
    </svg>
    <div class="glass">
      <h1 class="title">For Mano</h1>
      <span class="heart" aria-hidden="true">
        <FaIcon :icon="['fas', 'heart']" />
      </span>
      <p class="status">Setup complete</p>
    </div>
  </main>
</template>

<style scoped>
.setup {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-5);
  padding-top: calc(var(--space-5) + var(--safe-top));
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
}

.glass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: min(100%, 340px);
  padding: var(--space-6) var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 246, 238, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(27, 21, 51, 0.12);
  text-align: center;
}

.title {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(2rem, 8vw, 2.75rem);
  font-weight: 400;
  color: var(--color-night);
  line-height: 1.2;
}

.heart {
  display: inline-flex;
  font-size: 2.25rem;
  line-height: 1;
}

.heart :deep(svg path) {
  fill: url(#heart-grad);
}

.status {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-night);
  opacity: 0.75;
}
</style>
