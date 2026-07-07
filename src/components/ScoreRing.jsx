// score: 1–100 (stored in DB). Displays as x.x out of 10.
export default function ScoreRing({ score, size = 48, label }) {
  const display = score == null ? '—' : (score / 10).toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: score == null ? 'var(--color-bg-parchment)' : 'var(--color-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: score == null ? 'none' : '0 4px 10px rgba(40,20,10,0.2)',
      }}>
        <span style={{
          fontWeight: 800,
          fontFamily: 'var(--font-body)',
          fontSize: size >= 56 ? 17 : size >= 44 ? 14 : 12,
          color: 'oklch(26% 0.05 50)',
          lineHeight: 1,
        }}>
          {display}
        </span>
      </div>
      {label && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
