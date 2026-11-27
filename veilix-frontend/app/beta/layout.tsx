import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Liste d'attente : lancement le 1er février 2027",
  description: "Veilix, le service d'alias email open source hébergé en Europe, ouvre le 1er février 2027. Inscrivez-vous pour être prévenu de l'ouverture.",
  alternates: { canonical: '/beta' },
  openGraph: { title: "Liste d'attente : lancement le 1er février 2027 | Veilix", description: "Veilix, le service d'alias email open source hébergé en Europe, ouvre le 1er février 2027. Inscrivez-vous pour être prévenu de l'ouverture.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/beta' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
