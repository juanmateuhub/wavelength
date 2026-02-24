import { useState } from "react"
import { useWebSocket } from "./useWebSocket"
import Home from "./Home"
import Lobby from "./Lobby"
import Writing from "./Writing"
import Guessing from "./Guessing"
import Reveal from "./Reveal"

function App() {
  const [screen, setScreen] = useState("home")
  const [roomCode, setRoomCode] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [gameState, setGameState] = useState({})

  const { send, connected } = useWebSocket(roomCode, playerId, playerName, (msg) => {
    if (msg.type === "game_state" || msg.type === "player_joined" || msg.type === "writing_progress") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "lobby_settings") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "round_started") {
      setGameState(prev => ({ ...prev, ...msg }))
      setScreen("writing")
    }
    if (msg.type === "next_writing") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "guessing_started") {
      setGameState(prev => ({ ...prev, ...msg, needlePosition: msg.needle_position ?? 90 }))
      setScreen("guessing")
    }
    if (msg.type === "needle_moved") {
      setGameState(prev => ({ ...prev, needlePosition: msg.position, needlePlayerId: msg.player_id }))
    }
    if (msg.type === "player_ready") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "clue_reveal") {
      setGameState(prev => ({
        ...prev, ...msg,
        finalNeedleAngle: msg.needle_position,
        points_this_dial: msg.points_this_dial,
        team_score: msg.team_score,
      }))
      setScreen("reveal")
    }
    if (msg.type === "game_finished") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
  })

  const handleBackToLobby = () => {
    setGameState(prev => ({ ...prev, state: "waiting" }))
    setScreen("lobby")
  }

  const props = {
    screen, setScreen,
    roomCode, setRoomCode,
    playerName, setPlayerName,
    playerId, setPlayerId,
    gameState, setGameState,
    send, connected,
    onBackToLobby: handleBackToLobby,
  }

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      padding: "0 16px 32px", display: "flex", flexDirection: "column",
    }}>
      {screen === "home" && <Home {...props} />}
      {screen === "lobby" && <Lobby {...props} />}
      {screen === "writing" && <Writing {...props} />}
      {screen === "guessing" && <Guessing {...props} />}
      {screen === "reveal" && <Reveal {...props} />}
    </div>
  )
}

export default App