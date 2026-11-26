import { GAME_CONFIG } from '../game/gameConfig.js'
import { formatCountdownSeconds, getTimerProgress } from '../utils/formatTime.js'

/**
 * Cute circular garden timer anchored to the host's authoritative deadline.
 */
export function GameTimer({ remainingMs, totalMs = GAME_CONFIG.TURN_DURATION_MS }) {
  const progress = getTimerProgress(remainingMs, totalMs)
  const secondsText = formatCountdownSeconds(remainingMs)
  const isUrgent = remainingMs <= 3_000
  const isWarning = remainingMs <= 5_500 && !isUrgent

  const size = 96
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const strokeColor = isUrgent ? '#F28C75' : isWarning ? '#FFE28A' : '#65A65B'

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="#FFF8E9"
            stroke="rgba(54, 91, 60, 0.16)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={[
              'font-mono text-xl font-bold tabular-nums leading-none',
              isUrgent ? 'text-coral' : 'text-forest',
            ].join(' ')}
          >
            {secondsText}s
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-forest/65">
            {isUrgent ? 'Hurry!' : 'Time'}
          </span>
        </div>
      </div>
    </div>
  )
}
