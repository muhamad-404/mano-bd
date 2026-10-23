import { reactive, watch } from 'vue'
import { loadState, saveState } from '../utils/storage.js'
import { prefersReducedMotion } from '../utils/device.js'
import { nowKarachi } from '../utils/dates.js'

const STORAGE_VERSION = 1

export const SCENES = [
  'gate',
  'start',
  'intro',
  'timeline',
  'quest',
  'level',
  'reward',
  'keepsakes',
  'envelopes',
  'finale',
]

function defaultState() {
  return {
    version: STORAGE_VERSION,
    scene: 'gate',
    soundOn: true,
    previewMode: false,
    levelsCompleted: [],
    notesUnlocked: [],
    envelopesOpened: [],
    introSeen: false,
    finaleSeen: false,
    currentLevel: null,
  }
}

function mergeSaved(saved) {
  const base = defaultState()
  if (!saved || typeof saved !== 'object') return base
  return {
    ...base,
    ...saved,
    version: STORAGE_VERSION,
    levelsCompleted: Array.isArray(saved.levelsCompleted) ? saved.levelsCompleted : [],
    notesUnlocked: Array.isArray(saved.notesUnlocked) ? saved.notesUnlocked : [],
    envelopesOpened: Array.isArray(saved.envelopesOpened) ? saved.envelopesOpened : [],
  }
}

function stripUrlFlags() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  let changed = false
  for (const key of ['preview', 'reset', 'now']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }
  if (changed) {
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
}

function applyUrlFlags(state) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)

  if (import.meta.env.DEV && params.get('reset') === '1') {
    Object.assign(state, defaultState())
    saveState(persistable(state))
  }

  if (params.get('preview') === '1') {
    state.previewMode = true
  }

  // Prime DEV now-override before stripping the query string.
  if (import.meta.env.DEV && params.has('now')) {
    nowKarachi()
  }

  stripUrlFlags()
}

function persistable(state) {
  return {
    version: state.version,
    scene: state.scene,
    soundOn: state.soundOn,
    previewMode: state.previewMode,
    levelsCompleted: [...state.levelsCompleted],
    notesUnlocked: [...state.notesUnlocked],
    envelopesOpened: [...state.envelopesOpened],
    introSeen: state.introSeen,
    finaleSeen: state.finaleSeen,
    currentLevel: state.currentLevel,
  }
}

const store = reactive({
  ...mergeSaved(loadState()),
  reducedMotion: prefersReducedMotion(),
})

applyUrlFlags(store)

let saveTimer = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveState(persistable(store))
  }, 300)
}

watch(
  () => persistable(store),
  () => scheduleSave(),
  { deep: true },
)

export function useGameStore() {
  return store
}

export function goTo(scene) {
  if (!SCENES.includes(scene)) return
  store.scene = scene
}

export function toggleSound() {
  store.soundOn = !store.soundOn
}

export function setSoundOn(value) {
  store.soundOn = Boolean(value)
}

export function setPreviewMode(value) {
  store.previewMode = Boolean(value)
}

export function resetAll() {
  const next = defaultState()
  Object.assign(store, next)
  store.reducedMotion = prefersReducedMotion()
  saveState(persistable(store))
}

export function completeLevel(level) {
  const n = Number(level)
  if (!store.levelsCompleted.includes(n)) {
    store.levelsCompleted.push(n)
  }
  store.currentLevel = null
}

export function unlockNotes(ids) {
  for (const id of ids) {
    if (!store.notesUnlocked.includes(id)) {
      store.notesUnlocked.push(id)
    }
  }
}

export function openEnvelope(id) {
  if (!store.envelopesOpened.includes(id)) {
    store.envelopesOpened.push(id)
  }
}

export function setIntroSeen() {
  store.introSeen = true
}

export function setFinaleSeen() {
  store.finaleSeen = true
}

export default store
