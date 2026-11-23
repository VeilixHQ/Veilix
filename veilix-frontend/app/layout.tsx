import type { Metadata } from 'next'
import { connection } from 'next/server'
import './globals.css'

const SITE_URL = 'https://veilix.fr'
const DESCRIPTION = "Créez un alias email pour chaque site et gardez votre adresse e-mail personnelle privée. Sans e-mail ni mot de passe, sans journal d'activité, open source et hébergé en Europe."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Veilix : alias email anonymes et sécurisés',
    template: '%s | Veilix',
  },
  description: DESCRIPTION,
  applicationName: 'Veilix',
  keywords: ['alias email', 'adresse email alias', 'email jetable', 'protéger son adresse email', 'anti-spam', 'vie privée', 'chiffrement PGP', 'open source', 'hébergé en Europe'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Veilix',
    locale: 'fr_FR',
    title: 'Veilix : alias email anonymes et sécurisés',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veilix : alias email anonymes et sécurisés',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Veilix',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: 'contact@veilix.fr',
      sameAs: ['https://github.com/VeilixHQ/Veilix'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Veilix',
      url: SITE_URL,
      inLanguage: 'fr-FR',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
        {children}
      </body>
    </html>
  )
}