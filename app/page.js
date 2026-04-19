'use client'
import { useState } from 'react'
import ResultCard from '@/components/ResultCard'

export default function Home() {
  const [resumeText, setResumeText] = useState('')
  const [brutal, setBrutal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  async function handleRoast() {
    if (!resumeText.trim()) {
      setError('Paste your resume first.')
      return
    }
    if (resumeText.trim().length < 50) {
      setError('Resume too short — paste more content.')
      return
    }

    setError('')
    setResult(null)
    setShareUrl('')
    setLoading(true)

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, brutal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Roast failed.')
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, result, brutal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url = `${window.location.origin}/r/${data.id}`
      setShareUrl(url)
    } catch (err) {
      setError('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-display)' }}>
            C
          </div>
          <span className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            CVIFY
          </span>
          <span className="text-xs px-2 py-0.5 rounded hidden sm:block"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid #ff4d0033' }}>
            AI Resume Roaster
          </span>
        </div>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: 'var(--text-dim)' }}>
          GitHub ↗
        </a>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{ color: 'var(--text)' }}>
            Get your resume{' '}
            <span style={{ color: 'var(--accent)' }}>roasted.</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            AI-powered ATS analysis. No login. No fluff. Just the truth.
          </p>
        </div>

        {/* Input Card */}
        <div className="border rounded-xl p-5 space-y-4"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>

          {/* Mode toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              Paste Resume
            </label>
            <button
              onClick={() => setBrutal(!brutal)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded transition-all"
              style={{
                background: brutal ? '#ff4d0022' : 'var(--bg-input)',
                color: brutal ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${brutal ? '#ff4d0044' : 'var(--border)'}`,
              }}>
              <span>{brutal ? '🔥' : '💬'}</span>
              {brutal ? 'Brutal Mode ON' : 'Normal Mode'}
            </button>
          </div>

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here — work experience, skills, summary..."
            rows={10}
            className="w-full rounded-lg p-4 text-sm resize-none outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              lineHeight: '1.6',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-hover)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {resumeText.length} / 10,000 chars
            </span>
            <button
              onClick={handleRoast}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.02em',
              }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                  </svg>
                  Roasting...
                </span>
              ) : (
                brutal ? '🔥 Roast Brutally' : '⚡ Roast Resume'
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded"
              style={{ background: '#ff174411', color: '#ff1744', border: '1px solid #ff174433' }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Result */}
        {result && (
          <ResultCard
            result={result}
            brutal={brutal}
            onShare={handleShare}
            sharing={sharing}
            shareUrl={shareUrl}
          />
        )}

        {/* Footer */}
        <p className="text-center text-xs pb-4" style={{ color: 'var(--text-dim)' }}>
          Built by Roshan · CVIFY · Resume text is never stored unless you share
        </p>
      </div>
    </main>
  )
}
