import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Roast from '@/models/Roast'

export async function GET(request, { params }) {
  try {
    const { id } = params

    await connectDB()

    const roast = await Roast.findOne({ id })

    if (!roast) {
      return NextResponse.json(
        { error: 'Roast not found. Link may have expired.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      result: roast.result_json,
      brutal: roast.brutal_mode,
      created_at: roast.created_at,
    })
  } catch (error) {
    console.error('Get roast error:', error)
    return NextResponse.json(
      { error: 'Could not fetch result.' },
      { status: 500 }
    )
  }
}
