import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type BlogSection = { heading: string; body: string }
export type BlogFaq = { q: string; a: string }
export type BlogSource = { title: string; url: string; publisher?: string }
export type BlogCategory = 'fuite' | 'faille' | 'arnaque' | 'piratage' | 'guide'

export type BlogPost = {
  slug: string
  title: string
  description: string
  published: string
  updated: string
  category: BlogCategory
  summary: string
  sections: BlogSection[]
  checklist: string[]
  faq: BlogFaq[]
  sources: BlogSource[]
  tags: string[]
}

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  fuite: 'Fuite de données',
  faille: 'Faille de sécurité',
  arnaque: 'Arnaque et phishing',
  piratage: 'Piratage',
  guide: 'Guide',
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function isPost(value: unknown): value is BlogPost {
  const p = value as BlogPost
  return Boolean(
    p && SLUG.test(p.slug) && typeof p.title === 'string' && typeof p.description === 'string' &&
    DATE.test(p.published) && DATE.test(p.updated) && p.category in CATEGORY_LABELS && typeof p.summary === 'string' &&
    Array.isArray(p.sections) && p.sections.every(s => typeof s.heading === 'string' && typeof s.body === 'string') &&
    Array.isArray(p.checklist) && Array.isArray(p.faq) && Array.isArray(p.sources) && p.sources.every(s => /^https:\/\//.test(s.url)) &&
    Array.isArray(p.tags),
  )
}

export function getAllPosts(): BlogPost[] {
  let files: string[] = []
  try {
    files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'))
  } catch {
    return []
  }
  const posts: BlogPost[] = []
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(path.join(BLOG_DIR, file), 'utf8'))
      if (isPost(data) && `${data.slug}.json` === file) posts.push(data)
    } catch {
      continue
    }
  }
  return posts.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug))
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find(p => p.slug === slug)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}
