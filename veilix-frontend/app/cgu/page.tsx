'use client'
import { useState } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'
import { PT } from '@/lib/translations-pages'

export default function CGU() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const pt = PT[lang].cgu

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{pt.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{pt.title}</h1>
          <p style={{ fontSize: 13, color: '#475569' }}>{pt.updated}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {pt.sections.map((section, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, letterSpacing: '-0.2px' }}>{section.title}</h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  )
}