'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Lang } from '@/lib/translations'

export function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const flags: Record<Lang, string> = { fr: '/flag-fr.svg', en: '/flag-en.svg' }
  const labels: Record<Lang, string> = { fr: 'FR', en: 'EN' }
  const other: Lang = lang === 'fr' ? 'en' : 'fr'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)', background: 'transparent', border: '1px solid rgba(var(--ink),0.08)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', minWidth: 68, justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(var(--ink),0.16)'; e.currentTarget.style.color = 'var(--c-f1f5f9)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(var(--ink),0.08)'; e.currentTarget.style.color = 'var(--c-94a3b8)' }}
      >
        <Image src={flags[lang]} alt={labels[lang]} width={16} height={12} style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, width: 16, height: 12 }} />
        <span>{labels[lang]}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'var(--c-111118)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 9, padding: 6, minWidth: 80, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 200, animation: 'fadeUp 0.15s ease' }}>
          <button
            onClick={() => { setLang(other); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)', fontFamily: 'Inter, sans-serif', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Image src={flags[other]} alt={labels[other]} width={16} height={12} style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, width: 16, height: 12 }} />
            <span>{labels[other]}</span>
          </button>
        </div>
      )}
    </div>
  )
}