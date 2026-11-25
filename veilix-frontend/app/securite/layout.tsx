import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sécurité",
  description: "Comment Veilix protège vos données : adresses chiffrées en AES-256, clé créée dans votre navigateur, aucun cookie de suivi, open source et serveurs en Europe.",
  alternates: { canonical: '/securite' },
  openGraph: { title: "Sécurité | Veilix", description: "Comment Veilix protège vos données : adresses chiffrées en AES-256, clé créée dans votre navigateur, aucun cookie de suivi, open source et serveurs en Europe.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/securite' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
