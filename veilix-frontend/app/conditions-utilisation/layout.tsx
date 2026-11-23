import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation et de vente du service d'alias email Veilix.",
  alternates: { canonical: '/conditions-utilisation' },
  openGraph: { title: "Conditions d'utilisation | Veilix", description: "Conditions générales d'utilisation et de vente du service d'alias email Veilix.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/conditions-utilisation' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
