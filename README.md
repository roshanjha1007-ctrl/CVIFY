# CVIFY — AI Resume Roaster

> Paste your resume. Get brutally honest AI feedback. Share your score.

Built by **Roshan** — a CSIT student actively shipping real projects.

---

## What It Does

CVIFY sends your resume to an AI (acting as an ATS + hiring manager) and returns:

- **Score** (0–100) with a visual ring
- **Verdict** — one-line brutal truth
- **5 Issues** — what's killing your chances
- **5 Fixes** — exactly how to fix them
- **3 Rewrites** — your weak bullets, improved
- **Anonymous Share Link** — anyone with the link can view your roast (no personal info exposed)

---

## Features

- Resume paste + AI roast
- Score ring with color-coded rating
- Brutal Mode toggle (harsher feedback)
- Anonymous shareable links (`/r/{id}`)
- MongoDB storage (Azure Cosmos DB compatible)
- Mock mode — works with zero API keys
- Clean dark UI with custom fonts
- Loading + error states
- Input validation

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| AI | Google Gemini / OpenAI / Mock |
| Database | MongoDB (Mongoose) |
| Hosting | Vercel (recommended) |

---

## Folder Structure

```
CVIFY/
├── app/
│   ├── api/
│   │   ├── roast/route.js       # POST /api/roast
│   │   ├── share/route.js       # POST /api/share
│   │   └── r/[id]/route.js      # GET /api/r/:id
│   ├── r/[id]/page.js           # Public share page
│   ├── page.js                  # Home page
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── ScoreRing.js             # Animated SVG score ring
│   └── ResultCard.js            # Full result display
├── lib/
│   ├── ai.js                    # Gemini / OpenAI / Mock
│   └── mongodb.js               # DB connection
├── models/
│   └── Roast.js                 # Mongoose schema
├── .env.local.example
├── package.json
└── README.md
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/cvify
GEMINI_API_KEY=your_key_here   # or leave empty for mock mode
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes (for share links) | MongoDB or Azure Cosmos DB connection string |
| `GEMINI_API_KEY` | No | Google Gemini API key (free tier available) |
| `OPENAI_API_KEY` | No | OpenAI API key (used if no Gemini key) |

> ⚠️ If both AI keys are missing, CVIFY runs in **mock mode** — great for development.

---

## Getting a Free Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a key (free tier: 15 req/min)
3. Paste it into `.env.local` as `GEMINI_API_KEY`

---

## How Share Links Work

1. User clicks **↗ Share** after getting a roast
2. Frontend calls `POST /api/share` with resume text + result JSON
3. Server generates a short unique ID and saves to MongoDB
4. User gets a public URL: `https://yourapp.com/r/{id}`
5. Anyone visiting that URL sees the roast result — **resume text is never shown**
6. Documents auto-delete after **30 days**

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

For database, use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier or Azure Cosmos DB.

---

## Future Improvements

- [ ] PDF resume upload (parse text from PDF)
- [ ] Job description matching (paste JD + resume → gap analysis)
- [ ] LinkedIn profile URL input
- [ ] Email results to yourself
- [ ] Before/after score tracker
- [ ] Multiple resume versions comparison

---
