import { describe, expect, it } from 'vitest'
import { MESSAGE_TYPES, createMessage, validateMessage } from '../src/game/messageProtocol.js'

describe('messageProtocol', () => {
  it('validates well-formed client and host messages', () => {
    const joinMsg = createMessage(MESSAGE_TYPES.JOIN_REQUEST, {
      username: 'Rowan',
      roomCode: 'AB12CD',
    })
    expect(validateMessage(joinMsg, { expectFrom: 'client' }).valid).toBe(true)

    const submitMsg = createMessage(MESSAGE_TYPES.WORD_SUBMISSION, {
      word: 'orchid',
      turnId: 3,
    })
    expect(validateMessage(submitMsg, { expectFrom: 'client' }).valid).toBe(true)

    const startMsg = createMessage(MESSAGE_TYPES.GAME_START, {
      state: { phase: 'PLAYING' },
    })
    expect(validateMessage(startMsg, { expectFrom: 'host' }).valid).toBe(true)
  })

  it('rejects malformed or unauthorized client messages', () => {
    // Client trying to spoof GAME_OVER
    const spoofed = createMessage(MESSAGE_TYPES.GAME_OVER, {
      state: { winnerId: 'attacker' },
    })
    expect(validateMessage(spoofed, { expectFrom: 'client' }).valid).toBe(false)

    // Non-object payload
    expect(validateMessage('raw-string', { expectFrom: 'client' }).valid).toBe(false)

    // Empty username
    expect(
      validateMessage(
        { type: MESSAGE_TYPES.JOIN_REQUEST, payload: { username: '   ' } },
        { expectFrom: 'client' },
      ).valid,
    ).toBe(false)
  })
})
