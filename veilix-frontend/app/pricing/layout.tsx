import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Tarifs de Veilix : offre Pro à 4,99 € par mois, Pack de lancement à 69 € par an ou alias à l'unité avec les crédits. Essai gratuit de 14 jours.",
  alternates: { canonical: '/pricing' },
  openGraph: { title: "Tarifs | Veilix", description: "Tarifs de Veilix : offre Pro à 4,99 € par mois, Pack de lancement à 69 € par an ou alias à l'unité avec les crédits. Essai gratuit de 14 jours.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/pricing' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
