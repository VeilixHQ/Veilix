import { BLOG_PATH, getPosts, parisDate, xmlEscape } from '@/lib/blog'
import { SITE_URL } from '@/lib/seo'

const MAX_AGE_MS = 2 * 24 * 3600 * 1000

export function GET() {
  const now = Date.now()
  const posts = getPosts().filter(post => now - parisDate(post.published).getTime() <= MAX_AGE_MS)
  const urls = posts.map(post => [
    '<url>',
    `<loc>${SITE_URL}${BLOG_PATH}/${post.slug}</loc>`,
    '<news:news>',
    '<news:publication><news:name>Veilix</news:name><news:language>fr</news:language></news:publication>',
    `<news:publication_date>${post.published}</news:publication_date>`,
    `<news:title>${xmlEscape(post.title)}</news:title>`,
    '</news:news>',
    '</url>',
  ].join(''))
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n')
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } })
}
