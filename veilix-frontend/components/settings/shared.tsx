'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FT } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'

export const CARD: React.CSSProperties = { background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 14, padding: 24 }
export const MONO = 'ui-monospace, Menlo, Consolas, monospace'
export const INPUT: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--c-060608)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 8, fontSize: 13, color: 'var(--c-f1f5f9)', outline: 'none', fontFamily: 'Inter, sans-serif' }

export function buttonStyle(kind: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties {
  const base: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }
  if (kind === 'primary') return { ...base, background: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' }
  if (kind === 'danger') return { ...base, background: 'rgba(239,68,68,0.08)', color: 'var(--c-f87171)', border: '1px solid rgba(239,68,68,0.25)' }
  return { ...base, background: 'transparent', color: 'var(--c-e2e8f0)', border: '1px solid rgba(var(--ink),0.1)' }
}

export function isPack(plan: string) {
  return ['pack', 'premium', 'admin'].includes(plan)
}

export function PackUpsell({ lang, title, desc }: { lang: Lang; title: string; desc: string }) {
  const t = FT[lang].settings
  return (
    <div style={{ ...CARD, border: '1px solid rgba(124,58,237,0.25)', textAlign: 'center', padding: 28 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', background: 'rgba(124,58,237,0.12)', padding: '4px 10px', borderRadius: 6 }}>{t.packBadge}</span>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 8, color: 'var(--c-f1f5f9)' }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>{desc}</p>
      <Link href="/pricing" style={{ ...buttonStyle('primary'), display: 'inline-block', textDecoration: 'none' }}>{t.upgrade}</Link>
    </div>
  )
}

export function CopyButton({ value, lang }: { value: string; lang: Lang }) {
  const [copied, setCopied] = useState(false)
  const t = FT[lang].settings
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          setCopied(false)
        }
      }}
      style={{ background: 'none', border: 'none', color: copied ? 'var(--c-4ade80)' : 'var(--c-a78bfa)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}
    >
      {copied ? t.copied : t.copy}
    </button>
  )
}
