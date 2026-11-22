'use client'
import { useEffect, useRef, useState } from 'react'
import { useOnScreen, useCounter } from '@/lib/hooks'
import { Translations } from '@/lib/translations'

export function ProofSection({ t }: { t: Translations }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(ref)
  const [stage, setStage] = useState(0)
  const pct = useCounter(100, stage >= 1, 1200)
  const p = t.proof

  useEffect(() => {
    if (!visible) return
    const t1 = setTimeout(() => setStage(1), 100)
    const t2 = setTimeout(() => setStage(2), 1500)
    const t3 = setTimeout(() => setStage(3), 2200)
    const t4 = setTimeout(() => setStage(4), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [visible])

  const fi = (s: number, delay = 0): React.CSSProperties => ({
    opacity: stage >= s ? 1 : 0,
    transform: stage >= s ? 'translateY(0)' : 'translateY(10px)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  })

  return (
    <div ref={ref} style={{ padding: '56px 24px', borderTop: '1px solid rgba(var(--ink),0.06)', borderBottom: '1px solid rgba(var(--ink),0.06)', background: 'var(--c-080810)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: 110, ...fi(1) }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--c-f1f5f9)', fontVariantNumeric: 'tabular-nums' }}>{stage >= 1 ? `${pct}%` : '0%'}</div>
          <div style={{ fontSize: 12, color: 'var(--c-64748b)', fontWeight: 500, marginTop: 4, ...fi(2, 100) }}>{p.p1l}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(var(--ink),0.06)', ...fi(2) }} />
        <div style={{ textAlign: 'center', minWidth: 110, ...fi(3) }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--c-f1f5f9)' }}>{p.p2n}</div>
          <div style={{ fontSize: 12, color: 'var(--c-64748b)', fontWeight: 500, marginTop: 4 }}>{p.p2l}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(var(--ink),0.06)', ...fi(3) }} />
        <div style={{ textAlign: 'center', minWidth: 110, ...fi(4) }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--c-f1f5f9)' }}>{p.p3n}</div>
          <div style={{ fontSize: 12, color: 'var(--c-64748b)', fontWeight: 500, marginTop: 4 }}>{p.p3l}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(var(--ink),0.06)', ...fi(4) }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', ...fi(4, 200) }}>
          {[{ dot: 'var(--c-4ade80)', label: p.b1 }, { dot: 'var(--c-a78bfa)', label: p.b2 }, { dot: 'var(--c-60a5fa)', label: p.b3 }].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, background: 'rgba(var(--ink),0.02)', border: '1px solid rgba(var(--ink),0.06)', fontSize: 12, color: 'var(--c-94a3b8)', fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.dot, display: 'inline-block', flexShrink: 0 }} />{b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}