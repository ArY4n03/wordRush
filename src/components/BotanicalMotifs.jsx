import { getPlayerTheme } from '../utils/playerThemes.js'

/**
 * Hand-illustrated storybook garden SVG artwork.
 * Consistent style: soft organic shapes, #365B3C hand-drawn outlines,
 * and warm gouache-inspired pastel fills.
 */

/**
 * Illustrated 5-petal blossom life indicator.
 */
export function FlowerLifeIcon({ alive = true, className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      {alive ? (
        <>
          <circle cx="14" cy="6.8" r="4.2" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="20.8" cy="11.6" r="4.2" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="18.2" cy="19.6" r="4.2" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="9.8" cy="19.6" r="4.2" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="7.2" cy="11.6" r="4.2" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="4.5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
          <circle cx="12.6" cy="13.2" r="0.8" fill="#365B3C" />
          <circle cx="15.4" cy="13.2" r="0.8" fill="#365B3C" />
        </>
      ) : (
        <>
          <circle
            cx="14"
            cy="14"
            r="8.5"
            fill="#FFF8E9"
            stroke="#365B3C"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeDasharray="2.5 2.5"
          />
          <circle cx="14" cy="14" r="2.6" fill="#365B3C" fillOpacity="0.2" />
        </>
      )}
    </svg>
  )
}

/**
 * 5 expressive hand-drawn garden character avatars for players.
 */
export function GardenCharacterAvatar({ index = 0, eliminated = false, className = 'w-10 h-10' }) {
  const variant = Math.abs(index) % 5
  const theme = getPlayerTheme(index)

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`${className} ${eliminated ? 'opacity-55 grayscale-[35%]' : ''}`}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill={theme.avatarBg}
        fillOpacity="0.55"
        stroke="#365B3C"
        strokeWidth="2"
      />

      {variant === 0 && (
        /* Smiling Sprout */
        <>
          <path d="M24 36V22" stroke="#365B3C" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M24 23C17 22 13 17 15 12C20 12 24 17 24 23Z"
            fill="#91C96B"
            stroke="#365B3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M24 21C31 20 35 15 33 10C28 10 24 15 24 21Z"
            fill="#65A65B"
            stroke="#365B3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="32" r="7.5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.8" />
          <circle cx="21.5" cy="31" r="1.1" fill="#365B3C" />
          <circle cx="26.5" cy="31" r="1.1" fill="#365B3C" />
          <path d="M22 34C23 35.2 25 35.2 26 34" stroke="#365B3C" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {variant === 1 && (
        /* Cheerful Ladybug */
        <>
          <ellipse cx="24" cy="27" rx="10" ry="9" fill="#F28C75" stroke="#365B3C" strokeWidth="1.9" />
          <path d="M24 18V36" stroke="#365B3C" strokeWidth="1.7" />
          <path d="M16 21C18 16 30 16 32 21H16Z" fill="#365B3C" />
          <circle cx="20" cy="26" r="1.7" fill="#365B3C" />
          <circle cx="28" cy="26" r="1.7" fill="#365B3C" />
          <circle cx="20.5" cy="31" r="1.4" fill="#365B3C" />
          <circle cx="27.5" cy="31" r="1.4" fill="#365B3C" />
          <path d="M21 16L18 12M27 16L30 12" stroke="#365B3C" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}

      {variant === 2 && (
        /* Cozy Garden Snail */
        <>
          <path
            d="M13 33C13 30 18 29 28 29C34 29 37 26 37 23C37 20 34 19 32 21C31 25 32 34 28 34H15C13.5 34 13 33.5 13 33Z"
            fill="#FFE28A"
            stroke="#365B3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="25" r="7.5" fill="#C9B5E8" stroke="#365B3C" strokeWidth="1.8" />
          <path
            d="M21 25C21 23 23 22 24 24C25 26 22 28 20 27C18 26 18 22 21 21"
            stroke="#365B3C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M34 20L35 15M36.5 21L39 16.5" stroke="#365B3C" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="35" cy="14.5" r="1.3" fill="#365B3C" />
          <circle cx="39.2" cy="16" r="1.3" fill="#365B3C" />
        </>
      )}

      {variant === 3 && (
        /* Friendly Busy Bee */
        <>
          <ellipse cx="19" cy="18" rx="4.5" ry="6" transform="rotate(-22 19 18)" fill="#FFF8E9" stroke="#365B3C" strokeWidth="1.6" />
          <ellipse cx="29" cy="18" rx="4.5" ry="6" transform="rotate(22 29 18)" fill="#FFF8E9" stroke="#365B3C" strokeWidth="1.6" />
          <ellipse cx="24" cy="27" rx="9.5" ry="7.5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.9" />
          <path d="M21 20V34M26 20V34" stroke="#365B3C" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="30" cy="25.5" r="1.1" fill="#365B3C" />
          <path d="M28.5 29C29.5 30 31 29.8 31.5 29" stroke="#365B3C" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}

      {variant === 4 && (
        /* Spotted Mushroom Buddy */
        <>
          <rect x="19" y="25" width="10" height="11" rx="4.5" fill="#FFF8E9" stroke="#365B3C" strokeWidth="1.8" />
          <path
            d="M12 26C12 17 17.5 13 24 13C30.5 13 36 17 36 26H12Z"
            fill="#F4A6B8"
            stroke="#365B3C"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="20" r="2.1" fill="#FFF8E9" />
          <circle cx="27.5" cy="18.5" r="2.4" fill="#FFF8E9" />
          <circle cx="22" cy="30" r="1" fill="#365B3C" />
          <circle cx="26" cy="30" r="1" fill="#365B3C" />
          <path d="M22.5 32.5C23.5 33.4 24.5 33.4 25.5 32.5" stroke="#365B3C" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/**
 * Full storybook cover garden scene: sky, drifting clouds, smiling sun,
 * rolling grassy hills, winding garden path, picket fence, mushrooms, wildflowers,
 * fluttering butterfly, and tiny ladybug.
 */
export function StorybookHeroScene({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Soft Sky Band */}
      <rect width="1200" height="520" fill="url(#storybookSky)" />

      {/* Smiling Sunshine */}
      <g transform="translate(1035, 86)">
        <circle cx="0" cy="0" r="46" fill="#FFE28A" stroke="#365B3C" strokeWidth="2.5" />
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-56"
            x2="0"
            y2="-68"
            stroke="#FFE28A"
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="-13" cy="-6" r="3" fill="#365B3C" />
        <circle cx="13" cy="-6" r="3" fill="#365B3C" />
        <path d="M-10 8C-5 15 5 15 10 8" stroke="#365B3C" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="-20" cy="4" r="4.5" fill="#F4A6B8" fillOpacity="0.65" />
        <circle cx="20" cy="4" r="4.5" fill="#F4A6B8" fillOpacity="0.65" />
      </g>

      {/* Drifting Puffy Clouds */}
      <g className="animate-cloud" opacity="0.92">
        <path
          d="M115 112C115 95 130 83 148 85C156 68 179 64 196 76C213 68 235 78 238 97C252 99 262 111 259 125C257 135 247 140 235 140H136C122 140 115 127 115 112Z"
          fill="#FFFDF7"
          stroke="#365B3C"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
      </g>
      <g className="animate-cloud" style={{ animationDelay: '-4s' }} opacity="0.88">
        <path
          d="M720 82C720 69 732 60 746 62C753 48 772 45 786 55C799 49 817 57 820 72C831 74 839 84 836 95C834 103 826 107 816 107H737C726 107 720 96 720 82Z"
          fill="#FFFDF7"
          stroke="#365B3C"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
      </g>

      {/* Distant Rolling Hill */}
      <path
        d="M0 360C180 295 360 305 560 350C780 398 980 300 1200 335V520H0V360Z"
        fill="#91C96B"
        fillOpacity="0.58"
      />

      {/* Little Wooden Garden Fence on Mid Hill */}
      <g stroke="#365B3C" strokeWidth="2" fill="#FFF8E9">
        <rect x="85" y="330" width="14" height="46" rx="4" />
        <rect x="115" y="325" width="14" height="50" rx="4" />
        <rect x="145" y="328" width="14" height="48" rx="4" />
        <rect x="175" y="332" width="14" height="46" rx="4" />
        <rect x="76" y="346" width="122" height="8" rx="3" fill="#FFE28A" />
      </g>

      {/* Main Foreground Rolling Hills */}
      <path
        d="M0 395C210 345 410 420 650 385C870 353 1030 375 1200 355V520H0V395Z"
        fill="#91C96B"
        stroke="#365B3C"
        strokeOpacity="0.3"
        strokeWidth="2.5"
      />
      <path
        d="M0 440C280 415 510 465 780 432C960 410 1090 425 1200 412V520H0V440Z"
        fill="#65A65B"
        fillOpacity="0.88"
      />

      {/* Winding Garden Path */}
      <path
        d="M540 520C555 470 615 455 605 420C596 392 530 388 538 362C543 346 585 344 615 352C602 365 572 366 575 385C579 408 665 412 668 456C670 484 635 505 628 520H540Z"
        fill="#FFF8E9"
        fillOpacity="0.92"
        stroke="#365B3C"
        strokeOpacity="0.25"
        strokeWidth="2"
      />

      {/* Left Wildflower & Mushroom Patch */}
      <g transform="translate(80, 410)">
        {/* Toadstool Mushroom */}
        <rect x="18" y="28" width="14" height="24" rx="5" fill="#FFF8E9" stroke="#365B3C" strokeWidth="2" />
        <path d="M8 31C8 17 15 11 25 11C35 11 42 17 42 31H8Z" fill="#F28C75" stroke="#365B3C" strokeWidth="2" />
        <circle cx="18" cy="21" r="3" fill="#FFF8E9" />
        <circle cx="30" cy="19" r="3.4" fill="#FFF8E9" />
      </g>

      {/* Swaying Pink & Lavender Flowers Left */}
      <g className="animate-sway" transform="translate(215, 415)">
        <path d="M0 45C2 30 0 18 -2 8" stroke="#365B3C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="-2" cy="0" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="6" cy="6" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="-10" cy="6" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="-2" cy="12" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="-2" cy="6" r="5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
      </g>

      <g className="animate-sway" style={{ animationDelay: '-1.8s' }} transform="translate(285, 430)">
        <path d="M0 38C-2 25 1 15 2 5" stroke="#365B3C" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="2" cy="2" r="9" fill="#C9B5E8" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="2" cy="2" r="4" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.5" />
      </g>

      {/* Right Wildflowers & Friendly Caterpillar */}
      <g className="animate-sway" style={{ animationDelay: '-1s' }} transform="translate(960, 412)">
        <path d="M0 44C0 28 3 16 1 5" stroke="#365B3C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="1" cy="-1" r="6" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="8" cy="5" r="6" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="-6" cy="5" r="6" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="1" cy="11" r="6" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <circle cx="1" cy="5" r="4.5" fill="#F28C75" stroke="#365B3C" strokeWidth="1.6" />
      </g>

      <g transform="translate(1035, 452)">
        {/* Cute Caterpillar */}
        <circle cx="0" cy="6" r="7" fill="#91C96B" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="11" cy="4" r="7.5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="23" cy="5" r="7.5" fill="#91C96B" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="35" cy="2" r="8.5" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="37.5" cy="0.5" r="1.3" fill="#365B3C" />
        <path d="M35 -6L33 -12M39 -6L42 -11" stroke="#365B3C" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* Fluttering Butterfly */}
      <g className="animate-butterfly" transform="translate(880, 265)">
        <ellipse cx="-8" cy="-4" rx="9" ry="7" transform="rotate(-20 -8 -4)" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.8" />
        <ellipse cx="8" cy="-4" rx="9" ry="7" transform="rotate(20 8 -4)" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.8" />
        <ellipse cx="-6" cy="6" rx="6.5" ry="5" transform="rotate(15 -6 6)" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <ellipse cx="6" cy="6" rx="6.5" ry="5" transform="rotate(-15 6 6)" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.6" />
        <rect x="-2" y="-8" width="4" height="18" rx="2" fill="#365B3C" />
      </g>

      {/* Tiny Ladybug on Grass */}
      <g transform="translate(425, 474)">
        <ellipse cx="0" cy="0" rx="8" ry="6.5" fill="#F28C75" stroke="#365B3C" strokeWidth="1.7" />
        <circle cx="-6" cy="0" r="3" fill="#365B3C" />
        <circle cx="1" cy="-2.5" r="1.2" fill="#365B3C" />
        <circle cx="3" cy="2" r="1.2" fill="#365B3C" />
      </g>

      <defs>
        <linearGradient id="storybookSky" x1="600" y1="0" x2="600" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A9DDF4" stopOpacity="0.48" />
          <stop offset="55%" stopColor="#FFF8E9" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFF8E9" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Small wildflower & mushroom corner cluster for cards.
 */
export function StorybookCornerCluster({ className = 'w-20 h-20' }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className={className}>
      <path d="M56 84C56 64 62 48 70 36" stroke="#65A65B" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 84C36 70 30 58 22 48" stroke="#91C96B" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="70" cy="30" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.5" />
      <circle cx="77" cy="36" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.5" />
      <circle cx="63" cy="36" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.5" />
      <circle cx="70" cy="42" r="6" fill="#F4A6B8" stroke="#365B3C" strokeWidth="1.5" />
      <circle cx="70" cy="36" r="4.5" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.5" />
      <circle cx="21" cy="46" r="7" fill="#C9B5E8" stroke="#365B3C" strokeWidth="1.6" />
      <circle cx="21" cy="46" r="3" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.3" />
    </svg>
  )
}

/**
 * Charming empty-state garden bench & snail illustration for Lobby waiting.
 */
export function WaitingGardenIllustration({ className = 'w-44 h-24' }) {
  return (
    <svg viewBox="0 0 220 110" fill="none" aria-hidden="true" className={className}>
      {/* Soft grassy patch */}
      <ellipse cx="110" cy="92" rx="92" ry="12" fill="#91C96B" fillOpacity="0.45" />
      {/* Little garden toadstool */}
      <rect x="44" y="64" width="12" height="22" rx="4" fill="#FFF8E9" stroke="#365B3C" strokeWidth="2" />
      <path d="M32 67C32 53 40 47 50 47C60 47 68 53 68 67H32Z" fill="#F28C75" stroke="#365B3C" strokeWidth="2" />
      <circle cx="43" cy="57" r="2.6" fill="#FFF8E9" />
      <circle cx="55" cy="55" r="3" fill="#FFF8E9" />

      {/* Snail waiting cheerfully */}
      <path
        d="M84 85C84 80 92 78 108 78C117 78 122 73 122 68C122 63 117 62 114 66C112 72 113 86 107 86H87C85 86 84 85.5 84 85Z"
        fill="#FFE28A"
        stroke="#365B3C"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="97" cy="72" r="11" fill="#C9B5E8" stroke="#365B3C" strokeWidth="2" />
      <path d="M97 72C97 69 100 68 102 70C104 73 99 77 95 75C92 73 92 67 97 65" stroke="#365B3C" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M117 63L119 56M121 65L125 58" stroke="#365B3C" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="119" cy="55" r="1.8" fill="#365B3C" />
      <circle cx="125" cy="57" r="1.8" fill="#365B3C" />

      {/* Swaying daisies on the right */}
      <g className="animate-sway" transform="translate(166, 48)">
        <path d="M0 40C-2 24 0 12 2 0" stroke="#365B3C" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="2" cy="-2" r="9" fill="#A9DDF4" stroke="#365B3C" strokeWidth="1.8" />
        <circle cx="2" cy="-2" r="4" fill="#FFE28A" stroke="#365B3C" strokeWidth="1.5" />
      </g>
    </svg>
  )
}

/**
 * Small fluttering flower petals for celebration moments.
 */
export function CelebrationBlossoms({ className = '' }) {
  return (
    <div className={`pointer-events-none flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="animate-petal inline-block h-3 w-3 rounded-full bg-blossom border border-forest/40" />
      <span
        className="animate-petal inline-block h-2.5 w-2.5 rounded-full bg-butter border border-forest/40"
        style={{ animationDelay: '0.35s' }}
      />
      <span
        className="animate-petal inline-block h-3 w-3 rounded-full bg-lavender border border-forest/40"
        style={{ animationDelay: '0.75s' }}
      />
      <span
        className="animate-petal inline-block h-2.5 w-2.5 rounded-full bg-grass border border-forest/40"
        style={{ animationDelay: '1.15s' }}
      />
    </div>
  )
}
