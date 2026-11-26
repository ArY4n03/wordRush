export function LetterTile({ letter, turnNumber }) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-1.5 font-hand text-base font-semibold text-forest/85">
        Start your word with
      </span>
      <div
        key={`${letter}-${turnNumber}`}
        className="animate-tile-pop relative flex h-24 w-24 items-center justify-center rounded-2xl border-[3px] border-forest bg-butter shadow-[0_6px_0_#365B3C] sm:h-28 sm:w-28"
      >
        <div className="pointer-events-none absolute inset-1.5 rounded-xl border-2 border-dashed border-forest/25" />
        {/* Tiny corner sprout dot */}
        <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-blossom border border-forest/40" />
        <span className="font-display text-5xl font-bold leading-none text-forest sm:text-6xl">
          {letter || '?'}
        </span>
      </div>
    </div>
  )
}
