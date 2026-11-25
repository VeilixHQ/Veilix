import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogCategories, BlogList } from '@/components/content/BlogList'
import { ContentShell } from '@/components/content/ContentShell'
import { getAllPosts, getCategories, slugify } from '@/lib/blog'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ categorie: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getCategories().map(c => ({ categorie: c.slug }))
}

function find(slug: string) {
  return getCategories().find(c => c.slug === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = find((await params).categorie)
  if (!category) return {}
  const path = `/blog/categorie/${category.slug}`
  const base = pageMetadata({ path, title: `${category.name} : articles et conseils | Veilix`, description: `Tous les articles du blog Veilix sur le thème « ${category.name} » : actualité expliquée simplement et conseils concrets pour protéger vos données.` })
  return { ...base, openGraph: { ...base.openGraph, type: 'website' }, robots: category.count < 2 ? { index: false, follow: true } : undefined }
}

export default async function CategoryPage({ params }: Props) {
  const category = find((await params).categorie)
  if (!category) notFound()
  const posts = getAllPosts().filter(p => slugify(p.category) === category.slug)
  return (
    <ContentShell breadcrumb={category.name} parents={[{ href: '/blog', label: 'Blog' }]}>
      <h1>{category.name}</h1>
      <p className="lead">{category.count} article{category.count > 1 ? 's' : ''} sur ce thème, du plus récent au plus ancien.</p>
      <BlogCategories active={category.slug} />
      <BlogList posts={posts} />
    </ContentShell>
  )
}
