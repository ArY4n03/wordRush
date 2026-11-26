import { GAME_PHASES, GameEngine } from '../game/gameEngine.js'
import { MESSAGE_TYPES } from '../game/messageProtocol.js'
import { generateRoomCode, normalizeRoomCode } from '../utils/roomCode.js'
import { dictionaryService } from './dictionaryService.js'
import { PeerService } from './peerService.js'
import { createRoomDiscovery } from './roomDiscovery.js'

/**
 * Coordinates the authoritative GameEngine (for host) or synchronized mirror
 * (for clients) over PeerService and RoomDiscovery.
 */
export class GameService {
  constructor() {
    this.peerService = new PeerService()
    this.roomDiscovery = createRoomDiscovery()
    this.engine = null
    this.role = null // 'host' | 'client' | null
    this.localPeerId = null
    this.hostPeerId = null
    this.roomCode = ''
    this.turnTimeoutHandle = null
    this.callbacks = {
      onStateChange: null,
      onWordResult: null,
      onConnectionStatus: null,
      onError: null,
      onHostDisconnected: null,
    }
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  clearTurnTimeout() {
    if (this.turnTimeoutHandle) {
      clearTimeout(this.turnTimeoutHandle)
      this.turnTimeoutHandle = null
    }
  }

  /**
   * Schedules a single authoritative timeout check for the current turn.
   * Guarded by turnId inside GameEngine so multiple triggers never deduct > 1 life.
   */
  scheduleHostTurnTimeout() {
    this.clearTurnTimeout()
    if (!this.engine || this.engine.state.phase !== GAME_PHASES.PLAYING) return

    const { turnId, turnDeadline } = this.engine.state
    if (!turnDeadline) return

    const delayMs = Math.max(0, turnDeadline - Date.now()) + 40
    this.turnTimeoutHandle = setTimeout(() => {
      this.handleHostTimeout(turnId)
    }, delayMs)
  }

  handleHostTimeout(expectedTurnId) {
    if (this.role !== 'host' || !this.engine) return

    // If a dictionary lookup is currently in-flight, wait briefly before timing out.
    if (this.engine.validatingTurnId === expectedTurnId) {
      this.turnTimeoutHandle = setTimeout(() => {
        this.handleHostTimeout(expectedTurnId)
      }, 200)
      return
    }

    const result = this.engine.processTimeout(expectedTurnId, Date.now())
    if (!result) return

    const snapshot = this.engine.getPublicState()
    this.callbacks.onStateChange?.(snapshot)
    this.callbacks.onWordResult?.(result)

    this.peerService.broadcast(MESSAGE_TYPES.WORD_RESULT, result)

    if (snapshot.phase === GAME_PHASES.GAME_OVER) {
      this.clearTurnTimeout()
      this.peerService.broadcast(MESSAGE_TYPES.GAME_OVER, { state: snapshot })
    } else {
      this.peerService.broadcast(MESSAGE_TYPES.TURN_UPDATE, { state: snapshot })
      this.scheduleHostTurnTimeout()
    }
  }

  /**
   * Initializes a new room as the authoritative host.
   */
  async createRoom(username) {
    this.leaveRoom()
    this.role = 'host'

    this.peerService.setHandlers({
      onStatusChange: (status, detail) => this.callbacks.onConnectionStatus?.(status, detail),
      onMessage: (peerId, msg) => this.handleHostIncomingMessage(peerId, msg),
      onConnectionClose: (peerId) => this.handleClientDisconnected(peerId),
      onError: (err) => this.handlePeerRuntimeError(err),
    })

    // Try up to 4 generated room codes in case one collides on the PeerJS signaling server.
    let lastError = null
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const candidateCode = generateRoomCode()
      try {
        const reg = await this.roomDiscovery.registerRoom(candidateCode)
        const assignedId = await this.peerService.initPeer(reg.hostPeerId, 'host')
        // For HTTP discovery where hostPeerId might differ, register actual ID if needed
        if (assignedId !== reg.hostPeerId) {
          await this.roomDiscovery.registerRoom(candidateCode, assignedId)
        }

        this.roomCode = reg.roomCode
        this.localPeerId = assignedId
        this.hostPeerId = assignedId
        this.engine = new GameEngine({
          roomCode: this.roomCode,
          hostId: this.localPeerId,
          hostUsername: username,
        })

        const snapshot = this.engine.getPublicState()
        this.callbacks.onStateChange?.(snapshot)
        return { roomCode: this.roomCode, peerId: this.localPeerId, state: snapshot }
      } catch (err) {
        lastError = err
        if (err?.type === 'unavailable-id') {
          continue
        }
        break
      }
    }

    this.leaveRoom()
    throw new Error(this.formatPeerError(lastError, 'Could not create room. Please check your connection.'))
  }

  /**
   * Connects as a client to a host's room using its 6-character code.
   */
  async joinRoom(roomCode, username) {
    this.leaveRoom()
    this.role = 'client'

    const normalizedCode = normalizeRoomCode(roomCode)

    let resolved
    try {
      resolved = await this.roomDiscovery.resolveRoom(normalizedCode)
    } catch (err) {
      this.role = null
      throw err
    }

    this.roomCode = resolved.roomCode
    this.hostPeerId = resolved.hostPeerId

    return new Promise((resolve, reject) => {
      let handshakeDone = false
      let timeoutId = null

      const cleanupReject = (message) => {
        if (handshakeDone) return
        handshakeDone = true
        if (timeoutId) clearTimeout(timeoutId)
        this.leaveRoom()
        reject(new Error(message))
      }

      this.peerService.setHandlers({
        onStatusChange: (status, detail) => this.callbacks.onConnectionStatus?.(status, detail),
        onMessage: (peerId, msg) => {
          if (peerId !== this.hostPeerId) return

          if (msg.type === MESSAGE_TYPES.JOIN_ACCEPTED && !handshakeDone) {
            handshakeDone = true
            if (timeoutId) clearTimeout(timeoutId)
            this.callbacks.onStateChange?.(msg.payload.state)
            resolve({
              roomCode: this.roomCode,
              peerId: this.localPeerId,
              state: msg.payload.state,
            })
            return
          }

          if (msg.type === MESSAGE_TYPES.JOIN_REJECTED && !handshakeDone) {
            cleanupReject(msg.payload.reason || 'Join request was rejected by the host.')
            return
          }

          this.handleClientIncomingMessage(msg)
        },
        onConnectionClose: (peerId) => {
          if (peerId === this.hostPeerId) {
            if (!handshakeDone) {
              cleanupReject('Disconnected from host before joining.')
            } else {
              this.callbacks.onHostDisconnected?.('The host disconnected and the room closed.')
            }
          }
        },
        onError: (err) => {
          const msg = this.formatPeerError(err, 'Connection error with host.')
          if (!handshakeDone) {
            cleanupReject(msg)
          } else {
            this.callbacks.onError?.(msg)
          }
        },
      })

      this.peerService
        .initPeer(undefined, 'client')
        .then((id) => {
          this.localPeerId = id
          return this.peerService.connectToHost(this.hostPeerId)
        })
        .then(() => {
          timeoutId = setTimeout(() => {
            cleanupReject('Host did not respond to join request.')
          }, 10_000)

          this.peerService.sendTo(this.hostPeerId, MESSAGE_TYPES.JOIN_REQUEST, {
            username,
            roomCode: this.roomCode,
          })
        })
        .catch((err) => {
          cleanupReject(this.formatPeerError(err, 'Could not connect to room.'))
        })
    })
  }

  handleHostIncomingMessage(senderPeerId, msg) {
    if (this.role !== 'host' || !this.engine) return

    switch (msg.type) {
      case MESSAGE_TYPES.JOIN_REQUEST: {
        const result = this.engine.addPlayer({
          id: senderPeerId,
          username: msg.payload.username,
          isHost: false,
        })

        if (!result.ok) {
          this.peerService.sendTo(senderPeerId, MESSAGE_TYPES.JOIN_REJECTED, {
            reason: result.reason,
          })
          setTimeout(() => this.peerService.closePeerConnection(senderPeerId), 150)
          return
        }

        const snapshot = this.engine.getPublicState()
        this.peerService.sendTo(senderPeerId, MESSAGE_TYPES.JOIN_ACCEPTED, {
          playerId: senderPeerId,
          state: snapshot,
        })
        this.peerService.broadcast(
          MESSAGE_TYPES.PLAYER_LIST_UPDATE,
          { players: snapshot.players, state: snapshot },
          senderPeerId,
        )
        this.callbacks.onStateChange?.(snapshot)
        break
      }

      case MESSAGE_TYPES.WORD_SUBMISSION: {
        // Authoritative check: senderPeerId comes from the authenticated DataConnection,
        // preventing clients from spoofing another player's ID.
        this.processHostWordSubmission({
          playerId: senderPeerId,
          rawWord: msg.payload.word,
          turnId: msg.payload.turnId,
        })
        break
      }

      default:
        break
    }
  }

  handleClientIncomingMessage(msg) {
    switch (msg.type) {
      case MESSAGE_TYPES.PLAYER_LIST_UPDATE:
        if (msg.payload.state) {
          this.callbacks.onStateChange?.(msg.payload.state)
        }
        break

      case MESSAGE_TYPES.GAME_START:
      case MESSAGE_TYPES.GAME_STATE_UPDATE:
      case MESSAGE_TYPES.TURN_UPDATE:
      case MESSAGE_TYPES.GAME_OVER:
      case MESSAGE_TYPES.RETURN_TO_LOBBY:
        if (msg.payload.state) {
          this.callbacks.onStateChange?.(msg.payload.state)
        }
        break

      case MESSAGE_TYPES.PLAYER_DISCONNECTED:
        if (msg.payload.state) {
          this.callbacks.onStateChange?.(msg.payload.state)
        }
        break

      case MESSAGE_TYPES.WORD_RESULT:
        this.callbacks.onWordResult?.(msg.payload)
        if (msg.payload.state) {
          this.callbacks.onStateChange?.(msg.payload.state)
        }
        break

      default:
        break
    }
  }

  handleClientDisconnected(peerId) {
    if (this.role !== 'host' || !this.engine) return
    const res = this.engine.handlePlayerDisconnected(peerId, Date.now())
    if (!res.changed) return

    const snapshot = this.engine.getPublicState()
    this.callbacks.onStateChange?.(snapshot)

    if (res.removedFromLobby) {
      this.peerService.broadcast(MESSAGE_TYPES.PLAYER_LIST_UPDATE, {
        players: snapshot.players,
        state: snapshot,
      })
      return
    }

    this.peerService.broadcast(MESSAGE_TYPES.PLAYER_DISCONNECTED, {
      playerId: peerId,
      state: snapshot,
    })

    if (res.gameOver) {
      this.clearTurnTimeout()
      this.peerService.broadcast(MESSAGE_TYPES.GAME_OVER, { state: snapshot })
    } else if (snapshot.phase === GAME_PHASES.PLAYING) {
      this.scheduleHostTurnTimeout()
    }
  }

  startGame() {
    if (this.role !== 'host' || !this.engine) {
      return { ok: false, reason: 'Only the host can start the game.' }
    }
    const res = this.engine.startGame(Date.now())
    if (!res.ok) return res

    this.callbacks.onStateChange?.(res.state)
    this.peerService.broadcast(MESSAGE_TYPES.GAME_START, { state: res.state })
    this.scheduleHostTurnTimeout()
    return res
  }

  playAgain() {
    if (this.role !== 'host' || !this.engine) return
    this.clearTurnTimeout()
    const snapshot = this.engine.returnToLobby()
    this.callbacks.onStateChange?.(snapshot)
    this.peerService.broadcast(MESSAGE_TYPES.RETURN_TO_LOBBY, { state: snapshot })
  }

  async submitWord(rawWord, turnId) {
    if (this.role === 'host') {
      return this.processHostWordSubmission({
        playerId: this.localPeerId,
        rawWord,
        turnId,
      })
    }

    if (this.role === 'client') {
      const sent = this.peerService.sendTo(this.hostPeerId, MESSAGE_TYPES.WORD_SUBMISSION, {
        word: String(rawWord || ''),
        turnId,
      })
      if (!sent) {
        this.callbacks.onError?.('Not connected to host.')
        return { accepted: false, reason: 'DISCONNECTED' }
      }
      return { pending: true }
    }

    return { accepted: false }
  }

  async processHostWordSubmission({ playerId, rawWord, turnId }) {
    if (this.role !== 'host' || !this.engine) return null

    const submittedAt = Date.now()
    const result = await this.engine.processWordSubmission({
      playerId,
      rawWord,
      submittedAt,
      turnId,
      dictionaryService,
    })

    if (!result || result.ignored) return result

    // Dictionary outage: notify relevant player(s) without accepting the word or deducting a life.
    if (result.reason === 'DICTIONARY_UNAVAILABLE') {
      if (playerId === this.localPeerId) {
        this.callbacks.onWordResult?.(result)
      } else {
        this.peerService.sendTo(playerId, MESSAGE_TYPES.WORD_RESULT, result)
      }
      return result
    }

    const snapshot = result.state || this.engine.getPublicState()
    this.callbacks.onWordResult?.(result)
    this.callbacks.onStateChange?.(snapshot)

    this.peerService.broadcast(MESSAGE_TYPES.WORD_RESULT, result)

    if (snapshot.phase === GAME_PHASES.GAME_OVER) {
      this.clearTurnTimeout()
      this.peerService.broadcast(MESSAGE_TYPES.GAME_OVER, { state: snapshot })
    } else {
      this.peerService.broadcast(MESSAGE_TYPES.TURN_UPDATE, { state: snapshot })
      this.scheduleHostTurnTimeout()
    }

    return result
  }

  handlePeerRuntimeError(err) {
    const msg = this.formatPeerError(err, 'Peer networking error occurred.')
    this.callbacks.onError?.(msg)
  }

  formatPeerError(err, fallback) {
    if (!err) return fallback
    if (err.type === 'peer-unavailable') {
      return `Room "${this.roomCode}" was not found. Check the code or ask the host to create a new room.`
    }
    if (err.type === 'unavailable-id') {
      return 'Room code collision on signaling server. Please try again.'
    }
    if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
      return 'Unable to reach PeerJS signaling server. Check your internet connection.'
    }
    return err.message || fallback
  }

  leaveRoom() {
    this.clearTurnTimeout()
    if (this.role === 'host' && this.roomCode) {
      this.roomDiscovery.unregisterRoom(this.roomCode)
    }
    this.peerService.destroy()
    this.engine = null
    this.role = null
    this.localPeerId = null
    this.hostPeerId = null
    this.roomCode = ''
  }
}

export const gameService = new GameService()
