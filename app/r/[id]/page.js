import { ArrowLeft, ArrowRight, ChevronRight, Eye, Flame, FileWarning, Trophy } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import ScoreRing from '@/components/ScoreRing'
import connectDB from '@/lib/mongodb'
import Roast from '@/models/Roast'

async function getRoast(id) {
  try {
    await connectDB()
    const roast = await Roast.findOne({ id })
    return roast || null
  } catch {
    return null
  }
}

function Section({ title, items, accent }) {
  const colors = {
    red: '#ff1744',
    green: '#00e676',
    orange: '#ff4d00',
  }
  const color = colors[accent] || colors.orange

  return (
    <div style={{ border: '1px solid #222', background: '#111', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ color, fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
        {title}
      </h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
            <ChevronRight size={16} style={{ color, flexShrink: 0, marginTop: '2px' }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function SharedRoast({ params }) {
  const roast = await getRoast(params.id)

  if (!roast) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <FileWarning size={40} color="#ff4d00" />
          </div>
          <h1 style={{ color: '#f0f0f0', fontSize: '20px', marginBottom: '8px' }}>Roast not found</h1>
          <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px' }}>This link may have expired (30 days).</p>
          <a href="/" style={{ color: '#ff4d00', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} />
            Roast your own resume
          </a>
        </div>
      </main>
    )
  }

  const result = roast.result_json
  const score = result.score || 0
  const scoreColor = score >= 70 ? '#00e676' : score >= 45 ? '#ffd600' : '#ff1744'
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Average' : score >= 40 ? 'Weak' : 'Critical'

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <header style={{ borderBottom: '1px solid #222', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <BrandLogo className="brand-shadow hidden h-10 w-auto sm:block" />
          <BrandLogo compact className="brand-shadow h-10 w-10 sm:hidden" />
        </a>
        <span style={{ fontSize: '11px', color: '#444' }}>/ shared roast</span>
      </header>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#ff4d0011', border: '1px solid #ff4d0033', fontSize: '12px', color: '#ff4d00', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Eye size={14} />
          <span>Shared roast view. Resume text stays hidden.</span>
          {roast.brutal_mode && (
            <span style={{ marginLeft: '8px', background: '#ff4d0022', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={12} />
              Brutal Mode
            </span>
          )}
        </div>

        <div style={{ border: '1px solid #222', background: '#111', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={score} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>ATS Score</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: scoreColor + '22', color: scoreColor, border: `1px solid ${scoreColor}33`, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={12} />
                {label}
              </span>
            </div>
            <p style={{ color: '#f0f0f0', fontSize: '16px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>"{result.verdict}"</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Issues Found" items={result.issues || []} accent="red" />
          <Section title="How to Fix" items={result.fixes || []} accent="green" />
        </div>

        <Section title="Bullet Rewrites" items={result.rewrites || []} accent="orange" />

        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#ff4d00', color: '#fff',
            borderRadius: '8px', textDecoration: 'none', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: '14px'
          }}>
            Roast your own resume
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </main>
  )
}
