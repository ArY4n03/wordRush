# WORD RUSH

A cozy, botanical garden-themed multiplayer word-chain game built with React, Vite, Tailwind CSS, and peer-to-peer WebRTC via PeerJS.

> *"A little wordplay goes a long way."*

---

## Features

- **2–5 Player Peer-to-Peer Multiplayer**: Host creates a private room with a 6-character alphanumeric code; friends join directly in their browser with zero database or game backend.
- **Host-Authoritative Word-Chain Engine**:
  - Random starting letter (configurable in `src/game/gameConfig.js`).
  - Words must exist in the English dictionary, start with the required letter, contain only letters `A–Z`, and never repeat.
  - 10-second synchronized turn countdown anchored to the host's authoritative deadline.
  - 2 leaf lives per player; invalid words, repeats, or timeouts deduct 1 life.
  - Eliminated players are skipped clockwise until one player remains.
- **Modular Dictionary Layer**: Uses the Free Dictionary API (`https://api.dictionaryapi.dev`) by default behind a replaceable provider interface, and **never** accepts a word when the dictionary API is unreachable.
- **Botanical Garden Aesthetic**: Warm paper textures, editorial serif + clean sans + tabular monospace typography, custom lightweight SVG botanical sprigs, subtle purposeful motion (`prefers-reduced-motion` aware), and an optional procedural Web Audio soundscape.

---

## Local Setup

### Prerequisites

- Node.js 20+ and npm

### Install & Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in **two or more separate browser windows** (or devices on the same network / internet) to host and join a room.

### Scripts

- `npm run dev` — Start Vite development server
- `npm run build` — Build production bundle into `dist/`
- `npm run preview` — Preview production build locally
- `npm run lint` — Run `oxlint`
- `npm test` — Run unit tests (`vitest`)

---

## Architecture

```
src/
  components/   # Reusable UI pieces (Navbar, PlayerCard, GameTimer, WordInput, RoomCode, LetterTile, BotanicalMotifs)
  pages/        # Screen views (Home/Create/Join, Lobby, Game, Results)
  hooks/        # React state & timer hooks (usePeer, useRoom, useGame)
  services/     # PeerJS transport, RoomDiscovery, DictionaryService, GameService, Web Audio SoundService
  game/         # Pure game logic testable without React (gameConfig, gameRules, gameEngine, messageProtocol)
  utils/        # Room code generation/normalization, countdown formatting, username validation
  styles/       # Botanical Garden Tailwind v4 theme & paper grain styles
```

### Host-Client Networking

- **Host Browser**: Owns the authoritative `GameEngine` instance, validates every incoming PeerJS message against `messageProtocol.js`, checks words via `DictionaryService`, enforces the 10-second turn deadline, and broadcasts synchronized state snapshots (`GAME_START`, `WORD_RESULT`, `TURN_UPDATE`, `PLAYER_DISCONNECTED`, `GAME_OVER`, `RETURN_TO_LOBBY`).
- **Client Browsers**: Connect directly to the host over reliable WebRTC `DataConnection`s via PeerJS and send `JOIN_REQUEST` / `WORD_SUBMISSION` / `PING` messages. Clients compute a `clockOffsetMs` from the host's timestamp so countdowns stay smooth and accurate regardless of local clock skew.

### Room Discovery (`src/services/roomDiscovery.js`)

Room codes map to host PeerJS IDs behind the `RoomDiscovery` interface:

1. **Default (`DeterministicPeerRoomDiscovery`)**: Maps the 6-character code `ABCDEF` to a deterministic namespaced PeerJS ID (`wordrush-v1-ABCDEF`). If a collision occurs on the signaling server, the host retries with a new code. This requires **no backend or database**.
2. **Optional HTTP Directory (`HttpRoomDiscovery`)**: If you deploy a lightweight stateless lookup service (e.g., Cloudflare Worker + KV or Upstash Redis REST), set `VITE_DISCOVERY_URL` to point to it. It expects `POST /rooms`, `GET /rooms/:code`, and `DELETE /rooms/:code`.

### Dictionary Provider (`src/services/dictionaryService.js`)

`DictionaryService` accepts any provider implementing `lookup(word, { signal }) -> Promise<{ exists: boolean, definition?: string }>`. Network errors, timeouts, and non-404 HTTP errors throw `DictionaryServiceError` so words are **never** accepted merely because the dictionary API is unavailable.

---

## Security & P2P Limitations

- Every incoming PeerJS message is schema-validated (`validateMessage`) with role-based allowlists (`host` vs `client`), and player identity on `WORD_SUBMISSION` is bound to the authenticated WebRTC `conn.peer` ID so clients cannot impersonate other players.
- **Important Limitation**: Because this is a serverless host-authoritative P2P game, the host runs the authoritative game loop in their own browser. A malicious host who modifies their browser runtime could manipulate local game state; therefore, this architecture is designed for friendly private-room play rather than competitive anti-cheat tournaments.
- **NAT Traversal**: Direct WebRTC peer-to-peer connections work across most home/office networks using the configured public STUN servers, but strict symmetric NATs or corporate firewalls may require a **TURN relay server**.

---

## Configuration & Deployment (Vercel)

Because WORD RUSH is a pure static frontend with client-side WebRTC/PeerJS networking, **no VPS or persistent backend is needed**—and Vercel does not need to host a WebSocket server.

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in **Vercel** (`Framework Preset: Vite`, Build Command: `npm run build`, Output Directory: `dist`). `vercel.json` is already included for SPA rewrites.
3. *(Optional)* Configure environment variables in Vercel (see `.env.example`):
   - `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH`, `VITE_PEER_SECURE`, `VITE_PEER_KEY` — Point to a self-hosted `peerjs-server` instead of the public PeerJS cloud server.
   - `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` — Configure a TURN relay for restrictive networks.
   - `VITE_DISCOVERY_URL` — Optional custom room-code discovery HTTP endpoint.
