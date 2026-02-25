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
  const [dialKey, setDialKey] = useState(0)

  const { send, connected } = useWebSocket(roomCode, playerId, playerName, (msg) => {
    if (msg.type === "game_state" || msg.type === "player_joined") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "writing_progress") {
      setGameState(prev => ({ ...prev, players: msg.players }))
    }
    if (msg.type === "lobby_settings") {
      setGameState(prev => ({ ...prev, ...msg }))
    }
    if (msg.type === "round_started") {
      setDialKey(0)
      setGameState(prev => ({ ...prev, ...msg }))
      setScreen("writing")
    }
    if (msg.type === "next_writing") {
      setDialKey(k => k + 1)
      setGameState(prev => ({
        ...prev,
        target_position: msg.target_position,
        left_adjective: msg.left_adjective,
        right_adjective: msg.right_adjective,
        clue_number: msg.clue_number,
        total_clues: msg.total_clues,
        mode: msg.mode,
      }))
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
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100vh",
      padding: "0 16px 32px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}>
      {screen === "home" && <Home {...props} />}
      {screen === "lobby" && <Lobby {...props} />}
      {screen === "writing" && <Writing key={dialKey} {...props} />}
      {screen === "guessing" && <Guessing {...props} />}
      {screen === "reveal" && <Reveal {...props} />}
    </div>
  )
}

export default App