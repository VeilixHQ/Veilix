'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Particles } from './Particles'
import { Translations } from '@/lib/translations'
import { SIGNUP_OPEN, START_HREF } from '@/lib/launch'

function HeroDemo({ t }: { t: Translations }) {
  const [count, setCount] = useState(99)
  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    if (!disabled) return
    const id = setInterval(() => setCount(c => c + 1), 1800)
    return () => clearInterval(id)
  }, [disabled])

  return (
    <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1, background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.07)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderBottom: '1px solid rgba(var(--ink),0.06)', background: 'rgba(var(--ink),0.015)' }}>
        {['var(--c-ef4444)', '#f59e0b', 'var(--c-22c55e)'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />)}
        <span style={{ fontSize: 11, color: 'var(--c-334155)', marginLeft: 8, fontWeight: 500 }}>{t.demoUrl}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px 9px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-334155)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t.demoLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--c-a78bfa)', fontWeight: 600 }}>3 alias</span>
      </div>
      {[{ email: 'x7k2m9pl4q@alias.veilix.fr', label: 'Shopping' }, { email: 'r3n8w5jt2a@alias.veilix.fr', label: 'Gaming' }].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderTop: '1px solid rgba(var(--ink),0.04)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'monospace', color: 'var(--c-e2e8f0)', marginBottom: 3 }}>{r.email}</div>
            <div style={{ fontSize: 11, color: 'var(--c-334155)' }}>{r.label}</div>
          </div>
          <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: 'rgba(34,197,94,0.08)', color: 'var(--c-4ade80)', border: '1px solid rgba(34,197,94,0.18)' }}>{t.active}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderTop: '1px solid rgba(var(--ink),0.04)', background: disabled ? 'rgba(239,68,68,0.03)' : 'transparent', transition: 'background 0.4s' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'monospace', color: disabled ? 'var(--c-94a3b8)' : 'var(--c-e2e8f0)', marginBottom: 3, transition: 'color 0.4s', textDecoration: disabled ? 'line-through' : 'none' }}>m6p1s4yz8b@alias.veilix.fr</div>
          <div style={{ fontSize: 11, color: 'var(--c-334155)' }}>
            Newsletter{' '}
            {disabled && (
              <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: 'var(--c-f87171)', border: '1px solid rgba(239,68,68,0.2)' }}>{count}+</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: disabled ? 'rgba(100,116,139,0.1)' : 'rgba(34,197,94,0.08)', color: disabled ? 'var(--c-64748b)' : 'var(--c-4ade80)', border: `1px solid ${disabled ? 'rgba(100,116,139,0.2)' : 'rgba(34,197,94,0.18)'}`, transition: 'all 0.4s' }}>
            {disabled ? t.disabled : t.active}
          </span>
          <button
            onClick={() => { setDisabled(d => !d); if (disabled) setCount(0) }}
            style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: disabled ? 'rgba(124,58,237,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${disabled ? 'rgba(124,58,237,0.25)' : 'rgba(239,68,68,0.25)'}`, color: disabled ? 'var(--c-a78bfa)' : 'var(--c-f87171)', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          >
            {disabled ? t.reactivate : t.deactivate}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Hero({ t }: { t: Translations }) {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
      <Particles />
      <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <h1 className="hero-h1" style={{ position: 'relative', zIndex: 1, maxWidth: 900, animation: 'fadeUp 0.6s ease 0.1s both' }}>
        <span style={{ display: 'block', fontSize: 'clamp(30px, 4.5vw, 56px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-2px', marginBottom: 4 }}>{t.h1a}</span>
        <span style={{ display: 'block', fontSize: 'clamp(22px, 3.2vw, 40px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', color: 'var(--c-a78bfa)' }}>{t.h1b}</span>
      </h1>

      <p style={{ fontSize: 16, color: 'var(--c-64748b)', maxWidth: 500, lineHeight: 1.8, marginBottom: 36, marginTop: 18, position: 'relative', zIndex: 1, animation: 'fadeUp 0.6s ease 0.2s both' }}>
        {t.sub1}<br />{t.sub2}
      </p>

      <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64, animation: 'fadeUp 0.6s ease 0.3s both' }}>
        <Link href={START_HREF} style={{ padding: '12px 24px', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', background: '#7c3aed', textDecoration: 'none', boxShadow: '0 0 0 1px rgba(124,58,237,0.3)' }}>{SIGNUP_OPEN ? t.cta1 : t.waitlist.cta}</Link>
        <a href="#how" style={{ padding: '12px 24px', borderRadius: 9, fontSize: 14, fontWeight: 600, color: 'var(--c-94a3b8)', border: '1px solid rgba(var(--ink),0.07)', textDecoration: 'none' }}>{t.cta2}</a>
      </div>

      <div style={{ animation: 'fadeUp 0.6s ease 0.4s both', width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <HeroDemo t={t} />
      </div>
    </section>
  )
}
