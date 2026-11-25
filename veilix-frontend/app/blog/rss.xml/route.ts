import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function GET() {
  const posts = getAllPosts().slice(0, 50)
  const items = posts.map(post => {
    const url = `${SITE_URL}/blog/${post.slug}`
    return [
      '<item>',
      `<title>${escape(post.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<pubDate>${new Date(`${post.published}T07:00:00Z`).toUTCString()}</pubDate>`,
      `<category>${escape(post.category)}</category>`,
      `<description>${escape(post.description)}</description>`,
      '</item>',
    ].join('')
  })
  const lastBuild = posts[0] ? new Date(`${posts[0].modified}T07:00:00Z`).toUTCString() : new Date().toUTCString()
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>Blog Veilix</title>',
    `<link>${SITE_URL}/blog</link>`,
    `<atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
    '<description>Actualité cybersécurité et vie privée, expliquée simplement.</description>',
    '<language>fr-FR</language>',
    `<lastBuildDate>${lastBuild}</lastBuildDate>`,
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n')
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
