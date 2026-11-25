import { blogImage, imageSize } from '@/lib/blogImage'

export const size = imageSize
export const contentType = 'image/png'
export const alt = 'Article du blog Veilix'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return blogImage((await params).slug)
}
