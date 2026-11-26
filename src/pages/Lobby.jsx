import { Play } from 'lucide-react'
import {
  StorybookCornerCluster,
  WaitingGardenIllustration,
} from '../components/BotanicalMotifs.jsx'
import { PlayerCard } from '../components/PlayerCard.jsx'
import { RoomCode } from '../components/RoomCode.jsx'
import { GAME_CONFIG } from '../game/gameConfig.js'

export function Lobby({
  gameState,
  localPeerId,
  isHost,
  error,
  onStartGame,
}) {
  const players = gameState?.players || []
  const connectedCount = players.filter((p) => p.connected).length
  const canStart = isHost && connectedCount >= GAME_CONFIG.MIN_PLAYERS

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="storybook-card relative overflow-hidden rounded-3xl p-5 sm:p-8">
        <StorybookCornerCluster className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 opacity-85" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-block rounded-md bg-grass/35 px-2.5 py-0.5 font-hand text-base font-semibold text-forest">
              Garden Party Lobby
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold text-forest sm:text-3xl">
              Garden Lobby
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-forest/75">
              Share your invitation code so friends can hop into the circle.
            </p>
          </div>

          <span className="rounded-xl border-2 border-forest/25 bg-sky/45 px-3 py-1 font-mono text-xs font-bold text-forest">
            {players.length} / {GAME_CONFIG.MAX_PLAYERS} players
          </span>
        </div>

        <div className="mt-5">
          <RoomCode code={gameState?.roomCode || ''} />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-coral/55 bg-[#FDECE7] px-3.5 py-2.5 text-sm font-bold text-[#7F3424]"
          >
            {error}
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-forest/70">
            Garden Friends
          </h2>
          <div className="space-y-2.5">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                colorIndex={index}
                isSelf={player.id === localPeerId}
                showLives={false}
              />
            ))}
          </div>

          {players.length < GAME_CONFIG.MIN_PLAYERS && (
            <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-forest/20 bg-cream/75 px-4 py-4 text-center">
              <WaitingGardenIllustration className="h-20 w-40" />
              <p className="mt-1 font-hand text-lg text-forest/80">
                Waiting for at least one more friend to arrive…
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t-2 border-forest/10 pt-5">
          {isHost ? (
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-forest/75">
                {canStart
                  ? 'Everyone is gathered! Ready to start.'
                  : `Need at least ${GAME_CONFIG.MIN_PLAYERS} players to begin.`}
              </p>

              <button
                type="button"
                disabled={!canStart}
                onClick={onStartGame}
                className="btn-leaf inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-display text-base font-semibold"
              >
                <Play className="h-4 w-4" />
                <span>Start Game</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-forest/15 bg-butter/35 px-4 py-3 text-center text-sm font-bold text-forest">
              Waiting for the host to start the game…
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
