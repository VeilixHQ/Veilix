import { ImageResponse } from 'next/og'
import { formatDate, getPost } from '@/lib/blog'
import { EXPOSED_LABELS } from '@/lib/guides'

export const OG_SIZE = { width: 1200, height: 630 }

export function postImage(slug: string) {
  const post = getPost(slug)
  const title = post?.title ?? 'Fuites de données : actualité et bons réflexes'
  const exposed = post ? post.exposed.map(item => EXPOSED_LABELS[item] ?? item).slice(0, 5) : []
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #060608 0%, #140b26 100%)', color: '#f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', padding: '8px 18px', borderRadius: 999, background: 'rgba(239,68,68,0.16)', border: '2px solid rgba(239,68,68,0.5)', color: '#fca5a5', fontSize: 26 }}>Fuite de données</div>
          {post && <div style={{ display: 'flex', fontSize: 26, color: '#94a3b8' }}>{formatDate(post.revealed)}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {post && <div style={{ display: 'flex', fontSize: 40, color: '#a78bfa' }}>{post.organization}</div>}
          <div style={{ display: 'flex', fontSize: title.length > 80 ? 50 : 58, lineHeight: 1.15, fontWeight: 700, letterSpacing: -1 }}>{title}</div>
          {exposed.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {exposed.map(item => (
                <div key={item} style={{ display: 'flex', padding: '6px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.18)', color: '#e2e8f0', fontSize: 24 }}>{item}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28, color: '#94a3b8' }}>
          <div style={{ display: 'flex', color: '#f1f5f9', fontWeight: 700, fontSize: 34 }}>Veilix</div>
          <div style={{ display: 'flex' }}>veilix.fr/blog</div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
