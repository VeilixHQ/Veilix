import fs from 'node:fs'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { formatDate, getPost } from '@/lib/blog'

export const imageSize = { width: 1200, height: 630 }

export function blogImage(slug: string) {
  const post = getPost(slug)
  const logo = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png')).toString('base64')}`
  const title = post?.title ?? 'Blog Veilix'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #060608 0%, #110a22 60%, #241048 100%)', color: '#f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={logo} width={56} height={56} alt="" />
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>Veilix</div>
          <div style={{ marginLeft: 'auto', fontSize: 22, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2 }}>{post?.category ?? 'Blog'}</div>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 56 : 64, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1.5 }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#94a3b8' }}>
          <div>{post ? formatDate(post.published) : ''}</div>
          <div>veilix.fr/blog</div>
        </div>
      </div>
    ),
    imageSize,
  )
}
