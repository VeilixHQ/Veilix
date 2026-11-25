import { getAllPosts } from '@/lib/blog'

export const dynamic = 'force-static'

export function GET() {
  const index = getAllPosts().map(p => ({ s: p.slug, t: p.title, d: p.description, c: p.category, p: p.published, k: p.tags.join(' ') }))
  return Response.json(index, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
