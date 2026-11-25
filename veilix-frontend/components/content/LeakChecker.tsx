'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ApiError, Breach, checkEmailLeaks } from '@/lib/api'
import { guide } from '@/lib/guides'

type Result = { email: string; breaches: Breach[] }

function formatMonth(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function suggestions(breaches: Breach[]) {
  const data = breaches.flatMap(breach => breach.data).join(' ').toLowerCase()
  const keys = ['que-faire']
  if (data.includes('iban') || data.includes('carte')) keys.push('iban')
  if (data.includes('téléphone')) keys.push('telephone')
  keys.push('hameconnage')
  return keys.map(guide)
}

export function LeakChecker() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await checkEmailLeaks(email.trim(), website)
      setResult({ email: email.trim(), breaches: data.breaches })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Vérification impossible pour le moment. Réessayez plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--c-0d0d10)', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 14, padding: '22px 20px', margin: '8px 0 28px' }}>
      <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <label htmlFor="leak-email" style={{ width: '100%', fontSize: 14, fontWeight: 600, color: 'var(--c-e2e8f0)' }}>Votre adresse e-mail</label>
        <input
          id="leak-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={event => setEmail(event.target.value)}
          style={{ flex: '1 1 240px', minWidth: 0, padding: '12px 14px', background: 'var(--c-060608)', border: '1px solid rgba(var(--ink),0.12)', borderRadius: 9, fontSize: 15, color: 'var(--c-f1f5f9)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
        />
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="leak-website">Site web</label>
          <input id="leak-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ flex: '0 0 auto', padding: '12px 22px', borderRadius: 9, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}
        >
          {loading ? 'Vérification…' : 'Vérifier'}
        </button>
      </form>
      <p style={{ fontSize: 12.5, margin: '12px 0 0', lineHeight: 1.6 }}>Gratuit. Votre adresse est transmise de façon chiffrée à Have I Been Pwned pour la recherche, puis oubliée : Veilix ne la conserve pas et ne l&apos;enregistre dans aucun journal.</p>

      <div aria-live="polite">
        {error && <p role="alert" style={{ marginTop: 16, color: 'var(--c-f87171)' }}>{error}</p>}

        {result && result.breaches.length === 0 && (
          <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <p style={{ margin: 0, color: 'var(--c-e2e8f0)', fontWeight: 600 }}>Bonne nouvelle : cette adresse n&apos;apparaît dans aucune fuite connue.</p>
            <p style={{ margin: '8px 0 0' }}>Cela ne garantit pas qu&apos;elle n&apos;a jamais fuité : seules les fuites rendues publiques et analysées sont recensées. Restez vigilant face aux messages suspects.</p>
          </div>
        )}

        {result && result.breaches.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.28)', marginBottom: 14 }}>
              <p style={{ margin: 0, color: 'var(--c-e2e8f0)', fontWeight: 600 }}>
                Cette adresse apparaît dans {result.breaches.length} fuite{result.breaches.length > 1 ? 's' : ''} de données.
              </p>
              <p style={{ margin: '8px 0 0' }}>Changez en priorité le mot de passe des services concernés, et partout où vous l&apos;avez réutilisé.</p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {result.breaches.map(breach => (
                <li key={breach.name} style={{ border: '1px solid rgba(var(--ink),0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                  <p style={{ margin: 0, color: 'var(--c-e2e8f0)', fontWeight: 600 }}>
                    {breach.title}
                    {breach.domain && <span style={{ fontWeight: 400, color: 'var(--c-64748b)' }}> · {breach.domain}</span>}
                  </p>
                  <p style={{ margin: '4px 0 8px', fontSize: 13 }}>
                    {formatMonth(breach.date)} · {breach.count.toLocaleString('fr-FR')} comptes{!breach.verified && ' · fuite non vérifiée'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>Données exposées : {breach.data.join(', ')}</p>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 16, marginBottom: 6, color: 'var(--c-e2e8f0)', fontWeight: 600 }}>Que faire maintenant ?</p>
            <ul>
              {suggestions(result.breaches).map(item => (
                <li key={item.key}><Link href={item.path}>{item.short}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, margin: '14px 0 0' }}>Données fournies par <a href="https://haveibeenpwned.com" rel="noopener noreferrer" target="_blank">Have I Been Pwned</a>.</p>
    </div>
  )
}
