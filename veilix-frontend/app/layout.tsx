import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Veilix — Protégez votre identité numérique',
  description: 'Alias email instantanés pour protéger votre vraie adresse.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr"data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}