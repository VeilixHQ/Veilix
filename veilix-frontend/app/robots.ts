import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/access', '/dashboard', '/settings', '/admin', '/confirm'],
      },
    ],
    sitemap: 'https://veilix.fr/sitemap.xml',
  }
}
