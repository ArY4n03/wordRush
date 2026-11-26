import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

export function WordInput({
  requiredLetter,
  isMyTurn,
  currentPlayerName,
  submitting,
  onSubmit,
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isMyTurn) {
      const id = setTimeout(() => {
        inputRef.current?.focus()
      }, 40)
      return () => clearTimeout(id)
    }
    return undefined
  }, [isMyTurn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isMyTurn || submitting) return
    const wordToSubmit = value
    if (!wordToSubmit.trim()) return
    const res = await onSubmit(wordToSubmit)
    if (res?.accepted || res?.deductLife) {
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="word-rush-input" className="mb-1.5 block text-sm font-bold text-forest/85">
        {isMyTurn
          ? `Your turn! Type an English word starting with "${requiredLetter}"`
          : `Waiting for ${currentPlayerName || 'player'}…`}
      </label>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-forest/25 bg-butter/85 font-display text-base font-bold text-forest"
          >
            {requiredLetter}
          </span>
          <input
            id="word-rush-input"
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!isMyTurn || submitting}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              isMyTurn
                ? `Write a "${requiredLetter}" word…`
                : `${currentPlayerName || 'Friend'} is thinking…`
            }
            className="w-full rounded-xl border-2 border-forest/35 bg-cream py-3 pl-12 pr-4 text-base font-bold text-forest placeholder:font-semibold placeholder:text-forest/40 focus:border-leaf focus:bg-[#FFFDF7] focus:outline-none focus:ring-4 focus:ring-grass/30 disabled:cursor-not-allowed disabled:bg-cream/60 disabled:text-forest/45"
          />
        </div>

        <button
          type="submit"
          disabled={!isMyTurn || submitting || value.trim().length === 0}
          className="btn-leaf inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-base font-semibold"
        >
          <span>{submitting ? 'Checking…' : 'Play Word'}</span>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
