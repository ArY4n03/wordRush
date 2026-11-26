import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_CONFIG } from '../game/gameConfig.js'
import { GAME_PHASES } from '../game/gameEngine.js'
import { gameService } from '../services/gameService.js'
import { soundService } from '../services/soundService.js'

/**
 * Manages active turn state, smooth synchronized countdown, and word submissions.
 */
export function useGame({ gameState, localPeerId, clockOffsetMs, lastWordResult }) {
  const [liveRemainingMs, setLiveRemainingMs] = useState(GAME_CONFIG.TURN_DURATION_MS)
  const [pendingSubmission, setPendingSubmission] = useState(null)
  const lastWarningSecondRef = useRef(null)

  const isPlaying = gameState?.phase === GAME_PHASES.PLAYING
  const turnDeadline = gameState?.turnDeadline ?? null
  const turnId = gameState?.turnId ?? 0
  const isMyTurn = Boolean(isPlaying && gameState?.currentPlayerId === localPeerId)

  const submitting = Boolean(
    pendingSubmission &&
      pendingSubmission.turnId === turnId &&
      (!lastWordResult || lastWordResult._receivedAt < pendingSubmission.startedAt),
  )

  // Reset warning beep tracker when turnId changes
  useEffect(() => {
    lastWarningSecondRef.current = null
  }, [turnId])

  // Smooth countdown synced to authoritative host deadline + clock offset
  useEffect(() => {
    if (!isPlaying || !turnDeadline) {
      return undefined
    }

    let frameId = null
    let intervalId = null

    const updateTick = () => {
      const syncedNow = Date.now() + clockOffsetMs
      const left = Math.max(0, turnDeadline - syncedNow)
      setLiveRemainingMs(left)

      const wholeSeconds = Math.ceil(left / 1000)
      if (wholeSeconds > 0 && wholeSeconds <= 3 && lastWarningSecondRef.current !== wholeSeconds) {
        lastWarningSecondRef.current = wholeSeconds
        soundService.playTimerWarning()
      }
    }

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      const loop = () => {
        updateTick()
        frameId = window.requestAnimationFrame(loop)
      }
      frameId = window.requestAnimationFrame(loop)
    } else {
      intervalId = setInterval(updateTick, 50)
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPlaying, turnDeadline, clockOffsetMs])

  const submitWord = useCallback(
    async (rawWord) => {
      if (!isPlaying || !isMyTurn || submitting) return { ignored: true }
      const startedAt = Date.now()
      setPendingSubmission({ turnId, startedAt })
      const res = await gameService.submitWord(rawWord, turnId)
      if (!res?.pending) {
        setPendingSubmission(null)
      }
      return res
    },
    [isPlaying, isMyTurn, submitting, turnId],
  )

  return {
    remainingMs: isPlaying && turnDeadline ? liveRemainingMs : GAME_CONFIG.TURN_DURATION_MS,
    isMyTurn,
    submitting,
    submitWord,
  }
}
