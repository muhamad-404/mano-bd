import { Howl, Howler } from 'howler'
import { useGameStore } from '../store/game.js'

let bgm = null
let started = false
let warnedMissing = false
const BASE_VOLUME = 0.35

function store() {
  return useGameStore()
}

export function init() {
  if (bgm) return bgm

  const src = `${import.meta.env.BASE_URL}audio/bgm.mp3`
  bgm = new Howl({
    src: [src],
    loop: true,
    volume: 0,
    html5: true,
    preload: true,
    onloaderror() {
      if (!warnedMissing) {
        warnedMissing = true
        console.warn('[audio] bgm.mp3 missing or failed to load; UI will continue without music.')
      }
    },
  })

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }

  return bgm
}

function onVisibility() {
  if (!started || !bgm) return
  if (document.hidden) {
    bgm.pause()
  } else if (store().soundOn) {
    bgm.play()
  }
}

export function start() {
  init()
  if (!bgm) return
  started = true
  Howler.mute(!store().soundOn)
  if (!bgm.playing()) {
    bgm.play()
  }
  bgm.fade(bgm.volume(), store().soundOn ? BASE_VOLUME : 0, 1500)
}

export function setMuted(muted) {
  Howler.mute(Boolean(muted))
  if (!bgm || !started) return
  if (muted) {
    bgm.fade(bgm.volume(), 0, 300)
  } else {
    if (!bgm.playing()) bgm.play()
    bgm.fade(bgm.volume(), BASE_VOLUME, 400)
  }
}

export function toggle() {
  const next = !store().soundOn
  store().soundOn = !next
  // Prefer store actions from callers; keep helper for completeness.
  setMuted(!store().soundOn)
}

export function pause() {
  if (bgm) bgm.pause()
}

export function resume() {
  if (!bgm || !started || !store().soundOn) return
  if (!bgm.playing()) bgm.play()
}

export function duck(level = 0.1, ms = 400) {
  if (!bgm || !started) return
  const target = Math.max(0, Math.min(1, level))
  bgm.fade(bgm.volume(), target, ms)
}

export function unduck(ms = 500) {
  if (!bgm || !started) return
  const target = store().soundOn ? BASE_VOLUME : 0
  bgm.fade(bgm.volume(), target, ms)
}

export default {
  init,
  start,
  setMuted,
  toggle,
  pause,
  resume,
  duck,
  unduck,
}
