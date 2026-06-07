export default function ScoreRing({ score, size = 48, label }) {
  const color = score == null
    ? 'var(--color-border)'
    : score >= 85 ? 'var(--color-positive)'
    : score >= 70 ? 'var(--color-warning)'
    : 'var(--color-roast)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-full)',
        border: `2px ${score == null ? 'dashed' : 'solid'} ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: score == null ? 'var(--font-body)' : 'var(--font-display)',
          fontWeight: 'var(--weight-bold)',
          fontSize: size >= 56 ? 18 : size >= 44 ? 15 : 13,
          color,
          lineHeight: 1,
        }}>
          {score ?? '—'}
        </span>
      </div>
      {label && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 'var(--weight-medium)',
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
