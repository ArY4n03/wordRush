import { GAME_CONFIG } from './gameConfig.js'
import {
  WORD_REJECTION_REASONS,
  getLastLetter,
  pickRandomStartingLetter,
  validateWordFormat,
} from './gameRules.js'
import { DictionaryServiceError } from '../services/dictionaryService.js'

export const GAME_PHASES = Object.freeze({
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
})

/**
 * Pure authoritative game state machine for WORD RUSH.
 * Runs exclusively on the host (and can be unit-tested independently of React/PeerJS).
 */
export class GameEngine {
  constructor({ roomCode, hostId, hostUsername, config = GAME_CONFIG } = {}) {
    this.config = config
    this.state = {
      roomCode: roomCode || '',
      hostId: hostId || '',
      phase: GAME_PHASES.LOBBY,
      players: hostId
        ? [
            {
              id: hostId,
              username: hostUsername || 'Host',
              isHost: true,
              connected: true,
              lives: config.INITIAL_LIVES,
              eliminated: false,
              wordsPlayed: 0,
              eliminationOrder: null,
            },
          ]
        : [],
      turnIndex: 0,
      turnId: 0,
      turnNumber: 0,
      round: 1,
      requiredLetter: '',
      turnDeadline: null,
      wordHistory: [],
      lastEvent: null,
      winnerId: null,
      standings: [],
    }
    this.usedWords = new Set()
    this.eliminationSequence = 0
    this.validatingTurnId = null
  }

  getActivePlayers() {
    return this.state.players.filter((p) => !p.eliminated)
  }

  getConnectedLobbyPlayers() {
    return this.state.players.filter((p) => p.connected)
  }

  getCurrentPlayer() {
    if (this.state.phase !== GAME_PHASES.PLAYING) return null
    return this.state.players[this.state.turnIndex] || null
  }

  getPublicState(now = Date.now()) {
    const currentPlayer = this.getCurrentPlayer()
    return {
      roomCode: this.state.roomCode,
      hostId: this.state.hostId,
      phase: this.state.phase,
      players: this.state.players.map((p) => ({ ...p })),
      turnIndex: this.state.turnIndex,
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      turnId: this.state.turnId,
      turnNumber: this.state.turnNumber,
      round: this.state.round,
      requiredLetter: this.state.requiredLetter,
      turnDeadline: this.state.turnDeadline,
      hostTimestamp: now,
      wordHistory: this.state.wordHistory.map((item) => ({ ...item })),
      lastEvent: this.state.lastEvent ? { ...this.state.lastEvent } : null,
      winnerId: this.state.winnerId,
      standings: this.state.standings.map((s) => ({ ...s })),
    }
  }

  canJoin(username) {
    if (this.state.phase !== GAME_PHASES.LOBBY) {
      return { allowed: false, reason: 'Game has already started.' }
    }
    if (this.state.players.length >= this.config.MAX_PLAYERS) {
      return { allowed: false, reason: `Room is full (max ${this.config.MAX_PLAYERS} players).` }
    }
    const normalized = String(username || '').trim().toLowerCase()
    if (normalized.length < this.config.MIN_USERNAME_LENGTH) {
      return { allowed: false, reason: `Username must be at least ${this.config.MIN_USERNAME_LENGTH} characters.` }
    }
    const duplicate = this.state.players.some((p) => p.username.trim().toLowerCase() === normalized)
    if (duplicate) {
      return { allowed: false, reason: 'That username is already taken in this room.' }
    }
    return { allowed: true }
  }

  addPlayer({ id, username, isHost = false }) {
    const check = this.canJoin(username)
    if (!check.allowed) {
      return { ok: false, reason: check.reason }
    }
    if (this.state.players.some((p) => p.id === id)) {
      return { ok: false, reason: 'Player ID already exists in room.' }
    }
    const player = {
      id,
      username: username.trim().slice(0, this.config.MAX_USERNAME_LENGTH),
      isHost,
      connected: true,
      lives: this.config.INITIAL_LIVES,
      eliminated: false,
      wordsPlayed: 0,
      eliminationOrder: null,
    }
    this.state.players.push(player)
    this.state.lastEvent = {
      type: 'PLAYER_JOINED',
      playerId: player.id,
      username: player.username,
      message: `${player.username} joined the garden.`,
    }
    return { ok: true, player: { ...player } }
  }

  removeLobbyPlayer(playerId) {
    if (this.state.phase !== GAME_PHASES.LOBBY) return false
    const idx = this.state.players.findIndex((p) => p.id === playerId && !p.isHost)
    if (idx === -1) return false
    const [removed] = this.state.players.splice(idx, 1)
    this.state.lastEvent = {
      type: 'PLAYER_LEFT',
      playerId: removed.id,
      username: removed.username,
      message: `${removed.username} left the room.`,
    }
    return true
  }

  handlePlayerDisconnected(playerId, now = Date.now()) {
    const player = this.state.players.find((p) => p.id === playerId)
    if (!player) return { changed: false }

    if (this.state.phase === GAME_PHASES.LOBBY) {
      this.removeLobbyPlayer(playerId)
      return { changed: true, removedFromLobby: true }
    }

    player.connected = false

    if (this.state.phase === GAME_PHASES.PLAYING && !player.eliminated) {
      const wasCurrentTurn = this.getCurrentPlayer()?.id === playerId
      player.lives = 0
      player.eliminated = true
      this.eliminationSequence += 1
      player.eliminationOrder = this.eliminationSequence

      this.state.lastEvent = {
        type: 'PLAYER_DISCONNECTED',
        playerId: player.id,
        username: player.username,
        eliminated: true,
        message: `${player.username} disconnected and was eliminated.`,
      }

      if (this.checkAndFinishIfWinner()) {
        return { changed: true, gameOver: true, eliminatedPlayerId: playerId }
      }

      if (wasCurrentTurn) {
        this.advanceTurn(now)
      }
      return { changed: true, eliminatedPlayerId: playerId }
    }

    return { changed: true }
  }

  startGame(now = Date.now(), startingLetter = null) {
    if (this.state.phase !== GAME_PHASES.LOBBY) {
      return { ok: false, reason: 'Game is already in progress.' }
    }

    // Remove any disconnected stragglers before starting
    this.state.players = this.state.players.filter((p) => p.connected)

    if (this.state.players.length < this.config.MIN_PLAYERS) {
      return {
        ok: false,
        reason: `At least ${this.config.MIN_PLAYERS} players are needed to start.`,
      }
    }

    this.usedWords.clear()
    this.eliminationSequence = 0
    this.validatingTurnId = null

    this.state.players.forEach((p) => {
      p.lives = this.config.INITIAL_LIVES
      p.eliminated = false
      p.wordsPlayed = 0
      p.eliminationOrder = null
    })

    this.state.phase = GAME_PHASES.PLAYING
    this.state.turnIndex = 0
    this.state.turnId = 1
    this.state.turnNumber = 1
    this.state.round = 1
    this.state.requiredLetter = (startingLetter || pickRandomStartingLetter(this.config.STARTING_LETTERS)).toUpperCase()
    this.state.turnDeadline = now + this.config.TURN_DURATION_MS
    this.state.wordHistory = []
    this.state.winnerId = null
    this.state.standings = []
    this.state.lastEvent = {
      type: 'GAME_STARTED',
      playerId: this.state.players[0].id,
      username: this.state.players[0].username,
      requiredLetter: this.state.requiredLetter,
      message: `Game started! Starting letter is "${this.state.requiredLetter}".`,
    }

    return { ok: true, state: this.getPublicState(now) }
  }

  returnToLobby() {
    this.usedWords.clear()
    this.eliminationSequence = 0
    this.validatingTurnId = null

    // Keep connected players only
    this.state.players = this.state.players
      .filter((p) => p.connected || p.isHost)
      .map((p) => ({
        ...p,
        lives: this.config.INITIAL_LIVES,
        eliminated: false,
        wordsPlayed: 0,
        eliminationOrder: null,
      }))

    this.state.phase = GAME_PHASES.LOBBY
    this.state.turnIndex = 0
    this.state.turnId = 0
    this.state.turnNumber = 0
    this.state.round = 1
    this.state.requiredLetter = ''
    this.state.turnDeadline = null
    this.state.wordHistory = []
    this.state.winnerId = null
    this.state.standings = []
    this.state.lastEvent = {
      type: 'RETURN_TO_LOBBY',
      message: 'Returned to the garden lobby.',
    }

    return this.getPublicState()
  }

  /**
   * Authoritatively processes a player's word submission.
   */
  async processWordSubmission({
    playerId,
    rawWord,
    submittedAt = Date.now(),
    turnId,
    dictionaryService,
  }) {
    if (this.state.phase !== GAME_PHASES.PLAYING) {
      return { accepted: false, ignored: true, reason: 'GAME_NOT_ACTIVE', message: 'Game is not active.' }
    }

    const currentPlayer = this.getCurrentPlayer()
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { accepted: false, ignored: true, reason: 'NOT_YOUR_TURN', message: 'It is not your turn.' }
    }

    const activeTurnId = this.state.turnId
    if (turnId !== undefined && turnId !== activeTurnId) {
      return { accepted: false, ignored: true, reason: 'STALE_TURN', message: 'Turn has already moved on.' }
    }

    // Prevent concurrent submissions during async dictionary lookup for the same turn
    if (this.validatingTurnId === activeTurnId) {
      return { accepted: false, ignored: true, reason: 'SUBMISSION_IN_PROGRESS', message: 'Validating previous submission.' }
    }

    // Enforce authoritative deadline
    if (this.state.turnDeadline !== null && submittedAt > this.state.turnDeadline) {
      return this.processTimeout(activeTurnId, submittedAt)
    }

    const formatCheck = validateWordFormat(rawWord, this.state.requiredLetter, this.usedWords)
    if (!formatCheck.ok) {
      return this.applyLifePenalty({
        player: currentPlayer,
        reason: formatCheck.reason,
        message: formatCheck.message,
        word: String(rawWord || '').trim(),
        now: submittedAt,
      })
    }

    const normalizedWord = formatCheck.normalizedWord
    this.validatingTurnId = activeTurnId

    try {
      const lookup = await dictionaryService.verifyWord(normalizedWord)

      // Guard in case turn resolved (e.g. disconnect) while awaiting API
      if (this.state.phase !== GAME_PHASES.PLAYING || this.state.turnId !== activeTurnId) {
        return { accepted: false, ignored: true, reason: 'TURN_CHANGED', message: 'Turn already resolved.' }
      }

      if (!lookup.exists) {
        return this.applyLifePenalty({
          player: currentPlayer,
          reason: WORD_REJECTION_REASONS.NOT_IN_DICTIONARY,
          message: `"${normalizedWord}" was not found in the English dictionary.`,
          word: normalizedWord,
          now: Date.now(),
        })
      }

      // Valid word!
      this.usedWords.add(normalizedWord)
      currentPlayer.wordsPlayed += 1
      const nextLetter = getLastLetter(normalizedWord)
      const entry = {
        word: normalizedWord,
        playerId: currentPlayer.id,
        username: currentPlayer.username,
        turnNumber: this.state.turnNumber,
        timestamp: Date.now(),
      }
      this.state.wordHistory.push(entry)
      this.state.requiredLetter = nextLetter

      this.state.lastEvent = {
        type: 'WORD_ACCEPTED',
        playerId: currentPlayer.id,
        username: currentPlayer.username,
        word: normalizedWord,
        nextLetter,
        message: `${currentPlayer.username} played "${normalizedWord}". Next letter: ${nextLetter}.`,
      }

      const completionTime = Math.max(submittedAt, Date.now())
      this.advanceTurn(completionTime)

      return {
        accepted: true,
        word: normalizedWord,
        nextLetter,
        playerId: currentPlayer.id,
        state: this.getPublicState(completionTime),
      }
    } catch (error) {
      if (error instanceof DictionaryServiceError || error?.code === 'DICTIONARY_UNAVAILABLE') {
        // NEVER accept a word when dictionary is unavailable; do not punish player with life loss either.
        return {
          accepted: false,
          ignored: false,
          deductLife: false,
          reason: WORD_REJECTION_REASONS.DICTIONARY_UNAVAILABLE,
          message: error.message || 'Dictionary service is unavailable. Please try again.',
        }
      }
      throw error
    } finally {
      if (this.validatingTurnId === activeTurnId) {
        this.validatingTurnId = null
      }
    }
  }

  /**
   * Authoritatively resolves a turn timeout. Guarded by turnId so duplicate timers
   * can never deduct more than one life.
   */
  processTimeout(expectedTurnId, now = Date.now()) {
    if (this.state.phase !== GAME_PHASES.PLAYING) return null
    if (expectedTurnId !== undefined && this.state.turnId !== expectedTurnId) return null
    if (this.validatingTurnId === this.state.turnId) return null

    const currentPlayer = this.getCurrentPlayer()
    if (!currentPlayer) return null

    return this.applyLifePenalty({
      player: currentPlayer,
      reason: WORD_REJECTION_REASONS.TIMEOUT,
      message: `${currentPlayer.username} ran out of time!`,
      word: null,
      now,
    })
  }

  applyLifePenalty({ player, reason, message, word, now }) {
    const penalty =
      reason === WORD_REJECTION_REASONS.TIMEOUT
        ? this.config.PENALTIES.TIMEOUT
        : reason === WORD_REJECTION_REASONS.REPEATED_WORD
          ? this.config.PENALTIES.REPEATED_WORD
          : this.config.PENALTIES.INVALID_WORD

    player.lives = Math.max(0, player.lives - penalty)
    let eliminatedNow = false

    if (player.lives === 0 && !player.eliminated) {
      player.eliminated = true
      this.eliminationSequence += 1
      player.eliminationOrder = this.eliminationSequence
      eliminatedNow = true
    }

    this.state.lastEvent = {
      type: eliminatedNow ? 'PLAYER_ELIMINATED' : 'LIFE_LOST',
      reason,
      playerId: player.id,
      username: player.username,
      word,
      remainingLives: player.lives,
      eliminated: eliminatedNow,
      message: eliminatedNow ? `${message} ${player.username} has been eliminated!` : `${message} (-1 life)`,
    }

    const gameOver = this.checkAndFinishIfWinner()
    if (!gameOver) {
      this.advanceTurn(now)
    }

    return {
      accepted: false,
      deductLife: true,
      reason,
      message,
      playerId: player.id,
      remainingLives: player.lives,
      eliminated: eliminatedNow,
      gameOver,
      state: this.getPublicState(now),
    }
  }

  advanceTurn(now = Date.now()) {
    const total = this.state.players.length
    if (total === 0) return

    let nextIdx = this.state.turnIndex
    let wrapped = false

    for (let step = 1; step <= total; step += 1) {
      const candidate = (this.state.turnIndex + step) % total
      if (candidate <= this.state.turnIndex) {
        wrapped = true
      }
      if (!this.state.players[candidate].eliminated) {
        nextIdx = candidate
        break
      }
    }

    if (wrapped) {
      this.state.round += 1
    }

    this.state.turnIndex = nextIdx
    this.state.turnId += 1
    this.state.turnNumber += 1
    this.state.turnDeadline = now + this.config.TURN_DURATION_MS
  }

  checkAndFinishIfWinner() {
    const active = this.getActivePlayers()
    if (active.length > 1) return false

    const winner = active[0] || null
    this.state.phase = GAME_PHASES.GAME_OVER
    this.state.winnerId = winner ? winner.id : null
    this.state.turnDeadline = null

    // Standings: winner first, then remaining players ordered by latest elimination first, then wordsPlayed
    this.state.standings = [...this.state.players]
      .sort((a, b) => {
        if (a.id === this.state.winnerId) return -1
        if (b.id === this.state.winnerId) return 1
        const orderA = a.eliminationOrder ?? 0
        const orderB = b.eliminationOrder ?? 0
        if (orderA !== orderB) return orderB - orderA
        return b.wordsPlayed - a.wordsPlayed
      })
      .map((p, index) => ({
        rank: index + 1,
        id: p.id,
        username: p.username,
        isHost: p.isHost,
        wordsPlayed: p.wordsPlayed,
        lives: p.lives,
        eliminated: p.eliminated,
      }))

    return true
  }
}
