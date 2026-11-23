import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi Veilix existe : rendre la protection de votre adresse email simple, transparente et accessible à tous.",
  alternates: { canonical: '/a-propos' },
  openGraph: { title: "À propos | Veilix", description: "Pourquoi Veilix existe : rendre la protection de votre adresse email simple, transparente et accessible à tous.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/a-propos' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
