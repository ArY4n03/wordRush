import { GAME_CONFIG } from './gameConfig.js'

export const WORD_REJECTION_REASONS = Object.freeze({
  EMPTY: 'EMPTY',
  INVALID_CHARACTERS: 'INVALID_CHARACTERS',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  WRONG_START_LETTER: 'WRONG_START_LETTER',
  REPEATED_WORD: 'REPEATED_WORD',
  NOT_IN_DICTIONARY: 'NOT_IN_DICTIONARY',
  TIMEOUT: 'TIMEOUT',
  DICTIONARY_UNAVAILABLE: 'DICTIONARY_UNAVAILABLE',
})

/**
 * Picks a random starting letter from the configured alphabet.
 */
export function pickRandomStartingLetter(letters = GAME_CONFIG.STARTING_LETTERS) {
  const pool = typeof letters === 'string' && letters.length > 0 ? letters : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const index = Math.floor(Math.random() * pool.length)
  return pool[index].toUpperCase()
}

/**
 * Returns the uppercase last character of a normalized word.
 */
export function getLastLetter(word) {
  if (!word || typeof word !== 'string') return ''
  return word[word.length - 1].toUpperCase()
}

/**
 * Validates input formatting, starting letter, and uniqueness against word history.
 * Does NOT call the external dictionary API; call dictionaryService after this passes.
 */
export function validateWordFormat(rawWord, requiredLetter, usedWordsSet) {
  if (typeof rawWord !== 'string') {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.INVALID_CHARACTERS,
      deductLife: true,
      message: 'Please enter a valid English word.',
    }
  }

  const trimmed = rawWord.trim()
  if (trimmed.length === 0) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.EMPTY,
      deductLife: true,
      message: 'Empty submission counts as an invalid word.',
    }
  }

  const normalized = trimmed.toLowerCase()

  if (!/^[a-z]+$/.test(normalized)) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.INVALID_CHARACTERS,
      deductLife: true,
      message: 'Words may only contain English letters (A–Z).',
    }
  }

  if (normalized.length < GAME_CONFIG.MIN_WORD_LENGTH) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.TOO_SHORT,
      deductLife: true,
      message: `Words must be at least ${GAME_CONFIG.MIN_WORD_LENGTH} letters long.`,
    }
  }

  if (normalized.length > GAME_CONFIG.MAX_WORD_LENGTH) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.TOO_LONG,
      deductLife: true,
      message: `Words must be ${GAME_CONFIG.MAX_WORD_LENGTH} letters or fewer.`,
    }
  }

  const req = String(requiredLetter || '').toLowerCase()
  if (req && normalized[0] !== req) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.WRONG_START_LETTER,
      deductLife: true,
      message: `Word must start with "${req.toUpperCase()}".`,
    }
  }

  if (usedWordsSet && usedWordsSet.has(normalized)) {
    return {
      ok: false,
      reason: WORD_REJECTION_REASONS.REPEATED_WORD,
      deductLife: true,
      message: `"${normalized}" has already been played.`,
    }
  }

  return {
    ok: true,
    normalizedWord: normalized,
  }
}
