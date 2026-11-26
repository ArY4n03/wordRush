export const PLAYER_THEMES = [
  {
    name: 'sky',
    bg: 'bg-[#E7F5FC]',
    border: 'border-[#7EC3E6]',
    badge: 'bg-[#A9DDF4]/55 text-[#27516B]',
    avatarBg: '#A9DDF4',
  },
  {
    name: 'butter',
    bg: 'bg-[#FFF5D6]',
    border: 'border-[#E6BE53]',
    badge: 'bg-[#FFE28A]/70 text-[#6B5012]',
    avatarBg: '#FFE28A',
  },
  {
    name: 'blossom',
    bg: 'bg-[#FDECF0]',
    border: 'border-[#E68A9F]',
    badge: 'bg-[#F4A6B8]/50 text-[#6F2D3E]',
    avatarBg: '#F4A6B8',
  },
  {
    name: 'lavender',
    bg: 'bg-[#F2ECFA]',
    border: 'border-[#AE94D6]',
    badge: 'bg-[#C9B5E8]/55 text-[#473369]',
    avatarBg: '#C9B5E8',
  },
  {
    name: 'grass',
    bg: 'bg-[#EDF7E3]',
    border: 'border-[#7BB857]',
    badge: 'bg-[#91C96B]/55 text-[#2C4E24]',
    avatarBg: '#91C96B',
  },
]

export function getPlayerTheme(index = 0) {
  return PLAYER_THEMES[Math.abs(index) % PLAYER_THEMES.length]
}
