import { getPosts } from '@/lib/blog'
import { OG_SIZE, postImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Fuite de données : résumé de l’article Veilix'

export function generateStaticParams() {
  return getPosts().map(post => ({ slug: post.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return postImage(slug)
}
