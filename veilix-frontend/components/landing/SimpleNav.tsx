'use client'
import Link from 'next/link'
import Image from 'next/image'
import { LangSwitcher } from './LangSwitcher'
import { Lang } from '@/lib/translations'

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
  backLabel: string
}

export function SimpleNav({ lang, setLang, backLabel }: Props) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 58, background: 'rgba(var(--bg-rgb),0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(var(--ink),0.06)' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
        <Image src="/vlx-white.svg" alt="Veilix" width={28} height={28} style={{ objectFit: 'contain' }} />
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--c-heading)' }}>Veilix</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LangSwitcher lang={lang} setLang={setLang} />
        <Link href="/" style={{ fontSize: 13, color: 'var(--c-64748b)', textDecoration: 'none', fontWeight: 500 }}>{backLabel}</Link>
      </div>
    </nav>
  )
}