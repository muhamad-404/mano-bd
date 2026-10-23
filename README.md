# mano-birthday

A mobile-first, static, interactive birthday website for Mano. Vue 3 + Vite, Phaser (lazy), GSAP, Howler, and GitHub Pages. No backend. Progress stays in `localStorage`.

## Features

- Birthday gate with Karachi unlock time, then start, intro, and story timeline
- Quest map with four forgiving levels (hearts, university, storm, paper plane)
- Scratch-card keepsakes (22 notes) and Open-When envelopes
- Finale: candle wish (mic or tap), letter, fireworks
- Calm mode, mute, preloader, and offline-friendly Phaser retry

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local Vite dev server |
| `npm run dev:mobile` | Prints LAN URL(s) + QR, then Vite with host |
| `npm run dev:https` | Same over HTTPS (needed for mic on a phone) |
| `npm run build` | Production build to `dist/` |
| `npm run analyze` | Build + Rollup visualizer (`dist/stats.html`) |
| `npm run check:unlock` | Karachi now, time until unlock, preview URL pattern |
| `npm run preview` | Preview production build |
| `npm run preview:mobile` | Build, print LAN URL + QR, preview with host |
| `npm run deploy:manual` | Push `dist/` via gh-pages (optional; Actions preferred) |

## Test on your phone

1. Phone and computer on the same Wi-Fi.
2. Run `npm run dev:mobile`.
3. Scan the QR or open the printed LAN URL.
4. For the candle mic, use `npm run dev:https`. Accept the self-signed cert warning for your own machine.
5. Before unlock, bypass the gate with `?preview=<PREVIEW_KEY>` from `src/config.js` (see `docs/QA.md`). `?preview=1` does not work.

## Content and audio

- Edit copy in `src/content/` (search `TODO_AHSAN`). See `docs/QA.md` for the full list.
- Put `public/audio/bgm.mp3` (keep under ~4 MB) and optional `voice-note.mp3` / envelope MP3s.

```bash
ffmpeg -i input.mp3 -b:a 96k -ac 2 public/audio/bgm.mp3
```

## Deploy (click by click)

1. Create a GitHub repository with a **non-obvious name** (free Pages sites are public).
2. Confirm the correct GitHub account. Check local identity:
   ```bash
   git config user.name
   git config user.email
   ```
3. Add the remote and push (you push; this project does not auto-push):
   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
   Optional: `git push origin v1.0.0` after you are ready to publish the tag.
4. Repo **Settings → Pages → Source → GitHub Actions**.
5. Open the **Actions** tab; wait for **Deploy to GitHub Pages** to finish.
6. Open `https://<user>.github.io/<repo>/` on your phone (prefer mobile data once).
7. Walk gate (or preview key) → start → intro → timeline → quest → finale.
8. Add audio files before sharing if you want music / voice note / envelope audio.

The workflow sets `VITE_BASE` to `/<repository-name>/` automatically.

### Privacy

Anyone with the link can open the site. Source in the repo (including the letter if not encrypted) is readable. Prefer a quiet repo name; `robots` is already `noindex`.

### Post-deploy smoke (5 minutes)

See `docs/QA.md`. Quick path: live URL loads, mute works, one level starts, finale tap works, no obvious console errors.

### Rollback

Revert the bad commit on `main`, push, wait for Pages to redeploy, re-run the smoke list.

## QA

Living checklist: [`docs/QA.md`](docs/QA.md) (placeholders, audio, devices, share messages).

## Bundle analyze

```bash
npm run analyze
```
