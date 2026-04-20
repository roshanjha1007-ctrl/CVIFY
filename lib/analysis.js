const ATS_KEYWORDS = [
  'react',
  'next.js',
  'javascript',
  'typescript',
  'node.js',
  'express',
  'python',
  'java',
  'sql',
  'postgresql',
  'mongodb',
  'aws',
  'docker',
  'kubernetes',
  'graphql',
  'rest api',
  'microservices',
  'agile',
  'scrum',
  'ci/cd',
  'git',
  'testing',
  'jest',
  'cypress',
  'playwright',
  'figma',
  'leadership',
  'communication',
  'stakeholder management',
  'project management',
  'data analysis',
  'product strategy',
  'seo',
  'content strategy',
  'machine learning',
  'artificial intelligence',
  'llm',
]

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[^\w\s./+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1))
    .join(' ')
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))]
}

function extractKeywords(text = '') {
  const normalized = normalizeText(text)
  return ATS_KEYWORDS.filter((keyword) => normalized.includes(keyword))
}

function extractSectionSignals(text = '') {
  const normalized = normalizeText(text)
  return {
    summary: /\b(summary|profile|about)\b/.test(normalized),
    experience: /\b(experience|employment|work history)\b/.test(normalized),
    skills: /\b(skills|tech stack|core competencies)\b/.test(normalized),
    education: /\b(education|university|degree)\b/.test(normalized),
    projects: /\b(projects|portfolio|case study)\b/.test(normalized),
    certifications: /\b(certifications|certificate|licenses)\b/.test(normalized),
  }
}

function extractQuantifiedImpact(text = '') {
  const matches = text.match(/\b\d+(\.\d+)?%|\b\d+(\.\d+)?\s?(k|m|b|x|users|customers|clients|days|months|years)\b/gi)
  return matches ? matches.length : 0
}

function extractBullets(text = '') {
  return (text.match(/^[\s]*[-*•]/gm) || []).length
}

function extractContactSignals(text = '') {
  return {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    phone: /(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(text),
    links: /(github\.com|linkedin\.com|portfolio|https?:\/\/)/i.test(text),
  }
}

export function simulateLinkedInProfile(linkedInUrl = '') {
  if (!linkedInUrl) return null

  try {
    const url = new URL(linkedInUrl)
    const path = url.pathname.replace(/^\/+|\/+$/g, '')
    const slug = path.split('/').filter(Boolean).pop() || ''
    const slugTokens = slug.split('-').filter(Boolean)
    const nameTokens = slugTokens.filter((token) => !['in', 'www', 'linkedin', 'com'].includes(token)).slice(0, 2)
    const roleTokens = slugTokens.slice(2)

    return {
      url: linkedInUrl,
      handle: slug || 'linkedin-profile',
      displayName: nameTokens.length ? titleCase(nameTokens.join(' ')) : 'LinkedIn Candidate',
      headline: roleTokens.length ? titleCase(roleTokens.join(' ')) : 'Professional profile data estimated from LinkedIn URL',
      focusKeywords: uniqueStrings(roleTokens.map((token) => token.toLowerCase()).filter((token) => token.length > 2)).slice(0, 6),
      confidence: roleTokens.length ? 'medium' : 'low',
      simulated: true,
    }
  } catch {
    return {
      url: linkedInUrl,
      handle: linkedInUrl,
      displayName: 'LinkedIn Candidate',
      headline: 'Professional profile data estimated from LinkedIn URL',
      focusKeywords: [],
      confidence: 'low',
      simulated: true,
    }
  }
}

function getLinkedInConsistency(resumeText, linkedInProfile) {
  if (!linkedInProfile) {
    return {
      consistencyScore: 50,
      strengths: [],
      gaps: ['No LinkedIn profile was provided, so cross-profile consistency could not be checked.'],
    }
  }

  const normalizedResume = normalizeText(resumeText)
  const matched = linkedInProfile.focusKeywords.filter((keyword) => normalizedResume.includes(keyword))
  const missing = linkedInProfile.focusKeywords.filter((keyword) => !normalizedResume.includes(keyword))
  const nameAppears = linkedInProfile.displayName !== 'LinkedIn Candidate'
    ? normalizedResume.includes(normalizeText(linkedInProfile.displayName))
    : false

  let score = 60
  if (linkedInProfile.focusKeywords.length > 0) {
    score += Math.round((matched.length / linkedInProfile.focusKeywords.length) * 30)
  }
  if (nameAppears) score += 10

  return {
    consistencyScore: Math.max(0, Math.min(100, score)),
    strengths: matched.map((keyword) => `LinkedIn focus area "${keyword}" also appears in the resume.`),
    gaps: [
      ...(!nameAppears && linkedInProfile.displayName !== 'LinkedIn Candidate'
        ? [`The resume does not clearly surface the LinkedIn profile name "${linkedInProfile.displayName}".`]
        : []),
      ...missing.map((keyword) => `LinkedIn suggests emphasis on "${keyword}", but that term is missing from the resume.`),
    ],
  }
}

function scoreResume({ resumeText, jobDescription, linkedInProfile }) {
  const resumeKeywords = extractKeywords(resumeText)
  const jdKeywords = extractKeywords(jobDescription)
  const matchedSkills = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword))
  const missingSkills = jdKeywords.filter((keyword) => !resumeKeywords.includes(keyword))
  const sectionSignals = extractSectionSignals(resumeText)
  const quantifiedImpactCount = extractQuantifiedImpact(resumeText)
  const bullets = extractBullets(resumeText)
  const contactSignals = extractContactSignals(resumeText)
  const linkedInCheck = getLinkedInConsistency(resumeText, linkedInProfile)

  const sectionScore = Math.round((Object.values(sectionSignals).filter(Boolean).length / Object.keys(sectionSignals).length) * 100)
  const keywordScore = jdKeywords.length
    ? Math.round((matchedSkills.length / jdKeywords.length) * 100)
    : Math.min(100, 55 + resumeKeywords.length * 5)
  const impactScore = Math.min(100, quantifiedImpactCount * 22)
  const structureScore = Math.min(
    100,
    (contactSignals.email ? 25 : 0) +
      (contactSignals.phone ? 20 : 0) +
      (contactSignals.links ? 20 : 0) +
      Math.min(20, bullets * 2) +
      (sectionSignals.experience ? 15 : 0)
  )

  const scoreBreakdown = {
    keywordMatch: keywordScore,
    sectionCompleteness: sectionScore,
    quantifiedImpact: impactScore,
    structureReadability: structureScore,
    linkedinConsistency: linkedInCheck.consistencyScore,
  }

  const atsScore = Math.round(
    scoreBreakdown.keywordMatch * 0.4 +
      scoreBreakdown.sectionCompleteness * 0.2 +
      scoreBreakdown.quantifiedImpact * 0.15 +
      scoreBreakdown.structureReadability * 0.15 +
      scoreBreakdown.linkedinConsistency * 0.1
  )

  return {
    atsScore,
    scoreBreakdown,
    matchedSkills,
    missingSkills,
    resumeKeywords,
    jdKeywords,
    sectionSignals,
    quantifiedImpactCount,
    linkedInCheck,
  }
}

function buildSuggestions(scored) {
  const suggestions = []

  if (scored.missingSkills.length > 0) {
    suggestions.push(`Add evidence for missing JD keywords such as ${scored.missingSkills.slice(0, 5).join(', ')}.`)
  }

  if (!scored.sectionSignals.projects) {
    suggestions.push('Add a Projects section or highlight shipped initiatives with measurable outcomes.')
  }

  if (scored.quantifiedImpactCount < 3) {
    suggestions.push('Add more quantified results. Hiring teams scan for metrics such as percentages, revenue impact, or team size.')
  }

  if (scored.scoreBreakdown.structureReadability < 70) {
    suggestions.push('Tighten structure with contact links, consistent headings, and bullet-driven experience entries.')
  }

  if (scored.linkedInCheck.gaps.length > 0) {
    suggestions.push('Align your LinkedIn profile and resume positioning so the same headline and skill themes show up in both places.')
  }

  return uniqueStrings(suggestions).slice(0, 5)
}

function buildRewriteSuggestions(resumeText, missingSkills) {
  const lines = resumeText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length > 24)
    .slice(0, 3)

  return lines.map((line, index) => {
    const extraKeyword = missingSkills[index] || 'role-specific keywords'
    return {
      before: line,
      after: `${line} Added measurable impact, ownership, and ${extraKeyword} context to strengthen ATS relevance.`,
    }
  })
}

async function generateAIEnhancements({ resumeText, jobDescription, linkedInProfile, baseSuggestions, missingSkills }) {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return null
  }

  const prompt = `You are an expert resume strategist.
Return ONLY JSON with this shape:
{
  "executiveSummary": string,
  "rewriteSuggestions": [{"before": string, "after": string}],
  "keywordSuggestions": string[],
  "scoreExplanations": [{"label": string, "explanation": string}]
}

Resume:
${resumeText}

Job Description:
${jobDescription || 'Not provided'}

LinkedIn Profile:
${JSON.stringify(linkedInProfile || {})}

Base suggestions:
${baseSuggestions.join(' | ')}

Missing skills:
${missingSkills.join(', ')}`

  try {
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      })

      const response = await model.generateContent(prompt)
      const text = response.response.text()
      return JSON.parse(text)
    }

    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) return null
      const data = await response.json()
      return JSON.parse(data?.choices?.[0]?.message?.content || '{}')
    }
  } catch (error) {
    console.warn('AI enhancements unavailable:', error.message)
  }

  return null
}

export async function analyzeResume({ resumeText, jobDescription, linkedInUrl, versionLabel, email, resumeName }) {
  const linkedInProfile = simulateLinkedInProfile(linkedInUrl)
  const scored = scoreResume({ resumeText, jobDescription, linkedInProfile })
  const suggestions = buildSuggestions(scored)
  const keywordSuggestions = uniqueStrings([...scored.missingSkills, ...scored.jdKeywords]).slice(0, 8)
  const defaultScoreExplanations = [
    { label: 'Keyword Match', explanation: 'Measures overlap between JD terminology and resume language.' },
    { label: 'Section Completeness', explanation: 'Checks whether the resume includes core ATS-friendly sections.' },
    { label: 'Quantified Impact', explanation: 'Rewards measurable results such as percentages, counts, and scope.' },
    { label: 'Structure Readability', explanation: 'Looks for contact details, links, bullets, and clear organization.' },
    { label: 'LinkedIn Consistency', explanation: 'Checks whether LinkedIn themes align with the resume narrative.' },
  ]

  const aiEnhancements = await generateAIEnhancements({
    resumeText,
    jobDescription,
    linkedInProfile,
    baseSuggestions: suggestions,
    missingSkills: scored.missingSkills,
  })

  const executiveSummary =
    aiEnhancements?.executiveSummary ||
    `CVify found ${scored.matchedSkills.length} matched JD keywords and ${scored.missingSkills.length} missing skills. The resume scores strongest on ${Object.entries(scored.scoreBreakdown).sort((a, b) => b[1] - a[1])[0][0]}.`

  return {
    meta: {
      versionLabel: versionLabel || resumeName || 'Untitled Resume',
      email: email || '',
      resumeName: resumeName || 'Resume Upload',
      analyzedAt: new Date().toISOString(),
    },
    linkedinProfile: linkedInProfile,
    executiveSummary,
    atsScore: scored.atsScore,
    scoreBreakdown: scored.scoreBreakdown,
    matchedSkills: scored.matchedSkills,
    missingSkills: scored.missingSkills,
    keywordSuggestions: uniqueStrings(aiEnhancements?.keywordSuggestions || keywordSuggestions).slice(0, 8),
    improvementSuggestions: uniqueStrings(suggestions).slice(0, 5),
    rewriteSuggestions: (aiEnhancements?.rewriteSuggestions || buildRewriteSuggestions(resumeText, scored.missingSkills)).slice(0, 3),
    sectionCoverage: scored.sectionSignals,
    linkedinConsistency: scored.linkedInCheck,
    scoreExplanations: aiEnhancements?.scoreExplanations || defaultScoreExplanations,
    structuredJson: {
      matchedSkills: scored.matchedSkills,
      missingSkills: scored.missingSkills,
      scoreBreakdown: scored.scoreBreakdown,
      summary: executiveSummary,
    },
  }
}
