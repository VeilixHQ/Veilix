import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Bêta",
  description: "Participez à la bêta de Veilix et testez les alias email avant le lancement officiel.",
  alternates: { canonical: '/beta' },
  openGraph: { title: "Bêta | Veilix", description: "Participez à la bêta de Veilix et testez les alias email avant le lancement officiel.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/beta' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
