const INTERNAL_VERSION_LABEL = 'CVify v1.0'

const STOP_WORDS = new Set([
  'a',
  'about',
  'across',
  'aap',
  'after',
  'all',
  'also',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'by',
  'can',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'nice',
  'job',
  'knowledge',
  'looking',
  'of',
  'on',
  'or',
  'our',
  'role',
  'skills',
  'strong',
  'team',
  'that',
  'the',
  'their',
  'this',
  'toh',
  'to',
  'understand',
  'we',
  'with',
  'work',
  'working',
  'you',
  'your',
])

const CANONICAL_SKILLS = {
  javascript: ['javascript', 'js', 'ecmascript'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  'next.js': ['next.js', 'nextjs', 'next js'],
  'node.js': ['node.js', 'nodejs', 'node js'],
  express: ['express', 'expressjs', 'express.js'],
  python: ['python'],
  java: ['java'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite'],
  mongodb: ['mongodb', 'mongo', 'mongo db'],
  aws: ['aws', 'amazon web services'],
  docker: ['docker', 'containerization', 'containers'],
  kubernetes: ['kubernetes', 'k8s'],
  graphql: ['graphql'],
  'rest api': ['rest api', 'restful api', 'api development'],
  git: ['git', 'github', 'gitlab', 'version control'],
  testing: ['testing', 'unit testing', 'integration testing', 'qa'],
  jest: ['jest'],
  cypress: ['cypress'],
  playwright: ['playwright'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'tailwind', 'tailwindcss', 'sass', 'scss'],
  figma: ['figma'],
  agile: ['agile', 'scrum', 'kanban'],
  communication: ['communication', 'presentation', 'collaboration'],
  leadership: ['leadership', 'mentoring', 'mentorship'],
  developer: ['developer', 'development', 'engineer', 'dev'],
  frontend: ['frontend', 'front-end', 'ui'],
  backend: ['backend', 'back-end', 'server-side'],
  fullstack: ['fullstack', 'full-stack', 'full stack'],
  api: ['api', 'apis', 'service'],
}

const SKILL_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  'next.js': 'Next.js',
  'node.js': 'Node.js',
  express: 'Express',
  python: 'Python',
  java: 'Java',
  sql: 'SQL',
  mongodb: 'MongoDB',
  aws: 'AWS',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  graphql: 'GraphQL',
  'rest api': 'REST APIs',
  git: 'Git',
  testing: 'Testing',
  jest: 'Jest',
  cypress: 'Cypress',
  playwright: 'Playwright',
  html: 'HTML',
  css: 'CSS',
  figma: 'Figma',
  agile: 'Agile',
  communication: 'Communication',
  leadership: 'Leadership',
  developer: 'Software Development',
  frontend: 'Frontend Development',
  backend: 'Backend Development',
  fullstack: 'Full-Stack Development',
  api: 'APIs',
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, safeNumber(value)))
}

function round(value) {
  return Math.round(safeNumber(value))
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[•▪◦]/g, ' ')
    .replace(/[^\w\s./+#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value = '') {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token) && token.length > 1)
}

function sentenceSplit(value = '') {
  return String(value)
    .split(/[\n.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))]
}

function formatSkillLabel(skill = '') {
  const normalized = canonicalizeToken(skill)
  if (SKILL_LABELS[normalized]) return SKILL_LABELS[normalized]

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function canonicalizeToken(token = '') {
  const normalized = normalizeText(token)

  for (const [canonical, variants] of Object.entries(CANONICAL_SKILLS)) {
    if (variants.some((variant) => normalized === normalizeText(variant))) {
      return canonical
    }
  }

  if (normalized.endsWith('ing') && normalized.length > 5) return normalized.slice(0, -3)
  if (normalized.endsWith('ers') && normalized.length > 5) return normalized.slice(0, -1)
  if (normalized.endsWith('s') && normalized.length > 4) return normalized.slice(0, -1)
  return normalized
}

function normalizeTokenSet(value = '') {
  return uniqueStrings(tokenize(value).map(canonicalizeToken))
}

function buildNgrams(tokens = [], size = 2) {
  const results = []
  for (let index = 0; index <= tokens.length - size; index += 1) {
    const gram = tokens.slice(index, index + size)
    if (gram.some((token) => STOP_WORDS.has(token))) continue
    results.push(gram.join(' '))
  }
  return results
}

function splitWords(value = '') {
  return normalizeText(value)
    .split(/[\s./+-]+/)
    .filter(Boolean)
}

function phraseSimilarity(left = '', right = '') {
  const leftWords = new Set(splitWords(left).map(canonicalizeToken))
  const rightWords = new Set(splitWords(right).map(canonicalizeToken))
  if (!leftWords.size || !rightWords.size) return 0

  let overlap = 0
  for (const word of leftWords) {
    if (rightWords.has(word)) overlap += 1
  }

  return overlap / Math.max(leftWords.size, rightWords.size)
}

function cosineSimilarity(leftTokens = [], rightTokens = []) {
  const leftCounts = new Map()
  const rightCounts = new Map()

  for (const token of leftTokens) leftCounts.set(token, (leftCounts.get(token) || 0) + 1)
  for (const token of rightTokens) rightCounts.set(token, (rightCounts.get(token) || 0) + 1)

  const allTokens = new Set([...leftCounts.keys(), ...rightCounts.keys()])
  if (!allTokens.size) return 0

  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (const token of allTokens) {
    const leftValue = leftCounts.get(token) || 0
    const rightValue = rightCounts.get(token) || 0
    dot += leftValue * rightValue
    leftMagnitude += leftValue ** 2
    rightMagnitude += rightValue ** 2
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude)
  return denominator ? dot / denominator : 0
}

function extractKnownSkills(text = '') {
  const normalized = normalizeText(text)
  const matches = []

  for (const [canonical, variants] of Object.entries(CANONICAL_SKILLS)) {
    if (
      variants.some((variant) => {
        const pattern = new RegExp(`(^|\\b)${escapeRegExp(normalizeText(variant))}(\\b|$)`)
        return pattern.test(normalized)
      })
    ) {
      matches.push(canonical)
    }
  }

  return matches
}

function extractCandidatePhrases(text = '', limit = 16) {
  const tokens = tokenize(text).map(canonicalizeToken)
  const phrases = [
    ...buildNgrams(tokens, 3),
    ...buildNgrams(tokens, 2),
    ...tokens.filter((token) => token.length > 2),
  ]

  const counts = new Map()
  for (const phrase of phrases) {
    if (!phrase || STOP_WORDS.has(phrase)) continue
    counts.set(phrase, (counts.get(phrase) || 0) + 1)
  }

  return [...counts.entries()]
    .filter(([phrase]) => phrase.length > 2)
    .sort((left, right) => right[1] - left[1] || left[0].length - right[0].length)
    .slice(0, limit)
    .map(([phrase]) => phrase)
}

function extractJobRequirements(jobDescription = '') {
  const knownSkills = extractKnownSkills(jobDescription)
  const candidatePhrases = extractCandidatePhrases(jobDescription, 18)
  return uniqueStrings([...knownSkills, ...candidatePhrases])
    .filter((item) => splitWords(item).length <= 4)
    .slice(0, 20)
}

function matchRequirement(requirement, resumeText, resumeTokens) {
  const normalizedRequirement = normalizeText(requirement)
  const resumeNormalized = normalizeText(resumeText)
  const requirementTokens = splitWords(requirement).map(canonicalizeToken)

  const exact = requirementTokens.length
    ? requirementTokens.every((token) => resumeTokens.has(token))
    : false

  if (exact || resumeNormalized.includes(normalizedRequirement)) {
    return {
      label: requirement,
      type: 'exact',
      confidence: 1,
    }
  }

  const canonicalVariant = canonicalizeToken(requirement)
  if (canonicalVariant !== normalizedRequirement && resumeTokens.has(canonicalVariant)) {
    return {
      label: requirement,
      type: 'fuzzy',
      confidence: 0.85,
    }
  }

  let bestSimilarity = 0
  for (const token of resumeTokens) {
    bestSimilarity = Math.max(bestSimilarity, phraseSimilarity(requirement, token))
  }

  if (bestSimilarity >= 0.74) {
    return {
      label: requirement,
      type: 'semantic',
      confidence: bestSimilarity,
    }
  }

  return null
}

function extractSectionSignals(resumeText = '') {
  const normalized = normalizeText(resumeText)
  return {
    summary: /\b(summary|profile|objective|about)\b/.test(normalized),
    experience: /\b(experience|employment|work history)\b/.test(normalized),
    skills: /\b(skills|technical skills|core competencies|tech stack)\b/.test(normalized),
    education: /\b(education|university|degree|bachelor|master)\b/.test(normalized),
    projects: /\b(projects|portfolio|case study)\b/.test(normalized),
  }
}

function extractContactSignals(resumeText = '') {
  return {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText),
    phone: /(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(resumeText),
    linkedin: /linkedin\.com/i.test(resumeText),
  }
}

function computeStructureScore(resumeText = '') {
  const sections = extractSectionSignals(resumeText)
  const contacts = extractContactSignals(resumeText)
  const bulletCount = (String(resumeText).match(/^[\s]*[-*•]/gm) || []).length
  const sectionHits = Object.values(sections).filter(Boolean).length

  const score =
    (sectionHits / Object.keys(sections).length) * 60 +
    (contacts.email ? 12 : 0) +
    (contacts.phone ? 8 : 0) +
    (contacts.linkedin ? 5 : 0) +
    Math.min(15, bulletCount * 2)

  return {
    score: clamp(round(score)),
    sections,
    contacts,
    bulletCount,
  }
}

function computeClarityScore(resumeText = '') {
  const sentences = sentenceSplit(resumeText)
  const tokens = tokenize(resumeText)
  const wordCount = tokens.length
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : wordCount
  const quantifiedMatches = String(resumeText).match(/\b\d+(\.\d+)?%|\b\d+(\.\d+)?\s?(k|m|b|x|years|months|users|customers|clients)\b/gi) || []
  const bullets = (String(resumeText).match(/^[\s]*[-*•]/gm) || []).length

  let score = 0
  score += avgSentenceLength > 0 && avgSentenceLength <= 24 ? 35 : avgSentenceLength <= 32 ? 24 : 12
  score += quantifiedMatches.length ? Math.min(30, quantifiedMatches.length * 8) : 0
  score += bullets ? Math.min(20, bullets * 2) : 0
  score += wordCount >= 120 ? 15 : wordCount >= 80 ? 10 : 4

  return {
    score: clamp(round(score)),
    avgSentenceLength: safeNumber(avgSentenceLength),
    quantifiedBulletCount: quantifiedMatches.length,
  }
}

function buildSuggestions({ missingSkills, structureDetails, clarityDetails, semanticScore }) {
  const suggestions = []

  if (missingSkills.length) {
    suggestions.push({
      type: 'high',
      message: `Add proof of ${missingSkills.slice(0, 2).map(formatSkillLabel).join(' and ')} through a project, achievement, or role-specific bullet.`,
    })
  }

  if (!structureDetails.sections.summary) {
    suggestions.push({
      type: 'medium',
      message: 'Add a short summary section that mirrors the target role and highlights your most relevant stack upfront.',
    })
  }

  if (!structureDetails.sections.projects && !structureDetails.sections.experience) {
    suggestions.push({
      type: 'high',
      message: 'Add a dedicated Projects or Experience section so the ATS can detect where you used the required skills.',
    })
  }

  if (clarityDetails.quantifiedBulletCount < 2) {
    suggestions.push({
      type: 'medium',
      message: 'Add measurable outcomes like performance gains, user growth, or delivery speed to make your impact easier to score.',
    })
  }

  if (semanticScore < 55) {
    suggestions.push({
      type: 'low',
      message: 'Rewrite a few bullets using the same language as the job description so your experience reads closer to the target role.',
    })
  }

  const deduped = []
  const seen = new Set()

  for (const suggestion of suggestions) {
    if (!suggestion?.message || seen.has(suggestion.message)) continue
    seen.add(suggestion.message)
    deduped.push(suggestion)
  }

  return deduped.slice(0, 5)
}

function buildSimilarityExplanation({ keywordScore, semanticScore, matchedSkills, missingSkills }) {
  if (!matchedSkills.length && !missingSkills.length) {
    return 'The resume and job description share limited overlapping terminology, so the analyzer could only infer a weak match from general language patterns.'
  }

  const firstSentence =
    keywordScore >= 70
      ? 'The resume aligns well with the role because several required keywords already appear in the document.'
      : 'The resume only partially mirrors the job description, so ATS coverage is currently moderate.'

  const secondSentence = missingSkills.length
    ? `Adding clearer proof for ${missingSkills.slice(0, 3).join(', ')} would improve both keyword and semantic alignment.`
    : `Semantic similarity is ${round(semanticScore)}%, which suggests the resume language is close to the target role.`

  return `${firstSentence} ${secondSentence}`.trim()
}

function buildPremiumSummary({ score, matchedSkills, missingSkills }) {
  const opening =
    matchedSkills.length >= 4
      ? `Your resume is landing in a strong range at ${score}/100 with solid overlap on this role.`
      : `Your resume currently scores ${score}/100, so it has some relevant alignment but still needs sharper targeting.`

  const gap = missingSkills.length
    ? `The biggest gap is ${missingSkills.slice(0, 2).map(formatSkillLabel).join(' and ')}, which are important signals for this job.`
    : 'You already cover most of the high-impact skills, so the next gains will come from clearer positioning and stronger impact bullets.'

  return `${opening} ${gap}`.trim()
}

function estimatePredictedScore({ atsScore, missingSkills, structureDetails, clarityDetails }) {
  let lift = 0
  lift += Math.min(18, missingSkills.length * 4)
  if (!structureDetails.sections.summary) lift += 4
  if (!structureDetails.sections.projects && !structureDetails.sections.experience) lift += 6
  if (clarityDetails.quantifiedBulletCount < 2) lift += 5
  return clamp(atsScore + lift)
}

export async function analyzeResume({
  resumeText = '',
  jobDescription = '',
  linkedInUrl = '',
  resumeName = 'Resume Upload',
} = {}) {
  const safeResumeText = String(resumeText || '').trim()
  const safeJobDescription = String(jobDescription || '').trim()
  const safeLinkedInUrl = String(linkedInUrl || '').trim()

  const jobRequirements = extractJobRequirements(safeJobDescription)
  const resumeTokens = new Set(normalizeTokenSet(safeResumeText))
  const matchedRequirements = []
  const matchDetails = []

  for (const requirement of jobRequirements) {
    const matched = matchRequirement(requirement, safeResumeText, resumeTokens)
    if (matched) {
      matchedRequirements.push(requirement)
      matchDetails.push(matched)
    }
  }

  const missingSkills = jobRequirements.filter((requirement) => !matchedRequirements.includes(requirement))
  const exactMatches = matchDetails.filter((item) => item.type === 'exact').length
  const fuzzyMatches = matchDetails.filter((item) => item.type === 'fuzzy').length
  const semanticMatches = matchDetails.filter((item) => item.type === 'semantic').length
  const keywordCoverage = jobRequirements.length ? matchedRequirements.length / jobRequirements.length : 0

  const weightedMatchCoverage = jobRequirements.length
    ? (exactMatches + fuzzyMatches * 0.9 + semanticMatches * 0.75) / jobRequirements.length
    : 0

  const resumeSemanticTokens = tokenize(safeResumeText).map(canonicalizeToken)
  const jobSemanticTokens = tokenize(safeJobDescription).map(canonicalizeToken)
  const semanticSimilarity = cosineSimilarity(resumeSemanticTokens, jobSemanticTokens)
  const semanticScore = clamp(round((weightedMatchCoverage * 0.45 + semanticSimilarity * 0.55) * 100))

  const structureDetails = computeStructureScore(safeResumeText)
  const clarityDetails = computeClarityScore(safeResumeText)
  const keywordScore = clamp(round(keywordCoverage * 100))

  const scoreBreakdown = {
    keywordMatch: keywordScore,
    semanticSimilarity: semanticScore,
    structure: structureDetails.score,
    clarity: clarityDetails.score,
  }

  const atsScore = clamp(
    round(
      scoreBreakdown.keywordMatch * 0.4 +
        scoreBreakdown.semanticSimilarity * 0.3 +
        scoreBreakdown.structure * 0.15 +
        scoreBreakdown.clarity * 0.15
    )
  )

  const suggestions = buildSuggestions({
    missingSkills,
    structureDetails,
    clarityDetails,
    semanticScore,
  })

  const similarityExplanation = buildSimilarityExplanation({
    keywordScore,
    semanticScore,
    matchedSkills: matchedRequirements,
    missingSkills,
  })

  const formattedMatchedSkills = uniqueStrings(matchedRequirements.map(formatSkillLabel))
  const formattedMissingSkills = uniqueStrings(missingSkills.map(formatSkillLabel)).slice(0, 5)
  const summary = buildPremiumSummary({
    score: atsScore,
    matchedSkills: formattedMatchedSkills,
    missingSkills: formattedMissingSkills,
  })
  const predictedScoreIfImproved = estimatePredictedScore({
    atsScore,
    missingSkills: formattedMissingSkills,
    structureDetails,
    clarityDetails,
  })

  return {
    meta: {
      analyzedAt: new Date().toISOString(),
      resumeName,
      source: 'cvify-ats-analyzer',
    },
    atsScore,
    scoreBreakdown,
    matchedSkills: formattedMatchedSkills,
    missingSkills: formattedMissingSkills,
    improvementSuggestions: suggestions,
    similarityExplanation,
    matchDetails,
    structureDetails: {
      sections: structureDetails.sections,
      contacts: {
        email: structureDetails.contacts.email,
        phone: structureDetails.contacts.phone,
        linkedin: structureDetails.contacts.linkedin,
        linkedInUrlProvided: Boolean(safeLinkedInUrl),
      },
      bulletCount: safeNumber(structureDetails.bulletCount),
    },
    clarityDetails: {
      avgSentenceLength: round(clarityDetails.avgSentenceLength),
      quantifiedBulletCount: safeNumber(clarityDetails.quantifiedBulletCount),
    },
    structuredJson: {
      score: atsScore,
      breakdown: {
        keyword_match: scoreBreakdown.keywordMatch,
        semantic_similarity: scoreBreakdown.semanticSimilarity,
        structure: scoreBreakdown.structure,
        clarity: scoreBreakdown.clarity,
      },
      matched_skills: formattedMatchedSkills,
      missing_skills: formattedMissingSkills,
      improvements: suggestions,
      summary,
      predicted_score_if_improved: predictedScoreIfImproved,
    },
    internal: {
      versionLabel: INTERNAL_VERSION_LABEL,
      jobRequirements,
      semanticCosineSimilarity: Number(semanticSimilarity.toFixed(4)),
    },
  }
}

export { INTERNAL_VERSION_LABEL }
