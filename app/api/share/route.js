import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import Roast from '@/models/Roast'

export async function POST(request) {
  try {
    const { resumeText, result, brutal } = await request.json()

    if (!resumeText || !result) {
      return NextResponse.json(
        { error: 'Missing resume text or result.' },
        { status: 400 }
      )
    }

    await connectDB()

    const id = uuidv4().split('-')[0] + uuidv4().split('-')[1] // short-ish unique id

    const roast = new Roast({
      id,
      resume_text: resumeText,
      result_json: result,
      brutal_mode: brutal || false,
    })

    await roast.save()

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Could not save result. Check your MongoDB connection.' },
      { status: 500 }
    )
  }
}
