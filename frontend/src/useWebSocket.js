import { useEffect, useRef, useState } from "react"

const WS_BACKEND = "wss://wavelength-production.up.railway.app"
//const WS_BACKEND = "ws://127.0.0.1:8000"

let globalSocket = null
let globalRoomCode = null

export function useWebSocket(roomCode, playerId, playerName, onMessage) {
  const [connected, setConnected] = useState(false)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    if (!roomCode || !playerId) return

    if (globalSocket && globalSocket.readyState === WebSocket.OPEN && globalRoomCode === roomCode) {
      setConnected(true)
      return
    }

    if (globalSocket) {
      globalSocket.close()
      globalSocket = null
    }

    globalRoomCode = roomCode
    const ws = new WebSocket(`${WS_BACKEND}/ws/${roomCode}/${playerId}`)
    globalSocket = ws

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: "join", name: playerName }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      onMessageRef.current(message)
    }

    ws.onclose = () => {
      setConnected(false)
      if (globalSocket === ws) {
        globalSocket = null
        globalRoomCode = null
      }
    }
  }, [roomCode, playerId])

  const send = (message) => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.send(JSON.stringify(message))
    }
  }

  return { send, connected }
}