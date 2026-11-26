import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { soundService } from '../services/soundService.js'

export function RoomCode({ code, compact = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    soundService.playClick()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Copy room code"
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[rgba(54,91,60,0.28)] bg-butter/85 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-forest shadow-[0_2px_0_rgba(54,91,60,0.18)] transition-transform hover:-translate-y-0.5"
      >
        <span>{code}</span>
        {copied ? <Check className="h-3.5 w-3.5 text-leaf" /> : <Copy className="h-3.5 w-3.5 opacity-75" />}
      </button>
    )
  }

  return (
    <div className="invitation-card relative flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 sm:flex-row">
      <div className="text-center sm:text-left">
        <span className="inline-block rounded-md bg-butter px-2 py-0.5 font-hand text-sm font-semibold text-forest">
          Garden Party Invite Code
        </span>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.22em] text-forest sm:text-4xl">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="btn-butter inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-leaf" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy Code</span>
          </>
        )}
      </button>
    </div>
  )
}
