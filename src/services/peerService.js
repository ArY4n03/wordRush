import Peer from 'peerjs'
import { GAME_CONFIG, resolveNetworkConfig } from '../game/gameConfig.js'
import { MESSAGE_TYPES, createMessage, validateMessage } from '../game/messageProtocol.js'

/**
 * Low-level PeerJS WebRTC DataConnection wrapper.
 * Handles peer initialization, validated JSON messaging, and heartbeat checks.
 */
export class PeerService {
  constructor() {
    this.peer = null
    this.role = null // 'host' | 'client'
    this.initGeneration = 0
    this.connections = new Map() // peerId -> DataConnection
    this.lastSeen = new Map() // peerId -> timestamp
    this.heartbeatInterval = null
    this.handlers = {
      onMessage: null,
      onConnectionOpen: null,
      onConnectionClose: null,
      onStatusChange: null,
      onError: null,
    }
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers }
  }

  emitStatus(status, detail = null) {
    this.handlers.onStatusChange?.(status, detail)
  }

  /**
   * Initializes a PeerJS node.
   * For host, pass explicit deterministic `peerId`; for client, omit to get an ephemeral ID.
   */
  async initPeer(peerId = undefined, role = 'client') {
    this.destroy()
    const gen = ++this.initGeneration
    this.role = role
    this.emitStatus('connecting')

    const { peerOptions } = await resolveNetworkConfig()
    if (gen !== this.initGeneration) {
      const err = new Error('Peer initialization was cancelled.')
      err.type = 'cancelled'
      throw err
    }

    return new Promise((resolve, reject) => {
      let settled = false
      const peer = peerId ? new Peer(peerId, peerOptions) : new Peer(peerOptions)
      this.peer = peer

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true
          const err = new Error('Timed out connecting to signaling server.')
          err.type = 'signaling-timeout'
          reject(err)
        }
      }, 15_000)

      peer.on('open', (id) => {
        if (!settled) {
          settled = true
          clearTimeout(timeoutId)
          this.emitStatus('connected', { peerId: id })
          this.startHeartbeat()
          resolve(id)
        }
      })

      peer.on('connection', (conn) => {
        if (this.role !== 'host') {
          conn.close()
          return
        }
        this.attachConnection(conn, 'client')
      })

      peer.on('disconnected', () => {
        this.emitStatus('reconnecting')
        try {
          if (!peer.destroyed) {
            peer.reconnect()
          }
        } catch {
          // Ignore reconnect errors if peer is already tearing down
        }
      })

      peer.on('close', () => {
        this.emitStatus('disconnected')
      })

      peer.on('error', (err) => {
        if (!settled) {
          settled = true
          clearTimeout(timeoutId)
          reject(err)
          return
        }
        this.handlers.onError?.(err)
      })
    })
  }

  /**
   * Client connects to host PeerJS ID over a reliable ordered DataConnection.
   */
  connectToHost(hostPeerId) {
    if (!this.peer || this.peer.destroyed) {
      return Promise.reject(new Error('Peer connection is not initialized.'))
    }

    this.emitStatus('connecting_host')

    return new Promise((resolve, reject) => {
      let settled = false
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
        serialization: 'json',
      })

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true
          try {
            conn.close()
          } catch {
            // ignore
          }
          reject(new Error('Could not reach room host. Verify the room code and try again.'))
        }
      }, 25_000)

      this.attachConnection(conn, 'host', {
        onOpenOnce: () => {
          if (!settled) {
            settled = true
            clearTimeout(timeoutId)
            this.emitStatus('connected_host', { hostPeerId })
            resolve(conn)
          }
        },
        onErrorOnce: (err) => {
          if (!settled) {
            settled = true
            clearTimeout(timeoutId)
            reject(err || new Error('Failed to open WebRTC connection to host.'))
          }
        },
      })
    })
  }

  attachConnection(conn, expectFrom, lifecycleHooks = {}) {
    const remotePeerId = conn.peer
    this.connections.set(remotePeerId, conn)
    this.lastSeen.set(remotePeerId, Date.now())

    let closedOnce = false
    const handleClose = () => {
      if (closedOnce) return
      closedOnce = true
      this.connections.delete(remotePeerId)
      this.lastSeen.delete(remotePeerId)
      this.handlers.onConnectionClose?.(remotePeerId)
    }

    conn.on('open', () => {
      this.lastSeen.set(remotePeerId, Date.now())
      lifecycleHooks.onOpenOnce?.()
      this.handlers.onConnectionOpen?.(remotePeerId, conn)
    })

    conn.on('data', (rawData) => {
      this.lastSeen.set(remotePeerId, Date.now())
      const validation = validateMessage(rawData, { expectFrom })
      if (!validation.valid) {
        console.warn(`[PeerService] Rejected invalid message from ${remotePeerId}:`, validation.error)
        return
      }

      const msg = validation.message
      if (msg.type === MESSAGE_TYPES.PING) {
        this.sendTo(remotePeerId, MESSAGE_TYPES.PONG, { ts: msg.payload?.ts || Date.now() })
        return
      }
      if (msg.type === MESSAGE_TYPES.PONG) {
        return
      }

      this.handlers.onMessage?.(remotePeerId, msg)
    })

    conn.on('iceStateChanged', (state) => {
      if (state === 'failed') {
        const iceErr = new Error(
          'Direct and relayed WebRTC connection failed. A strict firewall or NAT may be blocking peer traffic.',
        )
        iceErr.type = 'ice-failed'
        lifecycleHooks.onErrorOnce?.(iceErr)
        handleClose()
      }
    })

    conn.on('close', handleClose)
    conn.on('error', (err) => {
      lifecycleHooks.onErrorOnce?.(err)
      handleClose()
    })
  }

  sendTo(peerId, type, payload = {}) {
    const conn = this.connections.get(peerId)
    if (!conn || !conn.open) return false
    try {
      conn.send(createMessage(type, payload))
      return true
    } catch {
      return false
    }
  }

  broadcast(type, payload = {}, excludePeerId = null) {
    const msg = createMessage(type, payload)
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId === excludePeerId) continue
      if (conn.open) {
        try {
          conn.send(msg)
        } catch {
          // Ignore send failures; close handler will clean up
        }
      }
    }
  }

  closePeerConnection(peerId) {
    const conn = this.connections.get(peerId)
    if (conn) {
      try {
        conn.close()
      } catch {
        // ignore
      }
      this.connections.delete(peerId)
      this.lastSeen.delete(peerId)
    }
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      for (const [peerId, conn] of this.connections.entries()) {
        const last = this.lastSeen.get(peerId) || now
        if (now - last > GAME_CONFIG.HEARTBEAT_TIMEOUT_MS) {
          this.closePeerConnection(peerId)
          this.handlers.onConnectionClose?.(peerId)
          continue
        }
        if (conn.open) {
          try {
            conn.send(createMessage(MESSAGE_TYPES.PING, { ts: now }))
          } catch {
            // ignore
          }
        }
      }
    }, GAME_CONFIG.HEARTBEAT_INTERVAL_MS)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  destroy() {
    this.initGeneration += 1
    this.stopHeartbeat()
    for (const conn of this.connections.values()) {
      try {
        conn.close()
      } catch {
        // ignore
      }
    }
    this.connections.clear()
    this.lastSeen.clear()

    if (this.peer) {
      try {
        this.peer.destroy()
      } catch {
        // ignore
      }
      this.peer = null
    }
    this.role = null
  }
}
