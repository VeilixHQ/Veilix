import type { MetadataRoute } from 'next'

const SITE_URL = 'https://veilix.fr'

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/alias-email-anonyme', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/transparence', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/securite', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/beta', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/a-propos', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/conditions-utilisation', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }))
}
