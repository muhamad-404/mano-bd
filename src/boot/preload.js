import { init as initAudio, whenBgmSettled } from '../audio/audioManager.js'

const MIN_MS = 800
const BGM_CAP_MS = 4000

/**
 * Wait for fonts + BGM settle with a minimum display time.
 * @param {(p: number) => void} onProgress
 */
export async function waitForAssets(onProgress = () => {}) {
  const started = performance.now()
  onProgress(0.1)

  initAudio()

  const fontsPromise = (async () => {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
    onProgress(0.45)
  })()

  const bgmPromise = (async () => {
    await whenBgmSettled(BGM_CAP_MS)
    onProgress(0.9)
  })()

  await Promise.all([fontsPromise, bgmPromise])

  const elapsed = performance.now() - started
  if (elapsed < MIN_MS) {
    await new Promise((r) => setTimeout(r, MIN_MS - elapsed))
  }
  onProgress(1)
}
