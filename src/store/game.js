import { computed, reactive, watch } from 'vue'
import { loadState, saveState } from '../utils/storage.js'
import { prefersReducedMotion } from '../utils/device.js'
import { nowKarachi } from '../utils/dates.js'
import { notes, NOTE_REWARD_COUNTS } from '../content/notes.js'
import { PREVIEW_KEY } from '../config.js'

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
    calmMode: false,
    levelsCompleted: [],
    earnedNoteIds: [],
    revealedNoteIds: [],
    notesGrantedLevels: [],
    envelopesOpened: [],
    introSeen: false,
    finaleSeen: false,
    currentLevel: null,
  }
}

function migrateNotes(saved) {
  const earned = Array.isArray(saved.earnedNoteIds)
    ? [...saved.earnedNoteIds]
    : Array.isArray(saved.notesUnlocked)
      ? [...saved.notesUnlocked]
      : []
  const revealed = Array.isArray(saved.revealedNoteIds) ? [...saved.revealedNoteIds] : []
  const granted = Array.isArray(saved.notesGrantedLevels) ? [...saved.notesGrantedLevels] : []
  return { earnedNoteIds: earned, revealedNoteIds: revealed, notesGrantedLevels: granted }
}

function mergeSaved(saved) {
  const base = defaultState()
  if (!saved || typeof saved !== 'object') return base
  const noteFields = migrateNotes(saved)
  return {
    ...base,
    ...saved,
    version: STORAGE_VERSION,
    levelsCompleted: Array.isArray(saved.levelsCompleted) ? saved.levelsCompleted : [],
    envelopesOpened: Array.isArray(saved.envelopesOpened) ? saved.envelopesOpened : [],
    ...noteFields,
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

  const preview = params.get('preview')
  if (preview && preview === PREVIEW_KEY) {
    state.previewMode = true
  }

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
    calmMode: Boolean(state.calmMode),
    levelsCompleted: [...state.levelsCompleted],
    earnedNoteIds: [...state.earnedNoteIds],
    revealedNoteIds: [...state.revealedNoteIds],
    notesGrantedLevels: [...state.notesGrantedLevels],
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

if (typeof store.calmMode !== 'boolean') store.calmMode = false

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

export const unrevealedEarned = computed(() =>
  store.earnedNoteIds.filter((id) => !store.revealedNoteIds.includes(id)),
)

export const progressText = computed(
  () => `${store.earnedNoteIds.length} of ${notes.length}`,
)

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

export function setCalmMode(value) {
  store.calmMode = Boolean(value)
}

export function toggleCalmMode() {
  store.calmMode = !store.calmMode
}

export function resetAll() {
  const next = defaultState()
  Object.assign(store, next)
  store.reducedMotion = prefersReducedMotion()
  saveState(persistable(store))
}

export function setCurrentLevel(level) {
  const n = Number(level)
  store.currentLevel = Number.isFinite(n) && n > 0 ? n : null
}

export function completeLevel(level) {
  const n = Number(level)
  if (!store.levelsCompleted.includes(n)) {
    store.levelsCompleted.push(n)
  }
  store.currentLevel = null
}

/** @deprecated prefer grantNotes */
export function unlockNotes(ids) {
  for (const id of ids) {
    if (!store.earnedNoteIds.includes(id)) {
      store.earnedNoteIds.push(id)
    }
  }
}

export function grantNotes(levelId) {
  const level = Number(levelId)
  if (!level || store.notesGrantedLevels.includes(level)) return []

  const count = NOTE_REWARD_COUNTS[level - 1]
  if (!count) return []

  const already = new Set(store.earnedNoteIds)
  const nextIds = []
  for (const note of notes) {
    if (already.has(note.id)) continue
    nextIds.push(note.id)
    if (nextIds.length >= count) break
  }

  for (const id of nextIds) {
    store.earnedNoteIds.push(id)
  }
  store.notesGrantedLevels.push(level)
  return nextIds
}

export function revealNote(id) {
  if (!store.earnedNoteIds.includes(id)) return
  if (!store.revealedNoteIds.includes(id)) {
    store.revealedNoteIds.push(id)
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

export function resetNotes() {
  store.earnedNoteIds = []
  store.revealedNoteIds = []
  store.notesGrantedLevels = []
}

export function revealAllNotes() {
  for (const id of store.earnedNoteIds) {
    if (!store.revealedNoteIds.includes(id)) {
      store.revealedNoteIds.push(id)
    }
  }
}

export function grantAllNotes() {
  for (let level = 1; level <= NOTE_REWARD_COUNTS.length; level += 1) {
    grantNotes(level)
  }
}

export default store
