import { BookOpen, Sparkles, Sprout } from 'lucide-react'
import { CelebrationBlossoms } from '../components/BotanicalMotifs.jsx'
import { GameTimer } from '../components/GameTimer.jsx'
import { LetterTile } from '../components/LetterTile.jsx'
import { PlayerCard } from '../components/PlayerCard.jsx'
import { RoomCode } from '../components/RoomCode.jsx'
import { WordInput } from '../components/WordInput.jsx'

export function Game({
  gameState,
  localPeerId,
  remainingMs,
  isMyTurn,
  submitting,
  lastWordResult,
  error,
  onSubmitWord,
}) {
  const players = gameState?.players || []
  const currentPlayer = players.find((p) => p.id === gameState?.currentPlayerId) || null
  const wordHistory = gameState?.wordHistory || []
  const recentWords = [...wordHistory].reverse()

  const feedbackMessage =
    error ||
    lastWordResult?.message ||
    gameState?.lastEvent?.message ||
    ''

  const isPositiveFeedback =
    !error &&
    (lastWordResult?.accepted || gameState?.lastEvent?.type === 'WORD_ACCEPTED')

  const isGentleWarning =
    Boolean(error) ||
    Boolean(lastWordResult && !lastWordResult.accepted) ||
    gameState?.lastEvent?.type === 'LIFE_LOST' ||
    gameState?.lastEvent?.type === 'PLAYER_ELIMINATED' ||
    gameState?.lastEvent?.type === 'PLAYER_DISCONNECTED'

  return (
    <section className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Compact Picnic Table Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <RoomCode code={gameState?.roomCode || ''} compact />
          <span className="rounded-xl border-2 border-forest/20 bg-[#FFFDF7] px-3 py-1 font-mono text-xs font-bold text-forest">
            Round {gameState?.round || 1}
          </span>
        </div>

        <div
          className={[
            'rounded-xl border-2 px-3.5 py-1 font-display text-sm font-semibold shadow-[0_2px_0_rgba(54,91,60,0.16)]',
            isMyTurn
              ? 'border-forest bg-leaf text-[#FFFDF7]'
              : 'border-forest/25 bg-[#FFFDF7] text-forest',
          ].join(' ')}
        >
          {isMyTurn
            ? 'Your turn!'
            : `${currentPlayer?.username || 'Player'}’s turn`}
        </div>
      </div>

      {/* Picnic Board Grid */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left/Top: Sunny Picnic Table Word Board */}
        <div className="space-y-4 lg:col-span-7">
          <div className="picnic-cloth-edge rounded-[28px] border-2 border-forest/25 p-2 shadow-[0_6px_0_rgba(54,91,60,0.12)]">
            <div className="relative rounded-[22px] border-2 border-forest/20 bg-[#FFFDF7] p-5 sm:p-7">
              {isPositiveFeedback && (
                <CelebrationBlossoms className="absolute right-5 top-3" />
              )}

              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around">
                <LetterTile
                  letter={gameState?.requiredLetter}
                  turnNumber={gameState?.turnNumber}
                />

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
                  <GameTimer remainingMs={remainingMs} />

                  <div className="text-center sm:text-left">
                    <p className="font-hand text-base font-semibold text-forest/75">
                      Playing now
                    </p>
                    <p className="font-display text-2xl font-bold text-forest">
                      {currentPlayer?.username || '—'}
                    </p>
                    {isMyTurn && (
                      <span className="mt-1 inline-block rounded-lg bg-grass/40 px-2 py-0.5 text-xs font-bold text-forest">
                        Your turn!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t-2 border-dashed border-forest/15 pt-5">
                <WordInput
                  key={gameState?.turnId ?? 0}
                  requiredLetter={gameState?.requiredLetter}
                  isMyTurn={isMyTurn}
                  currentPlayerName={currentPlayer?.username}
                  submitting={submitting}
                  onSubmit={onSubmitWord}
                />
              </div>

              {/* Cheerful or gentle status feedback */}
              {feedbackMessage && (
                <div
                  key={`${gameState?.turnId}-${feedbackMessage}`}
                  role="status"
                  aria-live="polite"
                  className={[
                    'mt-4 flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-2.5 text-sm font-bold',
                    isGentleWarning
                      ? 'animate-life-shake border-coral/55 bg-[#FFF0EC] text-[#7F3424]'
                      : isPositiveFeedback
                        ? 'animate-turn-switch border-grass bg-[#EEF8E6] text-forest'
                        : 'border-forest/15 bg-cream text-forest/85',
                  ].join(' ')}
                >
                  {isPositiveFeedback ? (
                    <Sparkles className="h-4 w-4 shrink-0 text-leaf" />
                  ) : (
                    <Sprout className="h-4 w-4 shrink-0 text-coral" />
                  )}
                  <span>{feedbackMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Garden Word Journal */}
          <div className="storybook-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-leaf" />
                <h2 className="font-display text-lg font-bold text-forest">
                  Garden Word Journal
                </h2>
              </div>
              <span className="rounded-lg bg-butter/70 px-2.5 py-0.5 font-mono text-xs font-bold text-forest">
                {wordHistory.length} {wordHistory.length === 1 ? 'word' : 'words'}
              </span>
            </div>

            {recentWords.length === 0 ? (
              <p className="mt-3 font-hand text-lg text-forest/65">
                The journal is open! Play the first word starting with "{gameState?.requiredLetter}".
              </p>
            ) : (
              <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                {recentWords.map((entry, idx) => (
                  <div
                    key={`${entry.word}-${entry.turnNumber}`}
                    className={[
                      'inline-flex items-baseline gap-1.5 rounded-xl border-2 px-3 py-1 text-sm',
                      idx === 0
                        ? 'border-forest bg-leaf text-[#FFFDF7] shadow-[0_2px_0_#365B3C]'
                        : 'border-forest/20 bg-cream text-forest',
                    ].join(' ')}
                  >
                    <span className="font-display font-semibold">{entry.word}</span>
                    <span
                      className={[
                        'text-[11px] font-bold',
                        idx === 0 ? 'text-[#FFFDF7]/85' : 'text-forest/60',
                      ].join(' ')}
                    >
                      · {entry.username}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right/Bottom: Garden Players & Flower Lives */}
        <aside className="lg:col-span-5">
          <div className="storybook-card rounded-3xl p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-forest">
                Players
              </h2>
              <span className="font-hand text-base font-semibold text-forest/70">
                Clockwise order
              </span>
            </div>

            <div className="space-y-2.5">
              {players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  colorIndex={index}
                  isSelf={player.id === localPeerId}
                  isCurrentTurn={player.id === gameState?.currentPlayerId}
                  showLives
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
