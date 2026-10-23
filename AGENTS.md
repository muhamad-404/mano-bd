# mano-birthday — agent guide

## Stack

- Vue 3 (Composition API, plain JavaScript) + Vite
- Phaser (lazy-loaded only when a level starts)
- GSAP
- Howler.js
- Web Audio API (synth + mic)
- tsParticles (`@tsparticles/vue3`, `@tsparticles/slim`)
- canvas-confetti
- Typed.js
- lottie-web (optional)
- Font Awesome Free via `@fortawesome/vue-fontawesome`
- Fontsource: Pacifico, Dancing Script, Quicksand
- GitHub Pages (Actions)

## Hard rules

- Mobile first (design at 360 x 780, then scale up).
- Absolutely no emojis anywhere in code, content, or UI.
- Icons are Font Awesome only (solid and regular).
- No image files of people; visuals are SVG, CSS, canvas, procedural textures, icons.
- No backend; progress in `localStorage`.
- JavaScript only (no TypeScript).
- Content lives in `src/content`.
- Phaser is loaded lazily (never a static import on the entry path).
- Animate only `transform` and `opacity`.
- Respect `prefers-reduced-motion`.
- Tap targets at least 44 x 44 px.
- Use `100dvh`, never `100vh`.

## Phases

- Phase 0 - Project setup and tooling
- Phase 1 - Design system and app shell
- Phase 2 - Finale (shippable MVP)
- Phase 3 - Story intro and timeline
- Phase 4 - Keepsakes: scratch cards and envelopes
- Phase 5 - Quest map and Phaser integration
- Phase 6 - Levels 2, 3 and 4
- Phase 7 - Polish and optimization
- Phase 8 - Final QA and launch

Work one phase at a time and ask for confirmation before starting the next phase. Prefer small, surgical edits.
