'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SimpleNav } from '@/components/landing/SimpleNav'
import { SimpleFooter } from '@/components/landing/SimpleFooter'
import { Button } from '@/components/Button'
import { PT } from '@/lib/translations-pages'
import { Lang } from '@/lib/translations'

export default function Pricing() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = PT[lang].pricing
  const back = PT[lang].back

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .plan-card{transition:transform .25s, border-color .2s}
        .plan-card:hover{transform:translateY(-4px)}
        @media(max-width:860px){
          .plans-grid{grid-template-columns:1fr!important}
          .credits-row{flex-direction:column!important}
        }
      `}</style>

      <SimpleNav lang={lang} setLang={setLang} backLabel={back} />

      {}
      <section style={{ padding: '140px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.6s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>{t.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 16 }}>{t.title}</h1>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>{t.subtitle}</p>
        </div>
      </section>

      {}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="plans-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {t.plans.map((plan, i) => {
            const highlight = plan.name === 'Pro'
            const disabled = plan.name === 'Business'
            return (
              <div
                key={i}
                className="plan-card"
                style={{
                  position: 'relative',
                  background: highlight ? 'linear-gradient(180deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))' : '#0d0d10',
                  border: highlight ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: '32px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {highlight && (
                  <div style={{ position: 'absolute', top: -12, left: 26, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    {t.popular}
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{plan.period}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? '#a78bfa' : '#4ade80'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                {disabled ? (
                  <Button variant="secondary" size="md" disabled style={{ width: '100%', cursor: 'not-allowed' }}>{plan.cta}</Button>
                ) : (
                  <Link href={plan.name === 'Pro' ? '/access?plan=pro' : '/access'} style={{ textDecoration: 'none' }}>
                    <Button variant={highlight ? 'primary' : 'secondary'} size="md" style={{ width: '100%' }}>{plan.cta}</Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {}
      <section style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px' }}>
          <div className="credits-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 380 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 8 }}>{t.creditsTitle}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{t.creditsDesc}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {t.creditsPacks.map((pack, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '14px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', minWidth: 100 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{pack.price}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{pack.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {}
      <section style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 32, textAlign: 'center' }}>{t.faqTitle}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {t.faqs.map((faq, i) => (
              <PricingFAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {}
      <section style={{ padding: '80px 24px 100px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>{t.ctaTitle}</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>{t.ctaSub}</p>
        <Link href="/access" style={{ padding: '13px 28px', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', textDecoration: 'none' }}>
          {t.ctaBtn}
        </Link>
      </section>

      <SimpleFooter lang={lang} />
    </div>
  )
}

function PricingFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#0d0d10', border: `1px solid ${open ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{q}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 12, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 18px 16px', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{a}</div>}
    </div>
  )
}