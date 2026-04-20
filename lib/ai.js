const SYSTEM_PROMPT = `You are an ATS + hiring manager.
Return ONLY JSON:
{score, verdict, issues[5], fixes[5], rewrites[3]}
Rules: concise, measurable impact, no fluff.`

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
]

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
      "Before: 'Responsible for managing database' | After: 'Designed and maintained PostgreSQL schema for 50K+ user records, reducing query latency by 35%'",
      "Before: 'Worked on frontend features' | After: 'Built 12 React components used across 4 product surfaces, cutting dev time by 2 days per sprint'",
      "Before: 'Good communication skills' | After: 'Led weekly cross-functional syncs between design and engineering, shipping 3 features on time'"
    ]
  }
}

function extractJsonPayload(raw) {
  if (typeof raw !== 'string') {
    throw new Error('AI response was not text')
  }

  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI returned invalid JSON')
  }

  return jsonMatch[0]
}

function normalizeList(value, limit) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
    .slice(0, limit)
}

function normalizeRoastResult(payload) {
  const score = Number(payload?.score)

  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    verdict:
      typeof payload?.verdict === 'string' && payload.verdict.trim()
        ? payload.verdict.trim()
        : 'Your resume needs sharper evidence, clearer positioning, and stronger bullets.',
    issues: normalizeList(payload?.issues, 5),
    fixes: normalizeList(payload?.fixes, 5),
    rewrites: normalizeList(payload?.rewrites, 3),
  }
}

function parseRoastResult(raw) {
  const parsed = JSON.parse(extractJsonPayload(raw))
  return normalizeRoastResult(parsed)
}

async function roastWithGemini(resumeText, brutal) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

  const modeNote = brutal
    ? ' Be brutally honest. No sugar-coating. Call out every weakness directly.'
    : ' Be constructive but direct.'

  const prompt = `${SYSTEM_PROMPT}${modeNote}\n\nResume:\n${resumeText}`
  let lastError

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      })

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return parseRoastResult(text)
    } catch (error) {
      lastError = error
      console.warn(`Gemini model "${modelName}" failed:`, error.message)
    }
  }

  throw new Error(lastError?.message || 'Gemini request failed')
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

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('OpenAI returned an empty response')
  }

  return parseRoastResult(text)
}

export async function roastResume(resumeText, brutal = false) {
  const providerErrors = []

  if (process.env.GEMINI_API_KEY) {
    try {
      return await roastWithGemini(resumeText, brutal)
    } catch (error) {
      providerErrors.push(`Gemini: ${error.message}`)
      console.error('Gemini roast failed:', error)
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await roastWithOpenAI(resumeText, brutal)
    } catch (error) {
      providerErrors.push(`OpenAI: ${error.message}`)
      console.error('OpenAI roast failed:', error)
    }
  }

  if (providerErrors.length > 0) {
    console.warn('Falling back to mock roast result:', providerErrors.join(' | '))
  } else {
    console.log('No AI API key found. Using mock response.')
  }

  return getMockResult(brutal)
}
