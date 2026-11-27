'use client'
import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ApiError, joinLaunchList, leaveLaunchList } from '@/lib/api'
import { EMAIL_PATTERN } from '@/lib/beta'
import { LAUNCH_DAY } from '@/lib/launch'

const CARD: React.CSSProperties = { background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.07)', borderRadius: 16, padding: 28 }
const NOTICE_TITLE: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 8 }
const NOTICE_TEXT: React.CSSProperties = { fontSize: 13, color: 'var(--c-94a3b8)', lineHeight: 1.7 }

const OFFERS = [
  'Essai gratuit de 14 jours, moyen de paiement requis',
  'Pro : 100 alias, dès 4,99 € par mois ou 44,90 € par an',
  'Pack de lancement : alias illimités, 69 € par an, limité à 100 exemplaires',
]

function subscribeToUrl() {
  return () => {}
}

function readLeaveToken() {
  return new URLSearchParams(window.location.search).get('retrait')
}

function noTokenOnServer() {
  return null
}

function LeaveCard({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function leave() {
    setState('sending')
    try {
      await leaveLaunchList(token)
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div style={{ ...CARD, textAlign: 'center' }} role="status">
        <p style={NOTICE_TITLE}>Vous avez quitté la liste d&apos;attente</p>
        <p style={NOTICE_TEXT}>Votre adresse a été effacée. Vous ne recevrez aucun message de notre part.</p>
      </div>
    )
  }

  return (
    <div style={{ ...CARD, textAlign: 'center' }}>
      <p style={NOTICE_TITLE}>Quitter la liste d&apos;attente</p>
      <p style={{ ...NOTICE_TEXT, marginBottom: 20 }}>Votre adresse sera effacée immédiatement et vous ne serez pas prévenu du lancement.</p>
      {state === 'error' && <p role="alert" style={{ fontSize: 13, color: 'var(--c-f87171)', marginBottom: 14 }}>Ce lien est invalide ou a déjà été utilisé.</p>}
      <Button variant="primary" size="md" loading={state === 'sending'} onClick={leave} style={{ width: '100%' }}>Effacer mon adresse</Button>
    </div>
  )
}

export function LaunchWaitlist() {
  const leaveToken = useSyncExternalStore(subscribeToUrl, readLeaveToken, noTokenOnServer)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const canSubmit = accepted && EMAIL_PATTERN.test(email.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')
    try {
      await joinLaunchList(email.trim(), website)
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Trop de tentatives depuis votre connexion. Réessayez dans une heure.')
      } else if (err instanceof ApiError && (err.status === 400 || err.status === 409 || err.status === 422)) {
        setError(err.status === 422 ? 'Adresse e-mail invalide.' : err.message)
      } else {
        setError('Serveur inaccessible. Réessayez plus tard.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: 'var(--c-a78bfa)', fontWeight: 600, marginBottom: 20 }}>
          Lancement le {LAUNCH_DAY.fr}
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 12 }}>
          Être prévenu du lancement de Veilix
        </h1>
        <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
          Veilix ouvre à tous le {LAUNCH_DAY.fr}. Laissez votre adresse : nous vous écrirons ce jour-là, une seule fois, puis elle sera effacée.
        </p>
      </div>

      {leaveToken ? (
        <LeaveCard token={leaveToken} />
      ) : sent ? (
        <div style={{ ...CARD, textAlign: 'center' }} role="status">
          <p style={NOTICE_TITLE}>C&apos;est noté.</p>
          <p style={NOTICE_TEXT}>Un e-mail de confirmation vient de partir. Rendez-vous le {LAUNCH_DAY.fr}.</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-c4b5fd)', marginBottom: 8 }}>Ce qui vous attend à l&apos;ouverture</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--c-a5a3c4)', lineHeight: 1.6 }}>
              {OFFERS.map(offer => <li key={offer}>{offer}</li>)}
            </ul>
          </div>

          <form onSubmit={handleSubmit} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input
              id="launch-email"
              type="email"
              label="Votre adresse e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              autoComplete="email"
              required
            />

            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="launch-website">Site web</label>
              <input id="launch-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>

            <label htmlFor="launch-accept" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--c-cbd5e1)', lineHeight: 1.5 }}>
              <input id="launch-accept" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 3, accentColor: '#7c3aed', width: 16, height: 16, flexShrink: 0 }} />
              <span>
                J&apos;accepte de recevoir un e-mail le jour de l&apos;ouverture de Veilix. Mon adresse est chiffrée et effacée après cet envoi (<a href="/confidentialite" target="_blank" rel="noopener" style={{ color: 'var(--c-a78bfa)' }}>confidentialité</a>).
              </span>
            </label>

            {error && <p role="alert" style={{ fontSize: 13, color: 'var(--c-f87171)' }}>{error}</p>}

            <Button type="submit" variant="primary" size="lg" loading={sending} disabled={!canSubmit} style={{ width: '100%' }}>
              Être prévenu
            </Button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--c-64748b)', textAlign: 'center', lineHeight: 1.7 }}>
            Testeur de la bêta privée ? Ouvrez le lien de votre invitation, ou <Link href="/access" style={{ color: 'var(--c-a78bfa)', fontWeight: 600, textDecoration: 'none' }}>créez votre clé avec votre code</Link>.
          </p>
        </>
      )}
    </>
  )
}
