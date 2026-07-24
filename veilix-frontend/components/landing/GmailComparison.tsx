'use client'
import { useRef } from 'react'
import { FadeInSection } from './Utils'
import { useOnScreen, useCounter } from '@/lib/hooks'
import { Translations } from '@/lib/translations'

function GmailCard({ t }: { t: Translations }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(ref)
  const spamCount = useCounter(9247, visible, 1800)
  const cleanCount = useCounter(8, visible, 800)

  const cols = [
    {
      border: 'rgba(239,68,68,0.2)', bg: 'rgba(239,68,68,0.03)', dot: '#ef4444',
      label: t.gmailBefore, labelColor: '#f87171', borderInner: 'rgba(239,68,68,0.1)',
      count: visible ? spamCount.toLocaleString('fr-FR') : '0',
      countBg: '#EA4335', countColor: '#fff',
      rows: t.gmailRowsBefore, msg: t.gmailMsgBefore, time: t.gmailNow,
      extra: (
        <div style={{ padding: '8px 14px', textAlign: 'center' as const }}>
          <span style={{ fontSize: 10, color: '#EA4335', fontWeight: 600 }}>
            + {visible ? (spamCount - 5).toLocaleString('fr-FR') : '0'} {t.gmailSpam}
          </span>
        </div>
      ),
      desc: t.gmailBeforeDesc,
    },
    {
      border: 'rgba(124,58,237,0.2)', bg: 'rgba(124,58,237,0.04)', dot: '#a78bfa',
      label: t.gmailAfter, labelColor: '#a78bfa', borderInner: 'rgba(124,58,237,0.1)',
      count: visible ? cleanCount : '0',
      countBg: '#4ade80', countColor: '#052e16',
      rows: t.gmailRowsAfter, msg: t.gmailMsgAfter, time: t.gmailToday,
      extra: null,
      desc: t.gmailAfterDesc,
    },
  ]

  return (
    <div ref={ref} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {cols.map((col, ci) => (
        <div key={ci} className="comp-card" style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${col.border}`, background: col.bg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${col.borderInner}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: col.labelColor, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{col.label}</span>
          </div>
          <div style={{ background: '#fff', margin: 16, borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#f6f8fc', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#EA4335"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#202124' }}>Gmail</span>
              </div>
              <div style={{ fontSize: 11, background: col.countBg, color: col.countColor, borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>{col.count}</div>
            </div>
            {col.rows.map((s, i) => (
              <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid #f1f3f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#202124' }}>{s}</div>
                  <div style={{ fontSize: 10, color: '#5f6368' }}>{col.msg}</div>
                </div>
                <div style={{ fontSize: 10, color: '#5f6368' }}>{col.time}</div>
              </div>
            ))}
            {col.extra}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textAlign: 'center' }}>{col.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function GmailComparison({ t }: { t: Translations }) {
  return (
    <section style={{ padding: '96px 24px', background: '#060608' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <FadeInSection>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{t.whyKicker}</div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.1 }}>{t.whyTitle}</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 48 }}>{t.whySub}</p>
        </FadeInSection>
        <FadeInSection delay={100}>
          <GmailCard t={t} />
        </FadeInSection>
      </div>
    </section>
  )
}