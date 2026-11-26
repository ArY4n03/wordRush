import { getNetworkConfig } from '../game/gameConfig.js'
import { isValidRoomCode, normalizeRoomCode } from '../utils/roomCode.js'

const PEER_ID_PREFIX = 'wordrush-v1-'

/**
 * RoomDiscovery abstraction mapping human-friendly 6-character room codes
 * to PeerJS host peer IDs.
 *
 * Default implementation (`DeterministicPeerRoomDiscovery`) derives the host's
 * PeerJS ID directly from the room code via a namespaced prefix, avoiding any
 * external database or persistent backend. If a separate directory service is
 * later desired, set `VITE_DISCOVERY_URL` to use `HttpRoomDiscovery`.
 */
export class DeterministicPeerRoomDiscovery {
  toPeerId(roomCode) {
    const normalized = normalizeRoomCode(roomCode)
    if (!isValidRoomCode(normalized)) {
      throw new Error('Room code must be 6 alphanumeric characters.')
    }
    return `${PEER_ID_PREFIX}${normalized}`
  }

  async registerRoom(roomCode) {
    const hostPeerId = this.toPeerId(roomCode)
    return { roomCode: normalizeRoomCode(roomCode), hostPeerId }
  }

  async resolveRoom(roomCode) {
    const normalized = normalizeRoomCode(roomCode)
    const hostPeerId = this.toPeerId(normalized)
    return { roomCode: normalized, hostPeerId }
  }

  async unregisterRoom() {
    // PeerJS server automatically releases the ID when the host peer disconnects.
  }
}

/**
 * Optional lightweight HTTP directory adapter for custom deployments.
 * Expects:
 *   POST {discoveryUrl}/rooms        { roomCode, hostPeerId }
 *   GET  {discoveryUrl}/rooms/:code  -> { hostPeerId }
 *   DELETE {discoveryUrl}/rooms/:code
 */
export class HttpRoomDiscovery {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  async registerRoom(roomCode, hostPeerId) {
    const normalized = normalizeRoomCode(roomCode)
    const res = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: normalized, hostPeerId }),
    })
    if (!res.ok) {
      throw new Error(`Failed to register room (${res.status}).`)
    }
    return { roomCode: normalized, hostPeerId }
  }

  async resolveRoom(roomCode) {
    const normalized = normalizeRoomCode(roomCode)
    if (!isValidRoomCode(normalized)) {
      throw new Error('Room code must be 6 alphanumeric characters.')
    }
    const res = await fetch(`${this.baseUrl}/rooms/${encodeURIComponent(normalized)}`)
    if (res.status === 404) {
      throw new Error('Room not found. Check the code and try again.')
    }
    if (!res.ok) {
      throw new Error(`Room lookup failed (${res.status}).`)
    }
    const data = await res.json()
    if (!data?.hostPeerId) {
      throw new Error('Room directory returned an invalid host ID.')
    }
    return { roomCode: normalized, hostPeerId: data.hostPeerId }
  }

  async unregisterRoom(roomCode) {
    const normalized = normalizeRoomCode(roomCode)
    await fetch(`${this.baseUrl}/rooms/${encodeURIComponent(normalized)}`, {
      method: 'DELETE',
    }).catch(() => {})
  }
}

export function createRoomDiscovery() {
  const { discoveryUrl } = getNetworkConfig()
  if (discoveryUrl) {
    return new HttpRoomDiscovery(discoveryUrl)
  }
  return new DeterministicPeerRoomDiscovery()
}
