import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Veilix traite, pourquoi, où elles sont hébergées et comment exercer vos droits RGPD.",
  alternates: { canonical: '/confidentialite' },
  openGraph: { title: "Politique de confidentialité | Veilix", description: "Quelles données Veilix traite, pourquoi, où elles sont hébergées et comment exercer vos droits RGPD.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/confidentialite' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
