'use client'
import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Button } from '@/components/Button'
import { confirmDestination } from '@/lib/api'
import { T, Lang } from '@/lib/translations'

type Phase = 'idle' | 'confirming' | 'done' | 'error'
type Step = 'loading' | 'ready' | 'missing' | Exclude<Phase, 'idle'>

const TEXTS = {
  fr: {
    kicker: 'Adresse de destination',
    readyTitle: 'Confirmer cette adresse',
    readyText: "Une demande a été faite pour transférer les e-mails d'un alias Veilix vers votre adresse. Confirmez uniquement si vous êtes à l'origine de cette demande.",
    confirm: "Confirmer l'adresse",
    doneTitle: 'Adresse confirmée',
    doneText: 'Les e-mails reçus par vos alias seront désormais transférés vers cette adresse.',
    errorTitle: 'Lien non valide',
    errorText: 'Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouvel e-mail de confirmation depuis votre tableau de bord.',
    missingText: "Ce lien est incomplet. Ouvrez le lien reçu par e-mail dans son intégralité.",
    home: "Retour à l'accueil",
  },
  en: {
    kicker: 'Destination address',
    readyTitle: 'Confirm this address',
    readyText: 'A request was made to forward emails from a Veilix alias to your address. Confirm only if you made this request.',
    confirm: 'Confirm address',
    doneTitle: 'Address confirmed',
    doneText: 'Emails received by your aliases will now be forwarded to this address.',
    errorTitle: 'Invalid link',
    errorText: 'This link is invalid, expired or already used. Request a new confirmation email from your dashboard.',
    missingText: 'This link is incomplete. Open the full link you received by email.',
    home: 'Back to home',
  },
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function readHash(): string {
  return window.location.hash
}

function readServerHash(): null {
  return null
}

export default function ConfirmDestination() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const text = TEXTS[lang]
  const [phase, setPhase] = useState<Phase>('idle')
  const hash = useSyncExternalStore<string | null>(subscribeToHash, readHash, readServerHash)
  const token = hash === null ? '' : new URLSearchParams(hash.replace(/^#/, '')).get('token') || ''
  const step: Step = phase !== 'idle' ? phase : hash === null ? 'loading' : token ? 'ready' : 'missing'

  async function handleConfirm() {
    setPhase('confirming')
    try {
      const ok = await confirmDestination(token)
      if (ok) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      setPhase(ok ? 'done' : 'error')
    } catch {
      setPhase('error')
    }
  }

  const title =
    step === 'done' ? text.doneTitle :
    step === 'error' || step === 'missing' ? text.errorTitle :
    text.readyTitle

  const body =
    step === 'done' ? text.doneText :
    step === 'error' ? text.errorText :
    step === 'missing' ? text.missingText :
    text.readyText

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px' }}>
        {step !== 'loading' && (
          <div style={{ width: '100%', maxWidth: 440, padding: 32, background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{text.kicker}</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 14 }}>{title}</h1>
            <p style={{ fontSize: 14, color: 'var(--c-94a3b8)', lineHeight: 1.7, marginBottom: 24 }}>{body}</p>

            {(step === 'ready' || step === 'confirming') && (
              <Button variant="primary" size="lg" loading={step === 'confirming'} onClick={handleConfirm} style={{ width: '100%' }}>
                {text.confirm}
              </Button>
            )}

            {(step === 'done' || step === 'error' || step === 'missing') && (
              <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-a78bfa)', textDecoration: 'none' }}>{text.home}</Link>
            )}
          </div>
        )}
      </section>

      <SiteFooter t={t} />
    </div>
  )
}
