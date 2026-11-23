import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Veilix : assistance, sécurité, questions juridiques et RGPD, ou partenariats.",
  alternates: { canonical: '/contact' },
  openGraph: { title: "Contact | Veilix", description: "Contactez Veilix : assistance, sécurité, questions juridiques et RGPD, ou partenariats.", siteName: 'Veilix', type: 'website', locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }], url: '/contact' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
