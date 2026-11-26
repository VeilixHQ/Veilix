import type { MetadataRoute } from 'next'

const SITE_URL = 'https://veilix.fr'

const PAGES: { path: string; lastModified: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', lastModified: '2026-11-26', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing', lastModified: '2026-11-23', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/alias-email-anonyme', lastModified: '2026-11-25', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/transparence', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/comparatif/meilleurs-alias-email', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/securite', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/faq', lastModified: '2026-11-23', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/beta', lastModified: '2026-11-23', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/a-propos', lastModified: '2026-11-26', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/feuille-de-route', lastModified: '2026-11-25', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/kit-media', lastModified: '2026-11-25', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact', lastModified: '2026-11-23', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/confidentialite', lastModified: '2026-11-23', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/conditions-utilisation', lastModified: '2026-11-25', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/politique-anti-abus', lastModified: '2026-11-25', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/mentions-legales', lastModified: '2026-11-23', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, lastModified, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
