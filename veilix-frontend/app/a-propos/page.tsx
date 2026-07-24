'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SimpleNav } from '@/components/landing/SimpleNav'
import { SimpleFooter } from '@/components/landing/SimpleFooter'
import { PT } from '@/lib/translations-pages'
import { Lang } from '@/lib/translations'

export default function APropos() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = PT[lang].apropos
  const back = PT[lang].back

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SimpleNav lang={lang} setLang={setLang} backLabel={back} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 80px' }}>

        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{t.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>{t.title}</h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8 }}>{t.intro}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ padding: '28px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 14 }}>{t.origin.title}</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{t.origin.content}</p>
          </div>

          <div style={{ padding: '28px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 14 }}>{t.philosophy.title}</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, marginBottom: 16 }}>{t.philosophy.content}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {t.philosophy.points.map((point, i) => {
                const colors = ['#4ade80', '#a78bfa', '#60a5fa', '#f59e0b']
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{point}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '28px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 14 }}>{t.architecture.title}</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{t.architecture.content}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {t.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px 16px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', color: '#f1f5f9', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 10 }}>{t.ctaTitle}</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{t.ctaSub}</p>
            <Link href="/access" style={{ padding: '11px 24px', borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              {t.ctaBtn}
            </Link>
          </div>
        </div>
      </div>

      <SimpleFooter lang={lang} />
    </div>
  )
}