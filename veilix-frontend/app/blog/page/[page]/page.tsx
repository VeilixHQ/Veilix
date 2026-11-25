import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogCategories, BlogList, Pagination } from '@/components/content/BlogList'
import { ContentShell } from '@/components/content/ContentShell'
import { homeSections, paginate } from '@/lib/blog'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ page: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  const { pages } = paginate(homeSections().latest, 1)
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = Number((await params).page)
  const base = pageMetadata({ path: `/blog/page/${page}`, title: `Blog Veilix : articles cybersécurité, page ${page}`, description: `Page ${page} des articles du blog Veilix : fuites de données, phishing, failles et conseils pour protéger votre adresse e-mail.` })
  return { ...base, openGraph: { ...base.openGraph, type: 'website' } }
}

export default async function BlogPage({ params }: Props) {
  const page = Number((await params).page)
  const { items, pages } = paginate(homeSections().latest, page)
  if (!Number.isInteger(page) || page < 2 || page > pages) notFound()
  return (
    <ContentShell breadcrumb={`Page ${page}`} parents={[{ href: '/blog', label: 'Blog' }]}>
      <h1>Tous les articles, page {page}</h1>
      <BlogCategories />
      <BlogList posts={items} />
      <Pagination base="/blog" page={page} pages={pages} />
    </ContentShell>
  )
}
