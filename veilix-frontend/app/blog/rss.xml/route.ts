import { BLOG_PATH, getPosts, parisDate, xmlEscape } from '@/lib/blog'
import { SITE_URL } from '@/lib/seo'

export function GET() {
  const posts = getPosts().slice(0, 30)
  const items = posts.map(post => {
    const url = `${SITE_URL}${BLOG_PATH}/${post.slug}`
    return [
      '<item>',
      `<title>${xmlEscape(post.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<pubDate>${parisDate(post.published).toUTCString()}</pubDate>`,
      `<description>${xmlEscape(post.description)}</description>`,
      '<category>Fuites de données</category>',
      '</item>',
    ].join('')
  })
  const updated = posts[0] ? parisDate(posts[0].modified).toUTCString() : new Date().toUTCString()
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>Veilix : fuites de données</title>',
    `<link>${SITE_URL}${BLOG_PATH}</link>`,
    `<atom:link href="${SITE_URL}${BLOG_PATH}/rss.xml" rel="self" type="application/rss+xml"/>`,
    '<description>Les fuites de données qui touchent les Français, expliquées simplement, avec ce qu&apos;il faut faire.</description>',
    '<language>fr-FR</language>',
    `<lastBuildDate>${updated}</lastBuildDate>`,
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n')
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } })
}
