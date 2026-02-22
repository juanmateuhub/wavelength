import { useState } from "react"

const BACKEND = "http://127.0.0.1:8000"

export default function Home({ setScreen, setRoomCode, setPlayerName, setPlayerId }) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const generatePlayerId = () => Math.random().toString(36).substring(2, 10)

  const handleCreate = async () => {
    if (!name.trim()) return setError("Escribe tu nombre")
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND}/create-room`, { method: "POST" })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setPlayerName(name.trim())
      setPlayerId(generatePlayerId())
      setRoomCode(data.room_code)
      setScreen("lobby")
    } catch (e) {
      setError("No se pudo conectar al servidor: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim()) return setError("Escribe tu nombre")
    if (!code.trim()) return setError("Escribe el código de sala")
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND}/room/${code.toUpperCase()}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (!data.exists) return setError("Sala no encontrada")
      setPlayerName(name.trim())
      setPlayerId(generatePlayerId())
      setRoomCode(code.toUpperCase())
      setScreen("lobby")
    } catch (e) {
      setError("No se pudo conectar al servidor: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh", gap: 24 }}>
      <div style={{ textAlign: "center", paddingTop: 20 }}>
        <div style={{ fontSize: 56 }}>🎯</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Wavelength</h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>El juego del dial</p>
      </div>

      <div style={card}>
        <label style={labelStyle}>Tu nombre</label>
        <input
          placeholder="¿Cómo te llamas?"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          style={inputStyle}
          autoComplete="off"
        />
        {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button onClick={handleCreate} disabled={loading} style={primaryBtn}>
          {loading ? "Creando..." : "Crear sala"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#333" }} />
        <span style={{ color: "#666", fontSize: 13 }}>o únete a una sala</span>
        <div style={{ flex: 1, height: 1, background: "#333" }} />
      </div>

      <div style={card}>
        <label style={labelStyle}>Código de sala</label>
        <input
          placeholder="Ej: 4209"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
          style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: 6, fontWeight: 700 }}
          autoComplete="off"
          maxLength={4}
        />
        <button onClick={handleJoin} disabled={loading} style={secondaryBtn}>
          {loading ? "Uniéndose..." : "Unirse"}
        </button>
      </div>
    </div>
  )
}

const card = {
  background: "#16213e",
  borderRadius: 16,
  padding: "20px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  border: "1px solid #2a2a4a"
}
const labelStyle = { color: "#aaa", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }
const inputStyle = {
  background: "#0f3460",
  border: "2px solid #2a2a4a",
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 16,
  color: "#fff",
  outline: "none",
  width: "100%",
}
const primaryBtn = {
  background: "#6c63ff",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "16px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  marginTop: 4,
}
const secondaryBtn = {
  background: "#2ecc71",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "16px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  marginTop: 4,
}