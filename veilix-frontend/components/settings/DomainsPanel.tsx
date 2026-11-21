'use client'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, CustomDomain, addDomain, deleteDomain, getAccount, getAliases, getDomains, setCatchAll, verifyDomain } from '@/lib/api'
import { FT, errorMessage } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'
import { CARD, CopyButton, INPUT, MONO, PackUpsell, buttonStyle, isPack } from './shared'

type Notify = (message: string, type: 'success' | 'error' | 'info') => void

export function DomainsPanel({ lang, plan, onToast }: { lang: Lang; plan: string; onToast: Notify }) {
  const t = FT[lang].settings
  const [domains, setDomains] = useState<CustomDomain[] | null>(null)
  const [destinations, setDestinations] = useState<string[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [choice, setChoice] = useState<Record<number, string>>({})
  const [available, setAvailable] = useState<boolean | null>(null)

  const fail = useCallback((error: unknown) => {
    onToast(errorMessage(lang, error instanceof ApiError ? error.message : null, t.error), 'error')
  }, [lang, onToast, t.error])

  useEffect(() => {
    if (!isPack(plan)) return
    let alive = true
    getAccount().then(account => {
      if (!alive) return
      const enabled = Boolean(account.custom_domains_available)
      setAvailable(enabled)
      if (enabled) getDomains().then(list => { if (alive) setDomains(list) }).catch(() => { if (alive) setDomains([]) })
    }).catch(() => { if (alive) setAvailable(false) })
    getAliases().then((list: { destination_email: string }[]) => {
      if (alive && Array.isArray(list)) setDestinations(Array.from(new Set(list.map(a => a.destination_email))))
    }).catch(() => {})
    return () => { alive = false }
  }, [plan])

  if (!isPack(plan)) return <PackUpsell lang={lang} title={t.domainsTitle} desc={t.domainsDesc} />

  if (available === null) return <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{t.loading}</p>

  if (!available) {
    return (
      <div style={{ ...CARD, textAlign: 'center', padding: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', background: 'rgba(124,58,237,0.12)', padding: '4px 10px', borderRadius: 6 }}>{t.soonBadge}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 8, color: 'var(--c-f1f5f9)' }}>{t.domainsTitle}</h2>
        <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>{t.soonDesc}</p>
      </div>
    )
  }

  function replace(updated: CustomDomain) {
    setDomains(prev => (prev || []).map(d => (d.id === updated.id ? updated : d)))
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy('add')
    try {
      const created = await addDomain(name.trim())
      setDomains(prev => [...(prev || []), created])
      setName('')
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  async function verify(domain: CustomDomain) {
    setBusy(`verify-${domain.id}`)
    try {
      const updated = await verifyDomain(domain.id)
      replace(updated)
      onToast(updated.verified ? t.verifyOk : t.verifyKo, updated.verified ? 'success' : 'info')
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  async function toggleCatchAll(domain: CustomDomain) {
    setBusy(`catch-${domain.id}`)
    try {
      const destination = choice[domain.id] || domain.catch_all_destination || destinations[0]
      replace(await setCatchAll(domain.id, !domain.catch_all, destination))
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  async function remove(domain: CustomDomain) {
    if (!confirm(`${t.deleteDomain} : ${domain.domain} ?`)) return
    try {
      await deleteDomain(domain.id)
      setDomains(prev => (prev || []).filter(d => d.id !== domain.id))
    } catch (error) {
      fail(error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={CARD}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t.domainsTitle}</h2>
        <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 16, lineHeight: 1.6 }}>{t.domainsDesc}</p>
        <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t.domainPlaceholder} aria-label={t.domainPlaceholder} style={{ ...INPUT, fontFamily: MONO }} />
          <button type="submit" disabled={busy === 'add' || !name.trim() || (domains?.length ?? 0) >= 3} style={{ ...buttonStyle('primary'), opacity: !name.trim() || (domains?.length ?? 0) >= 3 ? 0.5 : 1 }}>{t.addDomain}</button>
        </form>
      </div>

      {domains === null ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{t.loading}</p>
      ) : domains.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)', textAlign: 'center', padding: 16 }}>{t.noDomains}</p>
      ) : domains.map(domain => (
        <div key={domain.id} style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, color: 'var(--c-f1f5f9)' }}>{domain.domain}</div>
              <div style={{ fontSize: 12, color: 'var(--c-64748b)', marginTop: 2 }}>{t.aliasesCount(domain.aliases)}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: domain.verified ? 'var(--c-4ade80)' : 'var(--c-fbbf24)', background: domain.verified ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${domain.verified ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.28)'}` }}>
              {domain.verified ? t.verified : t.pending}
            </span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)', marginBottom: 8 }}>{t.records}</div>
          <div style={{ border: '1px solid rgba(var(--ink),0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
            {domain.records.map((record, i) => (
              <div key={`${record.type}-${record.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: '90px 56px minmax(0,1fr)', gap: 10, padding: '10px 12px', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--ink),0.05)', fontSize: 12, alignItems: 'start' }}>
                <span style={{ color: 'var(--c-64748b)' }}>{t.purpose[record.purpose] ?? record.purpose}</span>
                <span style={{ fontFamily: MONO, color: 'var(--c-a78bfa)' }}>{record.type}{record.priority ? ` ${record.priority}` : ''}</span>
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, color: 'var(--c-e2e8f0)', wordBreak: 'break-all' }}>{record.name}</span>
                    <CopyButton value={record.name} lang={lang} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, color: 'var(--c-94a3b8)', wordBreak: 'break-all' }}>{record.value}</span>
                    <CopyButton value={record.value} lang={lang} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: domain.verified ? 18 : 0 }}>
            <button type="button" onClick={() => verify(domain)} disabled={busy === `verify-${domain.id}`} style={buttonStyle(domain.verified ? 'secondary' : 'primary')}>{t.verify}</button>
            <button type="button" onClick={() => remove(domain)} style={buttonStyle('danger')}>{t.deleteDomain}</button>
          </div>

          {domain.verified && (
            <div style={{ borderTop: '1px solid rgba(var(--ink),0.06)', paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.catchAll}</div>
              <p style={{ fontSize: 12, color: 'var(--c-64748b)', marginBottom: 12, lineHeight: 1.6 }}>{t.catchAllDesc}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  aria-label={t.catchAllDestination}
                  value={choice[domain.id] ?? domain.catch_all_destination ?? destinations[0] ?? ''}
                  onChange={e => setChoice(prev => ({ ...prev, [domain.id]: e.target.value }))}
                  disabled={domain.catch_all}
                  style={{ ...INPUT, width: 'auto', minWidth: 220, flex: 1 }}
                >
                  {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="button" onClick={() => toggleCatchAll(domain)} disabled={busy === `catch-${domain.id}` || destinations.length === 0} style={buttonStyle(domain.catch_all ? 'secondary' : 'primary')}>
                  {domain.catch_all ? t.disable : t.enable}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
