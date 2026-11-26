import { Award, Home as HomeIcon, RotateCcw } from 'lucide-react'
import {
  CelebrationBlossoms,
  GardenCharacterAvatar,
} from '../components/BotanicalMotifs.jsx'
import { getPlayerTheme } from '../utils/playerThemes.js'

export function Results({
  gameState,
  localPeerId,
  isHost,
  onPlayAgain,
  onReturnHome,
}) {
  const standings = gameState?.standings || []
  const players = gameState?.players || []
  const winner =
    standings.find((p) => p.id === gameState?.winnerId) ||
    players.find((p) => p.id === gameState?.winnerId) ||
    standings[0] ||
    null

  const getPlayerIndex = (id) => {
    const idx = players.findIndex((p) => p.id === id)
    return idx >= 0 ? idx : 0
  }

  const winnerIndex = winner ? getPlayerIndex(winner.id) : 0
  const wordsPlayedCount = gameState?.wordHistory?.length || 0
  const totalRounds = gameState?.round || 1
  const isLocalWinner = winner && winner.id === localPeerId

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="storybook-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <CelebrationBlossoms className="absolute right-6 top-5" />

        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <GardenCharacterAvatar index={winnerIndex} className="h-20 w-20" />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-forest bg-butter text-forest shadow-xs">
              <Award className="h-4 w-4" />
            </span>
          </div>

          <span className="mt-3 inline-block rounded-full bg-butter/85 px-3 py-0.5 font-hand text-base font-semibold text-forest">
            {isLocalWinner ? 'You won the garden!' : 'Round Complete!'}
          </span>

          <h1 className="mt-1.5 font-display text-3xl font-bold text-forest sm:text-4xl">
            {winner ? `${winner.username} Wins!` : 'Round Complete'}
          </h1>

          <p className="mt-1.5 text-sm font-semibold text-forest/75">
            {wordsPlayedCount} {wordsPlayedCount === 1 ? 'word' : 'words'} chained across{' '}
            {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}.
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border-2 border-forest/15 bg-cream p-3.5 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-forest/65">Words Played</p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-forest">{wordsPlayedCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-forest/65">Total Rounds</p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-forest">{totalRounds}</p>
          </div>
        </div>

        {/* Final Standings */}
        <div className="mt-6">
          <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-forest/70">
            Final Standings
          </h2>
          <div className="space-y-2.5">
            {standings.map((entry) => {
              const idx = getPlayerIndex(entry.id)
              const theme = getPlayerTheme(idx)
              return (
                <div
                  key={entry.id}
                  className={[
                    'flex items-center justify-between rounded-2xl border-2 px-3.5 py-2.5',
                    entry.rank === 1
                      ? 'border-leaf bg-[#EDF8E5] shadow-[0_3px_0_rgba(101,166,91,0.3)]'
                      : `${theme.border} ${theme.bg}`,
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-full border-2 border-forest/30 font-display text-xs font-bold',
                        entry.rank === 1
                          ? 'bg-butter text-forest'
                          : 'bg-[#FFFDF7] text-forest/80',
                      ].join(' ')}
                    >
                      {entry.rank}
                    </span>
                    <GardenCharacterAvatar index={idx} className="h-9 w-9" />
                    <div>
                      <span className="font-display text-base font-semibold text-forest">
                        {entry.username}
                      </span>
                      {entry.id === localPeerId && (
                        <span className="ml-1.5 rounded-md bg-butter/85 px-1.5 py-0.5 text-[11px] font-bold text-forest">
                          you
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-forest/75">
                    {entry.wordsPlayed} {entry.wordsPlayed === 1 ? 'word' : 'words'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col gap-3 border-t-2 border-forest/10 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onReturnHome}
            className="btn-cream inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-sm font-semibold"
          >
            <HomeIcon className="h-4 w-4" />
            <span>Return to Home</span>
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="btn-leaf inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-display text-base font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border-2 border-forest/15 bg-cream px-4 py-2.5 text-xs font-bold text-forest/75">
              Host can start a rematch from the lobby.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
