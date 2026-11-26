import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_PHASES } from '../game/gameEngine.js'
import { gameService } from '../services/gameService.js'
import { soundService } from '../services/soundService.js'
import { validateUsername } from '../utils/formatTime.js'
import { isValidRoomCode, normalizeRoomCode } from '../utils/roomCode.js'

export const SCREENS = Object.freeze({
  HOME: 'HOME',
  CREATE: 'CREATE',
  JOIN: 'JOIN',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
  RESULTS: 'RESULTS',
})

/**
 * Manages room creation, joining, lobby state, screen transitions, and disconnects.
 */
export function useRoom({ setConnectionStatus }) {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [gameState, setGameState] = useState(null)
  const [localPeerId, setLocalPeerId] = useState(null)
  const [role, setRole] = useState(null) // 'host' | 'client' | null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [clockOffsetMs, setClockOffsetMs] = useState(0)
  const [lastWordResult, setLastWordResult] = useState(null)

  const prevPhaseRef = useRef(null)

  useEffect(() => {
    gameService.setCallbacks({
      onConnectionStatus: (status) => {
        setConnectionStatus(status)
      },
      onStateChange: (nextState) => {
        if (!nextState) return
        if (typeof nextState.hostTimestamp === 'number') {
          setClockOffsetMs(nextState.hostTimestamp - Date.now())
        }
        setGameState(nextState)

        const prevPhase = prevPhaseRef.current
        prevPhaseRef.current = nextState.phase

        if (nextState.phase === GAME_PHASES.LOBBY) {
          setScreen(SCREENS.LOBBY)
          setLastWordResult(null)
        } else if (nextState.phase === GAME_PHASES.PLAYING) {
          setScreen(SCREENS.GAME)
          if (prevPhase !== GAME_PHASES.PLAYING) {
            setLastWordResult(null)
          }
        } else if (nextState.phase === GAME_PHASES.GAME_OVER) {
          setScreen(SCREENS.RESULTS)
          if (prevPhase !== GAME_PHASES.GAME_OVER) {
            soundService.playVictory()
          }
        }
      },
      onWordResult: (result) => {
        if (!result) return
        setLastWordResult({ ...result, _receivedAt: Date.now() })
        if (result.accepted) {
          soundService.playValidWord()
        } else if (result.eliminated) {
          soundService.playEliminated()
        } else if (result.deductLife) {
          soundService.playInvalidWord()
        }
      },
      onHostDisconnected: (message) => {
        gameService.leaveRoom()
        setGameState(null)
        setLocalPeerId(null)
        setRole(null)
        setConnectionStatus('disconnected')
        setError(message || 'The host disconnected.')
        setScreen(SCREENS.HOME)
      },
      onError: (message) => {
        setError(message)
      },
    })
  }, [setConnectionStatus])

  const clearError = useCallback(() => setError(''), [])
  const clearNotice = useCallback(() => setNotice(''), [])

  const goHome = useCallback(() => {
    soundService.playClick()
    gameService.leaveRoom()
    prevPhaseRef.current = null
    setGameState(null)
    setLocalPeerId(null)
    setRole(null)
    setConnectionStatus('idle')
    setError('')
    setNotice('')
    setLastWordResult(null)
    setScreen(SCREENS.HOME)
  }, [setConnectionStatus])

  const openCreateRoom = useCallback(() => {
    soundService.playClick()
    setError('')
    setNotice('')
    setScreen(SCREENS.CREATE)
  }, [])

  const openJoinRoom = useCallback(() => {
    soundService.playClick()
    setError('')
    setNotice('')
    setScreen(SCREENS.JOIN)
  }, [])

  const createRoom = useCallback(async (rawUsername) => {
    const check = validateUsername(rawUsername)
    if (!check.valid) {
      setError(check.error)
      return false
    }

    setLoading(true)
    setError('')
    setNotice('')
    try {
      const res = await gameService.createRoom(check.name)
      setLocalPeerId(res.peerId)
      setRole('host')
      setGameState(res.state)
      prevPhaseRef.current = res.state.phase
      setScreen(SCREENS.LOBBY)
      return true
    } catch (err) {
      setError(err.message || 'Could not create room.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (rawRoomCode, rawUsername) => {
    const userCheck = validateUsername(rawUsername)
    if (!userCheck.valid) {
      setError(userCheck.error)
      return false
    }

    const code = normalizeRoomCode(rawRoomCode)
    if (!isValidRoomCode(code)) {
      setError('Enter a valid 6-character room code.')
      return false
    }

    setLoading(true)
    setError('')
    setNotice('')
    try {
      const res = await gameService.joinRoom(code, userCheck.name)
      setLocalPeerId(res.peerId)
      setRole('client')
      setGameState(res.state)
      prevPhaseRef.current = res.state.phase
      setScreen(SCREENS.LOBBY)
      return true
    } catch (err) {
      setError(err.message || 'Could not join room.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const startGame = useCallback(() => {
    soundService.playClick()
    setError('')
    const res = gameService.startGame()
    if (!res.ok) {
      setError(res.reason || 'Cannot start game yet.')
    }
  }, [])

  const playAgain = useCallback(() => {
    soundService.playClick()
    setError('')
    gameService.playAgain()
  }, [])

  return {
    screen,
    gameState,
    localPeerId,
    role,
    isHost: role === 'host',
    loading,
    error,
    notice,
    clockOffsetMs,
    lastWordResult,
    clearError,
    clearNotice,
    goHome,
    openCreateRoom,
    openJoinRoom,
    createRoom,
    joinRoom,
    startGame,
    playAgain,
  }
}
