'use client'
import { useEffect, useState } from 'react'
import { ApiError, PgpStatus, deletePgp, getPgp, savePgpKey, togglePgp } from '@/lib/api'
import { FT, errorMessage } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'
import { CARD, MONO, PackUpsell, buttonStyle, isPack } from './shared'

export function PgpPanel({ lang, plan, onToast }: { lang: Lang; plan: string; onToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const t = FT[lang].settings
  const [status, setStatus] = useState<PgpStatus | null>(null)
  const [armored, setArmored] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getPgp().then(value => { if (alive) setStatus(value) }).catch(() => { if (alive) setStatus({ configured: false, enabled: false, fingerprint: null, user_ids: [], expires_at: null }) })
    return () => { alive = false }
  }, [])


  async function run(action: () => Promise<PgpStatus>, success?: string) {
    setBusy(true)
    try {
      setStatus(await action())
      if (success) onToast(success, 'success')
    } catch (error) {
      onToast(errorMessage(lang, error instanceof ApiError ? error.message : null, t.error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const fingerprint = status?.fingerprint?.toUpperCase().match(/.{1,4}/g)?.join(' ')

  if (!isPack(plan)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PackUpsell lang={lang} title={t.pgpTitle} desc={t.pgpDesc} />
        {status?.configured && (
          <div style={{ ...CARD, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>{t.pgpKept}</span>
            <button type="button" disabled={busy} onClick={() => run(deletePgp)} style={buttonStyle('danger')}>{t.pgpRemove}</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={CARD}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t.pgpTitle}</h2>
      <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 6, lineHeight: 1.6 }}>{t.pgpDesc}</p>
      <p style={{ fontSize: 12, color: 'var(--c-475569)', marginBottom: 18 }}>{t.pgpSubjectNote}</p>

      {status === null ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{t.loading}</p>
      ) : status.configured ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.enabled ? 'var(--c-4ade80)' : 'var(--c-fbbf24)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: status.enabled ? 'var(--c-4ade80)' : 'var(--c-fbbf24)' }}>{status.enabled ? t.pgpActive : t.pgpPaused}</span>
          </div>
          <dl style={{ border: '1px solid rgba(var(--ink),0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 16, fontSize: 12 }}>
            {status.user_ids.map(uid => (
              <div key={uid} style={{ padding: '10px 12px', color: 'var(--c-e2e8f0)' }}>{uid}</div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, padding: '10px 12px', borderTop: '1px solid rgba(var(--ink),0.05)' }}>
              <dt style={{ color: 'var(--c-64748b)' }}>{t.pgpFingerprint}</dt>
              <dd style={{ fontFamily: MONO, color: 'var(--c-94a3b8)', wordBreak: 'break-all' }}>{fingerprint}</dd>
            </div>
            {status.expires_at && (
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, padding: '10px 12px', borderTop: '1px solid rgba(var(--ink),0.05)' }}>
                <dt style={{ color: 'var(--c-64748b)' }}>{t.pgpExpires}</dt>
                <dd style={{ color: 'var(--c-94a3b8)' }}>{new Date(status.expires_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</dd>
              </div>
            )}
          </dl>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={busy} onClick={() => run(() => togglePgp(!status.enabled))} style={buttonStyle('secondary')}>{status.enabled ? t.pgpPause : t.pgpResume}</button>
            <button type="button" disabled={busy} onClick={() => run(deletePgp)} style={buttonStyle('danger')}>{t.pgpRemove}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (armored.trim()) run(() => savePgpKey(armored.trim()), t.pgpSaved) }}>
          <textarea
            value={armored}
            onChange={e => setArmored(e.target.value)}
            placeholder={t.pgpPlaceholder}
            aria-label={t.pgpTitle}
            rows={8}
            spellCheck={false}
            style={{ width: '100%', padding: '12px 14px', background: 'var(--c-060608)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 10, fontSize: 12, color: 'var(--c-e2e8f0)', fontFamily: MONO, resize: 'vertical', outline: 'none', marginBottom: 12 }}
          />
          <button type="submit" disabled={busy || !armored.trim()} style={{ ...buttonStyle('primary'), opacity: armored.trim() ? 1 : 0.5 }}>{t.pgpSave}</button>
        </form>
      )}
    </div>
  )
}
