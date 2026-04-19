import './globals.css'

export const metadata = {
  title: 'CVIFY — AI Resume Roaster',
  description: 'Paste your resume. Get brutally honest AI feedback. Share your score.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
