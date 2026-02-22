import { useRef } from "react"

export default function Dial({ targetPosition, showTarget, needleAngle, setNeedleAngle, leftAdjective, rightAdjective }) {
  const cx = 130, cy = 120, r = 100
  const isDragging = useRef(false)
  const svgRef = useRef(null)

  const getAngleFromEvent = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    const x = clientX - rect.left - cx
    const y = -(clientY - rect.top - cy)
    let a = Math.atan2(y, -x) * (180 / Math.PI)
    if (a < 0) a = 0
    if (a > 180) a = 180
    return Math.round(a)
  }

  const handleMouseDown = (e) => {
    if (!setNeedleAngle) return
    isDragging.current = true
    setNeedleAngle(getAngleFromEvent(e.clientX, e.clientY))
  }
  const handleMouseMove = (e) => {
    if (!setNeedleAngle || !isDragging.current) return
    setNeedleAngle(getAngleFromEvent(e.clientX, e.clientY))
  }
  const handleMouseUp = () => { isDragging.current = false }

  const handleTouchStart = (e) => {
    if (!setNeedleAngle) return
    isDragging.current = true
    const t = e.touches[0]
    setNeedleAngle(getAngleFromEvent(t.clientX, t.clientY))
  }
  const handleTouchMove = (e) => {
    if (!setNeedleAngle || !isDragging.current) return
    e.preventDefault()
    const t = e.touches[0]
    setNeedleAngle(getAngleFromEvent(t.clientX, t.clientY))
  }
  const handleTouchEnd = () => { isDragging.current = false }

  const toCoords = (angleDeg, radius) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(Math.PI - rad),
      y: cy - radius * Math.sin(rad)
    }
  }

  const arcSlice = (startDeg, endDeg, innerR, outerR) => {
    const s1 = toCoords(startDeg, outerR)
    const e1 = toCoords(endDeg, outerR)
    const s2 = toCoords(endDeg, innerR)
    const e2 = toCoords(startDeg, innerR)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${outerR} ${outerR} 0 ${large} 0 ${e1.x} ${e1.y}
            L ${s2.x} ${s2.y} A ${innerR} ${innerR} 0 ${large} 1 ${e2.x} ${e2.y} Z`
  }

  const needle = needleAngle !== undefined ? toCoords(needleAngle, r - 8) : null
  const W = cx * 2, H = cy + 30

  return (
    <div style={{ touchAction: "none", display: "inline-block" }}>
      <svg
        ref={svgRef}
        width={W} height={H}
        style={{ cursor: setNeedleAngle ? "pointer" : "default", userSelect: "none", display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fondo */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="#2a2a4a" />

        {/* Zonas de puntos */}
        {showTarget && targetPosition !== undefined && (
          <>
            <path d={arcSlice(targetPosition - 35, targetPosition - 20, r * 0.5, r)} fill="#f39c12" opacity="0.8" />
            <path d={arcSlice(targetPosition + 20, targetPosition + 35, r * 0.5, r)} fill="#f39c12" opacity="0.8" />
            <path d={arcSlice(targetPosition - 20, targetPosition - 10, r * 0.5, r)} fill="#e67e22" opacity="0.9" />
            <path d={arcSlice(targetPosition + 10, targetPosition + 20, r * 0.5, r)} fill="#e67e22" opacity="0.9" />
            <path d={arcSlice(targetPosition - 10, targetPosition + 10, r * 0.5, r)} fill="#e74c3c" />
            {[
              { angle: targetPosition - 27, pts: "2" },
              { angle: targetPosition + 27, pts: "2" },
              { angle: targetPosition - 15, pts: "3" },
              { angle: targetPosition + 15, pts: "3" },
              { angle: targetPosition, pts: "4" },
            ].map(({ angle, pts }, i) => {
              const pos = toCoords(angle, r * 0.75)
              return <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="white">{pts}</text>
            })}
          </>
        )}

        {/* Borde */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#444" strokeWidth="2" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#444" strokeWidth="1" />

        {/* Aguja */}
        {needle && (
          <>
            <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#6c63ff" strokeWidth="4" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="7" fill="#6c63ff" />
          </>
        )}

        {/* Adjetivos */}
        <text x={cx - r - 4} y={cy + 18} textAnchor="end" fontSize="11" fontWeight="bold"
          fill="white" stroke="#1a1a2e" strokeWidth="3" paintOrder="stroke">
          {leftAdjective}
        </text>
        <text x={cx + r + 4} y={cy + 18} textAnchor="start" fontSize="11" fontWeight="bold"
          fill="white" stroke="#1a1a2e" strokeWidth="3" paintOrder="stroke">
          {rightAdjective}
        </text>
      </svg>
    </div>
  )
}