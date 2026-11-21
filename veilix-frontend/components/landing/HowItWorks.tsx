'use client'

import { FadeInSection } from './Utils'
import { Translations } from '@/lib/translations'

export function HowItWorks({ t }: { t: Translations }) {
  return (
    <section id="how" style={{ padding: '96px 24px', background: 'var(--c-060608)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <FadeInSection>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>
            {t.howKicker}
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 52, lineHeight: 1.1 }}>
            {t.howTitle}
          </h2>
        </FadeInSection>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <FadeInSection>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {t.howSteps.map((s) => (
                <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--c-a78bfa)' }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
                      {s.title}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--c-64748b)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div style={{ background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 14, overflow: 'hidden' }}>
              
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(var(--ink),0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)' }}>
                  {t.howVisualTitle}
                </span>
                <span style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--c-a78bfa)' }}>
                  {t.howVisualBtn}
                </span>
              </div>

              {t.howVisualLast && (
                <div style={{ padding: '14px 18px', background: 'rgba(124,58,237,0.04)', borderBottom: '1px solid rgba(var(--ink),0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-a78bfa)', marginBottom: 4 }}>
                    {t.howVisualLast.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-e2e8f0)' }}>
                    {t.howVisualLast.msg}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-64748b)', marginTop: 2 }}>
                    {t.howVisualLast.via}
                  </div>
                </div>
              )}

              {t.howVisualRows.map((r, i) => {
                const isBlocked = r.info?.includes('spams') || r.info?.includes('blocked')
                return (
                  <div
                    key={i}
                    style={{
                      padding: '13px 18px',
                      borderBottom: i < t.howVisualRows.length - 1 ? '1px solid rgba(var(--ink),0.03)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--c-e2e8f0)', marginBottom: 2 }}>
                        {r.email}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-64748b)' }}>
                        {r.label}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: isBlocked ? '#f43f5e' : 'var(--c-94a3b8)',
                        background: isBlocked ? 'rgba(244,63,94,0.1)' : 'rgba(var(--ink),0.03)',
                        border: isBlocked ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(var(--ink),0.05)',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {r.info}
                    </span>
                  </div>
                )
              })}

            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  )
}