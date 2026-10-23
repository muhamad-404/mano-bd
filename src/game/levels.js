import { chapters } from '../content/story.js'
import { NOTE_REWARD_COUNTS } from '../content/notes.js'

function chapterFor(levelId) {
  return chapters.find((c) => c.levelId === levelId)
}

function firstSentence(text) {
  if (!text) return ''
  const match = text.match(/^[^.!?]+[.!?]?/)
  return (match ? match[0] : text).trim()
}

const DEFS = [
  {
    id: 1,
    sceneKey: 'CatchHearts',
    ready: true,
    config: {
      target: 8,
      spawnMs: [900, 1400],
      fall: [90, 130],
      bonusStarChance: 0,
      palette: 'dawn',
    },
  },
  {
    id: 2,
    sceneKey: 'CatchHearts',
    ready: false,
    config: {
      target: 12,
      spawnMs: [700, 1100],
      fall: [110, 160],
      bonusStarChance: 0.18,
      palette: 'evening',
    },
  },
  {
    id: 3,
    sceneKey: 'Storm',
    ready: false,
    config: {
      target: 10,
      spawnMs: [800, 1200],
      fall: [100, 150],
      bonusStarChance: 0.25,
      palette: 'storm',
    },
  },
  {
    id: 4,
    sceneKey: 'PaperPlane',
    ready: false,
    config: {
      target: 1,
      spawnMs: [0, 0],
      fall: [0, 0],
      bonusStarChance: 0,
      palette: 'night',
    },
  },
]

/** @type {Array<{ id: number, chapterId: string, title: string, dateLabel: string, subtitle: string, icon: string, sceneKey: string, rewardCount: number, ready: boolean, config: object }>} */
export const levels = DEFS.map((def) => {
  const chapter = chapterFor(def.id)
  return {
    id: def.id,
    chapterId: chapter?.id ?? `level-${def.id}`,
    title: chapter?.title ?? `Level ${def.id}`,
    dateLabel: chapter?.dateLabel ?? '',
    subtitle: firstSentence(chapter?.text ?? ''),
    icon: chapter?.icon ?? 'star',
    text: chapter?.text ?? '',
    sceneKey: def.sceneKey,
    rewardCount: NOTE_REWARD_COUNTS[def.id - 1] ?? 5,
    ready: def.ready,
    config: def.config,
  }
})

export function getLevel(id) {
  return levels.find((l) => l.id === Number(id)) || null
}

export default levels
