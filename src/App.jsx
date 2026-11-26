import { Navbar } from './components/Navbar.jsx'
import { useGame } from './hooks/useGame.js'
import { usePeer } from './hooks/usePeer.js'
import { SCREENS, useRoom } from './hooks/useRoom.js'
import { Game } from './pages/Game.jsx'
import { Home } from './pages/Home.jsx'
import { Lobby } from './pages/Lobby.jsx'
import { Results } from './pages/Results.jsx'

function App() {
  const { connectionStatus, setConnectionStatus, muted, toggleMute } = usePeer()

  const {
    screen,
    gameState,
    localPeerId,
    isHost,
    loading,
    error,
    clockOffsetMs,
    lastWordResult,
    clearError,
    goHome,
    openCreateRoom,
    openJoinRoom,
    createRoom,
    joinRoom,
    startGame,
    playAgain,
  } = useRoom({ setConnectionStatus })

  const { remainingMs, isMyTurn, submitting, submitWord } = useGame({
    gameState,
    localPeerId,
    clockOffsetMs,
    lastWordResult,
  })

  const inRoom =
    screen === SCREENS.LOBBY ||
    screen === SCREENS.GAME ||
    screen === SCREENS.RESULTS

  return (
    <div className="storybook-surface flex min-h-screen flex-col text-forest">
      <Navbar
        inRoom={inRoom}
        connectionStatus={connectionStatus}
        muted={muted}
        onToggleMute={toggleMute}
        onLeaveRoom={goHome}
        onLogoClick={goHome}
      />

      <main className="flex flex-1 flex-col">
        {(screen === SCREENS.HOME ||
          screen === SCREENS.CREATE ||
          screen === SCREENS.JOIN) && (
          <Home
            screen={screen}
            loading={loading}
            error={error}
            onOpenCreate={openCreateRoom}
            onOpenJoin={openJoinRoom}
            onBackHome={goHome}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onClearError={clearError}
          />
        )}

        {screen === SCREENS.LOBBY && (
          <Lobby
            gameState={gameState}
            localPeerId={localPeerId}
            isHost={isHost}
            error={error}
            onStartGame={startGame}
          />
        )}

        {screen === SCREENS.GAME && (
          <Game
            gameState={gameState}
            localPeerId={localPeerId}
            remainingMs={remainingMs}
            isMyTurn={isMyTurn}
            submitting={submitting}
            lastWordResult={lastWordResult}
            error={error}
            onSubmitWord={submitWord}
          />
        )}

        {screen === SCREENS.RESULTS && (
          <Results
            gameState={gameState}
            localPeerId={localPeerId}
            isHost={isHost}
            onPlayAgain={playAgain}
            onReturnHome={goHome}
          />
        )}
      </main>
    </div>
  )
}

export default App
