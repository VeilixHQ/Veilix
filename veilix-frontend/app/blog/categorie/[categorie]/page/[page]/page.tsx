import type { Metadata } from 'next'
import { categoryMetadata, CategoryView } from '@/components/content/CategoryView'
import { getAllPosts, getCategories, paginate, slugify } from '@/lib/blog'

type Props = { params: Promise<{ categorie: string; page: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getCategories().flatMap(c => {
    const { pages } = paginate(getAllPosts().filter(p => slugify(p.category) === c.slug), 1)
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ categorie: c.slug, page: String(i + 2) }))
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorie, page } = await params
  return categoryMetadata(categorie, Number(page))
}

export default async function CategoryPage({ params }: Props) {
  const { categorie, page } = await params
  return <CategoryView slug={categorie} page={Number(page)} />
}
