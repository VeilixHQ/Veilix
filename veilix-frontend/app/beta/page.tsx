'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { LaunchWaitlist } from '@/components/LaunchWaitlist'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ApiError, BetaPublicStatus, getBetaStatus, joinBeta } from '@/lib/api'
import { BETA_RIGHTS, BETA_TERMS, EMAIL_PATTERN, betaRhythm, betaView, formatDate, formatLastDay, isPast } from '@/lib/beta'
import { T, Lang } from '@/lib/translations'

function subscribeToUrl() {
  return () => {}
}

function readInvitation() {
  return new URLSearchParams(window.location.search).get('invitation')
}

function noInvitationOnServer() {
  return null
}

const CARD: React.CSSProperties = { background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.07)', borderRadius: 16, padding: 28 }
const NOTICE_TITLE: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 8 }
const NOTICE_TEXT: React.CSSProperties = { fontSize: 13, color: 'var(--c-94a3b8)', lineHeight: 1.7 }

export default function BetaPage() {
  const invitation = useSyncExternalStore(subscribeToUrl, readInvitation, noInvitationOnServer)
  const isPrivate = Boolean(invitation)
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  const [status, setStatus] = useState<BetaPublicStatus | null>(null)
  const [failed, setFailed] = useState(false)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPrivate) return
    getBetaStatus().then(setStatus).catch(() => setFailed(true))
  }, [isPrivate])

  const view = betaView(status, failed, isPrivate)
  const shown = isPrivate ? 'private' : view === 'form' || view === 'closed' ? 'public' : null
  const phase = shown && status ? status[shown] : null
  const phaseName = shown === 'private' ? 'privée' : 'publique'
  const launchLine = status?.launch_at && !isPast(status.launch_at)
    ? `Lancement officiel de Veilix le ${formatDate(status.launch_at)}.`
    : 'Merci de votre intérêt pour Veilix.'
  const canSubmit = view === 'form' && accepted && EMAIL_PATTERN.test(email.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')
    try {
      await joinBeta(email.trim(), invitation, website)
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Trop de tentatives depuis votre connexion. Réessayez dans une heure.')
      } else if (err instanceof ApiError && (err.status === 403 || err.status === 409 || err.status === 400)) {
        setError(err.message)
      } else {
        setError('Serveur inaccessible. Réessayez plus tard.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="auth" />

      <section style={{ display: 'flex', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isPrivate ? (<>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: 'var(--c-a78bfa)', fontWeight: 600, marginBottom: 20 }}>
              {shown === 'private' ? 'Bêta privée · sur invitation' : shown === 'public' ? 'Bêta publique' : view === 'invitation' ? 'Bêta sur invitation' : 'Bêta Veilix'}
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 12 }}>
              Rejoindre la bêta Veilix
            </h1>
            {view === 'form' && !sent && (
              <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
                {isPrivate
                  ? "Entrez votre adresse : votre code personnel arrive par e-mail dans la minute. Pendant la bêta privée, le Pack de lancement vous est offert, sans carte bancaire."
                  : "Entrez votre adresse : votre code personnel arrive par e-mail dans la minute. Après la création de votre clé, vous choisissez votre offre, Pro ou Pack de lancement."}
              </p>
            )}
            {phase?.opens_at && phase.ends_at && (
              <p style={{ fontSize: 13, color: 'var(--c-a78bfa)', fontWeight: 600, marginTop: 14 }}>
                Du {formatDate(phase.opens_at)} au {formatLastDay(phase.ends_at)}
                {isPrivate && phase.signups_close_at && phase.signups_close_at !== phase.ends_at && (
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--c-64748b)', fontWeight: 500, marginTop: 4 }}>
                    Inscriptions jusqu&apos;au {formatLastDay(phase.signups_close_at)}
                  </span>
                )}
              </p>
            )}
          </div>

          {shown === 'private' && (view === 'form' || view === 'upcoming') && (
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-c4b5fd)', marginBottom: 6 }}>Après la bêta : 3 mois offerts</p>
              <p style={{ fontSize: 13, color: 'var(--c-a5a3c4)', lineHeight: 1.65 }}>
                {status?.launch_at ? `Au lancement officiel de Veilix, le ${formatDate(status.launch_at)}, ` : 'Au lancement officiel de Veilix, '}
                vous gardez le Pack de lancement avec 3 mois offerts. Une carte bancaire vous sera demandée à ce moment-là, sans aucun prélèvement pendant ces 3 mois, et vous pouvez résilier avant la fin de l&apos;offre.
              </p>
            </div>
          )}

          {sent ? (
            <div style={{ ...CARD, textAlign: 'center' }} role="status">
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>C&apos;est noté.</p>
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', lineHeight: 1.7, marginBottom: 20 }}>
                Vérifiez votre boîte mail : vous y trouverez votre code, ou votre place dans la liste d&apos;attente. Dès qu&apos;une place se libère, le code vous est envoyé automatiquement.
              </p>
              <Link href="/access" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" style={{ width: '100%' }}>J&apos;ai mon code</Button>
              </Link>
            </div>
          ) : view === 'loading' ? (
            <div style={{ ...CARD, textAlign: 'center' }} role="status">
              <p style={NOTICE_TEXT}>Chargement…</p>
            </div>
          ) : view === 'unavailable' ? (
            <div style={{ ...CARD, textAlign: 'center' }} role="alert">
              <p style={NOTICE_TITLE}>Serveur inaccessible</p>
              <p style={NOTICE_TEXT}>Réessayez dans quelques instants.</p>
            </div>
          ) : view === 'invitation' ? (
            <div style={{ ...CARD, textAlign: 'center' }}>
              <p style={NOTICE_TITLE}>La bêta est sur invitation</p>
              <p style={{ ...NOTICE_TEXT, marginBottom: 20 }}>
                Les inscriptions sont réservées aux personnes invitées. Si vous avez reçu une invitation, ouvrez le lien qu&apos;elle contient pour vous inscrire.
              </p>
              <p style={{ fontSize: 12, color: 'var(--c-64748b)' }}>
                Vous avez déjà votre code ? <Link href="/access" style={{ color: 'var(--c-a78bfa)', fontWeight: 600, textDecoration: 'none' }}>Créer ma clé</Link>
              </p>
            </div>
          ) : view === 'paused' ? (
            <div style={{ ...CARD, textAlign: 'center' }}>
              <p style={NOTICE_TITLE}>Aucune inscription n&apos;est ouverte pour le moment</p>
              <p style={NOTICE_TEXT}>{launchLine}</p>
            </div>
          ) : view === 'upcoming' ? (
            <div style={{ ...CARD, textAlign: 'center' }}>
              <p style={NOTICE_TITLE}>La bêta {phaseName} ouvre le {formatDate(phase?.opens_at ?? null)}</p>
              <p style={NOTICE_TEXT}>Revenez à cette date avec ce même lien : votre code vous sera envoyé dès votre inscription.</p>
            </div>
          ) : view === 'closed' ? (
            <div style={{ ...CARD, textAlign: 'center' }}>
              <p style={NOTICE_TITLE}>Les inscriptions à la bêta {phaseName} sont closes</p>
              <p style={NOTICE_TEXT}>{launchLine}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input
                id="beta-email"
                type="email"
                label="Votre adresse e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                autoComplete="email"
                required
              />

              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="beta-website">Site web</label>
                <input id="beta-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-94a3b8)', marginBottom: 8 }}>Conditions de participation</p>
                <div style={{ maxHeight: 180, overflowY: 'auto', padding: '12px 14px', borderRadius: 10, background: 'rgba(var(--ink),0.02)', border: '1px solid rgba(var(--ink),0.06)', fontSize: 12, lineHeight: 1.65, color: 'var(--c-94a3b8)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p>{BETA_TERMS}</p>
                  <p>{betaRhythm(isPrivate ? 'private' : 'public')}</p>
                  <p>{BETA_RIGHTS}</p>
                  <p>
                    Votre adresse sert uniquement à vous envoyer votre code et à vous écrire pendant la bêta. Elle est chiffrée en AES-256-GCM avant d&apos;être enregistrée, avec une clé conservée à part de la base de données.
                  </p>
                </div>
              </div>

              <label htmlFor="beta-accept" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--c-cbd5e1)', lineHeight: 1.5 }}>
                <input id="beta-accept" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 3, accentColor: '#7c3aed', width: 16, height: 16, flexShrink: 0 }} />
                <span>
                  J&apos;accepte les <a href="/conditions-utilisation#beta" target="_blank" rel="noopener" style={{ color: 'var(--c-a78bfa)' }}>conditions de participation à la bêta</a>.
                </span>
              </label>

              {!isPrivate && status?.public.wave === 1 && status.public.wave2_opens_at && (
                <p style={{ fontSize: 12, color: 'var(--c-64748b)', lineHeight: 1.6 }}>
                  Première vague en cours. Si elle est complète, vous rejoignez la liste d&apos;attente : la seconde vague ouvre automatiquement le {formatDate(status.public.wave2_opens_at)}.
                </p>
              )}

              {error && <p role="alert" style={{ fontSize: 13, color: 'var(--c-f87171)' }}>{error}</p>}

              <Button type="submit" variant="primary" size="lg" loading={sending} disabled={!canSubmit} style={{ width: '100%' }}>
                Recevoir mon code
              </Button>
              <p style={{ fontSize: 12, color: 'var(--c-64748b)', textAlign: 'center' }}>
                Vous avez déjà votre code ? <Link href="/access" style={{ color: 'var(--c-a78bfa)', fontWeight: 600, textDecoration: 'none' }}>Créer ma clé</Link>
              </p>
            </form>
          )}
          </>) : <LaunchWaitlist />}
        </div>
      </section>

      <SiteFooter t={t} />
    </div>
  )
}
