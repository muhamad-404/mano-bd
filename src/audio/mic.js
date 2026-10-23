/**
 * Blow detection via microphone RMS + low-frequency energy ratio.
 * Never throws; errors go to onError(reason).
 */

export function startBlowDetection({ onBlow, onError } = {}) {
  let stopped = false
  let fired = false
  let stream = null
  let audioCtx = null
  let analyser = null
  let raf = 0
  let timeData = null
  let freqData = null
  let baseline = 0
  let baselineSamples = 0
  let calibrating = true
  let calibStart = 0
  let blowHoldMs = 0
  let lastTs = 0

  const notifyError = (reason) => {
    if (typeof onError === 'function') onError(reason)
  }

  const cleanup = () => {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop()
        } catch {
          /* ignore */
        }
      }
      stream = null
    }
    if (audioCtx) {
      const ctx = audioCtx
      audioCtx = null
      ctx.close().catch(() => {})
    }
    analyser = null
  }

  function onVisibility() {
    if (document.hidden) {
      stop()
    }
  }

  function stop() {
    if (stopped) return
    stopped = true
    cleanup()
  }

  async function begin() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      notifyError('unsupported')
      return { stop }
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
    } catch (err) {
      const name = err && err.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        notifyError('denied')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        notifyError('no-device')
      } else if (name === 'NotSupportedError' || name === 'SecurityError') {
        notifyError('unsupported')
      } else {
        notifyError('denied')
      }
      return { stop }
    }

    if (stopped) {
      cleanup()
      return { stop }
    }

    try {
      const AC = window.AudioContext || window.webkitAudioContext
      audioCtx = new AC()
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      const source = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)
      timeData = new Uint8Array(analyser.fftSize)
      freqData = new Uint8Array(analyser.frequencyBinCount)
      calibStart = performance.now()
      lastTs = calibStart
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(tick)
    } catch {
      notifyError('unsupported')
      cleanup()
    }

    return { stop }
  }

  function computeRms() {
    analyser.getByteTimeDomainData(timeData)
    let sum = 0
    for (let i = 0; i < timeData.length; i += 1) {
      const v = (timeData[i] - 128) / 128
      sum += v * v
    }
    return Math.sqrt(sum / timeData.length)
  }

  function computeLowRatio() {
    analyser.getByteFrequencyData(freqData)
    const sampleRate = audioCtx.sampleRate || 44100
    const binHz = sampleRate / analyser.fftSize
    const lowBinMax = Math.max(1, Math.floor(1000 / binHz))
    let low = 0
    let total = 0
    for (let i = 0; i < freqData.length; i += 1) {
      const v = freqData[i]
      total += v
      if (i <= lowBinMax) low += v
    }
    if (total <= 0) return 0
    return low / total
  }

  function tick(ts) {
    if (stopped || !analyser) return
    const dt = Math.min(50, ts - lastTs)
    lastTs = ts

    const rms = computeRms()
    const lowRatio = computeLowRatio()

    if (calibrating) {
      baseline += rms
      baselineSamples += 1
      if (ts - calibStart >= 600) {
        baseline = baselineSamples ? baseline / baselineSamples : 0.02
        calibrating = false
        blowHoldMs = 0
      }
      raf = requestAnimationFrame(tick)
      return
    }

    const threshold = Math.max(baseline * 3, 0.06)
    const isBlow = rms > threshold && lowRatio > 0.5

    if (isBlow) {
      blowHoldMs += dt
      if (!fired && blowHoldMs >= 250) {
        fired = true
        if (typeof onBlow === 'function') onBlow()
        stop()
        return
      }
    } else {
      blowHoldMs = 0
    }

    raf = requestAnimationFrame(tick)
  }

  const api = { stop }
  begin()
  return api
}

export default { startBlowDetection }
