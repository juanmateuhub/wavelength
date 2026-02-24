import { useState, useRef, useEffect } from "react"
import Dial from "./Dial"

export default function Guessing({ playerId, gameState, send }) {
  const [submitted, setSubmitted] = useState(false)
  const lastSent = useRef(90)

  const clue = gameState?.clue
  const players = gameState?.players || []
  const isOwner = clue?.owner_id === playerId
  const readyCount = gameState?.ready_count || 0
  const totalGuessers = gameState?.total_guessers || 0
  const needlePosition = gameState?.needlePosition ?? 90
  const needlePlayerId = gameState?.needlePlayerId

  useEffect(() => {
    if (needlePlayerId && needlePlayerId !== playerId) {
      setSubmitted(false)
    }
  }, [needlePlayerId, needlePosition])

  const handleAngleChange = (newAngle) => {
    if (isOwner || submitted) return
    if (Math.abs(newAngle - lastSent.current) >= 2) {
      send({ type: "move_needle", position: newAngle })
      lastSent.current = newAngle
    }
  }

  const handleReady = () => {
    send({ type: "submit_guess", position: needlePosition })
    setSubmitted(true)
  }

  const handleCancelReady = () => {
    send({ type: "cancel_guess" })
    setSubmitted(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 20, width: "100%" }}>

      <div style={card}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🎯 Adivina</h2>
        {clue && (
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
            Dial {clue.clue_number} de {clue.total_clues} — pista de <strong style={{ color: "#aaa" }}>{clue.owner_name}</strong>
          </p>
        )}
      </div>

      {clue && (
        <div style={{ background: "#6c63ff", borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>"{clue.phrase}"</p>
        </div>
      )}

      {isOwner && (
        <div style={{ background: "#16213e", border: "2px solid #e67e22", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <p style={{ color: "#e67e22", fontWeight: 700, fontSize: 15, margin: 0 }}>👀 Es tu dial — espera a que los demás adivinen</p>
        </div>
      )}

      <Dial
        needleAngle={needlePosition}
        setNeedleAngle={isOwner || submitted ? null : handleAngleChange}
        showTarget={false}
        leftAdjective={clue?.left_adjective || ""}
        rightAdjective={clue?.right_adjective || ""}
      />

      {!isOwner && !submitted && (
        <button onClick={handleReady} style={btnStyle("#6c63ff")}>¡Listo! ✅</button>
      )}
      {!isOwner && submitted && (
        <button onClick={handleCancelReady} style={btnStyle("#e74c3c")}>Quitar listo ❌</button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map(p => {
          const isDialOwner = p.id === clue?.owner_id
          const isMe = p.id === playerId
          const isReady = isMe ? submitted : false
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", background: "#16213e", borderRadius: 10,
              border: isDialOwner ? "1px solid #e67e22" : isReady ? "1px solid #2ecc71" : "1px solid #2a2a4a"
            }}>
              <span style={{ fontSize: 16 }}>{isDialOwner ? "👀" : isReady ? "✅" : "⏳"}</span>
              <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
              {isMe && <span style={{ color: "#6c63ff", fontSize: 12, marginLeft: 4 }}>TÚ</span>}
              {isDialOwner && <span style={{ color: "#e67e22", fontSize: 12, marginLeft: "auto" }}>su dial</span>}
              {!isDialOwner && isReady && <span style={{ color: "#2ecc71", fontSize: 12, marginLeft: "auto" }}>listo</span>}
            </div>
          )
        })}
        {totalGuessers > 0 && (
          <p style={{ color: "#555", fontSize: 13, textAlign: "center", margin: "2px 0 0" }}>
            {readyCount} de {totalGuessers} jugadores listos
          </p>
        )}
      </div>
    </div>
  )
}

const card = { background: "#16213e", borderRadius: 14, padding: "14px 16px", border: "1px solid #2a2a4a" }
const btnStyle = (color) => ({
  background: color, color: "white", border: "none",
  borderRadius: 14, padding: "16px", fontSize: 16,
  fontWeight: 700, cursor: "pointer", width: "100%"
})