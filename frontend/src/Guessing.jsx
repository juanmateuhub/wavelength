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
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 20 }}>

      {/* Título con caja oscura */}
      <div style={{ background: "#16213e", borderRadius: 14, padding: "14px 16px", border: "1px solid #2a2a4a" }}>
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

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Dial
          needleAngle={needlePosition}
          setNeedleAngle={isOwner || submitted ? null : handleAngleChange}
          showTarget={false}
          leftAdjective={clue?.left_adjective || ""}
          rightAdjective={clue?.right_adjective || ""}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#888", fontSize: 14 }}>Posición: <strong style={{ color: "#fff" }}>{needlePosition}°</strong></span>
        {totalGuessers > 0 && (
          <span style={{ color: "#888", fontSize: 14 }}>Listos: <strong style={{ color: readyCount === totalGuessers ? "#2ecc71" : "#fff" }}>{readyCount}/{totalGuessers}</strong></span>
        )}
      </div>

      {!isOwner && !submitted && (
        <button onClick={handleReady} style={btnStyle("#6c63ff")}>¡Listo! ✅</button>
      )}
      {!isOwner && submitted && (
        <button onClick={handleCancelReady} style={btnStyle("#e74c3c")}>Quitar listo ❌</button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {players.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#16213e", borderRadius: 10, border: "1px solid #2a2a4a" }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
            {p.id === playerId && <span style={{ color: "#6c63ff", fontSize: 12 }}>TÚ</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const btnStyle = (color) => ({
  background: color, color: "white", border: "none",
  borderRadius: 14, padding: "16px", fontSize: 16,
  fontWeight: 700, cursor: "pointer", width: "100%"
})