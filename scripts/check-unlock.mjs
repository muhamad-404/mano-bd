/**
 * Print Karachi-local now and time remaining until UNLOCK_AT.
 * Usage: npm run check:unlock
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configSrc = readFileSync(join(root, 'src/config.js'), 'utf8')

function pick(name) {
  const m = configSrc.match(new RegExp(`export const ${name} = ([^\\n]+)`))
  if (!m) throw new Error(`Missing ${name} in config.js`)
  return Function(`return (${m[1]})`)()
}

const UNLOCK_AT = pick('UNLOCK_AT')
const TIMEZONE = pick('TIMEZONE')
const FINALE_REQUIRES_QUEST = pick('FINALE_REQUIRES_QUEST')
const PREVIEW_KEY = pick('PREVIEW_KEY')

const unlockMs = Date.parse(UNLOCK_AT)
const now = new Date()
const remaining = unlockMs - now.getTime()

const karachiFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function fmtDuration(ms) {
  if (ms <= 0) return 'UNLOCKED (past UNLOCK_AT)'
  const s = Math.floor(ms / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

console.log('TIMEZONE:', TIMEZONE)
console.log('Karachi now:', karachiFmt.format(now))
console.log('UNLOCK_AT:', UNLOCK_AT)
console.log('Remaining:', fmtDuration(remaining))
console.log('FINALE_REQUIRES_QUEST:', FINALE_REQUIRES_QUEST)
console.log('Preview URL pattern: ?preview=' + PREVIEW_KEY)
