import { STORAGE_KEY } from '../config.js'

const memory = { value: null }

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    memory.value = parsed
    return parsed
  } catch {
    return memory.value
  }
}

export function saveState(obj) {
  const payload = { ...obj, version: obj.version ?? 1 }
  memory.value = payload
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable; in-memory fallback already set.
  }
}
