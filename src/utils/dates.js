import { TIMEZONE } from '../config.js'

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** @type {{ anchorMs: number, wallMs: number } | null | undefined} */
let nowOverride = undefined

function ensureNowOverride() {
  if (nowOverride !== undefined) return nowOverride
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    nowOverride = null
    return null
  }
  const raw = new URLSearchParams(window.location.search).get('now')
  if (!raw) {
    nowOverride = null
    return null
  }
  const anchorMs = Date.parse(raw)
  if (Number.isNaN(anchorMs)) {
    nowOverride = null
    return null
  }
  nowOverride = { anchorMs, wallMs: Date.now() }
  return nowOverride
}

export function nowKarachi() {
  const override = ensureNowOverride()
  if (override) {
    return new Date(override.anchorMs + (Date.now() - override.wallMs))
  }
  return new Date()
}

export function karachiYMD(date = nowKarachi()) {
  return ymdFormatter.format(date)
}

export function daysBetween(fromYMD, toDate = nowKarachi()) {
  const [fy, fm, fd] = fromYMD.split('-').map(Number)
  const toYMD = karachiYMD(toDate)
  const [ty, tm, td] = toYMD.split('-').map(Number)
  const fromUtc = Date.UTC(fy, fm - 1, fd)
  const toUtc = Date.UTC(ty, tm - 1, td)
  return Math.floor((toUtc - fromUtc) / 86400000)
}

export function msUntil(isoString, from = nowKarachi()) {
  return new Date(isoString).getTime() - from.getTime()
}

export function splitDuration(ms) {
  const safe = Math.max(0, Math.floor(ms))
  const days = Math.floor(safe / 86400000)
  const hours = Math.floor((safe % 86400000) / 3600000)
  const minutes = Math.floor((safe % 3600000) / 60000)
  const seconds = Math.floor((safe % 60000) / 1000)
  return { days, hours, minutes, seconds }
}

export function pad2(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

export function formatKarachiDateTime(date = nowKarachi()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
