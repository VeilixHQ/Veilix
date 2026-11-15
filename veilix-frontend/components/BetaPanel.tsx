'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { BetaFeedback, BetaKeyStatus, deleteMyAccount, getMyBetaStatus, sendBetaFeedback } from '@/lib/api'
import { formatDate } from '@/lib/beta'
import { forgetIdentity } from '@/lib/crypto'

const FEATURES: { id: string; label: string }[] = [
  { id: 'creation', label: "Création d'alias" },
  { id: 'transfert', label: 'Réception des e-mails' },
  { id: 'reponse', label: 'Réponse depuis un alias' },
  { id: 'desactivation', label: 'Désactivation' },
  { id: 'suppression', label: 'Suppression' },
  { id: 'tags', label: 'Tags' },
  { id: 'tableau_de_bord', label: 'Tableau de bord' },
]

const EMPTY: BetaFeedback = {
  features_tried: [],
  alias_lifecycle: 'oui',
  forwarding_ok: 'oui',
  problem: '',
  unclear: '',
  recommend: 8,
  recommend_why: '',
}

const PANEL: React.CSSProperties = { background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' }
const FIELD_LABEL: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }
const TEXTAREA: React.CSSProperties = { width: '100%', minHeight: 72, padding: '10px 12px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }

function Choice({ name, value, options, onChange }: { name: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(([id, label]) => (
        <label key={id} htmlFor={`${name}-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', border: `1px solid ${value === id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, background: value === id ? 'rgba(124,58,237,0.12)' : 'transparent', color: value === id ? '#c4b5fd' : '#94a3b8' }}>
          <input id={`${name}-${id}`} type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} style={{ accentColor: '#7c3aed' }} />
          {label}
        </label>
      ))}
    </div>
  )
}

function FeedbackForm({ status, onClose, onSent }: { status: BetaKeyStatus; onClose: () => void; onSent: (s: BetaKeyStatus) => void }) {
  const [form, setForm] = useState<BetaFeedback>(EMPTY)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  function toggleFeature(id: string) {
    setForm(f => ({ ...f, features_tried: f.features_tried.includes(id) ? f.features_tried.filter(x => x !== id) : [...f.features_tried, id] }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      onSent(await sendBetaFeedback(form))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible')
    } finally {
      setSending(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h2 id="feedback-title" style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{status.final_window ? 'Mon retour final' : 'Mon retour sur la bêta'}</h2>
          <p style={{ fontSize: 12.5, color: '#64748b' }}>Quelques minutes suffisent. Ne mettez aucune donnée personnelle ni contenu d&apos;e-mail.</p>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={FIELD_LABEL}>Qu&apos;avez-vous essayé ?</legend>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FEATURES.map(f => (
              <label key={f.id} htmlFor={`feature-${f.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', color: form.features_tried.includes(f.id) ? '#c4b5fd' : '#94a3b8' }}>
                <input id={`feature-${f.id}`} type="checkbox" checked={form.features_tried.includes(f.id)} onChange={() => toggleFeature(f.id)} style={{ accentColor: '#7c3aed' }} />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span style={FIELD_LABEL}>Avez-vous réussi à créer, utiliser et supprimer un alias ?</span>
          <Choice name="lifecycle" value={form.alias_lifecycle} options={[['oui', 'Oui'], ['partiel', 'En partie'], ['non', 'Non']]} onChange={v => setForm(f => ({ ...f, alias_lifecycle: v as BetaFeedback['alias_lifecycle'] }))} />
        </div>

        <div>
          <span style={FIELD_LABEL}>Les e-mails ont-ils été transférés correctement ?</span>
          <Choice name="forwarding" value={form.forwarding_ok} options={[['oui', 'Oui'], ['partiel', 'Pas toujours'], ['non', 'Non'], ['pas_teste', 'Pas testé']]} onChange={v => setForm(f => ({ ...f, forwarding_ok: v as BetaFeedback['forwarding_ok'] }))} />
        </div>

        <div>
          <label htmlFor="feedback-problem" style={FIELD_LABEL}>Une erreur ou une difficulté ? À quelle étape ?</label>
          <textarea id="feedback-problem" maxLength={2000} value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} style={TEXTAREA} />
        </div>

        <div>
          <label htmlFor="feedback-unclear" style={FIELD_LABEL}>Qu&apos;est-ce qui vous a paru peu clair ou à améliorer ?</label>
          <textarea id="feedback-unclear" maxLength={2000} value={form.unclear} onChange={e => setForm(f => ({ ...f, unclear: e.target.value }))} style={TEXTAREA} />
        </div>

        <div>
          <label htmlFor="feedback-recommend" style={FIELD_LABEL}>Recommanderiez-vous Veilix ? <span style={{ color: '#a78bfa' }}>{form.recommend} / 10</span></label>
          <input id="feedback-recommend" type="range" min={0} max={10} value={form.recommend} onChange={e => setForm(f => ({ ...f, recommend: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#7c3aed' }} />
          <textarea aria-label="Pourquoi ?" placeholder="Pourquoi ?" maxLength={1000} value={form.recommend_why} onChange={e => setForm(f => ({ ...f, recommend_why: e.target.value }))} style={{ ...TEXTAREA, minHeight: 56, marginTop: 8 }} />
        </div>

        {error && <p role="alert" style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>Annuler</Button>
          <Button type="submit" variant="primary" size="md" loading={sending} style={{ flex: 1 }}>Envoyer mon retour</Button>
        </div>
      </form>
    </div>
  )
}

export function BetaPanel({ onFeedbackSent }: { onFeedbackSent: () => void }) {
  const [status, setStatus] = useState<BetaKeyStatus | null>(null)
  const [open, setOpen] = useState(false)
  const [thanks, setThanks] = useState(false)

  useEffect(() => {
    let alive = true
    const params = new URLSearchParams(window.location.search)
    const fromEmail = params.get('retour') === '1'
    getMyBetaStatus()
      .then(next => {
        if (!alive) return
        setStatus(next)
        if (fromEmail) {
          params.delete('retour')
          const query = params.toString()
          window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
          if (next.phase && !next.final_sent) setOpen(true)
        }
      })
      .catch(() => { if (alive) setStatus(null) })
    return () => { alive = false }
  }, [])

  if (!status || !status.phase) return null

  const phaseLabel = status.phase === 'private' ? 'Bêta privée' : 'Bêta publique'
  let tone = { color: '#a78bfa', border: 'rgba(124,58,237,0.25)', bg: 'rgba(124,58,237,0.06)' }
  let message = status.feedback_due_at ? `Prochain retour attendu le ${formatDate(status.feedback_due_at)}.` : 'Merci pour vos retours.'
  if (status.final_sent) {
    message = 'Retour final reçu. Merci pour votre participation.'
  } else if (status.suspended_for_feedback) {
    tone = { color: '#f87171', border: 'rgba(248,113,113,0.35)', bg: 'rgba(248,113,113,0.06)' }
    message = 'Accès suspendu faute de retour. Envoyez votre retour pour le réactiver immédiatement.'
  } else if (status.overdue) {
    tone = { color: '#fbbf24', border: 'rgba(251,191,36,0.35)', bg: 'rgba(251,191,36,0.06)' }
    message = `Retour en retard depuis le ${formatDate(status.feedback_due_at)}. ${status.reminded ? 'Sans retour 48 heures après le rappel, l’accès est suspendu.' : ''}`
  } else if (status.final_window && status.ends_at) {
    message = `Retour final attendu avant la clôture du ${formatDate(status.ends_at)}.`
  }

  return (
    <>
      <div style={{ ...PANEL, border: `1px solid ${tone.border}`, background: tone.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tone.color, marginBottom: 4 }}>{phaseLabel}</div>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }} role="status">{thanks ? 'Retour envoyé. Merci !' : message}</p>
        </div>
        {!status.final_sent && (
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>Donner mon retour</Button>
        )}
      </div>
      {open && (
        <FeedbackForm
          status={status}
          onClose={() => setOpen(false)}
          onSent={next => {
            setStatus(next)
            setOpen(false)
            setThanks(true)
            onFeedbackSent()
          }}
        />
      )}
    </>
  )
}

export function DeleteAccount() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setDeleting(true)
    setError('')
    try {
      await deleteMyAccount()
      await forgetIdentity()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
      setDeleting(false)
    }
  }

  return (
    <div style={{ ...PANEL, marginTop: 40, border: '1px solid rgba(248,113,113,0.18)' }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Quitter Veilix</h2>
      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
        Supprime définitivement votre clé, vos alias, vos destinations et vos retours de bêta. Les e-mails envoyés à vos alias ne seront plus transférés.
      </p>
      {confirming ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>Cette action est irréversible.</span>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>Annuler</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={remove}>Supprimer définitivement</Button>
        </div>
      ) : (
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>Supprimer mon compte et mes données</Button>
      )}
      {error && <p role="alert" style={{ fontSize: 13, color: '#f87171', marginTop: 10 }}>{error}</p>}
    </div>
  )
}
