'use client'
import { ChevronRight, Copy, Share2 } from 'lucide-react'
import ScoreRing from './ScoreRing'

function Section({ title, items, accent }) {
  const colors = {
    red: 'text-red-400 border-red-900',
    green: 'text-green-400 border-green-900',
    orange: 'text-orange-400 border-orange-900',
  }
  const cls = colors[accent] || colors.orange

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <h3 className={`text-xs font-semibold tracking-widest uppercase mb-3 ${cls.split(' ')[0]}`}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <ChevronRight size={16} className={cls.split(' ')[0]} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ResultCard({ result, brutal, onShare, sharing, shareUrl }) {
  const score = result.score || 0
  const label =
    score >= 80 ? 'Strong' :
    score >= 60 ? 'Average' :
    score >= 40 ? 'Weak' :
    'Critical'

  return (
    <div className="fade-up space-y-4">
      {/* Header */}
      <div className="border rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <ScoreRing score={score} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              ATS Score
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{
                background: score >= 70 ? '#00e67622' : score >= 45 ? '#ffd60022' : '#ff174422',
                color: score >= 70 ? '#00e676' : score >= 45 ? '#ffd600' : '#ff1744',
                border: `1px solid ${score >= 70 ? '#00e67633' : score >= 45 ? '#ffd60033' : '#ff174433'}`
              }}>
              {label}
            </span>
            {brutal && (
              <span className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: '#ff4d0022', color: '#ff4d00', border: '1px solid #ff4d0033' }}>
                BRUTAL
              </span>
            )}
          </div>
          <p className="font-display text-lg font-semibold" style={{ color: 'var(--text)' }}>
            "{result.verdict}"
          </p>
        </div>
      </div>

      {/* Issues & Fixes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Issues Found" items={result.issues || []} accent="red" />
        <Section title="How to Fix" items={result.fixes || []} accent="green" />
      </div>

      {/* Rewrites */}
      <Section title="Bullet Rewrites" items={result.rewrites || []} accent="orange" />

      {/* Share */}
      <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        {shareUrl ? (
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              Share Link
            </p>
            <div className="flex gap-2">
              <code className="flex-1 text-sm px-3 py-2 rounded text-orange-400 truncate"
                style={{ background: '#ff4d0011', border: '1px solid #ff4d0033' }}>
                {shareUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-3 py-2 rounded text-xs font-semibold transition-all hover:opacity-80 inline-flex items-center gap-2"
                style={{ background: '#ff4d0022', color: '#ff4d00', border: '1px solid #ff4d0044' }}>
                <Copy size={14} />
                Copy
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Share this roast</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Anonymous public link — resume text not visible
              </p>
            </div>
            <button
              onClick={onShare}
              disabled={sharing}
              className="px-4 py-2 rounded text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-2"
              style={{ background: '#ff4d0022', color: '#ff4d00', border: '1px solid #ff4d0044' }}>
              <Share2 size={15} />
              {sharing ? 'Saving...' : 'Share'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
