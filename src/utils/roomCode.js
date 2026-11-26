import { GAME_CONFIG } from '../game/gameConfig.js'

// Unambiguous uppercase alphanumeric charset for generating room codes.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Generates a 6-character uppercase alphanumeric room code.
 */
export function generateRoomCode(length = GAME_CONFIG.ROOM_CODE_LENGTH) {
  let code = ''
  const randomValues = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues)
  } else {
    for (let i = 0; i < length; i += 1) {
      randomValues[i] = Math.floor(Math.random() * 0xffffffff)
    }
  }
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_ALPHABET[randomValues[i] % ROOM_CODE_ALPHABET.length]
  }
  return code
}

/**
 * Normalizes user-entered room code (trims whitespace, removes dashes, uppercases).
 */
export function normalizeRoomCode(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, GAME_CONFIG.ROOM_CODE_LENGTH)
}

/**
 * Validates that a room code is exactly 6 alphanumeric characters.
 */
export function isValidRoomCode(code) {
  if (typeof code !== 'string') return false
  return new RegExp(`^[A-Z0-9]{${GAME_CONFIG.ROOM_CODE_LENGTH}}$`).test(code)
}
