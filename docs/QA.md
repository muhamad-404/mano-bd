# QA and launch checklist

Release candidate checklist for mano-birthday. Automated items are marked done where verified in Phase 8. **Unchecked boxes are for you** (content, audio files, real devices, push).

## Preview bypass (testing before midnight)

Open (replace host/path as needed):

```
http://localhost:5173/?preview=AdImtCNjEgRz
https://<user>.github.io/<repo>/?preview=AdImtCNjEgRz
```

- Old `?preview=1` no longer works.
- Key lives in `src/config.js` as `PREVIEW_KEY`.

## Unlock / time

| Item | Value |
| --- | --- |
| `UNLOCK_AT` | `2026-10-25T00:00:00+05:00` |
| `TIMEZONE` | `Asia/Karachi` |
| `FINALE_REQUIRES_QUEST` | `false` (finale after intro; set `true` in config if you want quest gating) |

Run: `npm run check:unlock`

### Timezone / clock notes

- Gate compares **UTC instants** (`UNLOCK_AT` with `+05:00` vs `Date.now()`). Changing the phone display timezone (DevTools Sensors) does **not** unlock early or late by itself.
- Countdown labels use Karachi calendar formatting for display where applicable.
- **Limitation:** a static site cannot stop someone who sets the device clock past unlock. Treat the gate as soft protection, not security.

- [x] `npm run check:unlock` runs and prints remaining time
- [x] Documented TZ / clock-tamper limitation

## Content placeholders (`TODO_AHSAN`)

**Do not invent personal details.** Replace these with your words.

### Counts

| File | Count |
| --- | ---: |
| `src/content/story.js` | 13 |
| `src/content/letter.js` | 5 |
| `src/content/notes.js` | 1 (covers all 22 note texts) |
| `src/content/envelopes.js` | 1 (covers all 8 envelope texts) |
| `PLAN.md` (docs only) | 1 |
| **Content total** | **20** (excl. PLAN) |

### Lines (content)

**story.js**

- L2 gate title/subtitle block
- L8 start screen block
- L16, L18, L20, L22 opening lines
- L33 chapter beginning text
- L42 chapter university text
- L51 chapter storm text
- L60 chapter distance text
- L71 timelineClosing
- L86, L88 planeArrival title/line

**letter.js**

- L4, L6, L8, L10, L12 paragraphs / signoff

**notes.js**

- L1 file-level marker (edit each note `text` in the array)

**envelopes.js**

- L1 file-level marker (edit each envelope `text` in the array)

- [ ] All `TODO_AHSAN` content replaced

## Audio audit

| File | Status | If missing |
| --- | --- | --- |
| `public/audio/bgm.mp3` | **Missing** (only `.gitkeep`) | Music never starts; UI stays usable; mute still works |
| `public/audio/voice-note.mp3` | **Missing** | Finale voice-note control hides / fails load |
| `public/audio/envelope-*.mp3` (8 files) | **Missing** | Envelope Play button stays hidden (`audioReady` false) |

Envelope paths expected: `envelope-miss-me`, `cant-sleep`, `sad`, `smile`, `doubt`, `remember`, `angry`, `birthday` under `public/audio/`.

- [ ] Add `bgm.mp3` (under ~4 MB)
- [ ] Optional: `voice-note.mp3`
- [ ] Optional: envelope MP3s

## Emoji scan

- [x] No emoji characters in `src/`, `public/`, `index.html` (Phase 8 scan PASS)

## Automated checks

- [x] `npm run build` passes
- [x] Build with `VITE_BASE=/mano-birthday/` (workflow-style) passes; initial JS ~127 KB gzip; Phaser ~357 KB gzip lazy
- [x] Prod bundle has no DevMenu / `?now` / `?reset` (Phase 7)
- [x] Preview key gated (not `preview=1`)
- [ ] Manual: `npm run preview` with matching base; Network tab — no 404s for JS/CSS/fonts/audio you added
- [ ] Manual full playthrough (below)
- [ ] Manual: localStorage persists after reload; DEV DevMenu Reset clears progress

### Manual playthrough

1. [ ] Gate (or preview key) → Start (music after tap)
2. [ ] Intro → Timeline → Quest
3. [ ] Levels 1–4 finishable; rewards scratch; notes grant once
4. [ ] Keepsakes + Envelopes
5. [ ] Finale: candle (HTTPS mic or tap), letter readable
6. [ ] Mute toggles; Calm mode; pause/back from levels

## Emulated viewports (you or DevTools)

Portrait and landscape; Fast 4G + 4x CPU where noted.

| Viewport | Portrait | Landscape | Fast 4G | 4x CPU |
| --- | --- | --- | --- | --- |
| 360 x 640 | [ ] | [ ] | [ ] | [ ] |
| 375 x 667 | [ ] | [ ] | [ ] | [ ] |
| 390 x 844 | [ ] | [ ] | [ ] | [ ] |
| 412 x 915 | [ ] | [ ] | [ ] | [ ] |
| 768 x 1024 | [ ] | [ ] | [ ] | [ ] |
| 1280 x 800 | [ ] | [ ] | [ ] | [ ] |

## Real devices (you run these)

Use HTTPS for mic (`npm run dev:https` locally, or the live Pages URL).

### Android Chrome

- [ ] Music starts after first tap
- [ ] Mute works
- [ ] Mic blow works over HTTPS (or tap fallback clear)
- [ ] Fireworks acceptable
- [ ] Scratch without page scroll; Reveal button if needed
- [ ] Envelopes open
- [ ] Levels finishable
- [ ] Letter readable
- [ ] No horizontal scroll

### iPhone Safari

- [ ] Same checklist as Android

### Low-end phone (if available)

- [ ] Same checklist; Calm mode if janky

### Mobile data (not Wi-Fi)

- [ ] Site loads; Phaser chunk after Start; full path once

## Post-deploy smoke (5 minutes)

1. [ ] Open live URL on phone (mobile data)
2. [ ] `?preview=<PREVIEW_KEY>` still works if before unlock
3. [ ] After unlock date: gate opens without key
4. [ ] Music / mute / one level / finale tap
5. [ ] No console errors on a quick pass

## Rollback

1. `git revert <bad-commit>` (or reset only if you know the risk) on `main`
2. Push `main`
3. Wait for Pages Actions to redeploy
4. Re-run smoke list

## Privacy reminder

- Free GitHub Pages repos are **public**; anyone with the link can open the site.
- Source in the repo (including letter text if not encrypted) is readable.
- Use a non-obvious repo name; keep `robots` noindex (already set).

## Share message options (placeholders — no emojis)

1. "I made something for you. Open it on your phone, portrait, with sound on: <link>"
2. "Happy birthday. When you are ready, tap this and follow the night: <link>"
3. "A little world from me to you. Allow the mic for the candle if it asks: <link>"

Advice: send when she can look at her phone; portrait; sound on; mic for the candle.

## Your remaining hand-work

1. Replace all `TODO_AHSAN` copy
2. Add audio files
3. Run real-device + viewport checkboxes
4. Push `main` yourself (tag `v1.0.0` is local only until you push tags)
5. Configure Pages → GitHub Actions
6. Send the link with one of the share messages
