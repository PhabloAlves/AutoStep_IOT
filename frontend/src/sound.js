let sharedAudioCtx = null

function playTone(freq, { duration = 150, delay = 0, type = 'sine', volume = 0.15 } = {}) {
  try {
    sharedAudioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
    const ctx = sharedAudioCtx
    const start = ctx.currentTime + delay
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    osc.type = type
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration / 1000)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration / 1000)
  } catch {}
}

export function playEnterSound() {
  playTone(520, { duration: 120 })
}

export function playAdvanceSound() {
  playTone(660, { duration: 100 })
  playTone(880, { duration: 140, delay: 0.09 })
}

export function playCompleteSound() {
  playTone(660, { duration: 120, delay: 0 })
  playTone(880, { duration: 120, delay: 0.12 })
  playTone(1046, { duration: 220, delay: 0.24 })
}
