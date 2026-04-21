import nodemailer from 'nodemailer'

function createTransport() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      simulated: false,
    }
  }

  return {
    transporter: nodemailer.createTransport({
      jsonTransport: true,
    }),
    simulated: true,
  }
}

export async function sendAnalysisEmail({ to, analysis, sessionId }) {
  const { transporter, simulated } = createTransport()
  const from = process.env.EMAIL_FROM || 'CVify <reports@cvify.local>'
  const resumeName = analysis.meta?.resumeName || 'Resume Upload'
  const summary = analysis.similarityExplanation || 'ATS analysis completed.'
  const subject = `CVify ATS report: ${resumeName}`

  const text = [
    `CVify analysis report for ${resumeName}`,
    '',
    `ATS score: ${analysis.atsScore}/100`,
    `Matched skills: ${(analysis.matchedSkills || []).join(', ') || 'None detected'}`,
    `Missing skills: ${(analysis.missingSkills || []).join(', ') || 'None detected'}`,
    '',
    'Suggestions:',
    ...(analysis.improvementSuggestions || []).map((item) => `- ${item.message || item}`),
    '',
    `Summary: ${summary}`,
    '',
    `Session ID: ${sessionId}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
      <h2>CVify analysis report</h2>
      <p><strong>Resume:</strong> ${resumeName}</p>
      <p><strong>ATS score:</strong> ${analysis.atsScore}/100</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Matched skills:</strong> ${(analysis.matchedSkills || []).join(', ') || 'None detected'}</p>
      <p><strong>Missing skills:</strong> ${(analysis.missingSkills || []).join(', ') || 'None detected'}</p>
      <h3>Suggestions</h3>
      <ul>${(analysis.improvementSuggestions || []).map((item) => `<li>${item.message || item}</li>`).join('')}</ul>
      <p><strong>Session ID:</strong> ${sessionId}</p>
    </div>
  `

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })

  return {
    simulated,
    messageId: info.messageId || '',
    preview: simulated ? info.message?.toString?.() || '' : '',
  }
}
