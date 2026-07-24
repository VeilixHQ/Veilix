'use client'
import { Translations } from '@/lib/translations'

export function PillarsStrip({ t }: { t: Translations }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0c' }}>
      {t.pillars.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 28px', borderRight: i < t.pillars.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.2px' }}>{p.label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
