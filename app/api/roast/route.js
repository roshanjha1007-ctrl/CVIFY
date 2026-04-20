import { NextResponse } from 'next/server'
import { roastResume } from '@/lib/ai'

export async function POST(request) {
  try {
    const { resumeText, brutal } = await request.json()

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Resume text is too short. Paste at least 50 characters.' },
        { status: 400 }
      )
    }

    if (resumeText.length > 10000) {
      return NextResponse.json(
        { error: 'Resume too long. Keep it under 10,000 characters.' },
        { status: 400 }
      )
    }

    const result = await roastResume(resumeText.trim(), brutal || false)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Roast API error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}