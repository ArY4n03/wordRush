import { useCallback, useEffect, useState } from 'react'
import { gameService } from '../services/gameService.js'
import { soundService } from '../services/soundService.js'

/**
 * Manages peer connection status, sound mute toggle, and cleanup on unload.
 */
export function usePeer() {
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [muted, setMuted] = useState(() => soundService.isMuted())

  useEffect(() => {
    const handleBeforeUnload = () => {
      gameService.leaveRoom()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const nextMuted = soundService.toggleMute()
    setMuted(nextMuted)
    if (!nextMuted) {
      soundService.playClick()
    }
  }, [])

  return {
    connectionStatus,
    setConnectionStatus,
    muted,
    toggleMute,
  }
}
