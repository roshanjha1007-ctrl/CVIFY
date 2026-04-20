'use client'
import { Flame, Trophy } from 'lucide-react'

export default function VersionComparison({ versions, onClear }) {
  if (!versions || versions.length === 0) return null

  const best = Math.max(...versions.map(v => v.result.score))

  return (
    <div className="border rounded-xl p-5 space-y-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase"
          style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          Version Comparison
        </h2>
        <button onClick={onClear} className="text-xs px-3 py-1 rounded transition-all hover:opacity-80"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Clear All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2 pr-4 text-xs tracking-widest uppercase"
                style={{ color: 'var(--text-dim)' }}>Version</th>
              <th className="text-left py-2 pr-4 text-xs tracking-widest uppercase"
                style={{ color: 'var(--text-dim)' }}>Score</th>
              <th className="text-left py-2 pr-4 text-xs tracking-widest uppercase"
                style={{ color: 'var(--text-dim)' }}>Verdict</th>
              <th className="text-left py-2 text-xs tracking-widest uppercase"
                style={{ color: 'var(--text-dim)' }}>Mode</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v, i) => {
              const score = v.result.score
              const isBest = score === best
              const scoreColor = score >= 70 ? '#00e676' : score >= 45 ? '#ffd600' : '#ff1744'

              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  background: isBest ? '#00e67608' : 'transparent'
                }}>
                  <td className="py-3 pr-4 font-semibold" style={{ color: 'var(--text)' }}>
                    <div className="flex items-center gap-2">
                      <span>v{i + 1}</span>
                      {isBest && (
                        <span className="text-xs px-2 py-0.5 rounded inline-flex items-center gap-1"
                          style={{ background: '#00e67622', color: '#00e676', border: '1px solid #00e67633' }}>
                          <Trophy size={12} />
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-bold text-base" style={{ color: scoreColor, fontFamily: 'var(--font-mono)' }}>
                      {score}
                    </span>
                    <span className="text-xs ml-1" style={{ color: 'var(--text-dim)' }}>/100</span>
                  </td>
                  <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-muted)', maxWidth: '240px' }}>
                    "{v.result.verdict}"
                  </td>
                  <td className="py-3">
                    {v.brutal ? (
                      <span className="text-xs px-2 py-0.5 rounded inline-flex items-center gap-1"
                        style={{ background: '#ff4d0022', color: '#ff4d00', border: '1px solid #ff4d0033' }}>
                        <Flame size={12} />
                        Brutal
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Score bar visual */}
      <div className="space-y-2 pt-2">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>Score Bars</p>
        {versions.map((v, i) => {
          const score = v.result.score
          const scoreColor = score >= 70 ? '#00e676' : score >= 45 ? '#ffd600' : '#ff1744'
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs w-6" style={{ color: 'var(--text-dim)' }}>v{i + 1}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)', height: '6px' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: scoreColor, boxShadow: `0 0 6px ${scoreColor}66` }} />
              </div>
              <span className="text-xs font-bold w-8 text-right" style={{ color: scoreColor }}>{score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
