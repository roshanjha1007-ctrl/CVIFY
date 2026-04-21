import { Buffer } from 'node:buffer'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import { analyzeResume, INTERNAL_VERSION_LABEL } from '@/lib/analysis'
import { sendAnalysisEmail } from '@/lib/email'
import AnalysisSession from '@/models/AnalysisSession'

export const dynamic = 'force-dynamic'

async function parsePdf(file) {
  const module = await import('pdf-parse')
  const pdfParse = module.default || module
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfParse(Buffer.from(arrayBuffer))
  return pdf.text || ''
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const resumeTextInput = String(formData.get('resumeText') || '')
    const jobDescription = String(formData.get('jobDescription') || '')
    const linkedInUrl = String(formData.get('linkedInUrl') || '')
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const file = formData.get('resumeFile')

    let resumeText = resumeTextInput.trim()
    let resumeName = 'Resume Upload'
    let sourceType = 'text'

    if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF resume uploads are supported.' }, { status: 400 })
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'PDF is too large. Keep it under 5MB.' }, { status: 400 })
      }

      resumeText = (await parsePdf(file)).trim()
      resumeName = file.name || 'Resume Upload'
      sourceType = 'pdf'
    }

    if (!resumeText || !jobDescription.trim()) {
      return NextResponse.json(
        {
          error: 'Missing input',
          message: 'Resume or Job Description not provided',
        },
        { status: 400 }
      )
    }

    if (!resumeText || resumeText.length < 80) {
      return NextResponse.json(
        { error: 'Resume text is too short after parsing. Upload a fuller resume PDF or paste more content.' },
        { status: 400 }
      )
    }

    const analysis = await analyzeResume({
      resumeText,
      jobDescription: jobDescription.trim(),
      linkedInUrl,
      resumeName,
    })

    const { internal, ...publicAnalysis } = analysis

    const sessionId = uuidv4().replace(/-/g, '').slice(0, 16)
    let emailReport = null

    if (email) {
      emailReport = await sendAnalysisEmail({
        to: email,
        analysis: publicAnalysis,
        sessionId,
      })
    }

    let savedRecord = null
    let history = []

    try {
      await connectDB()

      savedRecord = await AnalysisSession.create({
        session_id: sessionId,
        email,
        version_label: internal?.versionLabel || INTERNAL_VERSION_LABEL,
        resume_name: resumeName,
        source_type: sourceType,
        resume_text: resumeText,
        job_description: jobDescription.trim(),
        linkedin_url: linkedInUrl,
        linkedin_profile: null,
        analysis_json: publicAnalysis,
        email_report: emailReport,
      })

      history = email
        ? await AnalysisSession.find(
            { email },
            {
              _id: 0,
              session_id: 1,
              version_label: 1,
              resume_name: 1,
              email: 1,
              created_at: 1,
              analysis_json: 1,
            }
          )
            .sort({ created_at: -1 })
            .limit(12)
            .lean()
        : []
    } catch (databaseError) {
      console.warn('Analysis saved without database persistence:', databaseError.message)
    }

    return NextResponse.json({
      session: {
        sessionId,
        createdAt: savedRecord?.created_at || new Date().toISOString(),
        emailReport,
        persisted: Boolean(savedRecord),
      },
      analysis: publicAnalysis,
      history,
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
