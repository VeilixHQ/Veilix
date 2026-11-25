'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'

export function ContentShell({ breadcrumb, parents = [], children }: { breadcrumb: string; parents?: { href: string; label: string }[]; children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" />
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '112px 24px 80px' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 28 }}>
          <Link href="/" style={{ color: 'var(--c-94a3b8)', textDecoration: 'none' }}>Accueil</Link>
          <span aria-hidden style={{ margin: '0 8px' }}>/</span>
          {parents.map(parent => (
            <span key={parent.href}>
              <Link href={parent.href} style={{ color: 'var(--c-94a3b8)', textDecoration: 'none' }}>{parent.label}</Link>
              <span aria-hidden style={{ margin: '0 8px' }}>/</span>
            </span>
          ))}
          <span aria-current="page">{breadcrumb}</span>
        </nav>
        <article className="content-article">{children}</article>
      </main>
      <SiteFooter t={t} />
    </div>
  )
}
