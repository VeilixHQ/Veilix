import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogArticle } from '@/components/blog/BlogArticle'
import { getAllPosts, getFrenchOriginal, getPost } from '@/lib/blog'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts('en').map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug, 'en')
  if (!post) return {}
  const path = `/en/blog/${post.slug}`
  const original = getFrenchOriginal(post)
  const base = pageMetadata({ path, title: post.title, description: post.description })
  return {
    ...base,
    alternates: original ? { canonical: path, languages: { en: path, 'fr-FR': `/blog/${original.slug}`, 'x-default': `/blog/${original.slug}` } } : base.alternates,
    openGraph: { ...base.openGraph, locale: 'en_GB', publishedTime: post.published, modifiedTime: post.updated, tags: post.tags },
  }
}

export default async function EnglishBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug, 'en')
  if (!post) notFound()
  const related = getAllPosts('en').filter(p => p.slug !== post.slug).slice(0, 3)
  const jsonLd = articleJsonLd({ path: `/en/blog/${post.slug}`, title: post.title, description: post.description, published: post.published, modified: post.updated, breadcrumb: 'Blog', faq: post.faq })
  const graph = jsonLd['@graph'].map(node => {
    if (node['@type'] === 'Article') return { ...node, inLanguage: 'en' }
    if (node['@type'] === 'BreadcrumbList') return { ...node, itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://veilix.fr' }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `https://veilix.fr/en/blog/${post.slug}` }] }
    return node
  })
  return <BlogArticle post={post} lang="en" related={related} alternateSlug={getFrenchOriginal(post)?.slug} jsonLd={{ ...jsonLd, '@graph': graph }} />
}
