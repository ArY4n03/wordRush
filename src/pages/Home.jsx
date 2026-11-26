import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Users } from 'lucide-react'
import {
  StorybookCornerCluster,
  StorybookHeroScene,
} from '../components/BotanicalMotifs.jsx'
import { GAME_CONFIG } from '../game/gameConfig.js'
import { SCREENS } from '../hooks/useRoom.js'
import { normalizeRoomCode } from '../utils/roomCode.js'

export function Home({
  screen,
  loading,
  error,
  onOpenCreate,
  onOpenJoin,
  onBackHome,
  onCreateRoom,
  onJoinRoom,
  onClearError,
}) {
  const [username, setUsername] = useState('')
  const [roomCode, setRoomCode] = useState('')

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    await onCreateRoom(username)
  }

  const handleJoinSubmit = async (e) => {
    e.preventDefault()
    await onJoinRoom(roomCode, username)
  }

  if (screen === SCREENS.CREATE) {
    return (
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
        <StorybookHeroScene className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />

        <div className="relative z-10 w-full max-w-md">
          <button
            type="button"
            onClick={onBackHome}
            disabled={loading}
            className="btn-cream mb-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-forest"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="storybook-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <StorybookCornerCluster className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 opacity-85" />

            <span className="inline-block rounded-lg bg-butter px-2.5 py-0.5 font-hand text-base font-semibold text-forest">
              Garden Party Host
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-forest">
              Host a Game
            </h1>
            <p className="mt-1 text-sm font-semibold text-forest/75">
              Open a sunny word table and invite friends with your room code.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border-2 border-coral/55 bg-[#FDECE7] px-3.5 py-2.5 text-sm font-bold text-[#7F3424]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="host-username" className="mb-1.5 block text-sm font-bold text-forest">
                  Your Name
                </label>
                <input
                  id="host-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    onClearError()
                    setUsername(e.target.value)
                  }}
                  maxLength={GAME_CONFIG.MAX_USERNAME_LENGTH}
                  placeholder="e.g. Willow"
                  autoFocus
                  disabled={loading}
                  className="w-full rounded-xl border-2 border-forest/30 bg-cream px-3.5 py-2.5 text-base font-bold text-forest placeholder:font-semibold placeholder:text-forest/40 focus:border-leaf focus:outline-none focus:ring-4 focus:ring-grass/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading || username.trim().length < GAME_CONFIG.MIN_USERNAME_LENGTH}
                className="btn-leaf flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-display text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Setting up the table…</span>
                  </>
                ) : (
                  <>
                    <span>Create Room</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  if (screen === SCREENS.JOIN) {
    return (
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
        <StorybookHeroScene className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />

        <div className="relative z-10 w-full max-w-md">
          <button
            type="button"
            onClick={onBackHome}
            disabled={loading}
            className="btn-cream mb-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-forest"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="storybook-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <StorybookCornerCluster className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 opacity-85" />

            <span className="inline-block rounded-lg bg-sky/75 px-2.5 py-0.5 font-hand text-base font-semibold text-forest">
              Garden Invitation
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-forest">
              Join a Game
            </h1>
            <p className="mt-1 text-sm font-semibold text-forest/75">
              Enter your name and the 6-character code from your host.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border-2 border-coral/55 bg-[#FDECE7] px-3.5 py-2.5 text-sm font-bold text-[#7F3424]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="join-username" className="mb-1.5 block text-sm font-bold text-forest">
                  Your Name
                </label>
                <input
                  id="join-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    onClearError()
                    setUsername(e.target.value)
                  }}
                  maxLength={GAME_CONFIG.MAX_USERNAME_LENGTH}
                  placeholder="e.g. Rowan"
                  autoFocus
                  disabled={loading}
                  className="w-full rounded-xl border-2 border-forest/30 bg-cream px-3.5 py-2.5 text-base font-bold text-forest placeholder:font-semibold placeholder:text-forest/40 focus:border-leaf focus:outline-none focus:ring-4 focus:ring-grass/30"
                />
              </div>

              <div>
                <label htmlFor="join-room-code" className="mb-1.5 block text-sm font-bold text-forest">
                  Room Code
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    onClearError()
                    setRoomCode(normalizeRoomCode(e.target.value))
                  }}
                  maxLength={GAME_CONFIG.ROOM_CODE_LENGTH}
                  placeholder="A7K9P2"
                  disabled={loading}
                  className="w-full rounded-xl border-2 border-forest/30 bg-cream px-3.5 py-2.5 font-mono text-xl font-bold uppercase tracking-[0.22em] text-forest placeholder:tracking-[0.22em] placeholder:text-forest/35 focus:border-leaf focus:outline-none focus:ring-4 focus:ring-grass/30"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  username.trim().length < GAME_CONFIG.MIN_USERNAME_LENGTH ||
                  roomCode.length !== GAME_CONFIG.ROOM_CODE_LENGTH
                }
                className="btn-butter flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-display text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting to host…</span>
                  </>
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  // Storybook Cover Landing Screen (SCREENS.HOME)
  return (
    <section className="relative flex flex-1 flex-col justify-between overflow-hidden">
      {/* Layered Illustrated Garden Backdrop */}
      <StorybookHeroScene className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-cover" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        {error && (
          <div
            role="alert"
            className="mb-5 w-full max-w-xl rounded-2xl border-2 border-coral/60 bg-[#FDECE7] px-4 py-3 text-center text-sm font-bold text-[#7F3424] shadow-xs"
          >
            {error}
          </div>
        )}

        {/* Storybook Title Centerpiece */}
        <div className="storybook-card relative w-full max-w-xl rounded-[28px] px-6 py-7 text-center sm:px-10 sm:py-9">
          <StorybookCornerCluster className="pointer-events-none absolute -left-2 -top-2 h-16 w-16 -scale-x-100 opacity-85 sm:h-20 sm:w-20" />
          <StorybookCornerCluster className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 opacity-85 sm:h-20 sm:w-20" />

          <span className="inline-block rounded-full border border-forest/20 bg-butter/85 px-3.5 py-1 font-hand text-base font-semibold text-forest">
            2–5 Player Word-Chain Game
          </span>

          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-forest drop-shadow-[0_3px_0_#FFE28A] sm:text-6xl">
            WORD RUSH
          </h1>

          <p className="mt-2 font-hand text-2xl font-medium text-leaf sm:text-3xl">
            A little wordplay goes a long way!
          </p>

          <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-forest/80 sm:text-base">
            Link English words by their ending letters around a sunny garden table before your
            10-second blossom timer runs out.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3.5 sm:flex-row">
            <button
              type="button"
              onClick={onOpenCreate}
              className="btn-leaf inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5 font-display text-lg font-semibold"
            >
              <Sparkles className="h-5 w-5" />
              <span>Host a Game</span>
            </button>

            <button
              type="button"
              onClick={onOpenJoin}
              className="btn-butter inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 font-display text-lg font-semibold"
            >
              <Users className="h-5 w-5" />
              <span>Join a Game</span>
            </button>
          </div>
        </div>

        {/* Compact Storybook How-to-Play Trio */}
        <div className="mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-forest/20 bg-[#FFFDF7]/95 p-4 shadow-[0_3px_0_rgba(54,91,60,0.1)]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-butter font-display text-xs font-bold text-forest border border-forest/30">
              1
            </span>
            <p className="mt-1.5 font-display text-base font-semibold text-forest">
              Chain the Letters
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-forest/75">
              Play an English word starting with the last letter of the previous word. No repeats!
            </p>
          </div>

          <div className="rounded-2xl border-2 border-forest/20 bg-[#FFFDF7]/95 p-4 shadow-[0_3px_0_rgba(54,91,60,0.1)]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blossom/80 font-display text-xs font-bold text-forest border border-forest/30">
              2
            </span>
            <p className="mt-1.5 font-display text-base font-semibold text-forest">
              Guard Your Flowers
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-forest/75">
              Each turn gives 10 seconds. Mistakes or timeouts cost one of your two flower lives.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-forest/20 bg-[#FFFDF7]/95 p-4 shadow-[0_3px_0_rgba(54,91,60,0.1)]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky/85 font-display text-xs font-bold text-forest border border-forest/30">
              3
            </span>
            <p className="mt-1.5 font-display text-base font-semibold text-forest">
              Win the Garden
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-forest/75">
              Take turns clockwise until the last gardener with blooming lives wins!
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
