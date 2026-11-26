# WORD RUSH – Storybook Garden UI Redesign Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [UI Layer Structure](#ui-layer-structure)
4. [Design System](#design-system)
   - Color Palette
   - Typography
   - Illustrations & Icons
   - Animations
5. [Component Catalog](#component-catalog)
   - `App.jsx`
   - `Navbar.jsx`
   - `Home.jsx`
   - `Lobby.jsx`
   - `Game.jsx`
   - `PlayerCard.jsx`
   - `BotanicalMotifs.jsx`
   - `utils/playerThemes.js`
6. [Networking & Game Logic (unchanged)](#networking--game-logic-unchanged)
7. [Build, Test, Deploy](#build-test-deploy)
8. [Generating the PDF Documentation](#generating-the-pdf-documentation)
9. [Future Extensions](#future-extensions)
---

## Project Overview
`WORD RUSH` is a browser‑based multiplayer word‑chain game (2‑5 players) built with **React**, **Vite**, **Tailwind CSS**, **Lucide‑React**, and **PeerJS** (WebRTC). The recent redesign transforms the visual theme into a bright, whimsical children’s storybook garden while preserving all existing game mechanics, networking, and server‑less architecture.

## Architecture Overview
```
+-------------------+          +-------------------+          +-------------------+
|  Host Browser     | <--WebRTC--> |  Client Browsers   | <--WebRTC--> |  PeerJS Signaling |
|  (authoritative   |            |  (players)        |            |  Server (public) |
|   game state)     |            |                   |            +-------------------+
+-------------------+            +-------------------+
```
* The **host** maintains the authoritative game state and processes all actions.
* **Clients** receive state updates, submit word attempts, and display UI.
* **PeerJS** provides a public signaling server for connection discovery; the design allows swapping in a self‑hosted signaling server later.
* No external database or backend is used – all state lives in the host’s memory.

## UI Layer Structure
The UI sits on top of the networking layer and is organized as follows:
```
src/
├─ App.jsx                # Root component, applies storybook background
├─ pages/
│   ├─ Home.jsx           # Hero screen – garden illustration, host/join buttons
│   ├─ Lobby.jsx          # Room code entry, player list, waiting garden scene
│   └─ Game.jsx           # Main gameplay view – turn timer, word input, word journal
├─ components/
│   ├─ Navbar.jsx         # Top navigation with colorful branding
│   ├─ PlayerCard.jsx     # Player avatar, lives, turn indicator
│   ├─ BotanicalMotifs.jsx# Hand‑drawn SVG garden elements (clouds, sun, flowers)
│   └─ ...
└─ utils/
    └─ playerThemes.js    # Palette & avatar mapping for each player slot
```
All components use **Tailwind CSS** utility classes that reference the custom palette (see Design System).

## Design System
### Color Palette
| Role | Hex |
|------|-----|
| Fresh leaf green | `#65A65B` |
| Grass green | `#91C96B` |
| Sky blue | `#A9DDF4` |
| Butter yellow | `#FFE28A` |
| Warm cream (background) | `#FFF8E9` |
| Flower pink | `#F4A6B8` |
| Coral | `#F28C75` |
| Lavender | `#C9B5E8` |
| Text dark green | `#365B3C` |

Tailwind config has been extended with these colors (e.g., `bg-[#FFF8E9]`, `text-[#365B3C]`).

### Typography
* **Headings & key UI text** – *Fredoka* (rounded, playful). Loaded via Google Fonts in `index.html`.
* **Body & UI labels** – *Nunito* (clean, readable).
* **Accent handwritten** – *Patrick Hand* (used sparingly for decorative captions).

### Illustrations & Icons
All garden‑themed graphics are hand‑drawn SVGs stored in `src/components/BotanicalMotifs.jsx`. They include:
* Sun, clouds, butterflies, flowers, mushrooms, ladybugs, fences, winding paths.
* Each SVG is a React component, allowing easy colour overrides via Tailwind classes.
* Icons from **Lucide‑React** are used for functional UI elements (settings, volume, etc.) and styled to match the palette.

### Animations
* Simple CSS keyframe animations (e.g., `animate‑cloud`, `animate‑butterfly`, `animate‑sway`).
* Tailwind `motion-safe:` prefix ensures they are disabled when the user prefers reduced motion.
* Animations are lightweight – no heavy JS loops – and run on the host as well as clients.

## Component Catalog
### `App.jsx`
* Sets the root background to warm cream (`bg-[#FFF8E9]`).
* Wraps the router and provides a global `storybook-surface` class for consistent text colour (`text-[#365B3C]`).

### `Navbar.jsx`
* Re‑styled with a pastel gradient background, rounded corners, and garden‑seed icons.
* Shows the room code when in‑game and a host indicator.

### `Home.jsx`
* Hero section contains `<StorybookHeroScene />` (SVG garden composition).
* Large, rounded buttons (`Host a Game`, `Join a Game`) use `bg-[#F4A6B8]` with subtle drop‑shadows.
* Tagline “A little wordplay goes a long way!” uses `font‑fredoka`.

### `Lobby.jsx`
* Displays the room code inside a decorative invitation‑card‑style box.
* Player slots rendered as `PlayerCard` components with pastel avatars.
* When waiting for players, shows a centered illustration of a garden bench with a hummingbird.

### `Game.jsx`
* **Required‑letter tile** – a chunky square with `bg-[#65A65B]` and large white typography.
* **Countdown timer** – circular SVG progress ring animated via CSS; colour changes to `#F28C75` when <3 s remain.
* **Word input** – cream background, rounded border, focus ring in `#91C96B`.
* **Word journal** – scrollable list with flower‑border separators.
* **Feedback** – success shows a tiny burst of pollen particles; life loss triggers a brief wilt animation on the heart icon.

### `PlayerCard.jsx`
* Avatar: coloured garden critter (randomly selected from `PLAYER_THEMES`).
* Lives shown as small flower‑shaped icons (`<HeartIcon>` variant).
* Active turn highlighted with a pulsing green halo (`ring-2 ring-[#65A65B]`).
* Eliminated players receive `opacity-40` and a wilted silhouette.

### `BotanicalMotifs.jsx`
* Exports many SVG components: `Sun`, `Cloud`, `Butterfly`, `Flower`, `Mushroom`, `GardenFence`, etc.
* Each component accepts `className` prop for Tailwind styling.
* All SVG paths are hand‑drawn, lightweight (<5 KB each).

### `utils/playerThemes.js`
```js
export const PLAYER_THEMES = [
  { avatar: "🐞", color: "#F4A6B8" },
  { avatar: "🦋", color: "#A9DDF4" },
  { avatar: "🐛", color: "#FFE28A" },
  { avatar: "🐝", color: "#65A65B" },
  { avatar: "🐌", color: "#C9B5E8" },
];
export const getPlayerTheme = (index) => PLAYER_THEMES[index % PLAYER_THEMES.length];
```
Provides deterministic pastel avatars for up to 5 players.

## Networking & Game Logic (unchanged)
The multiplayer layer (PeerJS, message types, room discovery, turn timer) remains exactly as implemented before the UI redesign. The host still validates words via the modular dictionary service, enforces lives, and determines the winner. No UI changes affect the authority model.

## Build, Test, Deploy
```bash
# Install dependencies (already done)
npm ci

# Development server
npm run dev   # Vite – http://localhost:5173

# Lint & type‑check
npm run lint
npm run typecheck   # if using TS

# Unit tests (Jest/React Testing Library)
npm test

# Production build
npm run build   # outputs to /dist

# Deploy to Vercel (recommended)
# Connect the Git repo to Vercel; Vercel will run `npm install && npm run build`
```
All scripts continue to work after the redesign.

## Generating the PDF Documentation
We already have `DOCUMENTATION.md` in the project root. To produce the final PDF run:
```bash
npx markdown-pdf DOCUMENTATION.md -o WORD_RUSH_Documentation.pdf
```
The command creates `WORD_RUSH_Documentation.pdf` next to the markdown file. An npm shortcut has also been added to `package.json`:
```json
"scripts": {
  "doc": "npx markdown-pdf DOCUMENTATION.md -o WORD_RUSH_Documentation.pdf"
}
```
Running `npm run doc` will regenerate the PDF at any time.

## Future Extensions
* **Self‑hosted PeerJS signaling server** – replace the public server in production.
* **Customizable dictionary provider** – plug‑in architecture for alternative word APIs.
* **Accessibility** – add ARIA labels, focus management, and high‑contrast mode toggle.
* **Localization** – externalize strings for multi‑language support.
* **Animated storybook intro** – a short CSS‑only animation before the lobby screen.

---

*Generated on* `2026-11-26` *by Antigravity.*
