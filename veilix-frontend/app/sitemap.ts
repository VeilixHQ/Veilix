import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const SITE_URL = 'https://veilix.fr'

const PAGES: { path: string; lastModified: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', lastModified: '2026-11-26', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing', lastModified: '2026-11-26', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/alias-email-anonyme', lastModified: '2026-11-25', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/transparence', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/comparatif/meilleurs-alias-email', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/securite', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', lastModified: '2026-11-27', priority: 0.8, changeFrequency: 'daily' },
  { path: '/en/blog', lastModified: '2026-11-27', priority: 0.6, changeFrequency: 'daily' },
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
  const pages: MetadataRoute.Sitemap = PAGES.map(({ path, lastModified, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
  const posts: MetadataRoute.Sitemap = getAllPosts().map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))
  const englishPosts: MetadataRoute.Sitemap = getAllPosts('en').map(post => ({
    url: `${SITE_URL}/en/blog/${post.slug}`,
    lastModified: post.updated,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
  return [...pages, ...posts, ...englishPosts]
}
