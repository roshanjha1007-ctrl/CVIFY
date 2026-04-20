'use client'

function formatLabel(value) {
  const date = new Date(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function HistoryChart({ sessions = [] }) {
  if (!sessions.length) {
    return (
      <div
        className="rounded-xl border px-4 py-8 text-sm text-center"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
      >
        Add an email address and save a few analyses to unlock score history.
      </div>
    )
  }

  const ordered = [...sessions].reverse()
  const width = 440
  const height = 180
  const padding = 24
  const step = ordered.length > 1 ? (width - padding * 2) / (ordered.length - 1) : 0

  const points = ordered.map((session, index) => {
    const score = session.analysis_json?.atsScore || 0
    const x = padding + step * index
    const y = height - padding - (score / 100) * (height - padding * 2)
    return { x, y, score, label: formatLabel(session.created_at), id: session.session_id }
  })

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="history-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff7a18" />
            <stop offset="100%" stopColor="#ff3b1a" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick / 100) * (height - padding * 2)
          return (
            <g key={tick}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#222" strokeDasharray="4 6" />
              <text x="0" y={y + 4} fill="#555" fontSize="10">
                {tick}
              </text>
            </g>
          )
        })}

        <path d={path} fill="none" stroke="url(#history-line)" strokeWidth="3" strokeLinecap="round" />

        {points.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ff5a14" />
            <text x={point.x} y={height - 6} textAnchor="middle" fill="#666" fontSize="10">
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid gap-2 sm:grid-cols-3">
        {ordered.slice(-3).map((session) => (
          <div
            key={session.session_id}
            className="rounded-xl border px-3 py-3"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
              {formatLabel(session.created_at)}
            </p>
            <p className="font-display text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {session.analysis_json?.atsScore || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {session.version_label || session.resume_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
