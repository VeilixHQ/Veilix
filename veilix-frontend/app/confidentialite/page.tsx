'use client'
import { useState } from 'react'
import { SimpleNav } from '@/components/landing/SimpleNav'
import { SimpleFooter } from '@/components/landing/SimpleFooter'
import { PT } from '@/lib/translations-pages'
import { Lang } from '@/lib/translations'

export default function Confidentialite() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = PT[lang].confidentialite
  const back = PT[lang].back

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SimpleNav lang={lang} setLang={setLang} backLabel={back} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{t.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{t.title}</h1>
          <p style={{ fontSize: 13, color: '#475569' }}>{t.updated}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {t.sections.map((section, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, letterSpacing: '-0.2px' }}>{section.title}</h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      <SimpleFooter lang={lang} />
    </div>
  )
}