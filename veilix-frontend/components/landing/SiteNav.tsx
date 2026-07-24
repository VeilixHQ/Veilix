'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lang, Translations } from '@/lib/translations'

function NavDropdown({ label, items }: { label: string; items: { label: string; desc: string; href: string }[] }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enter = () => { if (timer.current) clearTimeout(timer.current); setOpen(true) }
  const leave = () => { timer.current = setTimeout(() => setOpen(false), 120) }

  return (
    <div style={{ position: 'relative' }} onMouseEnter={enter} onMouseLeave={leave}>
      <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontFamily: 'Inter, sans-serif' }}>
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)', color: open ? '#a78bfa' : '#64748b' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div onMouseEnter={enter} onMouseLeave={leave} style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 8, zIndex: 200 }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, minWidth: 240, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fadeUp 0.15s ease' }}>
            {items.map((item, i) => (
              <a key={i} href={item.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#94a3b8', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', minWidth: 68, justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#f1f5f9' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}>
        <Image src={flags[lang]} alt={labels[lang]} width={16} height={12} style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, width: 16, height: 12 }} />
        <span>{labels[lang]}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: 6, minWidth: 80, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 200, animation: 'fadeUp 0.15s ease' }}>
          <button onClick={() => { setLang(other); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'Inter, sans-serif', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Image src={flags[other]} alt={labels[other]} width={16} height={12} style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, width: 16, height: 12 }} />
            <span>{labels[other]}</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface SiteNavProps {
  t: Translations
  lang: Lang
  setLang: (l: Lang) => void
  
  mode?: 'public' | 'auth' | 'app'
  hideNavLinks?: boolean
  rightSlot?: React.ReactNode // pour insérer le UserMenu dans le dashboard
}

const LOGO_SIZE = 48

export function SiteNav({ t, lang, setLang, mode = 'public', hideNavLinks = false, rightSlot }: SiteNavProps) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, background: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
          <Image src="/vlx-white.svg" alt="Veilix" width={LOGO_SIZE} height={LOGO_SIZE} style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff', whiteSpace: 'nowrap' }}>Veilix</span>
        </Link>
        {!hideNavLinks && mode === 'public' && (
          <div className="nav-center-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <NavDropdown label={t.nav.services} items={[...t.navServices]} />
            <NavDropdown label={t.nav.explorer} items={[...t.navExplorer]} />
            <Link href="/pricing" className="nav-link" style={{ padding: '4px 8px', textDecoration: 'none' }}>{t.nav.pricing}</Link>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LangSwitcher lang={lang} setLang={setLang} />
        {mode === 'public' && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
            <Link href="/access" className="btn-access">{t.nav.login}</Link>
            <Link href="/access" className="btn-start">{t.nav.start}</Link>
          </>
        )}
        {mode === 'auth' && (
          <Link href="/" className="nav-link" style={{ textDecoration: 'none' }}>
            ← {lang === 'fr' ? "Retour à l'accueil" : 'Back to home'}
          </Link>
        )}
        {mode === 'app' && rightSlot}
      </div>
    </nav>
  )
}