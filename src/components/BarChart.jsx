// Simple inline SVG bar chart — no external charting dep needed
export default function BarChart({ bars, height = 120 }) {
  // bars: [{ label, value, color }]
  if (!bars || bars.length === 0) return null
  const max = Math.max(...bars.map(b => b.value), 0.01)
  const barW = 100 / bars.length

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, display: 'block', overflow: 'visible' }}
      >
        {bars.map((bar, i) => {
          const bh = max > 0 ? (bar.value / max) * (height - 28) : 0
          const x = i * barW + barW * 0.15
          const w = barW * 0.7
          const y = height - 20 - bh
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={Math.max(bh, 0)}
                rx="1.5"
                fill={bar.color || 'var(--amber)'}
                opacity="0.85"
              />
              {/* value label */}
              {bar.value > 0 && (
                <text
                  x={x + w / 2} y={y - 3}
                  textAnchor="middle"
                  fontSize="5"
                  fill="var(--text-dim)"
                  fontFamily="JetBrains Mono, monospace"
                >
                  £{bar.value.toFixed(0)}
                </text>
              )}
              {/* axis label */}
              <text
                x={x + w / 2} y={height - 6}
                textAnchor="middle"
                fontSize="5.5"
                fill="var(--text-dimmer)"
                fontFamily="Outfit, sans-serif"
              >
                {bar.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
