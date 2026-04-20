import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AnalysisSession from '@/models/AnalysisSession'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get('email') || '').trim().toLowerCase()
    const limit = Math.min(Number(searchParams.get('limit') || 12), 25)

    if (!email) {
      return NextResponse.json({ sessions: [] })
    }

    await connectDB()

    const sessions = await AnalysisSession.find(
      { email },
      {
        _id: 0,
        session_id: 1,
        version_label: 1,
        resume_name: 1,
        email: 1,
        created_at: 1,
        analysis_json: 1,
        linkedin_profile: 1,
      }
    )
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { error: 'Could not load saved analysis sessions.' },
      { status: 500 }
    )
  }
}
