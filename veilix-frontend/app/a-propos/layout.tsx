import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi Veilix existe : rendre la protection de votre adresse email simple, transparente et accessible à tous.",
  alternates: { canonical: '/a-propos' },
  openGraph: { title: "À propos | Veilix", description: "Pourquoi Veilix existe : rendre la protection de votre adresse email simple, transparente et accessible à tous.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/a-propos' },
}

const ABOUT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': 'https://veilix.fr/a-propos#webpage',
  url: 'https://veilix.fr/a-propos',
  name: 'À propos de Veilix',
  inLanguage: 'fr-FR',
  isPartOf: { '@id': 'https://veilix.fr/#website' },
  about: { '@id': 'https://veilix.fr/#organization' },
  mainEntity: { '@id': 'https://veilix.fr/#organization' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />
      {children}
    </>
  )
}
