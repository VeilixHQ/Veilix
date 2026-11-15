'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { adminBeta } from '@/lib/api'
import { formatDate } from '@/lib/beta'

type Phase = { open: boolean; capacity: number | null; seats_taken: number; waiting: number; invited: number; registered: number; ends_at: string | null; opens_at?: string | null; wave2_opens_at?: string | null; wave2_hold?: boolean }
type Tester = { code_id: number; phase: string; code_status: string; created_at: string; expires_at: string; used_at: string | null; contact: string | null; key_id: number | null; key_status: string | null; suspension_reason: string | null; feedback_due_at: string | null; reminded_at: string | null; feedback_count: number; aliases: number }
type Overview = { phases: Record<'private' | 'public', Phase>; metrics: Record<string, number>; testers: Tester[] }
type Feedback = { id: number; key_id: number; submitted_at: string; is_final: boolean; answers: Record<string, unknown> }

const CARD: React.CSSProperties = { background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px', minWidth: 0 }
const CELL: React.CSSProperties = { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', whiteSpace: 'nowrap', fontSize: 12.5 }
const METRIC_LABELS: Record<string, string> = { testers: 'Testeurs inscrits', with_alias: 'Ont créé un alias', aliases: 'Alias créés', feedback: 'Retours reçus', suspended: 'Suspendus' }

function stateOf(t: Tester) {
  if (t.key_status === 'suspended') return t.suspension_reason === 'fraud' ? 'Révoqué' : 'Suspendu (retour)'
  if (t.key_status === 'pending_payment') return 'Attente paiement'
  if (t.key_status === 'active') return t.reminded_at ? 'Rappel envoyé' : 'Actif'
  if (t.code_status === 'unused') return 'Invité'
  if (t.code_status === 'released') return 'Libéré'
  return t.code_status
}

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(() => {
    return Promise.all([adminBeta.overview(), adminBeta.feedback()])
      .then(([overview, list]) => {
        setData(overview)
        setFeedback(list)
      })
      .catch(() => setDenied(true))
  }, [])

  useEffect(() => {
    let alive = true
    Promise.all([adminBeta.overview(), adminBeta.feedback()])
      .then(([overview, list]) => {
        if (!alive) return
        setData(overview)
        setFeedback(list)
      })
      .catch(() => { if (alive) setDenied(true) })
    return () => { alive = false }
  }, [])

  async function act(action: () => Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action()
      setNotice(done)
      await load()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action refusée')
    } finally {
      setBusy(false)
    }
  }

  if (denied) {
    return (
      <main style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Page introuvable</p>
          <Link href="/" style={{ color: '#a78bfa', fontSize: 13 }}>Retour à l&apos;accueil</Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '40px max(16px, 3vw) 64px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px' }}>Suivi de la bêta</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>Les invitations, rappels et suspensions partent automatiquement toutes les 10 minutes.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {notice && <span role="status" style={{ fontSize: 12.5, color: '#a78bfa' }}>{notice}</span>}
            <Button variant="secondary" size="sm" loading={busy} onClick={() => act(adminBeta.tick, 'Tâches exécutées')}>Lancer les tâches maintenant</Button>
          </div>
        </header>

        {!data ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>Chargement...</p>
        ) : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {(['private', 'public'] as const).map(phase => {
                const p = data.phases[phase]
                return (
                  <div key={phase} style={CARD}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ fontSize: 14 }}>{phase === 'private' ? 'Bêta privée' : 'Bêta publique'}</strong>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: p.open ? '#4ade80' : '#64748b' }}>{p.open ? 'Ouverte' : 'Fermée'}</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {p.seats_taken}<span style={{ fontSize: 14, color: '#475569' }}> / {p.capacity ?? '-'} places</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.6 }}>
                      {p.waiting} en attente · {p.invited} invités · {p.registered} inscrits
                      {p.ends_at && <><br />Clôture le {formatDate(p.ends_at)}</>}
                      {phase === 'public' && p.wave2_opens_at && <><br />Vague 2 le {formatDate(p.wave2_opens_at)}{p.wave2_hold ? ' (bloquée)' : ''}</>}
                    </p>
                  </div>
                )
              })}
              <div style={CARD}>
                <strong style={{ fontSize: 14 }}>Indicateurs</strong>
                <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 12px', marginTop: 10, fontSize: 12.5 }}>
                  {Object.entries(data.metrics).map(([k, v]) => (
                    <div key={k} style={{ display: 'contents' }}>
                      <dt style={{ color: '#94a3b8' }}>{METRIC_LABELS[k] || k}</dt>
                      <dd style={{ margin: 0, fontWeight: 700, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section style={{ ...CARD, padding: 0 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, padding: '14px 18px' }}>Testeurs et codes</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#64748b' }}>
                      {['Code', 'Phase', 'Contact', 'État', 'Invité le', 'Activé le', 'Prochain retour', 'Retours', 'Alias', ''].map(h => <th key={h} style={{ ...CELL, fontWeight: 600, fontSize: 11.5 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.testers.map(t => (
                      <tr key={t.code_id}>
                        <td style={CELL}>#{t.code_id}</td>
                        <td style={CELL}>{t.phase === 'private' ? 'Privée' : 'Publique'}</td>
                        <td style={CELL}>{t.contact || '-'}</td>
                        <td style={CELL}>{stateOf(t)}</td>
                        <td style={CELL}>{formatDate(t.created_at)}</td>
                        <td style={CELL}>{t.used_at ? formatDate(t.used_at) : '-'}</td>
                        <td style={CELL}>{t.feedback_due_at ? formatDate(t.feedback_due_at) : '-'}</td>
                        <td style={{ ...CELL, fontVariantNumeric: 'tabular-nums' }}>{t.feedback_count}</td>
                        <td style={{ ...CELL, fontVariantNumeric: 'tabular-nums' }}>{t.aliases}</td>
                        <td style={{ ...CELL, display: 'flex', gap: 6 }}>
                          {t.code_status !== 'revoked' && t.code_status !== 'released' && (
                            <Button variant="danger" size="sm" disabled={busy} onClick={() => act(() => adminBeta.revoke(t.code_id), `Code #${t.code_id} révoqué`)}>Révoquer</Button>
                          )}
                          {t.key_id && t.key_status === 'suspended' && (
                            <Button variant="secondary" size="sm" disabled={busy} onClick={() => act(() => adminBeta.reactivate(t.key_id as number), 'Accès réactivé')}>Réactiver</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Retours reçus</h2>
              {feedback.length === 0 && <p style={{ fontSize: 13, color: '#64748b' }}>Aucun retour pour l&apos;instant.</p>}
              {feedback.map(f => (
                <article key={f.id} style={CARD}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    Clé #{f.key_id} · {formatDate(f.submitted_at)}{f.is_final ? ' · retour final' : ''}
                  </div>
                  <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '4px 14px', fontSize: 12.5 }}>
                    {Object.entries(f.answers).map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}>
                        <dt style={{ color: '#94a3b8' }}>{k}</dt>
                        <dd style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{Array.isArray(v) ? v.join(', ') : String(v || '-')}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
