import { useState } from "react"
import Dial from "./Dial"

export default function Writing({ playerId, gameState, send }) {
  const [phrase, setPhrase] = useState("")
  const [leftAdj, setLeftAdj] = useState("")
  const [rightAdj, setRightAdj] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const targetPosition = gameState?.target_position
  const players = gameState?.players || []

  const handleSubmit = () => {
    if (!phrase.trim() || !leftAdj.trim() || !rightAdj.trim()) return
    send({ type: "submit_clue", phrase, left_adjective: leftAdj, right_adjective: rightAdj })
    setSubmitted(true)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>✍️ Escribe tu pista</h2>
        <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          Solo tú ves tu posición en el dial
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        {targetPosition !== undefined && targetPosition !== null
          ? <Dial targetPosition={targetPosition} showTarget={true} leftAdjective={leftAdj || "Izq"} rightAdjective={rightAdj || "Der"} />
          : <div style={{ color: "#888", padding: 20 }}>⏳ Cargando dial...</div>
        }
      </div>

      {!submitted ? (
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>⬅️ Adjetivo izquierda</label>
              <input
                placeholder="Ej: Frío"
                value={leftAdj}
                onChange={e => setLeftAdj(e.target.value)}
                style={inputStyle}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={labelStyle}>➡️ Adjetivo derecha</label>
              <input
                placeholder="Ej: Caliente"
                value={rightAdj}
                onChange={e => setRightAdj(e.target.value)}
                style={inputStyle}
                autoComplete="off"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!phrase.trim() || !leftAdj.trim() || !rightAdj.trim()}
            style={{
              background: phrase.trim() && leftAdj.trim() && rightAdj.trim() ? "#6c63ff" : "#2a2a4a",
              color: phrase.trim() && leftAdj.trim() && rightAdj.trim() ? "white" : "#555",
              border: "none", borderRadius: 14, padding: "16px",
              fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 4
            }}
          >
            Enviar pista ✅
          </button>
        </div>
      ) : (
        <div style={{ background: "#16213e", borderRadius: 16, padding: 20, border: "1px solid #2a2a4a", textAlign: "center" }}>
          <p style={{ fontSize: 20, color: "#2ecc71", fontWeight: 700 }}>✅ Pista enviada</p>
          <p style={{ color: "#888", fontSize: 14, marginTop: 8 }}>Esperando a los demás...</p>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {players.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#0f3460", borderRadius: 10 }}>
                <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
                {p.id === playerId && <span style={{ color: "#6c63ff", fontSize: 12, marginLeft: "auto" }}>TÚ</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { color: "#aaa", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }
const inputStyle = {
  background: "#16213e", border: "2px solid #2a2a4a", borderRadius: 12,
  padding: "14px 14px", fontSize: 15, color: "#fff", outline: "none", width: "100%",
}