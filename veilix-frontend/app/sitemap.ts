import type { MetadataRoute } from 'next'
import { BLOG_PATH, getPosts } from '@/lib/blog'

const SITE_URL = 'https://veilix.fr'

const PAGES: { path: string; lastModified: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', lastModified: '2026-11-25', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing', lastModified: '2026-11-23', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/alias-email-anonyme', lastModified: '2026-11-25', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/transparence', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/comparatif/meilleurs-alias-email', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/securite', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/verifier-fuite-email', lastModified: '2026-11-25', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/guides', lastModified: '2026-11-25', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guides/que-faire-apres-une-fuite-de-donnees', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/guides/iban-fuite-que-faire', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/guides/hameconnage-apres-une-fuite', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/guides/numero-de-telephone-fuite', lastModified: '2026-11-25', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog/methode', lastModified: '2026-11-25', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/faq', lastModified: '2026-11-23', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/beta', lastModified: '2026-11-23', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/a-propos', lastModified: '2026-11-23', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/feuille-de-route', lastModified: '2026-11-25', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/kit-media', lastModified: '2026-11-25', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact', lastModified: '2026-11-23', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/confidentialite', lastModified: '2026-11-23', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/conditions-utilisation', lastModified: '2026-11-25', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/politique-anti-abus', lastModified: '2026-11-25', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/mentions-legales', lastModified: '2026-11-23', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = PAGES.map(({ path, lastModified, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
  const posts = getPosts()
  if (posts.length === 0) return pages
  const blog = {
    url: `${SITE_URL}${BLOG_PATH}`,
    lastModified: posts.reduce((latest, post) => (post.modified > latest ? post.modified : latest), posts[0].modified),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }
  const articles = posts.map(post => ({
    url: `${SITE_URL}${BLOG_PATH}/${post.slug}`,
    lastModified: post.modified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  const list = posts.length >= 3 ? [{ url: `${SITE_URL}/fuites-de-donnees`, lastModified: blog.lastModified, changeFrequency: 'daily' as const, priority: 0.9 }] : []
  return [...pages, ...list, blog, ...articles]
}
