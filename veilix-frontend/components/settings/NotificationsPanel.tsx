'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Preferences, getPreferences, savePreferences } from '@/lib/api'
import { FT } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'
import { CARD, buttonStyle, isPack } from './shared'

export function NotificationsPanel({ lang, plan, onToast }: { lang: Lang; plan: string; onToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const t = FT[lang].settings
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getPreferences().then(value => { if (alive) setPrefs(value) }).catch(() => { if (alive) setPrefs({ leak_alerts: true, weekly_digest: false, digest_sent_at: null }) })
    return () => { alive = false }
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!prefs) return
    setBusy(true)
    try {
      setPrefs(await savePreferences({ leak_alerts: prefs.leak_alerts, weekly_digest: prefs.weekly_digest }))
      onToast(t.saved, 'success')
    } catch {
      onToast(t.error, 'error')
    } finally {
      setBusy(false)
    }
  }

  const pack = isPack(plan)
  return (
    <form onSubmit={save} style={CARD}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t.notifTitle}</h2>
      {prefs === null ? (
        <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{t.loading}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, cursor: pack ? 'pointer' : 'not-allowed', opacity: pack ? 1 : 0.65 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={pack && prefs.leak_alerts} disabled={!pack} onChange={e => setPrefs({ ...prefs, leak_alerts: e.target.checked })} />
              <span>{t.leakAlerts}</span>
            </span>
            {!pack && <Link href="/pricing" style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#7c3aed', padding: '5px 12px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>{t.packBadge}</Link>}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={prefs.weekly_digest} onChange={e => setPrefs({ ...prefs, weekly_digest: e.target.checked })} />
            <span>{t.weeklyDigest}</span>
          </label>
        </div>
      )}
      <button type="submit" disabled={busy || prefs === null} style={buttonStyle('secondary')}>{t.save}</button>
    </form>
  )
}
