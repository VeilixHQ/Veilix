import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogArticle } from '@/components/blog/BlogArticle'
import { getAllPosts, getEnglishVersion, getPost } from '@/lib/blog'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug)
  if (!post) return {}
  const path = `/blog/${post.slug}`
  const english = getEnglishVersion(post.slug)
  const base = pageMetadata({ path, title: post.title, description: post.description })
  return {
    ...base,
    alternates: english ? { canonical: path, languages: { 'fr-FR': path, en: `/en/blog/${english.slug}`, 'x-default': path } } : base.alternates,
    openGraph: { ...base.openGraph, publishedTime: post.published, modifiedTime: post.updated, tags: post.tags },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)
  if (!post) notFound()
  const related = getAllPosts().filter(p => p.slug !== post.slug).slice(0, 3)
  const jsonLd = articleJsonLd({ path: `/blog/${post.slug}`, title: post.title, description: post.description, published: post.published, modified: post.updated, breadcrumb: 'Blog', faq: post.faq })
  return <BlogArticle post={post} lang="fr" related={related} alternateSlug={getEnglishVersion(post.slug)?.slug} jsonLd={jsonLd} />
}
