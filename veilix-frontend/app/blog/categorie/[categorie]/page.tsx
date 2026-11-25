import type { Metadata } from 'next'
import { categoryMetadata, CategoryView } from '@/components/content/CategoryView'
import { getCategories } from '@/lib/blog'

type Props = { params: Promise<{ categorie: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getCategories().map(c => ({ categorie: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryMetadata((await params).categorie, 1)
}

export default async function CategoryPage({ params }: Props) {
  return <CategoryView slug={(await params).categorie} page={1} />
}
