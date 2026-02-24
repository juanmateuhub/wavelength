import { useRef, useState, useEffect } from "react"

export default function Dial({ targetPosition, showTarget, needleAngle, setNeedleAngle, leftAdjective, rightAdjective }) {
  const cx = 130, cy = 120, r = 100
  const W = cx * 2
  const isDragging = useRef(false)
  const svgRef = useRef(null)
  const rafRef = useRef(null)
  const [revealWidth, setRevealWidth] = useState(0)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (showTarget) {
      setRevealWidth(0)
      const duration = 1400
      let startTime = null
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setRevealWidth(eased * 2 * r)
        if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      }
      const t = setTimeout(() => { rafRef.current = requestAnimationFrame(animate) }, 100)
      return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    } else {
      setRevealWidth(0)
    }
  }, [showTarget, targetPosition])

  const getAngleFromEvent = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    const x = clientX - rect.left - cx
    const y = -(clientY - rect.top - cy)
    let a = Math.atan2(y, -x) * (180 / Math.PI)
    if (a < 0) a = 0
    if (a > 180) a = 180
    return Math.round(a)
  }

  const handleMouseDown = (e) => { if (!setNeedleAngle) return; isDragging.current = true; setNeedleAngle(getAngleFromEvent(e.clientX, e.clientY)) }
  const handleMouseMove = (e) => { if (!setNeedleAngle || !isDragging.current) return; setNeedleAngle(getAngleFromEvent(e.clientX, e.clientY)) }
  const handleMouseUp = () => { isDragging.current = false }
  const handleTouchStart = (e) => { if (!setNeedleAngle) return; isDragging.current = true; const t = e.touches[0]; setNeedleAngle(getAngleFromEvent(t.clientX, t.clientY)) }
  const handleTouchMove = (e) => { if (!setNeedleAngle || !isDragging.current) return; e.preventDefault(); const t = e.touches[0]; setNeedleAngle(getAngleFromEvent(t.clientX, t.clientY)) }
  const handleTouchEnd = () => { isDragging.current = false }

  const toCoords = (angleDeg, radius) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(Math.PI - rad), y: cy - radius * Math.sin(rad) }
  }

  const arcSlice = (startDeg, endDeg) => {
    const innerR = r * 0.18
    const outerR = r
    const s1 = toCoords(startDeg, outerR), e1 = toCoords(endDeg, outerR)
    const s2 = toCoords(endDeg, innerR), e2 = toCoords(startDeg, innerR)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${outerR} ${outerR} 0 ${large} 0 ${e1.x} ${e1.y}
            L ${s2.x} ${s2.y} A ${innerR} ${innerR} 0 ${large} 1 ${e2.x} ${e2.y} Z`
  }

  const needle = needleAngle !== undefined ? toCoords(needleAngle, r - 8) : null
  const Z4 = 5, Z3 = 11, Z2 = 19

  // Tamaño de fuente adaptativo según longitud
  const adjFontSize = (text) => {
    if (!text) return 12
    const l = text.length
    if (l > 16) return 9
    if (l > 12) return 10
    if (l > 8)  return 11
    return 12
  }

  return (
    <div style={{
      touchAction: "none",
      width: "100%",
      maxWidth: W,
      margin: "0 auto",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${cy + 10}`}
        width="100%"
        style={{
          cursor: setNeedleAngle ? "pointer" : "default",
          userSelect: "none",
          display: "block",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          <clipPath id="revealClip">
            <rect x={cx - r} y={0} width={revealWidth} height={cy + 10} />
          </clipPath>
        </defs>

        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="#3d3d6b" />

        {showTarget && targetPosition !== undefined && (
          <g clipPath="url(#revealClip)">
            <path d={arcSlice(targetPosition + Z3, targetPosition + Z2)} fill="#f0c040" />
            <path d={arcSlice(targetPosition - Z2, targetPosition - Z3)} fill="#f0c040" />
            <path d={arcSlice(targetPosition + Z4, targetPosition + Z3)} fill="#e67e22" />
            <path d={arcSlice(targetPosition - Z3, targetPosition - Z4)} fill="#e67e22" />
            <path d={arcSlice(targetPosition - Z4, targetPosition + Z4)} fill="#e74c3c" />
            {[
              { angle: targetPosition - (Z2 + Z3) / 2, pts: "2" },
              { angle: targetPosition + (Z2 + Z3) / 2, pts: "2" },
              { angle: targetPosition - (Z3 + Z4) / 2, pts: "3" },
              { angle: targetPosition + (Z3 + Z4) / 2, pts: "3" },
              { angle: targetPosition, pts: "4" },
            ].map(({ angle, pts }, i) => {
              const pos = toCoords(angle, r * 0.88)
              return (
                <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize="13" fontWeight="900" fontFamily="Georgia, 'Times New Roman', serif" fill="white">
                  {pts}
                </text>
              )
            })}
          </g>
        )}

        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#444" strokeWidth="3" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#444" strokeWidth="1" />

        {needle && (
          <>
            <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#6c63ff" strokeWidth="4" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="7" fill="#6c63ff" />
          </>
        )}
      </svg>

      {/* Adjetivos — dentro del mismo contenedor limitado, nunca desbordan */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 6,
        marginTop: 6,
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{
          flex: "1 1 0",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>⬅️</span>
          <span style={{
            color: "#ccc",
            fontSize: adjFontSize(leftAdjective),
            fontWeight: 700,
            lineHeight: 1.3,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}>
            {leftAdjective}
          </span>
        </div>

        <div style={{
          flex: "1 1 0",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
        }}>
          <span style={{
            color: "#ccc",
            fontSize: adjFontSize(rightAdjective),
            fontWeight: 700,
            lineHeight: 1.3,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            textAlign: "right",
          }}>
            {rightAdjective}
          </span>
          <span style={{ fontSize: 12, flexShrink: 0 }}>➡️</span>
        </div>
      </div>
    </div>
  )
}