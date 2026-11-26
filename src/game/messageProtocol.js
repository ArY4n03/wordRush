/**
 * Structured P2P message protocol for WORD RUSH.
 * Every incoming PeerJS message is validated before reaching game or room state.
 */

export const MESSAGE_TYPES = Object.freeze({
  JOIN_REQUEST: 'JOIN_REQUEST',
  JOIN_ACCEPTED: 'JOIN_ACCEPTED',
  JOIN_REJECTED: 'JOIN_REJECTED',
  PLAYER_LIST_UPDATE: 'PLAYER_LIST_UPDATE',
  GAME_START: 'GAME_START',
  WORD_SUBMISSION: 'WORD_SUBMISSION',
  WORD_RESULT: 'WORD_RESULT',
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
  TURN_UPDATE: 'TURN_UPDATE',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  GAME_OVER: 'GAME_OVER',
  RETURN_TO_LOBBY: 'RETURN_TO_LOBBY',
  PING: 'PING',
  PONG: 'PONG',
})

const VALID_TYPE_SET = new Set(Object.values(MESSAGE_TYPES))

const HOST_ONLY_TYPES = new Set([
  MESSAGE_TYPES.JOIN_ACCEPTED,
  MESSAGE_TYPES.JOIN_REJECTED,
  MESSAGE_TYPES.PLAYER_LIST_UPDATE,
  MESSAGE_TYPES.GAME_START,
  MESSAGE_TYPES.WORD_RESULT,
  MESSAGE_TYPES.GAME_STATE_UPDATE,
  MESSAGE_TYPES.TURN_UPDATE,
  MESSAGE_TYPES.PLAYER_DISCONNECTED,
  MESSAGE_TYPES.GAME_OVER,
  MESSAGE_TYPES.RETURN_TO_LOBBY,
])

const CLIENT_ALLOWED_TYPES = new Set([
  MESSAGE_TYPES.JOIN_REQUEST,
  MESSAGE_TYPES.WORD_SUBMISSION,
  MESSAGE_TYPES.PING,
  MESSAGE_TYPES.PONG,
])

export function createMessage(type, payload = {}) {
  if (!VALID_TYPE_SET.has(type)) {
    throw new Error(`Unknown message type: ${type}`)
  }
  return {
    type,
    payload: payload && typeof payload === 'object' ? payload : {},
    timestamp: Date.now(),
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Validates raw incoming message structure and role authorization.
 * @param {unknown} raw
 * @param {{ expectFrom?: 'host' | 'client' }} options
 * @returns {{ valid: boolean, message?: object, error?: string }}
 */
export function validateMessage(raw, options = {}) {
  if (!isPlainObject(raw)) {
    return { valid: false, error: 'Message must be a JSON object.' }
  }

  const { type, payload, timestamp } = raw

  if (typeof type !== 'string' || !VALID_TYPE_SET.has(type)) {
    return { valid: false, error: `Unsupported message type: ${String(type)}` }
  }

  if (payload !== undefined && !isPlainObject(payload)) {
    return { valid: false, error: 'Message payload must be an object.' }
  }

  if (timestamp !== undefined && (typeof timestamp !== 'number' || !Number.isFinite(timestamp))) {
    return { valid: false, error: 'Invalid message timestamp.' }
  }

  if (options.expectFrom === 'client' && !CLIENT_ALLOWED_TYPES.has(type)) {
    return { valid: false, error: `Unauthorized client message type: ${type}` }
  }

  if (options.expectFrom === 'host' && !HOST_ONLY_TYPES.has(type) && type !== MESSAGE_TYPES.PING && type !== MESSAGE_TYPES.PONG) {
    return { valid: false, error: `Unexpected host message type: ${type}` }
  }

  const safePayload = payload || {}

  switch (type) {
    case MESSAGE_TYPES.JOIN_REQUEST: {
      if (typeof safePayload.username !== 'string' || safePayload.username.trim().length === 0) {
        return { valid: false, error: 'JOIN_REQUEST requires a username.' }
      }
      if (safePayload.username.length > 40) {
        return { valid: false, error: 'Username exceeds maximum length.' }
      }
      if (safePayload.roomCode !== undefined && typeof safePayload.roomCode !== 'string') {
        return { valid: false, error: 'Invalid roomCode in JOIN_REQUEST.' }
      }
      break
    }

    case MESSAGE_TYPES.WORD_SUBMISSION: {
      if (typeof safePayload.word !== 'string') {
        return { valid: false, error: 'WORD_SUBMISSION requires a string word.' }
      }
      if (safePayload.word.length > 64) {
        return { valid: false, error: 'Submitted word exceeds maximum buffer length.' }
      }
      if (safePayload.turnId !== undefined && typeof safePayload.turnId !== 'number') {
        return { valid: false, error: 'Invalid turnId in WORD_SUBMISSION.' }
      }
      break
    }

    case MESSAGE_TYPES.JOIN_REJECTED: {
      if (typeof safePayload.reason !== 'string') {
        return { valid: false, error: 'JOIN_REJECTED requires a reason.' }
      }
      break
    }

    case MESSAGE_TYPES.JOIN_ACCEPTED:
    case MESSAGE_TYPES.GAME_STATE_UPDATE:
    case MESSAGE_TYPES.GAME_START:
    case MESSAGE_TYPES.GAME_OVER:
    case MESSAGE_TYPES.RETURN_TO_LOBBY: {
      if (!isPlainObject(safePayload.state)) {
        return { valid: false, error: `${type} requires a state object.` }
      }
      break
    }

    case MESSAGE_TYPES.PLAYER_LIST_UPDATE: {
      if (!Array.isArray(safePayload.players)) {
        return { valid: false, error: 'PLAYER_LIST_UPDATE requires a players array.' }
      }
      break
    }

    case MESSAGE_TYPES.WORD_RESULT: {
      if (typeof safePayload.accepted !== 'boolean') {
        return { valid: false, error: 'WORD_RESULT requires an accepted boolean.' }
      }
      break
    }

    default:
      break
  }

  return {
    valid: true,
    message: {
      type,
      payload: safePayload,
      timestamp: timestamp || Date.now(),
    },
  }
}
