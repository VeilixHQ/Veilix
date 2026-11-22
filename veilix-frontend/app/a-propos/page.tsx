'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'
import { PT } from '@/lib/translations-pages'

export default function APropos() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const pt = PT[lang].apropos

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{pt.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>{pt.title}</h1>
          <p style={{ fontSize: 16, color: 'var(--c-64748b)', lineHeight: 1.8 }}>{pt.intro}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ padding: '28px', background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 14 }}>{pt.origin.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8 }}>{pt.origin.content}</p>
          </div>

          <div style={{ padding: '28px', background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 14 }}>{pt.philosophy.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8, marginBottom: 16 }}>{pt.philosophy.content}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: lang === 'fr' ? 'No Account : Aucune inscription requise' : 'No Account: No sign-up required', color: '#000091' },
                { label: lang === 'fr' ? 'No Logs : Vos emails ne sont jamais lus ni stockés' : 'No Logs: Your emails are never read or stored', color: '#FFFFFF' },
                { label: lang === 'fr' ? 'Open Source : Code entièrement auditable publiquement' : 'Open Source: Code entirely publicly auditable', color: '#E1000F' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 10 }}>{pt.ctaTitle}</h2>
            <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 20 }}>{pt.ctaSub}</p>
            <Link href="/access" style={{ padding: '11px 24px', borderRadius: 9, background: '#7c3aed', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{pt.ctaBtn}</Link>
          </div>

          <p style={{ fontSize: 13, color: 'var(--c-64748b)', textAlign: 'center' }}>
            {lang === 'fr' ? 'Partenariats : ' : 'Partnerships: '}
            <a href="mailto:partnership@veilix.fr" style={{ color: 'var(--c-a78bfa)', textDecoration: 'none', fontWeight: 600 }}>partnership@veilix.fr</a>
            {lang === 'fr' ? ' · Questions générales : ' : ' · General enquiries: '}
            <a href="mailto:contact@veilix.fr" style={{ color: 'var(--c-a78bfa)', textDecoration: 'none', fontWeight: 600 }}>contact@veilix.fr</a>
          </p>
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  )
}