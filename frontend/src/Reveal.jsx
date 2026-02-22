import Dial from "./Dial"

export default function Reveal({ playerId, gameState, setScreen, send }) {
  const clue = gameState?.clue
  const players = gameState?.players || []
  const targetPosition = gameState?.target_position
  const scores = gameState?.scores || {}
  const isFinished = gameState?.state === "finished"
  const finalNeedleAngle = gameState?.finalNeedleAngle ?? 90

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>🎯 Resultado</h2>
        {clue && <p style={{ color: "#888", fontSize: 13, marginTop: 2 }}>Pista de <strong style={{ color: "#aaa" }}>{clue.owner_name}</strong></p>}
      </div>

      {clue && (
        <div style={{ background: "#6c63ff", borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>"{clue.phrase}"</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Dial
          targetPosition={targetPosition}
          needleAngle={finalNeedleAngle}
          showTarget={true}
          leftAdjective={clue?.left_adjective || ""}
          rightAdjective={clue?.right_adjective || ""}
        />
      </div>

      <div style={{ background: "#16213e", borderRadius: 16, padding: 16, border: "1px solid #2a2a4a" }}>
        <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>Puntos esta ronda</p>
        {players.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center",
            padding: "12px 14px", background: "#0f3460",
            borderRadius: 10, marginBottom: 8,
            border: p.id === playerId ? "1px solid #6c63ff" : "1px solid transparent"
          }}>
            <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span>
            {p.id === playerId && <span style={{ color: "#6c63ff", fontSize: 12, marginLeft: 6 }}>TÚ</span>}
            <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              {scores[p.id] !== undefined && (
                <span style={{ color: "#6c63ff", fontWeight: 800, fontSize: 16 }}>+{scores[p.id]}</span>
              )}
              <span style={{ color: "#888", fontSize: 13 }}>{p.score} pts</span>
            </span>
          </div>
        ))}
      </div>

      {!isFinished ? (
        <button onClick={() => send({ type: "next_clue" })} style={btnStyle("#6c63ff")}>
          Siguiente dial ▶️
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>🏆 ¡Juego terminado!</h2>
          <div style={{ background: "#16213e", borderRadius: 16, padding: 16, border: "1px solid #2a2a4a" }}>
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px", background: i === 0 ? "#1a1a3e" : "#0f3460",
                borderRadius: 10, marginBottom: 8,
                border: i === 0 ? "2px solid #6c63ff" : "1px solid transparent"
              }}>
                <span style={{ fontSize: 24 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>{p.name}</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, color: i === 0 ? "#6c63ff" : "#888", fontSize: 18 }}>{p.score} pts</span>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen("home")} style={btnStyle("#2ecc71")}>
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  )
}

const btnStyle = (color) => ({
  background: color, color: "white", border: "none",
  borderRadius: 14, padding: "18px", fontSize: 16,
  fontWeight: 700, cursor: "pointer", width: "100%"
})