'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SimpleNav } from '@/components/landing/SimpleNav'
import { SimpleFooter } from '@/components/landing/SimpleFooter'
import { PT } from '@/lib/translations-pages'
import { Lang } from '@/lib/translations'

export default function FAQPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = PT[lang].faq
  const back = PT[lang].back
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SimpleNav lang={lang} setLang={setLang} backLabel={back} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{t.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{t.title}</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>{t.sub}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {t.categories.map((cat, ci) => (
            <div key={ci}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>{cat.category}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cat.items.map((faq, fi) => {
                  const key = `${ci}-${fi}`
                  return (
                    <div key={fi} style={{ background: '#0d0d10', border: `1px solid ${open === key ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                      <button
                        onClick={() => setOpen(open === key ? null : key)}
                        style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{faq.q}</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 12, transition: 'transform 0.2s', transform: open === key ? 'rotate(45deg)' : 'rotate(0)' }}>
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      {open === key && (
                        <div style={{ padding: '0 18px 16px', fontSize: 14, color: '#64748b', lineHeight: 1.75 }}>{faq.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, padding: '24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>{t.notFound}</p>
          <Link href="/contact" style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            {t.contactUs}
          </Link>
        </div>
      </div>

      <SimpleFooter lang={lang} />
    </div>
  )
}