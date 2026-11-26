import { describe, expect, it } from 'vitest'
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '../src/utils/roomCode.js'

describe('roomCode utilities', () => {
  it('generates valid 6-character alphanumeric codes', () => {
    for (let i = 0; i < 20; i += 1) {
      const code = generateRoomCode()
      expect(code).toHaveLength(6)
      expect(isValidRoomCode(code)).toBe(true)
    }
  })

  it('normalizes user-typed room codes', () => {
    expect(normalizeRoomCode(' ab-12 cd ')).toBe('AB12CD')
    expect(isValidRoomCode('AB12CD')).toBe(true)
    expect(isValidRoomCode('AB12')).toBe(false)
  })
})
