export default function ScoreRing({ score, size = 48, label }) {
  if (score == null) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div
          style={{ width: size, height: size }}
          className="rounded-full border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-300 text-xs"
        >
          —
        </div>
        {label && <span className="text-xs text-amber-500">{label}</span>}
      </div>
    )
  }

  const color = score >= 85 ? '#16a34a' : score >= 70 ? '#d97706' : '#dc2626'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        style={{ width: size, height: size, borderColor: color }}
        className="rounded-full border-2 flex items-center justify-center font-bold text-sm"
      >
        <span style={{ color }}>{score}</span>
      </div>
      {label && <span className="text-xs text-amber-500">{label}</span>}
    </div>
  )
}
