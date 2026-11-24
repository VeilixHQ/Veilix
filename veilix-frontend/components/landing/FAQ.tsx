'use client'
import { useState } from 'react'
import { FadeInSection } from './Utils'
import { Translations } from '@/lib/translations'

export function FAQ({ t }: { t: Translations }) {
  const [open, setOpen] = useState<number | null>(null)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
  }

  return (
    <section style={{ padding: '96px 24px', background: 'var(--c-0d0d10)', borderTop: '1px solid rgba(var(--ink),0.06)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <FadeInSection>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12, textAlign: 'center' }}>{t.faqKicker}</div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 52, lineHeight: 1.1, textAlign: 'center' }}>{t.faqTitle}</h2>
        </FadeInSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {t.faqs.map((faq, i) => (
            <FadeInSection key={i} delay={i * 60}>
              <div style={{ background: 'var(--c-060608)', border: `1px solid ${open === i ? 'rgba(124,58,237,0.3)' : 'rgba(var(--ink),0.06)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-e2e8f0)' }}>{faq.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 12, transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'rotate(0)' }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div hidden={open !== i} style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.75 }}>{faq.a}</div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )
}