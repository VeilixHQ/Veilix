'use client'

import { FadeInSection } from './Utils'
import { Translations } from '@/lib/translations'

export function Features({ t }: { t: Translations }) {
  return (
    <section
      id="features"
      style={{
        padding: '96px 24px',
        background: '#0d0d10',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <FadeInSection>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              marginBottom: 12,
            }}
          >
            {t.featKicker}
          </div>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.2vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              marginBottom: 8,
              lineHeight: 1.1,
            }}
          >
            {t.featTitle.split('\n').map((l, i) => (
              <span key={i} style={{ display: 'block' }}>
                {l}
              </span>
            ))}
          </h2>

          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 52 }}>
            {t.featSub}
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {t.features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#060608',
                  padding: 24,
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#fff' }}>
                  {f.title}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}