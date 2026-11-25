import fs from 'node:fs'
import path from 'node:path'

export type BlogSource = { title: string; url: string; publisher: string }
export type BlogSection = { heading: string; paragraphs: string[]; bullets: string[] }
export type BlogFaq = { q: string; a: string }

export type BlogPost = {
  slug: string
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
