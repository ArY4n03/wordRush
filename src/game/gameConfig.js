/**
 * Centralized game and networking configuration for WORD RUSH.
 * All core rules, timers, and PeerJS/ICE defaults live here so they
 * can be tuned in one place without touching game logic or UI.
 */

export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,
  INITIAL_LIVES: 2,
  TURN_DURATION_MS: 10_000,
  MIN_WORD_LENGTH: 2,
  MAX_WORD_LENGTH: 40,
  MAX_USERNAME_LENGTH: 18,
  MIN_USERNAME_LENGTH: 2,
  ROOM_CODE_LENGTH: 6,
  // Exclude X by default? Keeping full A-Z per specification; easily customizable here.
  STARTING_LETTERS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  PENALTIES: {
    INVALID_WORD: 1,
    REPEATED_WORD: 1,
    TIMEOUT: 1,
  },
  HEARTBEAT_INTERVAL_MS: 5_000,
  HEARTBEAT_TIMEOUT_MS: 16_000,
  DICTIONARY_TIMEOUT_MS: 4_500,
  DICTIONARY_GRACE_MS: 450,
}

function parseBoolEnv(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  return String(value).toLowerCase() === 'true'
}

export function getNetworkConfig() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]

  if (env.VITE_TURN_URL) {
    const turnEntry = { urls: env.VITE_TURN_URL }
    if (env.VITE_TURN_USERNAME) turnEntry.username = env.VITE_TURN_USERNAME
    if (env.VITE_TURN_CREDENTIAL) turnEntry.credential = env.VITE_TURN_CREDENTIAL
    iceServers.push(turnEntry)
  }

  // If VITE_PEER_HOST is omitted, PeerJS uses its public cloud signaling server.
  const peerOptions = {
    debug: env.DEV ? 1 : 0,
    config: {
      iceServers,
    },
  }

  if (env.VITE_PEER_HOST) {
    peerOptions.host = env.VITE_PEER_HOST
    if (env.VITE_PEER_PORT) peerOptions.port = Number(env.VITE_PEER_PORT)
    if (env.VITE_PEER_PATH) peerOptions.path = env.VITE_PEER_PATH
    peerOptions.secure = parseBoolEnv(env.VITE_PEER_SECURE, true)
    if (env.VITE_PEER_KEY) peerOptions.key = env.VITE_PEER_KEY
  }

  return {
    peerOptions,
    discoveryUrl: env.VITE_DISCOVERY_URL || '',
    dictionaryProvider: env.VITE_DICTIONARY_PROVIDER || 'free-dictionary-api',
  }
}
