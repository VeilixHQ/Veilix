import fs from 'node:fs'
import path from 'node:path'

export type BlogSource = { title: string; url: string; publisher: string }
export type BlogSection = { heading: string; paragraphs: string[]; bullets: string[] }
export type BlogFaq = { q: string; a: string }

export type BlogPost = {
  slug: string
  format?: 'actu' | 'guide' | 'recap'
  topicKey?: string | null
  quality?: { scores: Record<string, number>; resume: string }
  cta?: { accroche: string; texte: string }
  title: string
  metaTitle: string
  description: string
  published: string
  modified: string
  category: string
  tags: string[]
  lead: string
  sections: BlogSection[]
  takeaways: string[]
  faq: BlogFaq[]
  sources: BlogSource[]
}

const DIR = path.join(process.cwd(), 'content', 'blog')

let cache: BlogPost[] | null = null

export function getAllPosts(): BlogPost[] {
  if (cache) return cache
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')) : []
  cache = files
    .map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as BlogPost)
    .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.slug.localeCompare(b.slug)))
  return cache
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find(p => p.slug === slug)
}

export function relatedPosts(post: BlogPost, count = 3): BlogPost[] {
  const others = getAllPosts().filter(p => p.slug !== post.slug)
  const score = (p: BlogPost) => (p.category === post.category ? 2 : 0) + p.tags.filter(t => post.tags.includes(t)).length
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count)
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

export function readingMinutes(post: BlogPost): number {
  const text = [post.lead, ...post.sections.flatMap(s => [...s.paragraphs, ...s.bullets]), ...post.takeaways].join(' ')
  return Math.max(1, Math.round(text.split(/\s+/).length / 220))
}

export function plainText(value: string): string {
  return value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
}

export function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getCategories(): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const post of getAllPosts()) counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  return [...counts.entries()].map(([name, count]) => ({ name, slug: slugify(name), count })).sort((a, b) => b.count - a.count)
}

export const PAGE_SIZE = 12

export function paginate<T>(items: T[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), pages }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fuite de données': '#f87171',
  'Phishing et arnaques': '#fb923c',
  'Vulnérabilité': '#facc15',
  'Ransomware': '#f472b6',
  'Vie privée': '#a78bfa',
  'Réglementation': '#60a5fa',
  'Conseils pratiques': '#34d399',
  'Récap de la semaine': '#22d3ee',
}

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#a78bfa'
}

export function adjacentPosts(post: BlogPost): { older?: BlogPost; newer?: BlogPost } {
  const posts = getAllPosts()
  const index = posts.findIndex(p => p.slug === post.slug)
  return { newer: index > 0 ? posts[index - 1] : undefined, older: index >= 0 ? posts[index + 1] : undefined }
}

export function homeSections() {
  const posts = getAllPosts()
  const [featured, ...others] = posts
  const highlights = others.slice(0, 2)
  const top = new Set([featured, ...highlights].filter(Boolean).map(p => p.slug))
  const guides = posts.filter(p => p.format === 'guide' && !top.has(p.slug)).slice(0, 3)
  const recap = posts.find(p => p.format === 'recap' && !top.has(p.slug))
  const shown = new Set([...top, ...guides.map(p => p.slug), ...(recap ? [recap.slug] : [])])
  return { featured, highlights, guides, recap, latest: posts.filter(p => !shown.has(p.slug)) }
}
