import { GAME_CONFIG } from '../game/gameConfig.js'

/**
 * Formats remaining milliseconds into a clean countdown string (e.g. "9.4s" or "10.0s").
 */
export function formatCountdownSeconds(remainingMs) {
  const clamped = Math.max(0, remainingMs)
  return (clamped / 1000).toFixed(1)
}

/**
 * Computes progress ratio in [0, 1] for timer bar rendering.
 */
export function getTimerProgress(remainingMs, totalMs = GAME_CONFIG.TURN_DURATION_MS) {
  if (totalMs <= 0) return 0
  return Math.max(0, Math.min(1, remainingMs / totalMs))
}

/**
 * Sanitizes a display username.
 */
export function sanitizeUsername(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, GAME_CONFIG.MAX_USERNAME_LENGTH)
}

/**
 * Validates username length and allowed characters.
 */
export function validateUsername(raw) {
  const name = sanitizeUsername(raw)
  if (name.length < GAME_CONFIG.MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      name,
      error: `Name must be at least ${GAME_CONFIG.MIN_USERNAME_LENGTH} characters.`,
    }
  }
  if (name.length > GAME_CONFIG.MAX_USERNAME_LENGTH) {
    return {
      valid: false,
      name,
      error: `Name must be ${GAME_CONFIG.MAX_USERNAME_LENGTH} characters or fewer.`,
    }
  }
  return { valid: true, name, error: null }
}
