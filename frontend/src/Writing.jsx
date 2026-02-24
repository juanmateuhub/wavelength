import { useState, useEffect, useRef } from "react"
import Dial from "./Dial"

export default function Writing({ playerId, gameState, setGameState, send }) {
  const [phrase, setPhrase] = useState("")
  const [leftAdj, setLeftAdj] = useState("")
  const [rightAdj, setRightAdj] = useState("")
  const [waitingForNext, setWaitingForNext] = useState(false)

  // Rastrear el último clueNumber que hemos mostrado
  const lastClueNumberRef = useRef(null)

  const targetPosition = gameState?.target_position
  const clueNumber = gameState?.clue_number || 1
  const totalClues = gameState?.total_clues || 1
  const mode = gameState?.mode || "free"
  const serverLeftAdj = gameState?.left_adjective
  const serverRightAdj = gameState?.right_adjective
  const players = gameState?.players || []

  const isBattery = mode === "battery"
  const displayLeft = isBattery ? (serverLeftAdj || "") : (leftAdj || "Izq")
  const displayRight = isBattery ? (serverRightAdj || "") : (rightAdj || "Der")

  // Cuando llega un nuevo dial (clueNumber cambia), resetear el formulario
  useEffect(() => {
    if (lastClueNumberRef.current === null) {
      // Primera carga — solo registrar
      lastClueNumberRef.current = clueNumber
      return
    }
    if (clueNumber !== lastClueNumberRef.current) {
      // Llegó un dial nuevo
      lastClueNumberRef.current = clueNumber
      setWaitingForNext(false)
      setPhrase("")
      setLeftAdj("")
      setRightAdj("")
    }
  }, [clueNumber, targetPosition])

  // Resetear todo al empezar nueva partida
  useEffect(() => {
    lastClueNumberRef.current = null
    setWaitingForNext(false)
    setPhrase("")
    setLeftAdj("")
    setRightAdj("")
  }, [gameState?.state === "writing" && gameState?.clue_number === 1 && gameState?.type === "round_started"])

  const canSubmit = phrase.trim() && (isBattery || (leftAdj.trim() && rightAdj.trim()))

  const handleSubmit = () => {
    if (!canSubmit || waitingForNext) return
    send({
      type: "submit_clue",
      phrase,
      left_adjective: isBattery ? null : leftAdj,
      right_adjective: isBattery ? null : rightAdj,
    })
    setWaitingForNext(true)
  }

  const allDone = waitingForNext && clueNumber >= totalClues

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>

      <div style={{ background: "#16213e", borderRadius: 14, padding: "14px 16px", border: "1px solid #2a2a4a" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>✍️ Escribe tu pista</h2>
        <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
          Dial {clueNumber} de {totalClues} — solo tú ves tu posición
        </p>
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {Array.from({ length: totalClues }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < clueNumber ? "#6c63ff" : "#2a2a4a"
            }} />
          ))}
        </div>
      </div>

      {isBattery && serverLeftAdj && (
        <div style={{ background: "#16213e", borderRadius: 12, padding: "12px 16px", border: "1px solid #2a2a4a", textAlign: "center" }}>
          <p style={{ color: "#aaa", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>Tus adjetivos</p>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
            <span style={{ color: "#6c63ff" }}>{serverLeftAdj}</span>
            <span style={{ color: "#555", margin: "0 12px" }}>↔</span>
            <span style={{ color: "#6c63ff" }}>{serverRightAdj}</span>
          </p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        {targetPosition !== undefined && targetPosition !== null
          ? <Dial
              targetPosition={targetPosition}
              showTarget={true}
              leftAdjective={displayLeft}
              rightAdjective={displayRight}
            />
          : <div style={{ color: "#888", padding: 20 }}>⏳ Cargando dial...</div>
        }
      </div>

      {!waitingForNext ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Tu frase o palabra clave</label>
            <input
              placeholder="Escribe algo relacionado con la posición..."
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
          </div>

          {!isBattery && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>⬅️ Izquierda</label>
                <input
                  placeholder="Ej: Frío"
                  value={leftAdj}
                  onChange={e => setLeftAdj(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
              <div>
                <label style={labelStyle}>➡️ Derecha</label>
                <input
                  placeholder="Ej: Caliente"
                  value={rightAdj}
                  onChange={e => setRightAdj(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? "#6c63ff" : "#2a2a4a",
              color: canSubmit ? "white" : "#555",
              border: "none", borderRadius: 14, padding: "16px",
              fontSize: 16, fontWeight: 700,
              cursor: canSubmit ? "pointer" : "default",
              marginTop: 4
            }}
          >
            {clueNumber < totalClues ? "Siguiente dial ➡️" : "Enviar última pista ✅"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#16213e", borderRadius: 16, padding: 20, border: "1px solid #2a2a4a", textAlign: "center" }}>
          {allDone
            ? <p style={{ fontSize: 20, color: "#2ecc71", fontWeight: 700, margin: 0 }}>✅ ¡Todas las pistas enviadas!</p>
            : <p style={{ fontSize: 18, color: "#6c63ff", fontWeight: 700, margin: 0 }}>⏳ Cargando siguiente dial...</p>
          }
          <p style={{ color: "#888", fontSize: 14, marginTop: 8, marginBottom: 0 }}>Esperando a los demás jugadores...</p>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  color: "#aaa", fontSize: 12, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: 0.8,
  display: "block", marginBottom: 6
}
const inputStyle = {
  background: "#16213e", border: "2px solid #2a2a4a", borderRadius: 12,
  padding: "14px", fontSize: 15, color: "#fff", outline: "none",
  width: "100%", boxSizing: "border-box"
}