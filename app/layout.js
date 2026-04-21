import './globals.css'

export const metadata = {
  title: 'CVify | ATS Resume Analyzer',
  description: 'Upload a PDF resume, compare it with a job description, and get a production-ready ATS score breakdown.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
