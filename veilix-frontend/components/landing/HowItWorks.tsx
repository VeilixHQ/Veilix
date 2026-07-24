'use client'
import { FadeInSection } from './Utils'
import { Translations } from '@/lib/translations'

export function HowItWorks({ t }: { t: Translations }) {
  return (
    <section id="how" style={{ padding: '96px 24px', background: '#060608' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <FadeInSection>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{t.howKicker}</div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 52, lineHeight: 1.1 }}>{t.howTitle}</h2>
        </FadeInSection>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <FadeInSection>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {t.howSteps.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
          <FadeInSection delay={100}>
            <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{t.howVisualTitle}</span>
                <span style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>{t.howVisualBtn}</span>
              </div>
              {t.howVisualRows.map((r, i) => (
                <div key={i} style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0', marginBottom: 3 }}>{r.email}</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>{r.meta}</div>
                </div>
              ))}
              <div style={{ padding: '14px 18px', background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.1)' }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 5 }}>{t.howVisualLast.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.howVisualLast.msg}</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{t.howVisualLast.via}</div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  )
}
