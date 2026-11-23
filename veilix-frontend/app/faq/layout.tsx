import type { Metadata } from 'next'
import { PT } from '@/lib/translations-pages'

export const metadata: Metadata = {
  title: "Questions fréquentes sur les alias email",
  description: "Tout savoir sur les alias email Veilix : fonctionnement, réponse depuis un alias, clé de récupération, confidentialité, tarifs et essai gratuit.",
  alternates: { canonical: '/faq' },
  openGraph: { title: "Questions fréquentes sur les alias email | Veilix", description: "Tout savoir sur les alias email Veilix : fonctionnement, réponse depuis un alias, clé de récupération, confidentialité, tarifs et essai gratuit.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/faq' },
}

const FAQ_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PT.fr.faq.categories.flatMap(category => category.items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }))),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_DATA) }} />
      {children}
    </>
  )
}
