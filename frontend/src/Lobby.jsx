import { useState, useEffect } from "react"

export default function Lobby({ roomCode, playerId, gameState, send, connected }) {
  const players = gameState?.players || []
  const hostId = gameState?.host_id
  const isHost = playerId === hostId

  const [numRounds, setNumRounds] = useState(gameState?.num_rounds || 3)
  const [mode, setMode] = useState(gameState?.mode || "free")

  useEffect(() => {
    if (gameState?.type === "lobby_settings") {
      setNumRounds(gameState.num_rounds)
      setMode(gameState.mode)
    }
  }, [gameState?.num_rounds, gameState?.mode, gameState?.type])

  const handleNumRounds = (n) => {
    setNumRounds(n)
    if (isHost) send({ type: "lobby_settings", num_rounds: n, mode })
  }

  const handleMode = (m) => {
    setMode(m)
    if (isHost) send({ type: "lobby_settings", num_rounds: numRounds, mode: m })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingTop: 40, paddingBottom: 24, gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Código de sala</p>
        <div style={{
          fontSize: 48, fontWeight: 900, letterSpacing: 10, color: "#6c63ff",
          background: "#16213e", borderRadius: 16, padding: "16px 24px",
          border: "2px solid #6c63ff", marginTop: 8, display: "inline-block"
        }}>
          {roomCode}
        </div>
        <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>Comparte este código con tus amigos</p>
      </div>

      <div style={card}>
        <p style={sectionLabel}>Jugadores ({players.length})</p>
        {players.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", background: "#0f3460", borderRadius: 10, marginBottom: 8,
            border: p.id === playerId ? "1px solid #6c63ff" : "1px solid transparent"
          }}>
            <span style={{ fontSize: 20 }}>{p.id === hostId ? "👑" : "👤"}</span>
            <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              {p.id === hostId && <span style={{ color: "#f0c040", fontSize: 11, fontWeight: 700 }}>ANFITRIÓN</span>}
              {p.id === playerId && <span style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700 }}>TÚ</span>}
            </span>
          </div>
        ))}
        {players.length < 2 && (
          <p style={{ color: "#666", fontSize: 13, textAlign: "center", marginTop: 4 }}>Esperando más jugadores...</p>
        )}
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ ...sectionLabel, margin: 0 }}>Modo de juego</p>
          {!isHost && <span style={{ color: "#f0c040", fontSize: 11, fontWeight: 700 }}>👑 Solo el anfitrión</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => isHost && handleMode("free")} style={modeBtn(mode === "free")}>
            <span style={{ fontSize: 24 }}>✍️</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Libre</span>
            <span style={{ fontSize: 11, color: mode === "free" ? "#ddd" : "#666", textAlign: "center" }}>
              Tú escribes la pista y los adjetivos
            </span>
          </button>
          <button onClick={() => isHost && handleMode("battery")} style={modeBtn(mode === "battery")}>
            <span style={{ fontSize: 24 }}>🎲</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Batería</span>
            <span style={{ fontSize: 11, color: mode === "battery" ? "#ddd" : "#666", textAlign: "center" }}>
              Los adjetivos salen solos
            </span>
          </button>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ ...sectionLabel, margin: 0 }}>Diales por jugador</p>
          {!isHost && <span style={{ color: "#f0c040", fontSize: 11, fontWeight: 700 }}>👑 Solo el anfitrión</span>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => isHost && handleNumRounds(n)} style={{
              width: 48, height: 48, borderRadius: 10, fontSize: 18, fontWeight: 700,
              border: numRounds === n ? "2px solid #6c63ff" : "2px solid #2a2a4a",
              background: numRounds === n ? "#6c63ff" : "#0f3460",
              color: "white", cursor: isHost ? "pointer" : "default"
            }}>
              {n}
            </button>
          ))}
        </div>
        <p style={{ color: "#666", fontSize: 12, textAlign: "center", marginTop: 10 }}>
          {numRounds * players.length} diales en total
        </p>
      </div>

      {isHost ? (
        <button
          onClick={() => send({ type: "start_round", num_rounds: numRounds, mode })}
          disabled={players.length < 2}
          style={{
            background: players.length >= 2 ? "#6c63ff" : "#2a2a4a",
            color: players.length >= 2 ? "white" : "#555",
            border: "none", borderRadius: 14, padding: "18px",
            fontSize: 18, fontWeight: 700, cursor: players.length >= 2 ? "pointer" : "default",
            width: "100%",
          }}
        >
          {players.length < 2 ? "Esperando jugadores..." : "¡Empezar! 🚀"}
        </button>
      ) : (
        <div style={{
          background: "#16213e", borderRadius: 14, padding: "18px",
          textAlign: "center", border: "1px solid #2a2a4a",
        }}>
          <p style={{ color: "#888", fontSize: 16, margin: 0 }}>⏳ Esperando al anfitrión...</p>
        </div>
      )}
    </div>
  )
}

const card = { background: "#16213e", borderRadius: 16, padding: 16, border: "1px solid #2a2a4a" }
const sectionLabel = { color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }
const modeBtn = (active) => ({
  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  padding: "14px 10px", borderRadius: 12, cursor: "pointer",
  border: active ? "2px solid #6c63ff" : "2px solid #2a2a4a",
  background: active ? "#1a1a4e" : "#0f3460",
  color: active ? "white" : "#888",
})