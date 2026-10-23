export function isLowEnd() {
  if (typeof navigator === 'undefined') return false
  const memory = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  if (typeof memory === 'number' && memory <= 4) return true
  if (typeof cores === 'number' && cores <= 4) return true
  return false
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function dprCap(max = 2) {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, max)
}

export function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function vibrate(ms) {
  if (!canVibrate()) return false
  try {
    return navigator.vibrate(ms)
  } catch {
    return false
  }
}
