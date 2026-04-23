'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Copy, Download, Radar, Sparkles } from 'lucide-react'

const RESULT_STORAGE_KEY = 'cvify:last-analysis'
const SHOW_TECHNICAL_DETAILS_PANEL = false

function getScoreLabel(score) {
  if (score < 40) return 'Weak'
  if (score < 70) return 'Moderate'
  return 'Strong'
}

function formatPriorityLabel(value) {
  if (value === 'high') return 'High Priority'
  if (value === 'medium') return 'Medium Priority'
  return 'Low Priority'
}

function getPriorityTone(value) {
  if (value === 'high') return 'priority-high'
  if (value === 'medium') return 'priority-medium'
  return 'priority-low'
}

function buildNextSteps(analysis) {
  const missingSkills = Array.isArray(analysis?.missingSkills) ? analysis.missingSkills : []
  const improvements = Array.isArray(analysis?.improvementSuggestions) ? analysis.improvementSuggestions : []

  return [
    missingSkills.length
      ? `Add proof of ${missingSkills.slice(0, 2).join(' and ')} in your strongest project or experience bullets.`
      : 'Tighten your strongest bullets so they mirror the target job language more closely.',
    improvements[0]?.message || 'Add one high-impact improvement from this report to your resume today.',
    'Re-run the analysis after editing so you can see whether the ATS score and missing-skill list improve.',
  ]
}

function buildShareSummary({ analysis, session, input, scoreLabel, summary, nextSteps }) {
  const matchedSkills = Array.isArray(analysis?.matchedSkills) ? analysis.matchedSkills : []
  const missingSkills = Array.isArray(analysis?.missingSkills) ? analysis.missingSkills : []
  const improvements = Array.isArray(analysis?.improvementSuggestions) ? analysis.improvementSuggestions : []

  return [
    'CVify ATS Analysis Summary',
    '',
    `Score: ${analysis?.atsScore ?? 0} (${scoreLabel})`,
    `Session: ${session?.sessionId || 'Not saved'}`,
    `Source: ${input?.resumeFileName ? input.resumeFileName : 'Pasted resume text'}`,
    '',
    'Overview',
    summary,
    '',
    `Matched skills: ${matchedSkills.length ? matchedSkills.join(', ') : 'None detected'}`,
    `Missing skills: ${missingSkills.length ? missingSkills.join(', ') : 'None detected'}`,
    '',
    'Top improvements',
    ...(improvements.length ? improvements.slice(0, 3).map((item, index) => `${index + 1}. ${item.message}`) : ['1. No suggestions generated for this run.']),
    '',
    'Next steps',
    ...nextSteps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n')
}

function ScoreBar({ label, value }) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{safeValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#ff8d57)]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

function SkillPills({ items, tone, emptyLabel }) {
  const safeItems = Array.isArray(items) ? items : []

  if (!safeItems.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {safeItems.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1.5 text-xs ${tone === 'success' ? 'pill-success' : 'pill-warning'}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [payload, setPayload] = useState(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESULT_STORAGE_KEY)
      if (!saved) return
      setPayload(JSON.parse(saved))
    } catch {
      sessionStorage.removeItem(RESULT_STORAGE_KEY)
    }
  }, [])

  if (!payload?.analysis) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl dashboard-card p-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-dim-foreground">Results</p>
          <h1 className="mt-3 font-display text-3xl font-bold">No analysis found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Run an analysis from the home page first, then the results dashboard will appear here.
          </p>
          <button type="button" onClick={() => router.push('/')} className="primary-button mx-auto mt-6">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </main>
    )
  }

  const { analysis, session, input } = payload
  const breakdown = analysis.scoreBreakdown || {}
  const atsScore = Number.isFinite(Number(analysis.atsScore)) ? Number(analysis.atsScore) : 0
  const improvements = Array.isArray(analysis.improvementSuggestions) ? analysis.improvementSuggestions : []
  const scoreLabel = getScoreLabel(atsScore)
  const nextSteps = buildNextSteps(analysis)
  const predictedScore =
    Number.isFinite(Number(analysis.structuredJson?.predicted_score_if_improved))
      ? Number(analysis.structuredJson.predicted_score_if_improved)
      : atsScore
  const summary =
    analysis.structuredJson?.summary ||
    analysis.similarityExplanation ||
    'Your resume has some alignment with the role, but there are still a few important gaps to close.'
  const shareSummary = buildShareSummary({
    analysis,
    session,
    input,
    scoreLabel,
    summary,
    nextSteps,
  })

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(shareSummary)
      setShareMessage('Summary copied. You can paste it into GitHub, email, or notes.')
    } catch {
      setShareMessage('Clipboard access failed in this browser. Try downloading the report instead.')
    }
  }

  function handleDownloadReport() {
    const blob = new Blob([shareSummary], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const sessionId = session?.sessionId || 'analysis'

    link.href = url
    link.download = `cvify-${sessionId}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setShareMessage('Report downloaded as a text summary.')
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-dim-foreground">Results</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">ATS analysis dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleCopySummary} className="secondary-button">
                <Copy size={16} />
                <span>Copy Summary</span>
              </button>
              <button type="button" onClick={handleDownloadReport} className="ghost-button">
                <Download size={16} />
                <span>Download Report</span>
              </button>
              <button type="button" onClick={() => router.push('/')} className="secondary-button">
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </button>
            </div>
            {shareMessage && <p className="text-sm text-muted-foreground">{shareMessage}</p>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="dashboard-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">ATS Snapshot</p>
                <h2 className="mt-2 text-xl font-semibold">Resume match score</h2>
              </div>
              <Radar className="text-[var(--accent)]" size={20} />
            </div>

            <div className="mt-8 flex items-end gap-4">
              <div className="score-orb">
                <span className="font-display text-5xl font-extrabold">{atsScore}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] score-chip">
                  {scoreLabel}
                </p>
                <p>Session: {session?.sessionId || 'Not saved'}</p>
                <p>{input?.resumeFileName ? `Source: ${input.resumeFileName}` : 'Source: pasted resume text'}</p>
                <p>{session?.persisted ? 'Stored for analytics' : 'Analyzed without persistence'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[rgba(255,141,87,0.18)] bg-[rgba(255,255,255,0.02)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">AI Insight</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Fixing the biggest gaps here can realistically boost your score to <span className="font-semibold text-[var(--text)]">~{predictedScore}%</span>.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <ScoreBar label="Keyword match" value={breakdown.keywordMatch} />
              <ScoreBar label="Semantic similarity" value={breakdown.semanticSimilarity} />
              <ScoreBar label="Structure" value={breakdown.structure} />
              <ScoreBar label="Clarity" value={breakdown.clarity} />
            </div>

            <div className="export-panel mt-8">
              <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Shareable Report</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Turn this analysis into a portable summary for applications, issue threads, or quick progress snapshots.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleCopySummary} className="secondary-button">
                  <Copy size={16} />
                  <span>Copy Text Summary</span>
                </button>
                <button type="button" onClick={handleDownloadReport} className="ghost-button">
                  <Download size={16} />
                  <span>Save .txt Report</span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="dashboard-card p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[var(--green)]" />
                  <h2 className="text-lg font-semibold">Matched skills</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  These are the signals your resume is already sending clearly for this role.
                </p>
                <div className="mt-4">
                  <SkillPills items={analysis.matchedSkills} tone="success" emptyLabel="No confirmed matches were found yet." />
                </div>
              </div>

              <div className="dashboard-card p-6">
                <div className="flex items-center gap-2">
                  <CircleAlert size={18} className="text-[#ff8ba2]" />
                  <h2 className="text-lg font-semibold">Missing skills</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  These are the highest-impact gaps most likely to hold the score back right now.
                </p>
                <div className="mt-4">
                  <SkillPills items={analysis.missingSkills} tone="warning" emptyLabel="No missing skills were detected from the extracted job terms." />
                </div>
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Improvement suggestions</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                These recommendations are prioritized based on what would most improve ATS alignment.
              </p>
              <div className="mt-4 space-y-3">
                {improvements.length ? (
                  improvements.map((suggestion) => (
                    <div key={suggestion.message} className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-muted-foreground">
                      <p className={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${getPriorityTone(suggestion.type)}`}>
                        {formatPriorityLabel(suggestion.type)}
                      </p>
                      <p>{suggestion.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No suggestions generated for this run.</p>
                )}
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">What to do next</h2>
              </div>
              <div className="mt-4 space-y-3">
                {nextSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                    <div className="next-step-index">{index + 1}</div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {SHOW_TECHNICAL_DETAILS_PANEL && (
          <section className="dashboard-card p-6">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Debug</p>
                <h2 className="mt-2 text-lg font-semibold">View Technical Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Expand this if you want the raw structured output behind the analysis.
                </p>
              </div>
              {showTechnicalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showTechnicalDetails && (
              <pre className="mt-4 overflow-x-auto rounded-3xl bg-[#080808] p-4 text-xs leading-6 text-[#f3d8cc]">
                {JSON.stringify(analysis.structuredJson || {}, null, 2)}
              </pre>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
