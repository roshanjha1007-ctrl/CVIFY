import './globals.css'

export const metadata = {
  title: 'CVify | AI Resume Optimization and Tracking',
  description: 'Upload resume PDFs, compare against job descriptions, track ATS improvements, and send resume analysis reports by email.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
