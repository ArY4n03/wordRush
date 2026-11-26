import { describe, expect, it } from 'vitest'
import { GAME_PHASES, GameEngine } from '../src/game/gameEngine.js'
import { DictionaryServiceError } from '../src/services/dictionaryService.js'

function createMockDictionary(validWords = [], { fail = false } = {}) {
  const validSet = new Set(validWords.map((w) => w.toLowerCase()))
  return {
    async verifyWord(word) {
      if (fail) {
        throw new DictionaryServiceError('Simulated dictionary API outage')
      }
      return { exists: validSet.has(word.toLowerCase()) }
    },
  }
}

describe('GameEngine', () => {
  it('enforces room capacity, duplicate usernames, and lobby-only joins', () => {
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })

    expect(engine.addPlayer({ id: 'p2', username: 'willow' }).ok).toBe(false)
    expect(engine.addPlayer({ id: 'p2', username: 'Rowan' }).ok).toBe(true)
    expect(engine.addPlayer({ id: 'p3', username: 'Fern' }).ok).toBe(true)
    expect(engine.addPlayer({ id: 'p4', username: 'Moss' }).ok).toBe(true)
    expect(engine.addPlayer({ id: 'p5', username: 'Sage' }).ok).toBe(true)
    // 6th player exceeds MAX_PLAYERS = 5
    expect(engine.addPlayer({ id: 'p6', username: 'Cedar' }).ok).toBe(false)

    const startRes = engine.startGame(1000, 'A')
    expect(startRes.ok).toBe(true)
    expect(engine.state.phase).toBe(GAME_PHASES.PLAYING)

    // Cannot join after game starts
    engine.state.players.pop()
    expect(engine.addPlayer({ id: 'p6', username: 'Cedar' }).ok).toBe(false)
  })

  it('requires at least 2 players to start', () => {
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    const res = engine.startGame(1000, 'A')
    expect(res.ok).toBe(false)
  })

  it('chains valid words, trims spaces, ignores case, and rejects repeats', async () => {
    const dict = createMockDictionary(['apple', 'earth', 'herb'])
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.startGame(1000, 'A')

    // Valid word with whitespace and mixed case
    const r1 = await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: '  ApPlE  ',
      submittedAt: 2000,
      turnId: 1,
      dictionaryService: dict,
    })
    expect(r1.accepted).toBe(true)
    expect(r1.nextLetter).toBe('E')
    expect(engine.getCurrentPlayer().id).toBe('p2')

    // Valid chained word
    const r2 = await engine.processWordSubmission({
      playerId: 'p2',
      rawWord: 'earth',
      submittedAt: 3000,
      turnId: 2,
      dictionaryService: dict,
    })
    expect(r2.accepted).toBe(true)
    expect(r2.nextLetter).toBe('H')
    expect(engine.getCurrentPlayer().id).toBe('host-1')

    // Wrong starting letter deducts 1 life
    const r3 = await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: 'apple',
      submittedAt: 4000,
      turnId: 3,
      dictionaryService: dict,
    })
    expect(r3.accepted).toBe(false)
    expect(r3.deductLife).toBe(true)
    expect(engine.state.players[0].lives).toBe(1)
  })

  it('prevents repeated words and deducts a life', async () => {
    const dict = createMockDictionary(['area', 'apple'])
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.startGame(1000, 'A')

    await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: 'area',
      submittedAt: 2000,
      turnId: 1,
      dictionaryService: dict,
    })

    // p2 tries repeating 'area' (which starts with A!)
    const repeatRes = await engine.processWordSubmission({
      playerId: 'p2',
      rawWord: 'AREA',
      submittedAt: 3000,
      turnId: 2,
      dictionaryService: dict,
    })
    expect(repeatRes.accepted).toBe(false)
    expect(repeatRes.reason).toBe('REPEATED_WORD')
    expect(engine.state.players[1].lives).toBe(1)
  })

  it('prevents duplicate timeout calls from deducting multiple lives', () => {
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.startGame(1000, 'A')

    const firstTimeout = engine.processTimeout(1, 12000)
    expect(firstTimeout.deductLife).toBe(true)
    expect(engine.state.players[0].lives).toBe(1)
    expect(engine.state.turnId).toBe(2)

    // Duplicate timeout for turnId 1 must be ignored
    const duplicateTimeout = engine.processTimeout(1, 12050)
    expect(duplicateTimeout).toBeNull()
    expect(engine.state.players[0].lives).toBe(1)
  })

  it('eliminates players at 0 lives, skips them, and declares last player winner', async () => {
    const dict = createMockDictionary(['apple', 'ant'])
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.addPlayer({ id: 'p3', username: 'Fern' })
    engine.startGame(1000, 'A')

    // Turn 1: host-1 times out (1 life left)
    engine.processTimeout(1, 12000)
    // Turn 2: p2 plays 'apple' (next letter E)
    await engine.processWordSubmission({
      playerId: 'p2',
      rawWord: 'apple',
      submittedAt: 13000,
      turnId: 2,
      dictionaryService: dict,
    })
    // Turn 3: p3 times out (1 life left)
    engine.processTimeout(3, 24000)
    // Turn 4: host-1 submits invalid characters -> 0 lives -> eliminated!
    const elimRes = await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: '1234',
      submittedAt: 25000,
      turnId: 4,
      dictionaryService: dict,
    })
    expect(elimRes.eliminated).toBe(true)
    expect(engine.state.players[0].eliminated).toBe(true)
    expect(engine.state.phase).toBe(GAME_PHASES.PLAYING)

    // Turn 5: p2 times out (1 life left); Turn 6 should skip host-1 and go to p3
    engine.processTimeout(5, 36000)
    expect(engine.getCurrentPlayer().id).toBe('p3')

    // Turn 6: p3 times out -> 0 lives -> eliminated -> p2 wins!
    const finalRes = engine.processTimeout(6, 47000)
    expect(finalRes.gameOver).toBe(true)
    expect(engine.state.phase).toBe(GAME_PHASES.GAME_OVER)
    expect(engine.state.winnerId).toBe('p2')
    expect(engine.state.standings[0].id).toBe('p2')
  })

  it('never accepts a word when the dictionary API is unavailable', async () => {
    const failingDict = createMockDictionary(['apple'], { fail: true })
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.startGame(1000, 'A')

    const res = await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: 'apple',
      submittedAt: 2000,
      turnId: 1,
      dictionaryService: failingDict,
    })

    expect(res.accepted).toBe(false)
    expect(res.deductLife).toBe(false)
    expect(res.reason).toBe('DICTIONARY_UNAVAILABLE')
    expect(engine.state.wordHistory).toHaveLength(0)
    expect(engine.state.players[0].lives).toBe(2)
  })

  it('treats submissions arriving after turnDeadline as timeout', async () => {
    const dict = createMockDictionary(['apple'])
    const engine = new GameEngine({
      roomCode: 'AB12CD',
      hostId: 'host-1',
      hostUsername: 'Willow',
    })
    engine.addPlayer({ id: 'p2', username: 'Rowan' })
    engine.startGame(1000, 'A')

    const res = await engine.processWordSubmission({
      playerId: 'host-1',
      rawWord: 'apple',
      submittedAt: 11001, // deadline is 11000
      turnId: 1,
      dictionaryService: dict,
    })
    expect(res.accepted).toBe(false)
    expect(res.reason).toBe('TIMEOUT')
    expect(engine.state.players[0].lives).toBe(1)
  })
})
