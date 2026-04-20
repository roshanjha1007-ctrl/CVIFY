'use client'

import { useEffect, useState } from 'react'
import {
  Briefcase,
  CheckCircle2,
  Globe2,
  LineChart,
  Mail,
  ScanSearch,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import ComparisonTable from '@/components/ComparisonTable'
import HistoryChart from '@/components/HistoryChart'
import ScoreRing from '@/components/ScoreRing'
import SectionPanel from '@/components/SectionPanel'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function TagList({ items = [], tone = 'neutral', emptyLabel }) {
  if (!items.length) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {emptyLabel}
      </p>
    )
  }

  const styles = {
    success: { background: '#00e67612', color: '#00e676', border: '1px solid #00e67622' },
    warning: { background: '#ff174412', color: '#ff7676', border: '1px solid #ff174422' },
    accent: { background: '#ff4d0014', color: '#ff8b52', border: '1px solid #ff4d0028' },
    neutral: { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1.5 rounded-full text-xs"
          style={styles[tone] || styles.neutral}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function BreakdownList({ breakdown = {}, explanations = [] }) {
  const labels = {
    keywordMatch: 'Keyword Match',
    sectionCompleteness: 'Section Completeness',
    quantifiedImpact: 'Quantified Impact',
    structureReadability: 'Structure Readability',
    linkedinConsistency: 'LinkedIn Consistency',
  }

  const explanationMap = explanations.reduce((acc, item) => {
    acc[item.label] = item.explanation
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(breakdown).map(([key, value]) => (
        <div key={key} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{labels[key] || key}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {explanationMap[labels[key] || key]}
              </p>
            </div>
            <span className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{value}</span>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#181818' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${value}%`,
                background: value >= 75 ? 'var(--green)' : value >= 55 ? 'var(--yellow)' : 'var(--accent)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function mapHistorySession(item) {
  return {
    id: item.session_id,
    label: item.version_label || item.resume_name || 'Untitled Resume',
    createdAt: item.created_at,
    analysis: item.analysis_json,
    linkedinProfile: item.linkedin_profile,
  }
}

export default function Home() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [email, setEmail] = useState('')
  const [versionLabel, setVersionLabel] = useState('')
  const [pdfFiles, setPdfFiles] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState('')
  const [latestResult, setLatestResult] = useState(null)
  const [batchResults, setBatchResults] = useState([])
  const [history, setHistory] = useState([])
  const [selectedCompareIds, setSelectedCompareIds] = useState([])

  useEffect(() => {
    if (!email || !email.includes('@')) {
      setHistory([])
      setSelectedCompareIds([])
      return
    }

    const timeout = setTimeout(async () => {
      setLoadingHistory(true)
      try {
        const response = await fetch(`/api/sessions?email=${encodeURIComponent(email)}&limit=12`)
        const data = await response.json()
        const nextHistory = (data.sessions || []).map(mapHistorySession)
        setHistory(nextHistory)
        setSelectedCompareIds(nextHistory.slice(0, 3).map((item) => item.id))
      } catch {
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [email])

  async function handleAnalyze() {
    if (!pdfFiles.length && resumeText.trim().length < 80) {
      setError('Upload one or more PDF resumes, or paste at least 80 characters of resume content.')
      return
    }

    if (jobDescription.trim().length < 40) {
      setError('Paste a fuller job description so CVify can score ATS compatibility accurately.')
      return
    }

    setError('')
    setAnalyzing(true)

    try {
      const targets = pdfFiles.length ? pdfFiles : [null]
      const results = []

      for (const file of targets) {
        const formData = new FormData()
        formData.append('jobDescription', jobDescription)
        formData.append('linkedInUrl', linkedInUrl)
        formData.append('email', email)
        formData.append('versionLabel', versionLabel || (file ? file.name.replace(/\.pdf$/i, '') : 'Manual Resume'))

        if (file) {
          formData.append('resumeFile', file)
        } else {
          formData.append('resumeText', resumeText)
        }

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed.')
        }

        const mappedResult = {
          id: data.session.sessionId,
          label: data.analysis.meta.versionLabel,
          createdAt: data.session.createdAt,
          analysis: data.analysis,
          emailReport: data.session.emailReport,
        }

        results.push(mappedResult)

        if (data.history?.length) {
          const nextHistory = data.history.map(mapHistorySession)
          setHistory(nextHistory)
          setSelectedCompareIds(nextHistory.slice(0, 3).map((item) => item.id))
        }
      }

      setBatchResults(results)
      setLatestResult(results[results.length - 1])
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function toggleCompare(sessionId) {
    setSelectedCompareIds((current) =>
      current.includes(sessionId)
        ? current.filter((item) => item !== sessionId)
        : [...current, sessionId].slice(-4)
    )
  }

  const comparisonSource = batchResults.length > 1
    ? batchResults.map((item) => ({
        id: item.id,
        label: item.label,
        dateLabel: formatDate(item.createdAt),
        atsScore: item.analysis.atsScore,
        matchedSkills: item.analysis.matchedSkills.length,
        missingSkills: item.analysis.missingSkills.length,
        structureReadability: item.analysis.scoreBreakdown.structureReadability,
      }))
    : history
        .filter((item) => selectedCompareIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          label: item.label,
          dateLabel: formatDate(item.createdAt),
          atsScore: item.analysis.atsScore,
          matchedSkills: item.analysis.matchedSkills.length,
          missingSkills: item.analysis.missingSkills.length,
          structureReadability: item.analysis.scoreBreakdown.structureReadability,
        }))

  return (
    <main className="min-h-screen">
      <header
        className="border-b px-6 py-4 sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', background: 'rgba(10, 10, 10, 0.88)', backdropFilter: 'blur(14px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo priority className="hidden h-9 w-auto sm:block brand-shadow" />
            <BrandLogo compact priority className="h-10 w-10 sm:hidden brand-shadow" />
            <span
              className="text-xs px-3 py-1 rounded-full hidden sm:inline-flex"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid #ff4d0033' }}
            >
              AI resume optimization and score tracking
            </span>
          </div>
          <div className="text-right hidden lg:block">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
              Dashboard
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Resume uploads, job matching, LinkedIn checks, and report delivery
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-4">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em]"
            style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            Resume analysis, tracking, and optimization
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Build stronger resumes with{' '}
            <span style={{ color: 'var(--accent)' }}>clear ATS feedback.</span>
          </h1>
          <p className="mx-auto max-w-3xl text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
            CVify parses resume PDFs, scores JD alignment, compares resume versions, simulates LinkedIn consistency checks,
            and saves every run so you can track progress over time.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionPanel title="Analyze Resume" eyebrow="Input Workspace">
            <div className="space-y-4">
              <label
                className="block rounded-2xl border border-dashed p-5 transition-all"
                style={{ borderColor: 'var(--border-hover)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-3" style={{ background: '#ff4d0014', color: 'var(--accent)' }}>
                    <Upload size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>
                      Upload resume PDFs
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Select one PDF for a single analysis, or upload multiple versions to compare them in one pass.
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="mt-4 block w-full text-sm"
                      onChange={(event) => setPdfFiles(Array.from(event.target.files || []))}
                    />
                  </div>
                </div>
              </label>

              {pdfFiles.length > 0 && (
                <TagList items={pdfFiles.map((file) => file.name)} tone="accent" emptyLabel="" />
              )}

              <div>
                <label className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                  Resume Text Fallback
                </label>
                <textarea
                  rows={7}
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste resume text here if you do not want to upload a PDF."
                  className="w-full mt-2 rounded-xl border p-4 text-sm resize-y"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                    <Briefcase size={12} className="inline mr-2" />
                    Job Description
                  </label>
                  <textarea
                    rows={9}
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste the target role or job description here."
                    className="w-full mt-2 rounded-xl border p-4 text-sm resize-y"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                      <Globe2 size={12} className="inline mr-2" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedInUrl}
                      onChange={(event) => setLinkedInUrl(event.target.value)}
                      placeholder="https://www.linkedin.com/in/your-profile"
                      className="w-full mt-2 rounded-xl border px-4 py-3 text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                      <Mail size={12} className="inline mr-2" />
                      Email Report
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="w-full mt-2 rounded-xl border px-4 py-3 text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                      Version Label
                    </label>
                    <input
                      type="text"
                      value={versionLabel}
                      onChange={(event) => setVersionLabel(event.target.value)}
                      placeholder="Example: Frontend resume v3"
                      className="w-full mt-2 rounded-xl border px-4 py-3 text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      What CVify returns
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-2"><Target size={15} /> ATS score breakdown</div>
                      <div className="flex items-center gap-2"><CheckCircle2 size={15} /> Matched and missing skills</div>
                      <div className="flex items-center gap-2"><Globe2 size={15} /> LinkedIn consistency notes</div>
                      <div className="flex items-center gap-2"><LineChart size={15} /> Score tracking history</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {pdfFiles.length ? `${pdfFiles.length} PDF file(s) selected for batch analysis.` : 'No PDF selected. CVify will use pasted resume text.'}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  <ScanSearch size={16} />
                  {analyzing ? 'Analyzing...' : 'Run CVify Analysis'}
                </button>
              </div>

              {error && (
                <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#ff174433', background: '#ff174411', color: '#ff7676' }}>
                  {error}
                </div>
              )}
            </div>
          </SectionPanel>

          <SectionPanel title="Saved Sessions" eyebrow="Progress Tracker">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
                    Saved analyses
                  </p>
                  <p className="font-display text-3xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                    {history.length}
                  </p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
                    Compare slots
                  </p>
                  <p className="font-display text-3xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                    {selectedCompareIds.length}
                  </p>
                </div>
              </div>

              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Add an email address to tie analyses together, receive reports, and build a before-and-after score history.
              </p>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {loadingHistory && (
                  <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                    Loading saved sessions...
                  </div>
                )}

                {!loadingHistory && !history.length && (
                  <div className="rounded-xl border px-4 py-8 text-sm text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                    No saved sessions yet for this email.
                  </div>
                )}

                {history.map((session) => {
                  const checked = selectedCompareIds.includes(session.id)
                  return (
                    <label
                      key={session.id}
                      className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer"
                      style={{
                        borderColor: checked ? '#ff4d0033' : 'var(--border)',
                        background: checked ? '#ff4d000d' : 'var(--bg-card)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompare(session.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold" style={{ color: 'var(--text)' }}>
                            {session.label}
                          </p>
                          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                            {session.analysis.atsScore}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                          {formatDate(session.createdAt)}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          {session.analysis.executiveSummary}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </SectionPanel>
        </div>

        {latestResult && (
          <>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <SectionPanel title="Current Analysis" eyebrow="ATS Snapshot">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ScoreRing score={latestResult.analysis.atsScore} />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>
                        {latestResult.analysis.meta.versionLabel}
                      </p>
                      <h3 className="font-display text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                        {latestResult.analysis.executiveSummary}
                      </h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>Matched</p>
                        <p className="font-display text-2xl font-bold mt-2" style={{ color: 'var(--green)' }}>
                          {latestResult.analysis.matchedSkills.length}
                        </p>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>Missing</p>
                        <p className="font-display text-2xl font-bold mt-2" style={{ color: '#ff7676' }}>
                          {latestResult.analysis.missingSkills.length}
                        </p>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>Tracked</p>
                        <p className="font-display text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                          {history.length || batchResults.length}
                        </p>
                      </div>
                    </div>
                    {latestResult.emailReport && (
                      <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        {latestResult.emailReport.simulated
                          ? 'Email report prepared in simulated mode. Add SMTP settings to send it for real.'
                          : 'Email report sent successfully.'}
                      </div>
                    )}
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Score Breakdown" eyebrow="Explained">
                <BreakdownList
                  breakdown={latestResult.analysis.scoreBreakdown}
                  explanations={latestResult.analysis.scoreExplanations}
                />
              </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionPanel title="JD Skill Match" eyebrow="Keywords">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Matched skills</p>
                    <TagList
                      items={latestResult.analysis.matchedSkills}
                      tone="success"
                      emptyLabel="No matched skills detected yet. Tighten the resume to mirror the job description language."
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Missing keywords</p>
                    <TagList
                      items={latestResult.analysis.missingSkills}
                      tone="warning"
                      emptyLabel="No obvious missing skills detected from the pasted job description."
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Keyword suggestions</p>
                    <TagList
                      items={latestResult.analysis.keywordSuggestions}
                      tone="accent"
                      emptyLabel="Keyword suggestions will appear here after analysis."
                    />
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="LinkedIn Consistency" eyebrow="Profile Check">
                <div className="space-y-4">
                  <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>
                          {latestResult.analysis.linkedinProfile?.displayName || 'No LinkedIn profile'}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                          {latestResult.analysis.linkedinProfile?.headline || 'Provide a LinkedIn URL to compare profile positioning.'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                        {latestResult.analysis.linkedinConsistency.consistencyScore}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Strengths</p>
                    <TagList
                      items={latestResult.analysis.linkedinConsistency.strengths}
                      tone="success"
                      emptyLabel="No overlap signals yet. CVify will highlight LinkedIn-to-resume alignment here."
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Gaps</p>
                    <TagList
                      items={latestResult.analysis.linkedinConsistency.gaps}
                      tone="warning"
                      emptyLabel="No LinkedIn inconsistencies detected."
                    />
                  </div>
                </div>
              </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <SectionPanel title="Improvement Plan" eyebrow="Suggestions">
                <div className="space-y-3">
                  {latestResult.analysis.improvementSuggestions.map((item) => (
                    <div key={item} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                      <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Resume Rewrites" eyebrow="Before and After">
                <div className="space-y-4">
                  {latestResult.analysis.rewriteSuggestions.map((item, index) => (
                    <div key={`${item.before}-${index}`} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
                        Before
                      </p>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{item.before}</p>
                      <p className="text-xs uppercase tracking-[0.2em] mt-4" style={{ color: 'var(--text-dim)' }}>
                        After
                      </p>
                      <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>{item.after}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionPanel title="Before and After Tracker" eyebrow="Progress History">
                <HistoryChart sessions={history} />
              </SectionPanel>

              <SectionPanel title="Structured JSON Output" eyebrow="Analysis Payload">
                <div className="rounded-xl border p-4 overflow-auto" style={{ borderColor: 'var(--border)', background: '#090909' }}>
                  <pre className="text-xs leading-6 whitespace-pre-wrap" style={{ color: '#d6d6d6' }}>
                    {JSON.stringify(latestResult.analysis.structuredJson, null, 2)}
                  </pre>
                </div>
              </SectionPanel>
            </div>

            <SectionPanel title="Version Comparison" eyebrow="Multiple Resume Views">
              <ComparisonTable items={comparisonSource} />
            </SectionPanel>
          </>
        )}
      </div>
    </main>
  )
}
