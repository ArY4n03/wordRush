import { LogOut, Volume2, VolumeX } from 'lucide-react'
import { soundService } from '../services/soundService.js'

const STATUS_LABELS = {
  idle: { text: 'Offline', dot: 'bg-lavender' },
  connecting: { text: 'Connecting…', dot: 'bg-butter animate-pulse' },
  connected: { text: 'Online', dot: 'bg-leaf' },
  connecting_host: { text: 'Joining garden…', dot: 'bg-butter animate-pulse' },
  connected_host: { text: 'Connected', dot: 'bg-leaf' },
  reconnecting: { text: 'Reconnecting…', dot: 'bg-coral animate-pulse' },
  disconnected: { text: 'Disconnected', dot: 'bg-coral' },
}

export function Navbar({
  inRoom,
  connectionStatus,
  muted,
  onToggleMute,
  onLeaveRoom,
  onLogoClick,
}) {
  const statusInfo = STATUS_LABELS[connectionStatus] || STATUS_LABELS.idle

  return (
    <header className="relative z-20 w-full border-b-2 border-[rgba(54,91,60,0.16)] bg-[#FFFDF7]/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={() => {
            soundService.playClick()
            onLogoClick?.()
          }}
          className="flex items-center gap-2.5 rounded-xl px-1 py-0.5 text-left transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-forest bg-grass shadow-[0_2px_0_#365B3C]">
            <svg viewBox="0 0 28 28" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M6 21C6 13 12 7 22 6C21 16 15 22 6 21Z"
                fill="#FFF8E9"
                stroke="#365B3C"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="19" cy="9" r="3.4" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-forest sm:text-2xl">
            WORD RUSH
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {inRoom && (
            <div
              className="flex items-center gap-1.5 rounded-xl border-2 border-[rgba(54,91,60,0.2)] bg-cream px-2.5 py-1 text-xs font-bold text-forest"
              title="Peer connection status"
            >
              <span className={`h-2.5 w-2.5 rounded-full border border-forest/30 ${statusInfo.dot}`} />
              <span className="hidden sm:inline">{statusInfo.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="btn-cream flex h-9 w-9 items-center justify-center rounded-xl text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
          >
            {muted ? <VolumeX className="h-4 w-4 text-coral" /> : <Volume2 className="h-4 w-4 text-leaf" />}
          </button>

          {inRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="btn-cream flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-forest sm:text-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
