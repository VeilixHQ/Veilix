import { POSTS } from '@/content/blog'

export type BlogSection = { heading: string; paragraphs: string[]; bullets: string[] }

export type BlogPost = {
  slug: string
  title: string
  seoTitle: string
  description: string
  published: string
  modified: string
  organization: string
  lead: string
  sections: BlogSection[]
  actions: string[]
  faq: { q: string; a: string }[]
  sources: { title: string; url: string }[]
}

export const BLOG_PATH = '/blog'

export function getPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug))
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find(post => post.slug === slug)
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
