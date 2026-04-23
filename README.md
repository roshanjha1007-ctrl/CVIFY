# CVify

![CVify logo](./public/cvify-logo.svg)

CVify is an AI-powered resume optimization and tracking app built with Next.js. It accepts PDF resumes, matches them against job descriptions, simulates LinkedIn consistency checks, stores analysis sessions, and can send a summary report by email.

## Core Workflow

1. Upload one or more resume PDFs, or paste resume text manually.
2. Paste a target job description.
3. Optionally add a LinkedIn URL and email address.
4. Use demo mode to instantly preload a sample resume and role if you want to preview the experience first.
5. CVify parses the resume, scores ATS alignment, highlights missing skills, and stores the session.
6. Review progress history, compare resume versions, and send reports by email.

## Features

- PDF resume upload with text extraction via `pdf-parse`
- ATS compatibility scoring from `0-100`
- Missing and matched skill detection against a job description
- Resume improvement suggestions and rewrite prompts
- One-click demo content for easier repo previews and first-run testing
- Exportable ATS summaries with copy and download actions on the results screen
- LinkedIn URL input with simulated profile extraction and consistency checks
- Email report delivery through `nodemailer`
- Saved analysis sessions in MongoDB
- Before/after score tracking with a history chart
- Multiple resume version comparison
- Structured JSON analysis output for future AI workflows

## Stack

- Next.js 14 App Router
- React 18
- MongoDB with Mongoose
- `pdf-parse` for PDF extraction
- `nodemailer` for report sending
- Lucide React for icons
- Optional Gemini or OpenAI enhancement hooks

## Environment Setup

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then configure the values you need:

```env
MONGODB_URI=mongodb://localhost:27017/cvify
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM="CVify <reports@example.com>"
```

Notes:

- `MONGODB_URI` is required for saved sessions and score history.
- `GEMINI_API_KEY` and `OPENAI_API_KEY` are optional. CVify still works with local heuristic analysis if no provider is configured.
- SMTP values are optional. Without them, email reports run in simulated mode so the app still works in development.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## API Surface

### `POST /api/analyze`

Accepts `multipart/form-data` with:

- `resumeFile` for PDF upload
- `resumeText` as a manual fallback
- `jobDescription`
- `linkedInUrl`
- `email`
- `versionLabel`

Returns:

- saved session metadata
- structured analysis JSON
- email report status
- recent session history for that email

### `GET /api/sessions?email=...`

Loads saved analysis sessions scoped to the provided email address.

## Project Structure

```text
app/
  api/
    analyze/route.js
    sessions/route.js
    r/[id]/route.js
    roast/route.js
    share/route.js
  r/[id]/page.js
  globals.css
  layout.js
  page.js
components/
  BrandLogo.js
  ComparisonTable.js
  HistoryChart.js
  ScoreRing.js
  SectionPanel.js
lib/
  analysis.js
  ai.js
  email.js
  mongodb.js
models/
  AnalysisSession.js
  Roast.js
public/
  cvify-logo.svg
  cvify-mark.svg
```

## Security Notes

- `.env.local` is ignored by git.
- The example env file contains placeholders only.
- If any real API keys were ever committed in the past, rotate them immediately. Ignoring the file now does not protect previously leaked secrets.
- Session history is scoped by email in the API instead of being returned globally.

## Build

```bash
npm run build
```

## Future Extensions

- Real LinkedIn enrichment through a compliant third-party provider
- Fine-tuned AI rewrite generation for role-specific resumes
- Recruiter-style scorecards per job family
- Authenticated multi-user dashboards
