import { useEffect, useRef, useState } from 'react'
import { Crown } from 'lucide-react'
import { GAME_CONFIG } from '../game/gameConfig.js'
import { FlowerLifeIcon, GardenCharacterAvatar } from './BotanicalMotifs.jsx'
import { getPlayerTheme } from '../utils/playerThemes.js'

export function PlayerCard({
  player,
  colorIndex = 0,
  isSelf = false,
  isCurrentTurn = false,
  showLives = true,
  compact = false,
}) {
  const [lostLifePulse, setLostLifePulse] = useState(false)
  const prevLivesRef = useRef(player.lives)

  useEffect(() => {
    if (showLives && player.lives < prevLivesRef.current) {
      setLostLifePulse(true)
      const timer = setTimeout(() => setLostLifePulse(false), 450)
      prevLivesRef.current = player.lives
      return () => clearTimeout(timer)
    }
    prevLivesRef.current = player.lives
    return undefined
  }, [player.lives, showLives])

  const totalLives = GAME_CONFIG.INITIAL_LIVES
  const theme = getPlayerTheme(colorIndex)

  return (
    <div
      className={[
        'relative flex items-center justify-between gap-3 rounded-2xl border-2 px-3.5 py-2.5 transition-all',
        player.eliminated
          ? 'border-[rgba(54,91,60,0.16)] bg-cream/65 opacity-60'
          : isCurrentTurn
            ? 'animate-turn-switch border-leaf bg-[#EDF8E5] shadow-[0_4px_0_rgba(101,166,91,0.35)] ring-2 ring-grass/55'
            : `${theme.border} ${theme.bg} shadow-[0_2px_0_rgba(54,91,60,0.08)]`,
        lostLifePulse ? 'animate-life-shake' : '',
        compact ? 'py-2' : '',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <GardenCharacterAvatar
            index={colorIndex}
            eliminated={player.eliminated}
            className="h-10 w-10 sm:h-11 sm:w-11"
          />
          <span
            className={[
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#FFFDF7]',
              player.eliminated
                ? 'bg-coral'
                : player.connected
                  ? isCurrentTurn
                    ? 'bg-leaf'
                    : 'bg-grass'
                  : 'bg-lavender',
            ].join(' ')}
            title={player.eliminated ? 'Eliminated' : player.connected ? 'Online' : 'Offline'}
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={[
                'truncate font-display text-base font-semibold',
                player.eliminated ? 'line-through text-forest/55' : 'text-forest',
              ].join(' ')}
            >
              {player.username}
            </span>

            {isSelf && (
              <span className="shrink-0 rounded-md bg-butter/85 px-1.5 py-0.5 text-[11px] font-bold text-forest">
                you
              </span>
            )}

            {player.isHost && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-leaf/20 px-1.5 py-0.5 text-[11px] font-bold text-forest"
                title="Room Host"
              >
                <Crown className="h-3 w-3" />
                <span>Host</span>
              </span>
            )}
          </div>

          {!compact && (
            <p className="text-xs font-semibold text-forest/70">
              {player.eliminated
                ? 'Resting in the garden'
                : !player.connected
                  ? 'Disconnected'
                  : isCurrentTurn
                    ? 'Playing now!'
                    : showLives
                      ? `${player.wordsPlayed || 0} ${player.wordsPlayed === 1 ? 'word' : 'words'}`
                      : 'Ready to play'}
            </p>
          )}
        </div>
      </div>

      {showLives && (
        <div
          className="flex shrink-0 items-center gap-1"
          aria-label={`${player.lives} of ${totalLives} lives remaining`}
        >
          {Array.from({ length: totalLives }).map((_, idx) => (
            <FlowerLifeIcon key={idx} alive={idx < player.lives} className="h-5 w-5 sm:h-6 sm:w-6" />
          ))}
        </div>
      )}
    </div>
  )
}
