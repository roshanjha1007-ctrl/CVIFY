'use client'

import Image from 'next/image'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eraser, FileText, ScanSearch, Sparkles, Upload } from 'lucide-react'

const DRAFT_STORAGE_KEY = 'cvify:analysis-draft'
const RESULT_STORAGE_KEY = 'cvify:last-analysis'
const MIN_RESUME_TEXT_LENGTH = 80
const MIN_JOB_DESCRIPTION_LENGTH = 40
const DEMO_DRAFT = {
  resumeText: `PRIYA SHARMA
Product Designer | Bangalore, India | priya.sharma@example.com | https://www.linkedin.com/in/priyasharma

SUMMARY
Product designer with 4+ years of experience designing SaaS workflows, design systems, and growth experiments for B2B products. Strong partner to product managers and engineers, with a track record of improving activation, task completion, and retention.

EXPERIENCE
Senior Product Designer | OrbitStack | 2023-Present
- Redesigned onboarding for a workflow automation platform, improving activation by 18%.
- Built a reusable component library in Figma that reduced design handoff time by 30%.
- Ran usability tests and converted findings into prioritized product recommendations.

Product Designer | LaunchPilot | 2021-2023
- Led UX for analytics dashboards used by 8,000+ monthly users.
- Partnered with engineering to ship responsive flows across desktop and mobile.
- Collaborated with marketing on landing page experiments that improved trial conversions by 12%.

SKILLS
Figma, design systems, user research, wireframing, prototyping, usability testing, stakeholder communication, analytics`,
  jobDescription: `Senior Product Designer

We are hiring a Senior Product Designer to lead end-to-end design for our B2B SaaS platform. You will work closely with product managers and engineers to shape onboarding, analytics dashboards, and collaboration workflows.

Requirements:
- 3+ years of product design experience in SaaS
- Strong design systems and prototyping skills
- Experience running user research and usability testing
- Ability to collaborate cross-functionally with product, engineering, and growth teams
- Familiarity with analytics-driven experimentation and conversion optimization`,
  linkedInUrl: 'https://www.linkedin.com/in/priyasharma',
}

function getCompletionState(value, minLength) {
  const safeLength = value.trim().length

  if (!safeLength) {
    return {
      label: 'Missing',
      tone: 'muted',
      detail: `${minLength}+ chars`,
    }
  }

  if (safeLength < minLength) {
    return {
      label: 'Needs more detail',
      tone: 'warning',
      detail: `${safeLength}/${minLength} chars`,
    }
  }

  return {
    label: 'Ready',
    tone: 'success',
    detail: `${safeLength} chars`,
  }
}

export default function HomePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (!savedDraft) return
      const parsed = JSON.parse(savedDraft)
      setResumeText(String(parsed.resumeText || ''))
      setJobDescription(String(parsed.jobDescription || ''))
      setLinkedInUrl(String(parsed.linkedInUrl || ''))
    } catch {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const payload = JSON.stringify({
      resumeText,
      jobDescription,
      linkedInUrl,
    })

    sessionStorage.setItem(DRAFT_STORAGE_KEY, payload)
  }, [resumeText, jobDescription, linkedInUrl])

  const resumeState = getCompletionState(resumeText, MIN_RESUME_TEXT_LENGTH)
  const jobState = getCompletionState(jobDescription, MIN_JOB_DESCRIPTION_LENGTH)
  const linkedInState = linkedInUrl.trim()
    ? { label: 'Added', tone: 'success', detail: 'Link added' }
    : { label: 'Optional', tone: 'muted', detail: 'Skip if needed' }
  const resumeBulletCount = resumeText
    .split('\n')
    .filter((line) => line.trim().startsWith('-')).length
  const requiredSkillCount = jobDescription
    .split('\n')
    .filter((line) => line.trim().startsWith('-')).length

  function handleLoadDemo() {
    setResumeFile(null)
    setResumeText(DEMO_DRAFT.resumeText)
    setJobDescription(DEMO_DRAFT.jobDescription)
    setLinkedInUrl(DEMO_DRAFT.linkedInUrl)
    setError('')
  }

  function handleClearDraft() {
    setResumeFile(null)
    setResumeText('')
    setJobDescription('')
    setLinkedInUrl('')
    setError('')
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
  }

  async function handleAnalyze() {
    if (!resumeFile && resumeText.trim().length < MIN_RESUME_TEXT_LENGTH) {
      setError('Upload a PDF resume or paste at least 80 characters of resume text.')
      return
    }

    if (jobDescription.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
      setError('Paste a fuller job description so the ATS analysis has enough context.')
      return
    }

    setError('')
    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('jobDescription', jobDescription)
      formData.append('linkedInUrl', linkedInUrl)

      if (resumeFile) {
        formData.append('resumeFile', resumeFile)
      } else {
        formData.append('resumeText', resumeText)
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to analyze the resume right now.')
      }

      sessionStorage.setItem(
        RESULT_STORAGE_KEY,
        JSON.stringify({
          input: {
            jobDescription,
            linkedInUrl,
            resumeFileName: resumeFile?.name || '',
            usedPastedResume: !resumeFile,
          },
          session: data.session,
          analysis: data.analysis,
        })
      )

      startTransition(() => {
        router.push('/results')
      })
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] subtle-chip">
              <ScanSearch size={14} />
              ATS Resume Analyzer
            </div>
            <div className="relative space-y-4 overflow-hidden">
              <div className="pointer-events-none absolute -left-3 -top-5 hidden rounded-[28px] border border-white/6 bg-white/[0.02] p-3 opacity-70 blur-[0.2px] sm:block">
                <Image
                  src="/cvify-mark.svg"
                  alt="CVify logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 opacity-80"
                />
              </div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Upload a resume, paste a role, and get a real ATS score.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Fast ATS match insights.
              </p>
            </div>

            <div className="dashboard-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-lg">
                  <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Demo Mode</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Make the app feel alive in one click</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try the sample flow.
                  </p>
                </div>
                <Sparkles className="shrink-0 text-[var(--accent)]" size={20} />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleLoadDemo} className="secondary-button justify-center">
                  <Sparkles size={16} />
                  <span>Load Demo Content</span>
                </button>
                <button type="button" onClick={handleClearDraft} className="ghost-button justify-center">
                  <Eraser size={16} />
                  <span>Clear Draft</span>
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className={`status-card status-card-${resumeState.tone}`}>
                  <p className="text-xs uppercase tracking-[0.22em]">Resume</p>
                  <p className="mt-2 text-sm font-semibold">{resumeState.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{resumeState.detail}</p>
                </div>
                <div className={`status-card status-card-${jobState.tone}`}>
                  <p className="text-xs uppercase tracking-[0.22em]">Job Description</p>
                  <p className="mt-2 text-sm font-semibold">{jobState.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{jobState.detail}</p>
                </div>
                <div className={`status-card status-card-${linkedInState.tone}`}>
                  <p className="text-xs uppercase tracking-[0.22em]">LinkedIn</p>
                  <p className="mt-2 text-sm font-semibold">{linkedInState.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{linkedInState.detail}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="dashboard-card p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Scoring Mix</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Keyword match: 40%</p>
                  <p>Semantic similarity: 30%</p>
                  <p>Structure: 15%</p>
                  <p>Clarity: 15%</p>
                </div>
              </div>
              <div className="dashboard-card p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Output</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>ATS score snapshot</p>
                  <p>Matched and missing skills</p>
                  <p>Improvement suggestions</p>
                  <p>Structured JSON result</p>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-dim-foreground">Home</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Analyze Resume</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload resume and job.
                </p>
              </div>

              <label className="upload-zone block cursor-pointer rounded-3xl border border-dashed p-5 transition">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[var(--accent-dim)] p-3 text-[var(--accent)]">
                    <Upload size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Resume PDF</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      One PDF, max 5MB.
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="mt-4 block w-full text-sm text-muted-foreground"
                      onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    />
                    {resumeFile && <p className="mt-3 text-sm text-[var(--accent)]">{resumeFile.name}</p>}
                  </div>
                </div>
              </label>

              <div>
                <label className="field-label">Resume Text Fallback</label>
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-dim-foreground">
                  <span>Paste instead of PDF.</span>
                  <span>{resumeText.trim().length} chars</span>
                </div>
                <textarea
                  rows={7}
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste resume text here if you do not want to upload a PDF."
                  className="app-textarea"
                />
              </div>

              <div>
                <label className="field-label">Job Description</label>
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-dim-foreground">
                  <span>Paste target job details.</span>
                  <span>{jobDescription.trim().length} chars</span>
                </div>
                <textarea
                  rows={9}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the target role, responsibilities, and requirements."
                  className="app-textarea"
                />
              </div>

              <div>
                <label className="field-label">LinkedIn URL Optional</label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim-foreground" size={16} />
                  <input
                    type="url"
                    value={linkedInUrl}
                    onChange={(event) => setLinkedInUrl(event.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    className="app-input pl-11"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-dim-foreground">Input Readiness</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ready to analyze.
                    </p>
                  </div>
                  <ScanSearch className="text-[var(--accent)]" size={18} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="readiness-tile">
                    <p className="text-xs uppercase tracking-[0.2em] text-dim-foreground">Resume Bullets</p>
                    <p className="mt-2 text-2xl font-semibold">{resumeBulletCount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Bullet lines found.</p>
                  </div>
                  <div className="readiness-tile">
                    <p className="text-xs uppercase tracking-[0.2em] text-dim-foreground">Role Requirements</p>
                    <p className="mt-2 text-2xl font-semibold">{requiredSkillCount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Requirements bullets found.</p>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-2xl border border-[rgba(255,23,68,0.28)] bg-[rgba(255,23,68,0.09)] px-4 py-3 text-sm text-[#ff8ba2]">{error}</div>}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isPending}
                className="primary-button w-full justify-center"
              >
                <span>{isAnalyzing ? 'Analyzing Resume...' : 'Analyze Resume'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
