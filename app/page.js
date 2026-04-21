'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileText, ScanSearch, Upload } from 'lucide-react'

const DRAFT_STORAGE_KEY = 'cvify:analysis-draft'
const RESULT_STORAGE_KEY = 'cvify:last-analysis'

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

  async function handleAnalyze() {
    if (!resumeFile && resumeText.trim().length < 80) {
      setError('Upload a PDF resume or paste at least 80 characters of resume text.')
      return
    }

    if (jobDescription.trim().length < 40) {
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
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Upload a resume, paste a role, and get a real ATS score.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                CVify extracts PDF text, matches job keywords with exact, fuzzy, and semantic checks, and returns a clean
                hiring-style breakdown with suggestions you can act on immediately.
              </p>
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
                  Upload a PDF resume for extraction, or use pasted text as a fallback. LinkedIn is optional and will not
                  block analysis.
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
                      Upload one PDF up to 5MB. The analyzer extracts text on the backend before scoring.
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
