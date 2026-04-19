const SYSTEM_PROMPT = `You are an ATS + hiring manager.
Return ONLY JSON:
{score, verdict, issues[5], fixes[5], rewrites[3]}
Rules: concise, measurable impact, no fluff.`

function getMockResult(brutal = false) {
  return {
    score: brutal ? 34 : 52,
    verdict: brutal
      ? "This resume would get deleted before a human even sees it."
      : "Decent foundation, but missing the details that get callbacks.",
    issues: [
      "No quantifiable achievements — just duties, not impact",
      "Skills section is a buzzword graveyard with no context",
      "Summary reads like a template from 2012",
      "Job titles don't match industry-standard ATS keywords",
      "No links to work, GitHub, or portfolio"
    ],
    fixes: [
      "Add numbers: 'Improved load time by 40%' beats 'Optimized performance'",
      "Replace 'hardworking team player' with actual delivered outcomes",
      "Move skills inline with experience, not in a separate blob",
      "Use exact job title keywords from target postings",
      "Add GitHub/portfolio link above the fold"
    ],
    rewrites: [
      "❌ 'Responsible for managing database' → ✅ 'Designed and maintained PostgreSQL schema for 50K+ user records, reducing query latency by 35%'",
      "❌ 'Worked on frontend features' → ✅ 'Built 12 React components used across 4 product surfaces, cutting dev time by 2 days per sprint'",
      "❌ 'Good communication skills' → ✅ 'Led weekly cross-functional syncs between design and engineering, shipping 3 features on time'"
    ]
  }
}

async function roastWithGemini(resumeText, brutal) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const modeNote = brutal
    ? ' Be brutally honest. No sugar-coating. Call out every weakness directly.'
    : ' Be constructive but direct.'

  const prompt = `${SYSTEM_PROMPT}${modeNote}\n\nResume:\n${resumeText}`
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid AI response')
  return JSON.parse(jsonMatch[0])
}

async function roastWithOpenAI(resumeText, brutal) {
  const modeNote = brutal
    ? ' Be brutally honest. No sugar-coating.'
    : ' Be constructive but direct.'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + modeNote },
        { role: 'user', content: `Resume:\n${resumeText}` },
      ],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const text = data.choices[0].message.content
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid AI response')
  return JSON.parse(jsonMatch[0])
}

export async function roastResume(resumeText, brutal = false) {
  // Try Gemini first, then OpenAI, then mock
  if (process.env.GEMINI_API_KEY) {
    return await roastWithGemini(resumeText, brutal)
  }

  if (process.env.OPENAI_API_KEY) {
    return await roastWithOpenAI(resumeText, brutal)
  }

  // Mock mode — no API key needed
  console.log('⚠️  No AI API key found. Using mock response.')
  return getMockResult(brutal)
}
