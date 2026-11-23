import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site veilix.fr : éditeur, hébergeurs et propriété intellectuelle.",
  alternates: { canonical: '/mentions-legales' },
  openGraph: { title: "Mentions légales | Veilix", description: "Mentions légales du site veilix.fr : éditeur, hébergeurs et propriété intellectuelle.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/mentions-legales' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
