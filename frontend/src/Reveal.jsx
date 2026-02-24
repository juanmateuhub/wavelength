import { useEffect, useState } from "react"
import Dial from "./Dial"

function useCountUp(target, duration = 1000, delay = 300) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    setValue(0)
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target])
  return value
}

function FadeIn({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(14px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      {children}
    </div>
  )
}

export default function Reveal({ playerId, gameState, setScreen, send, onBackToLobby }) {
  const clue = gameState?.clue
  const players = gameState?.players || []
  const targetPosition = gameState?.target_position
  const isFinished = gameState?.state === "finished"
  const finalNeedleAngle = gameState?.finalNeedleAngle ?? 90
  const pointsThisDial = gameState?.points_this_dial ?? 0
  const teamScore = gameState?.team_score ?? 0
  const totalDials = gameState?.total_dials
  const leaderboard = gameState?.leaderboard || []
  const maxScore = totalDials * 4
  const hostId = gameState?.host_id
  const isHost = playerId === hostId

  const animatedTeamScore = useCountUp(teamScore, 1000, 600)

  const isNewRecord = isFinished && leaderboard.length > 0 &&
    leaderboard[0].score === teamScore &&
    leaderboard[0].players.join() === players.map(p => p.name).join()

  const [showRecord, setShowRecord] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    setShowRecord(false)
    if (isFinished && isNewRecord) {
      const t = setTimeout(() => setShowRecord(true), 1800)
      return () => clearTimeout(t)
    }
  }, [isFinished, isNewRecord])

  useEffect(() => {
    if (!showRecord) return
    const interval = setInterval(() => setPulse(p => !p), 700)
    return () => clearInterval(interval)
  }, [showRecord])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 16, paddingTop: 20,
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      {!isFinished ? (
        <>
          <FadeIn delay={0}>
            <div style={{ background: "#16213e", borderRadius: 14, padding: "14px 16px", border: "1px solid #2a2a4a" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🎯 Resultado</h2>
              {clue && <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>Pista de <strong style={{ color: "#aaa" }}>{clue.owner_name}</strong></p>}
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            {clue && (
              <div style={{ background: "#6c63ff", borderRadius: 14, padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>"{clue.phrase}"</p>
              </div>
            )}
          </FadeIn>

          <FadeIn delay={200}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Dial
                targetPosition={targetPosition}
                needleAngle={finalNeedleAngle}
                showTarget={true}
                leftAdjective={clue?.left_adjective || ""}
                rightAdjective={clue?.right_adjective || ""}
              />
            </div>
          </FadeIn>

          <FadeIn delay={1700}>
            <div style={{ background: "#16213e", borderRadius: 14, padding: 16, border: "1px solid #2a2a4a", textAlign: "center" }}>
              <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Puntos este dial</p>
              <p style={{
                fontSize: 52, fontWeight: 900, margin: 0,
                color: pointsThisDial === 4 ? "#2ecc71" : pointsThisDial === 3 ? "#f0c040" : pointsThisDial === 2 ? "#e67e22" : "#e74c3c",
              }}>
                +{pointsThisDial}
              </p>
              <p style={{ color: "#666", fontSize: 13, margin: "4px 0 0" }}>
                {pointsThisDial === 4 ? "🎯 ¡Perfecto!" : pointsThisDial === 3 ? "👏 ¡Muy cerca!" : pointsThisDial === 2 ? "👍 Bien" : "😬 Sigue intentándolo"}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={1900}>
            <div style={{ background: "#16213e", borderRadius: 14, padding: 16, border: "1px solid #6c63ff", textAlign: "center" }}>
              <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Puntuación del equipo</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: "#6c63ff", margin: 0 }}>{teamScore} pts</p>
              <div style={{ display: "flex", gap: 4, marginTop: 10, padding: "0 20px" }}>
                {Array.from({ length: clue?.total_clues || 1 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i < (clue?.clue_number || 0) ? "#6c63ff" : "#2a2a4a",
                  }} />
                ))}
              </div>
              <p style={{ color: "#555", fontSize: 12, marginTop: 6 }}>
                Dial {clue?.clue_number} de {clue?.total_clues}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={2100}>
            {isHost ? (
              <button onClick={() => send({ type: "next_clue" })} style={btnStyle("#6c63ff")}>
                Siguiente dial ▶️
              </button>
            ) : (
              <div style={{ background: "#16213e", borderRadius: 14, padding: "18px", textAlign: "center", border: "1px solid #2a2a4a" }}>
                <p style={{ color: "#888", fontSize: 16, margin: 0 }}>⏳ Esperando al anfitrión...</p>
              </div>
            )}
          </FadeIn>
        </>
      ) : (
        <>
          <FadeIn delay={0}>
            <div style={{ background: "#16213e", borderRadius: 14, padding: "14px 16px", border: "1px solid #2a2a4a", textAlign: "center" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>🏆 ¡Partida terminada!</h2>
            </div>
          </FadeIn>

          {showRecord && (
            <div style={{
              background: pulse ? "#f0c040" : "#d4a800",
              borderRadius: 14, padding: "16px", textAlign: "center",
              transition: "background 0.5s ease",
              boxShadow: "0 0 40px rgba(240, 196, 64, 0.5)",
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", margin: 0 }}>
                🎉 ¡NUEVO RÉCORD! 🎉
              </p>
            </div>
          )}

          <FadeIn delay={200}>
            <div style={{ background: "#16213e", borderRadius: 16, padding: 20, border: "2px solid #6c63ff", textAlign: "center" }}>
              <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Puntuación final</p>
              <p style={{ fontSize: 64, fontWeight: 900, color: "#6c63ff", margin: 0, lineHeight: 1 }}>
                {animatedTeamScore}
              </p>
              <p style={{ color: "#555", fontSize: 14, marginTop: 4 }}>de {maxScore} puntos posibles</p>
              <div style={{ display: "flex", gap: 3, marginTop: 12, padding: "0 4px" }}>
                {Array.from({ length: maxScore }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 6, borderRadius: 2,
                    background: i < animatedTeamScore ? "#6c63ff" : "#2a2a4a",
                    transition: "background 0.05s"
                  }} />
                ))}
              </div>
              <p style={{ color: "#888", fontSize: 13, marginTop: 10 }}>
                {players.map(p => p.name).join(", ")}
              </p>
              <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
                {teamScore === maxScore ? "🎯 ¡Puntuación perfecta!" :
                 teamScore >= maxScore * 0.8 ? "🔥 ¡Increíble!" :
                 teamScore >= maxScore * 0.6 ? "👏 ¡Muy bien!" :
                 teamScore >= maxScore * 0.4 ? "👍 Nada mal" : "💪 ¡A practicar!"}
              </p>
            </div>
          </FadeIn>

          {leaderboard.length > 0 && (
            <FadeIn delay={600}>
              <div style={{ background: "#16213e", borderRadius: 16, padding: 16, border: "1px solid #2a2a4a" }}>
                <p style={{ color: "#aaa", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>
                  🏅 Récords — {totalDials} diales
                </p>
                {leaderboard.map((entry, i) => (
                  <div key={i} style={{
                    display: "flex", flexDirection: "column",
                    padding: "12px 14px",
                    background: i === 0 ? "#1a1a4e" : "#0f3460",
                    borderRadius: 10, marginBottom: 8,
                    border: i === 0 ? "2px solid #6c63ff" : "1px solid transparent",
                    boxShadow: i === 0 && isNewRecord ? "0 0 20px rgba(108, 99, 255, 0.4)" : "none",
                    transform: i === 0 && isNewRecord ? "scale(1.02)" : "scale(1)",
                    transition: "transform 0.4s ease, box-shadow 0.4s ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                      <span style={{ fontWeight: 900, fontSize: 20, color: i === 0 ? "#6c63ff" : "#fff" }}>{entry.score} pts</span>
                    </div>
                    <p style={{ color: "#aaa", fontSize: 12, margin: "4px 0 0" }}>{entry.players.join(", ")}</p>
                    <p style={{ color: "#555", fontSize: 11, margin: "2px 0 0" }}>{entry.date}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}

          <FadeIn delay={800}>
            <button onClick={onBackToLobby} style={btnStyle("#6c63ff")}>Jugar otra vez 🔄</button>
          </FadeIn>
          <FadeIn delay={900}>
            <button onClick={() => setScreen("home")} style={btnStyle("#2a2a4a")}>Volver al inicio</button>
          </FadeIn>
        </>
      )}
    </div>
  )
}

const btnStyle = (color) => ({
  background: color, color: "white", border: "none",
  borderRadius: 14, padding: "18px", fontSize: 16,
  fontWeight: 700, cursor: "pointer", width: "100%"
})