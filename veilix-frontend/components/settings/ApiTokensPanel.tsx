'use client'
import { useEffect, useState } from 'react'
import { ApiError, ApiToken, createApiToken, getApiTokens, revokeApiToken } from '@/lib/api'
import { FT, errorMessage } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'
import { CARD, CopyButton, INPUT, MONO, PackUpsell, buttonStyle, isPack } from './shared'

export function ApiTokensPanel({ lang, plan, apiUrl, onToast }: { lang: Lang; plan: string; apiUrl: string; onToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const t = FT[lang].settings
  const [tokens, setTokens] = useState<ApiToken[] | null>(null)
  const [name, setName] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isPack(plan)) return
    let alive = true
    getApiTokens().then(list => { if (alive) setTokens(list) }).catch(() => { if (alive) setTokens([]) })
    return () => { alive = false }
  }, [plan])

  if (!isPack(plan)) return <PackUpsell lang={lang} title={t.apiTitle} desc={t.apiDesc} />

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const token = await createApiToken(name.trim())
      setTokens(prev => [token, ...(prev || [])])
      setCreated(token.token)
      setName('')
    } catch (error) {
      onToast(errorMessage(lang, error instanceof ApiError ? error.message : null, t.error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: number) {
    try {
      await revokeApiToken(id)
      setTokens(prev => (prev || []).filter(token => token.id !== id))
      onToast(t.apiRevoked, 'info')
    } catch {
      onToast(t.error, 'error')
    }
  }

  const example = `curl ${apiUrl}/alias \\\n  -H "Authorization: Bearer ${created ?? 'vlx_...'}"`

  return (
    <div style={CARD}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t.apiTitle}</h2>
      <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 16, lineHeight: 1.6 }}>{t.apiDesc}</p>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={name} onChange={e => setName(e.target.value.slice(0, 64))} placeholder={t.apiNamePlaceholder} aria-label={t.apiName} style={INPUT} />
        <button type="submit" disabled={busy || !name.trim()} style={{ ...buttonStyle('primary'), opacity: name.trim() ? 1 : 0.5 }}>{t.apiCreate}</button>
      </form>
      {created && (
        <div role="status" style={{ border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--c-fbbf24)', marginBottom: 8 }}>{t.apiCreated}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--c-f1f5f9)', wordBreak: 'break-all', flex: 1 }}>{created}</code>
            <CopyButton value={created} lang={lang} />
          </div>
        </div>
      )}
      {tokens === null ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{t.loading}</p>
      ) : tokens.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 16 }}>{t.apiEmpty}</p>
      ) : (
        <ul style={{ listStyle: 'none', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {tokens.map((token, i) => (
            <li key={token.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--ink),0.05)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--c-e2e8f0)' }}>{token.name}</div>
                <div style={{ fontSize: 11, color: 'var(--c-64748b)', fontFamily: MONO }}>{token.prefix}… · {new Date(token.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</div>
              </div>
              <button type="button" onClick={() => revoke(token.id)} style={buttonStyle('danger')}>{t.apiRevoke}</button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)', marginBottom: 8 }}>{t.apiExample}</div>
      <pre style={{ background: '#070709', padding: 14, borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, fontFamily: MONO, color: 'var(--c-e2e8f0)', overflowX: 'auto', margin: 0 }}>{example}</pre>
    </div>
  )
}
