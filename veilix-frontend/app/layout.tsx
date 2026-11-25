import type { Metadata } from 'next'
import { connection } from 'next/server'
import './globals.css'

const SITE_URL = 'https://veilix.fr'
const DESCRIPTION = "Un alias email par site, votre adresse personnelle reste privée. Sans e-mail ni mot de passe, sans journal d'activité, open source et hébergé en Europe."

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
      description: "Service d'alias email anonymes et sécurisés, open source et hébergé en Europe.",
      slogan: 'Des alias email anonymes et sécurisés.',
      sameAs: ['https://github.com/VeilixHQ/Veilix'],
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#application`,
      name: 'Veilix',
      url: SITE_URL,
      description: "Créez un alias email différent pour chaque site : les messages sont relayés vers votre adresse e-mail personnelle, qui reste privée. Sans e-mail ni mot de passe pour s'inscrire, adresses chiffrées, code open source sous licence AGPL-3.0, hébergé en Europe.",
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Web',
      inLanguage: 'fr-FR',
      isAccessibleForFree: false,
      license: 'https://www.gnu.org/licenses/agpl-3.0.html',
      featureList: [
        'Alias email aléatoires, un par site',
        "Réponse depuis l'alias sans révéler votre adresse",
        "Blocage d'expéditeurs par adresse ou par domaine",
        'Alertes de fuite',
        'Chiffrement PGP des e-mails relayés',
        'Clés API',
        "Inscription sans e-mail ni mot de passe",
        'Hébergement dans l’Union européenne',
      ],
      offers: [
        { '@type': 'Offer', name: 'Pro (mensuel)', price: '4.99', priceCurrency: 'EUR', url: `${SITE_URL}/pricing` },
        { '@type': 'Offer', name: 'Pro (annuel)', price: '44.90', priceCurrency: 'EUR', url: `${SITE_URL}/pricing` },
        { '@type': 'Offer', name: 'Pack de lancement (annuel)', price: '69.00', priceCurrency: 'EUR', url: `${SITE_URL}/pricing` },
      ],
      publisher: { '@id': `${SITE_URL}/#organization` },
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