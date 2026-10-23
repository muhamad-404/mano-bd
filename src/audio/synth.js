import { useGameStore } from '../store/game.js'

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export function unlock() {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {})
  }
}

function tone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.08, slideTo }) {
  if (!useGameStore().soundOn) return
  const audio = getCtx()
  if (!audio) return
  unlock()

  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audio.currentTime)
  if (typeof slideTo === 'number') {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), audio.currentTime + duration)
  }
  g.gain.setValueAtTime(0.0001, audio.currentTime)
  g.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + duration + 0.02)
}

export function pop() {
  tone({ freq: 520, type: 'triangle', duration: 0.1, gain: 0.07, slideTo: 220 })
}

export function chime() {
  tone({ freq: 880, type: 'sine', duration: 0.18, gain: 0.06 })
  setTimeout(() => tone({ freq: 1320, type: 'sine', duration: 0.22, gain: 0.045 }), 70)
}

export function whoosh() {
  tone({ freq: 240, type: 'sawtooth', duration: 0.28, gain: 0.03, slideTo: 90 })
}

export function sparkle() {
  ;[988, 1175, 1480].forEach((freq, i) => {
    setTimeout(() => tone({ freq, type: 'sine', duration: 0.12, gain: 0.04 }), i * 55)
  })
}

export function softHit() {
  tone({ freq: 140, type: 'sine', duration: 0.22, gain: 0.045, slideTo: 70 })
}

export default { unlock, pop, chime, whoosh, sparkle, softHit }
