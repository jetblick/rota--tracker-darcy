export default function BarChart({ bars, height = 160 }) {
  if (!bars || bars.length === 0) return null

  const max = Math.max(...bars.map(b => b.value), 0.01)
  const LABEL_HEIGHT = 36   // space at bottom for label + value
  const TOP_PAD = 16        // space above tallest bar
  const chartH = height - LABEL_HEIGHT - TOP_PAD
  const BAR_RADIUS = 6

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        height: `${height}px`,
        padding: `${TOP_PAD}px 4px 0`,
      }}>
        {bars.map((bar, i) => {
          const fillRatio = bar.value / max
          const barH = Math.max(fillRatio * chartH, bar.value > 0 ? 4 : 0)
          const isEmpty = bar.value === 0

          return (
            <div key={i} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              gap: '6px',
            }}>
              {/* Value label above bar */}
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: isEmpty ? 'transparent' : 'var(--text3)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}>
                £{bar.value.toFixed(0)}
              </div>

              {/* Bar */}
              <div style={{
                width: '100%',
                height: `${barH}px`,
                background: bar.color || 'var(--blue)',
                borderRadius: `${BAR_RADIUS}px ${BAR_RADIUS}px ${BAR_RADIUS}px ${BAR_RADIUS}px`,
                opacity: isEmpty ? 0.15 : 1,
                minHeight: isEmpty ? '3px' : undefined,
                transition: 'height 0.3s ease',
              }} />

              {/* Axis label */}
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text3)',
                letterSpacing: '-0.01em',
                textAlign: 'center',
                lineHeight: 1,
                paddingBottom: '4px',
              }}>
                {bar.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
