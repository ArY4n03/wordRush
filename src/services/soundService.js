/**
 * Lightweight Web Audio API sound synthesizer for WORD RUSH.
 * Produces gentle, organic wooden/marimba tones without external audio files.
 */

const MUTE_STORAGE_KEY = 'wordrush_sound_muted'

class SoundService {
  constructor() {
    this.ctx = null
    this.muted = this.loadMutedPreference()
  }

  loadMutedPreference() {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  }

  isMuted() {
    return this.muted
  }

  setMuted(value) {
    this.muted = Boolean(value)
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted))
    } catch {
      // Ignore storage failures in private browsing
    }
    return this.muted
  }

  toggleMute() {
    return this.setMuted(!this.muted)
  }

  ensureContext() {
    if (this.muted || typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!this.ctx) {
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  playTone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.08, delay = 0, endFreq = null }) {
    const ctx = this.ensureContext()
    if (!ctx) return

    const startTime = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration)
    }

    amp.gain.setValueAtTime(0.0001, startTime)
    amp.gain.linearRampToValueAtTime(gain, startTime + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(amp)
    amp.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  playClick() {
    this.playTone({ freq: 520, endFreq: 380, type: 'triangle', duration: 0.05, gain: 0.045 })
  }

  playValidWord() {
    this.playTone({ freq: 523.25, type: 'sine', duration: 0.13, gain: 0.075, delay: 0 })
    this.playTone({ freq: 659.25, type: 'sine', duration: 0.18, gain: 0.08, delay: 0.075 })
  }

  playInvalidWord() {
    this.playTone({ freq: 220, endFreq: 165, type: 'triangle', duration: 0.18, gain: 0.08, delay: 0 })
    this.playTone({ freq: 175, endFreq: 140, type: 'triangle', duration: 0.2, gain: 0.07, delay: 0.09 })
  }

  playTimerWarning() {
    this.playTone({ freq: 740, type: 'sine', duration: 0.06, gain: 0.035 })
  }

  playEliminated() {
    this.playTone({ freq: 330, endFreq: 247, type: 'triangle', duration: 0.2, gain: 0.075, delay: 0 })
    this.playTone({ freq: 247, endFreq: 185, type: 'triangle', duration: 0.28, gain: 0.075, delay: 0.14 })
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      this.playTone({
        freq,
        type: 'sine',
        duration: idx === notes.length - 1 ? 0.36 : 0.16,
        gain: 0.08,
        delay: idx * 0.09,
      })
    })
  }
}

export const soundService = new SoundService()
