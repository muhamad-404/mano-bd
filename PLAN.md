# Mano Birthday Website - Full Plan

A mobile-first, fully animated, static birthday experience for Mano, deployable on GitHub Pages. Prepared for Ahsan. Project codename: `mano-birthday`.

## 1. Vision

A single-page interactive experience that feels like a small game and a love letter at once. She taps once to begin, music starts, and she moves through the story of the two of you: the beginning (17 March 2023), university, the hard times, the distance since 30 July 2026, and finally her birthday (25 October 2026), where she blows out a candle and receives your letter.

The feeling to aim for: *I have been thinking about us the whole time.* Effects impress her for ten seconds; your words, dates and voice are what she will remember.

## 2. Non-negotiables

- **Mobile first.** Design at 360 x 780 first, then scale up. Desktop is a bonus.
- **No emojis anywhere** in the UI, content or code comments shown to users. Use Font Awesome Free icons only (solid and regular), colored with CSS gradients.
- **No photos.** All visuals are SVG, CSS, canvas-drawn shapes, procedural textures and Font Awesome icons.
- **Static only.** No backend. Progress is stored in `localStorage`.
- **No forced fail states.** Games are forgiving. She cannot lose; she can only finish.
- **Every phase ends in a working, deployable build.**

## 3. Stack (final)

| Purpose | Choice |
| --- | --- |
| Framework and build | Vue 3 (Composition API, plain JavaScript) + Vite |
| Games | Phaser 3, lazy-loaded only when a level starts |
| UI animation | GSAP (core + ScrollTrigger only if needed) |
| Audio | Howler.js for music; Web Audio API for generated sound effects and mic blow detection |
| Particles | tsParticles slim (`@tsparticles/vue3`, `@tsparticles/slim`) |
| Confetti and fireworks | canvas-confetti |
| Typewriter | Typed.js |
| Optional vector animations | lottie-web (only if you download Lottie JSON files) |
| Icons | Font Awesome Free via `@fortawesome/vue-fontawesome` (tree-shaken) |
| Fonts (self-hosted) | `@fontsource/pacifico`, `@fontsource/dancing-script`, `@fontsource/quicksand` |
| State | Tiny reactive store (no Pinia, no router) |
| Dev tools | `@vitejs/plugin-basic-ssl`, `qrcode-terminal`, `gh-pages` |
| Hosting | GitHub Pages via GitHub Actions |

Reference repositories (read, do not copy blindly):

- https://github.com/phaserjs/template-vue (how Vue and Phaser talk to each other)
- https://github.com/phaserjs/phaser
- https://github.com/greensock/GSAP
- https://github.com/catdad/canvas-confetti
- https://github.com/tsparticles/tsparticles
- https://github.com/goldfire/howler.js
- https://github.com/mattboldt/typed.js
- https://github.com/Masth0/ScratchCard (reference only; we build our own scratch component for better touch control and no image dependency)

Free assets you add by hand (the agent cannot download these for you): background music from Pixabay Music, optional Lottie files from LottieFiles. Check each license. Sound effects are generated in code, so no download is needed.

## 4. Experience flow

1. **Gate screen.** If the current time in Asia/Karachi is before `2026-10-25T00:00:00+05:00`, show a soft countdown with a lock icon. A preview bypass (`?preview=1`, remembered in localStorage) lets you test. After the unlock time the gate becomes the start screen.
2. **Start screen.** Title, her name, a pulsing button: "Tap to begin". This tap unlocks audio, starts the music and enters fullscreen-like mode.
3. **Story intro.** Typed opening message, then a vertical story timeline (GSAP scroll or tap-to-advance) with live counters: days together since 17 March 2023, days since we last met (30 July 2026), and age (22).
4. **Quest map.** A winding vertical path of four glowing nodes. Each node starts a level. A keepsake counter shows notes collected (0 of 22).
5. **Levels (Phaser).**
   - Level 1, The Beginning (17 Mar 2023): calm catch-the-hearts, target 8. Rewards 5 notes.
   - Level 2, University: faster hearts with bonus stars, target 12. Rewards 5 notes.
   - Level 3, The Storm: dark clouds drift across; touching one only slows her, never ends the level. Collect stars until the clouds part and a rainbow appears. Rewards 5 notes.
   - Level 4, Until We Meet Again: steer a paper plane across a night sky from one side (you) to the other (her), collecting stars while a distance bar fills. Ends on the counter of days since 30 July. Rewards 7 notes.
6. **Scratch notes.** Each reward is a scratch card. Scratch 50 percent to reveal one of the 22 notes. Collected notes live in a Keepsakes gallery.
7. **Open-When envelopes.** A hub of 6 to 8 envelopes that open with an animation to a short message (and optionally an audio file). Available from the menu at any time after the intro.
8. **Finale.** Dark night scene, a cake drawn in SVG with one candle. She blows into the mic (tap fallback always available). The flame goes out, fireworks burst, "Happy 22nd Birthday, Mano" appears, and your final letter types out. Optional: play your voice note.

The finale is available after the quest is finished or after the unlock time, whichever you decide in config (`FINALE_REQUIRES_QUEST`).

## 5. Design system

**Palette (CSS variables):** blush `#FFC9D9`, rose `#FF7EA8`, deep rose `#E0457B`, lavender `#CDB8FF`, sky `#BFE3FF`, cream `#FFF6EE`, night `#1B1533`, gold `#FFD98A`.

**Style:** soft pastel gradients, glassmorphism cards (blur, thin white border), large rounded corners (24 px), generous spacing, gentle glow on interactive elements.

**Type:** Pacifico for the title only, Dancing Script for letters and notes, Quicksand for UI text.

**Icons (Font Awesome Free):** heart, star, cake-candles, envelope, envelope-open-text, gift, lock, key, music, volume-xmark, wand-magic-sparkles, cloud-rain, cloud-sun, rainbow, paper-plane, moon, hand-pointer, book-open, graduation-cap, circle-check, chevron-down. Color them with gradient fills through CSS (`fill: url(#grad)` or `background-clip: text` on the icon wrapper). Duotone is Pro only, so do not use it.

**Motion language:** ease-out for entrances (0.6 to 0.9 s), small staggers (60 to 100 ms), floating loops of 4 to 7 s for ambient elements, spring-like scale on taps, no abrupt cuts between scenes (cross-fade plus slight upward drift). Respect `prefers-reduced-motion` by shortening or disabling loops.

## 6. Content you need to write

Put everything in `src/content/*.js` so you can edit text without touching components. The agent fills placeholders marked `TODO_AHSAN`; you replace them with your own words.

- Gate text and start-screen line
- Opening message (3 to 5 sentences)
- 4 chapter texts (2 to 4 sentences each)
- 22 scratch notes (one line each, for example "Reason 7 I love you: ...")
- 6 to 8 Open-When messages
- Final letter (150 to 300 words)
- Optional: a voice note (`public/audio/voice-note.mp3`)
- Background music (`public/audio/bgm.mp3`, 2 to 4 minutes, loops)

## 7. Architecture

```
mano-birthday/
  index.html
  vite.config.js
  package.json
  README.md
  AGENTS.md
  .cursor/rules/mano-birthday.mdc
  .github/workflows/deploy.yml
  scripts/lan-url.mjs
  public/
    audio/            (bgm.mp3, voice-note.mp3 - added by hand)
    favicon.svg
  src/
    main.js
    App.vue
    config.js         (dates, unlock time, feature flags)
    plugins/icons.js  (Font Awesome registrations)
    styles/           (tokens.css, base.css, animations.css)
    content/          (story.js, notes.js, envelopes.js, letter.js)
    store/game.js     (reactive state + localStorage)
    audio/            (audioManager.js, synth.js, mic.js)
    utils/            (dates.js, device.js, storage.js)
    components/
      shell/          (SceneManager.vue, TopBar.vue, MuteButton.vue, ParticleBackdrop.vue)
      screens/        (GateScreen.vue, StartScreen.vue, IntroScreen.vue, StoryTimeline.vue, QuestMap.vue, Keepsakes.vue, Envelopes.vue, FinaleScreen.vue)
      ui/               (GlassCard.vue, PrimaryButton.vue, Counter.vue, ScratchCard.vue, EnvelopeCard.vue, CakeSvg.vue)
    game/
      GameHost.vue    (mounts Phaser, lazy import)
      createGame.js
      scenes/         (Boot.js, CatchHearts.js, Storm.js, PaperPlane.js)
      textures.js     (procedural heart, star, cloud, plane, basket textures)
```

**State machine:** `gate -> start -> intro -> quest -> (level n) -> keepsakes / envelopes -> finale`. `SceneManager.vue` renders one screen at a time with a GSAP cross-fade. State persists: sound on or off, levels completed, notes unlocked, envelopes opened, finale seen.

**Phaser rules:** import Phaser dynamically inside `GameHost.vue`; destroy the game on unmount; use `Phaser.Scale.FIT` with `autoCenter`; cap resolution at devicePixelRatio 2; all textures generated in code; input is a single horizontal drag (or plane steering by drag), with no on-screen buttons needed.

## 8. Mobile-first rules

- Viewport meta with `viewport-fit=cover`; use `100dvh`, never `100vh`.
- Respect safe areas with `env(safe-area-inset-*)` padding on top bars and bottom buttons.
- Tap targets at least 44 x 44 px. `touch-action: manipulation` on buttons, `touch-action: none` on game and scratch canvases.
- Disable text selection and long-press callouts on game surfaces. Prevent rubber-band scrolling during levels.
- Audio only starts after the first tap (iOS and Android policy). Pause music on `visibilitychange`, resume when she returns.
- Microphone requires a secure context. `localhost` works, a plain-HTTP LAN address does not, so use `npm run dev:https` when testing blow detection on your phone. GitHub Pages is HTTPS, so production is fine.
- Vibration (`navigator.vibrate`) works on Android only; treat it as optional.
- Portrait is primary. In landscape show a gentle "please rotate" overlay during levels only.
- Performance budget: initial JavaScript under about 200 KB gzipped (Phaser excluded, it is a lazy chunk), particles capped at about 40 on mobile, animate only `transform` and `opacity`, no large blur filters on animated layers.

## 9. Phases

Work one phase at a time. After each phase: run `npm run build`, test on your phone, then confirm before moving on (this matches how you like to work: surgical changes, one step at a time, confirmation at each major step).

**Phase 0 - Project setup and tooling.** Scaffold, install every library, configure Vite for LAN and HTTPS preview, print a QR code for your phone, set up Font Awesome and fonts, rules files, deploy workflow. Done when `npm run dev:mobile` shows a Network URL and QR, the blank branded page loads on your phone, and `npm run build` passes. (Full agent prompt in section 10.)

**Phase 1 - Design system and app shell.** Tokens, base CSS, Glass card and buttons, top bar with mute toggle, particle backdrop, scene manager with transitions, audio manager (Howler music with fade, mute persisted), Gate and Start screens. Done when the gate counts down, the start tap begins music, and transitions are smooth at 60 fps on your phone.

**Phase 2 - Finale (shippable MVP).** Cake SVG with animated flame, mic blow detection with tap fallback, fireworks, name reveal, typed final letter, optional voice note. Deploy to GitHub Pages at the end of this phase so a working gift exists, even if later phases are unfinished. Done when the whole gate, start, finale path works end to end on a real phone over HTTPS.

**Phase 3 - Story intro and timeline.** Opening typed message, vertical timeline with the four chapters, live counters (days together, days apart, age), subtle parallax floating shapes. Done when the content is read from `src/content` and the counters are correct in Asia/Karachi time.

**Phase 4 - Keepsakes: scratch cards and envelopes.** Custom `ScratchCard.vue` (canvas, pointer events, 50 percent threshold, sparkle on reveal, haptic where available), Keepsakes gallery of the 22 notes, Open-When envelope hub with open animation and optional audio. Done when notes and envelopes persist across reloads.

**Phase 5 - Quest map and Phaser integration.** Quest map with four nodes and lock states, `GameHost.vue` with lazy Phaser import, procedural textures, Level 1 (catch hearts) with reward flow into scratch cards. Done when Phaser loads only after tapping a node and the initial bundle stays within budget.

**Phase 6 - Levels 2, 3 and 4.** University level, Storm level, Paper Plane level, each wired to rewards and the quest map. Done when all four levels are finishable on a mid-range Android phone with no frame drops.

**Phase 7 - Polish and optimization.** Reduced-motion support, loading screen and asset preloading, error fallbacks (mic denied, audio blocked, storage unavailable), iOS Safari fixes, accessibility labels, bundle analysis, optional encrypted final letter (see section 12). Done when Lighthouse mobile performance is 85 or higher and there are no console errors.

**Phase 8 - Final QA and launch.** Test on at least one iPhone-size and one Android-size viewport, test slow network throttling, set the real unlock time, remove the preview bypass or keep it hidden, deploy, and test the live URL on her kind of device. Send her the link.

## 10. Phase 0 prompt (paste this into the Cursor agent in an empty folder)

```
You are setting up a new project in the current empty directory. Do ONLY Phase 0 (setup and tooling). Do not build any screens yet. Work step by step and tell me when each step is done.

Project: mano-birthday, a mobile-first, static, interactive birthday website for GitHub Pages.
Stack: Vue 3 + Vite (plain JavaScript), Phaser 3, GSAP, Howler, tsParticles, canvas-confetti, Typed.js, lottie-web, Font Awesome Free (vue-fontawesome), self-hosted fonts via Fontsource.
Hard rules: mobile first; absolutely no emojis anywhere in code, content or UI; icons are Font Awesome only; no image files of people; no backend. If any API in this prompt differs from the package's current README, follow the README.

STEP 1 - Environment
- Check `node -v` (need 20 or newer) and `npm -v`. If Node is too old, stop and tell me.

STEP 2 - Scaffold
- Run: npm create vite@latest . -- --template vue
  (If it asks about the non-empty directory, choose to ignore existing files and continue. If it offers experimental options, say no.)
- Run: npm install

STEP 3 - Install dependencies
Runtime:
  npm install phaser gsap howler canvas-confetti typed.js lottie-web @tsparticles/vue3 @tsparticles/slim @tsparticles/engine @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/vue-fontawesome @fontsource/pacifico @fontsource/dancing-script @fontsource/quicksand
Dev:
  npm install -D @vitejs/plugin-basic-ssl qrcode-terminal gh-pages

STEP 4 - Vite config (vite.config.js)
- Plugins: vue(); add basicSsl() only when the Vite mode is 'https'.
- base: process.env.VITE_BASE || '/'
- server: { host: true, port: 5173, strictPort: true }  (host true exposes the LAN URL)
- preview: { host: true, port: 4173, strictPort: true }
- build: target 'es2020'; split phaser and gsap into their own chunks (use manualChunks, or the current equivalent if Vite warns); chunkSizeWarningLimit 1500.
- Make sure Phaser is NOT imported statically anywhere in the entry path (it will be dynamically imported later).

STEP 5 - Scripts (package.json)
  "dev": "vite",
  "dev:mobile": "node scripts/lan-url.mjs && vite --host",
  "dev:https": "node scripts/lan-url.mjs https && vite --host --mode https",
  "build": "vite build",
  "preview": "vite preview --host",
  "preview:mobile": "npm run build && node scripts/lan-url.mjs preview && vite preview --host",
  "deploy:manual": "gh-pages -d dist"

STEP 6 - Phone preview helper (scripts/lan-url.mjs)
Write a small Node script that:
- reads os.networkInterfaces(), picks non-internal IPv4 addresses,
- takes an optional argument: 'https' (port 5173 with https), 'preview' (port 4173), default http on 5173,
- prints a clear box in the terminal: "Open on your phone (same Wi-Fi): <url>" for each address,
- prints a QR code of the first address using qrcode-terminal (small mode),
- prints a one-line reminder: microphone features need `npm run dev:https` on a phone, and the first HTTPS visit shows a self-signed certificate warning that is safe to accept for your own dev server.

STEP 7 - Index and viewport (index.html)
- <html lang="en">, title "For Mano".
- meta viewport: width=device-width, initial-scale=1, viewport-fit=cover.
- meta theme-color #1B1533, meta color-scheme "light dark".
- Add public/favicon.svg (a simple heart drawn as SVG, no emoji) and link it.
- Body margin 0; #app uses min-height 100dvh.

STEP 8 - Folder structure
Create exactly the folders and empty/placeholder files listed here (placeholders contain a one-line comment only):
  src/config.js, src/plugins/icons.js, src/styles/{tokens.css,base.css,animations.css}, src/content/{story.js,notes.js,envelopes.js,letter.js}, src/store/game.js, src/audio/{audioManager.js,synth.js,mic.js}, src/utils/{dates.js,device.js,storage.js}, src/components/{shell,screens,ui}/ (with .gitkeep), src/game/{scenes,.gitkeep}, public/audio/.gitkeep.
- Remove the default Vite demo content (HelloWorld component, demo assets, default CSS).

STEP 9 - Config and tokens
- src/config.js exports: COUPLE_START = '2023-03-17', LAST_MET = '2026-07-30', BIRTHDAY = '2026-10-25', AGE = 22, TIMEZONE = 'Asia/Karachi', UNLOCK_AT = '2026-10-25T00:00:00+05:00', FINALE_REQUIRES_QUEST = false, STORAGE_KEY = 'mano-bday-v1'.
- src/styles/tokens.css: CSS variables for the palette (blush #FFC9D9, rose #FF7EA8, deep rose #E0457B, lavender #CDB8FF, sky #BFE3FF, cream #FFF6EE, night #1B1533, gold #FFD98A), radii (24px), spacing scale, font stacks, easing curves, safe-area variables.
- src/styles/base.css: import fonts from @fontsource (Pacifico 400, Dancing Script 500/700, Quicksand 400/600/700); reset; body background gradient; use 100dvh; user-select none on .no-select; -webkit-tap-highlight-color transparent; touch-action manipulation on buttons; prefers-reduced-motion rules.
- Import tokens.css, base.css and animations.css in src/main.js.

STEP 10 - Font Awesome (src/plugins/icons.js)
- Register a tree-shaken set from free-solid and free-regular: heart, star, cake-candles, envelope, envelope-open-text, gift, lock, key, music, volume-xmark, volume-high, wand-magic-sparkles, cloud-rain, cloud-sun, rainbow, paper-plane, moon, hand-pointer, book-open, graduation-cap, circle-check, chevron-down, chevron-left, xmark.
- Export an install function that registers the FontAwesomeIcon component globally as <FaIcon>. Call it in main.js.

STEP 11 - Minimal App.vue
- Show a centered glass card with the text "For Mano", a heart <FaIcon> with a CSS gradient color, and the line "Setup complete". Nothing else. No emojis.

STEP 12 - Project rules for future AI sessions
- Create AGENTS.md and .cursor/rules/mano-birthday.mdc (alwaysApply: true) containing: the stack list; the hard rules (mobile first, no emojis, Font Awesome only, no photos, no backend, JS only, content lives in src/content, Phaser loaded lazily, animate only transform/opacity, respect reduced motion, 44px tap targets, 100dvh); the phase list (Phase 0 to 8 names only); and "Work one phase at a time and ask for confirmation before starting the next phase. Prefer small, surgical edits."

STEP 13 - GitHub Pages workflow (.github/workflows/deploy.yml)
- Trigger on push to main and workflow_dispatch.
- Permissions: contents read, pages write, id-token write.
- Steps: actions/checkout, actions/setup-node (node 20, npm cache), npm ci, npm run build with env VITE_BASE=/${{ github.event.repository.name }}/, actions/configure-pages, actions/upload-pages-artifact (path dist), actions/deploy-pages. Use the current major versions of these official actions.

STEP 14 - Repo hygiene
- .gitignore (node_modules, dist, .DS_Store, *.local, .env*), README.md with: what the project is, the commands (dev, dev:mobile, dev:https, build, preview:mobile), how to test on a phone, how to deploy (push to main with Pages source set to GitHub Actions), and where to put audio files.
- Run: git init, then make the first commit "Phase 0: project setup". Do not push anything.

STEP 15 - Verify (report each result)
1. npm run build succeeds with no errors.
2. npm run dev:mobile starts, prints Network URL(s) and a QR code in the terminal.
3. The page at the printed LAN URL renders the "For Mano" card.
4. npm run dev:https starts (self-signed cert warning is expected).
5. No emoji characters exist in the repository (search for common emoji ranges) and no unused default Vite files remain.
Finally, list any deviations from this prompt and any package API differences you adapted to. Then STOP and wait for me to say "Start Phase 1".
```

## 11. How to use the later phases

After Phase 0, start each phase with a short message to the Cursor agent, for example:

> Start Phase 1. Follow AGENTS.md and the Phase 1 description in PLAN.md. Show me the plan of files you will touch, wait for my confirmation, then implement. No emojis, Font Awesome only, mobile first.

Save this document in the repo as `PLAN.md` so the agent can read the phase descriptions directly. If you want, bring each phase back here first and I will turn it into a detailed agent prompt like the one above.

## 12. Notes and risks

- **Timing.** Her birthday is tomorrow (25 October 2026). Phases 0 to 2 are the shippable core: setup, shell and finale. Deploy after Phase 2 and keep adding the quest, keepsakes and envelopes afterward as a growing gift. The gate screen can show a countdown until midnight so an early deploy still feels intentional.
- **Privacy.** A GitHub Pages site is public to anyone with the link, and on a free GitHub plan the repository must be public, so your letters would be readable in the source. Use a non-obvious repository name and avoid anything you would not want a stranger to read. Optional hardening in Phase 7: store the final letter encrypted (Web Crypto, AES-GCM, key derived from an answer only she knows, such as the date you started) so the repository never contains the plain text.
- **Audio licensing.** Use only music you are allowed to reuse (Pixabay license or similar), and keep the file under about 4 MB so mobile loads fast.
- **iOS quirks.** Safari blocks audio before a tap, treats the microphone prompt strictly, and ignores some fullscreen APIs. All of these are handled by the start tap and the tap-to-blow fallback.
- **Time zones.** All countdowns and day counters use Asia/Karachi so she sees the correct day regardless of her phone settings.
- **Scope control.** If time runs short, cut in this order: Level 4, Level 3, Level 2. Keep Level 1, the scratch notes, the envelopes and the finale.
