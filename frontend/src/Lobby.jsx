export default function Lobby({ roomCode, playerId, gameState, send, connected }) {
  const players = gameState?.players || []

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingTop: 40, gap: 20 }}>
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

      <div style={{ background: "#16213e", borderRadius: 16, padding: 16, border: "1px solid #2a2a4a" }}>
        <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>
          Jugadores ({players.length})
        </p>
        {players.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", background: "#0f3460",
            borderRadius: 10, marginBottom: 8,
            border: p.id === playerId ? "1px solid #6c63ff" : "1px solid transparent"
          }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span>
            {p.id === playerId && <span style={{ marginLeft: "auto", color: "#6c63ff", fontSize: 12, fontWeight: 700 }}>TÚ</span>}
          </div>
        ))}
        {players.length < 2 && (
          <p style={{ color: "#666", fontSize: 13, textAlign: "center", marginTop: 8 }}>
            Esperando más jugadores...
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#2ecc71" : "#e74c3c" }} />
        <span style={{ color: "#888", fontSize: 13 }}>{connected ? "Conectado" : "Conectando..."}</span>
      </div>

      <button
        onClick={() => send({ type: "start_round" })}
        disabled={players.length < 2}
        style={{
          background: players.length >= 2 ? "#6c63ff" : "#2a2a4a",
          color: players.length >= 2 ? "white" : "#555",
          border: "none", borderRadius: 14, padding: "18px",
          fontSize: 18, fontWeight: 700, cursor: players.length >= 2 ? "pointer" : "default",
          width: "100%", marginTop: "auto"
        }}
      >
        {players.length < 2 ? "Esperando jugadores..." : "¡Empezar! 🚀"}
      </button>
    </div>
  )
}