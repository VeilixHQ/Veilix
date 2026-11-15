'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAliases, getAccount, createAlias, disableAlias, enableAlias, deleteAlias, resendConfirmation, Account, ApiError } from '@/lib/api'
import { getIdentity } from '@/lib/crypto'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { Toast, useToast } from '@/components/Toast'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { UserMenu } from '@/components/UserMenu'
import { InactivityWarning } from '@/components/InactivityWarning'
import { SessionExpiredModal } from '@/components/SessionExpiredModal'
import { UpgradeModal, UpgradeReason } from '@/components/UpgradeModal'
import { BetaPanel, DeleteAccount } from '@/components/BetaPanel'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { T, Lang } from '@/lib/translations'

type Alias = {
  id: number
  alias_email: string
  destination_email: string
  label: string | null
  status: string
}

const LABELS = ['shopping', 'gaming', 'travail', 'newsletter', 'social', 'autre']
const TAG_MAX_LENGTH = 24
const TAG_STYLE = { color: '#a78bfa', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.28)' }

const PLAN_LABELS: Record<string, string> = {
  credits: 'Sans abonnement',
  pro: 'Pro',
  pack: 'Pack de lancement',
  premium: 'Premium',
  admin: 'Admin',
}

const UPGRADE_REASONS: Record<string, UpgradeReason> = {
  NO_CREDITS: 'credits',
  LIMIT_REACHED_PRO: 'quota',
  LIMIT_REACHED: 'quota',
}

const CARD_STYLE: React.CSSProperties = {
  background: '#0d0d10',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '18px 20px',
  minWidth: 0,
}

function planLabel(plan: string | undefined) {
  return (plan && PLAN_LABELS[plan]) || 'Pro'
}

function AccountCards({ account, active, inactive }: { account: Account | null; active: number; inactive: number }) {
  const used = account?.aliases_used ?? active + inactive
  const quota = account?.alias_quota ?? null
  const ratio = quota ? Math.min(used / quota, 1) : 0
  const barColor = ratio >= 1 ? '#f87171' : ratio >= 0.9 ? '#fbbf24' : '#7c3aed'

  return (
    <div className="account-cards">
      <div className="account-card-aliases" style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: '#f1f5f9' }}>{used}</span>
          {quota !== 0 && (
            <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{quota === null ? '/ illimité' : `/ ${quota}`}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
          {quota === 0 ? 'Alias utilisés, 1 crédit par nouvel alias' : 'Alias utilisés'}
        </div>
        {quota !== null && quota > 0 && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={quota}
            aria-valuenow={used}
            aria-label="Alias utilisés sur le quota du plan"
            style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', margin: '12px 0 10px', overflow: 'hidden' }}
          >
            <div style={{ width: `${ratio * 100}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width .3s' }} />
          </div>
        )}
        <div style={{ fontSize: 11.5, color: '#475569', marginTop: quota !== null && quota > 0 ? 0 : 10 }}>
          <span style={{ color: '#4ade80' }}>{active} actif{active > 1 ? 's' : ''}</span>
          <span> · {inactive} inactif{inactive > 1 ? 's' : ''}</span>
        </div>
      </div>

      <Link href="/pricing#credits" className="account-card-link" style={{ ...CARD_STYLE, textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', marginBottom: 2, color: '#f1f5f9' }}>{account ? account.credits : '-'}</div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Crédit{account && account.credits > 1 ? 's' : ''}</div>
        <div style={{ fontSize: 11.5, color: '#a78bfa', fontWeight: 600, marginTop: 10 }}>Acheter des crédits</div>
      </Link>

      <Link href="/pricing" className="account-card-link" style={{ ...CARD_STYLE, textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.25, minHeight: 31, display: 'flex', alignItems: 'center', marginBottom: 2, color: '#f1f5f9' }}>
          {account ? planLabel(account.plan) : '-'}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Plan</div>
        <div style={{ fontSize: 11.5, color: '#a78bfa', fontWeight: 600, marginTop: 10 }}>Voir les offres</div>
      </Link>
    </div>
  )
}

function tagStyle(_name: string) {
  return TAG_STYLE
}

function normalizeTag(raw: string) {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, TAG_MAX_LENGTH)
}

function TagChip({ name, count, active, onClick, size = 'sm' }: {
  name: string
  count?: number
  active?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}) {
  const c = tagStyle(name)
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: size === 'md' ? '4px 11px' : '2px 9px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
    color: c.color,
    background: active ? c.bg : size === 'md' ? 'transparent' : c.bg,
    border: `1px solid ${active || size === 'sm' ? c.border : 'rgba(255,255,255,0.08)'}`,
    cursor: onClick ? 'pointer' : 'default',
  }
  const content = (
    <>
      {name}
      {count !== undefined && <span style={{ opacity: 0.6, fontWeight: 600 }}>{count}</span>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} style={style} aria-pressed={active}>{content}</button>
  ) : (
    <span style={style}>{content}</span>
  )
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Actif', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' },
  pending: { label: 'À confirmer', color: '#a78bfa', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.28)' },
  disabled: { label: 'Désactivé', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.28)' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.disabled
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        padding: '4px 14px',
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  )
}

export default function Dashboard() {
  const { showWarning, countdown, stayConnected, sessionExpired, setSessionExpired } = useInactivityTimeout()

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast, showToast, hideToast } = useToast()
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  const [keyId, setKeyId] = useState<string | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [aliases, setAliases] = useState<Alias[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null)
  const [newDest, setNewDest] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/access')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && user) {
      getIdentity().then(id => {
        if (id) setKeyId(id.keyId)
      })
    }
  }, [authLoading, user])

  const fetchAccount = useCallback(async () => {
    try {
      setAccount(await getAccount())
    } catch (error) {
      setAccount(null)
      if (error instanceof ApiError && error.status === 402) router.push('/pricing?paiement=requis')
    }
  }, [router])

  const fetchAliases = useCallback(async () => {
    try {
      const data = await getAliases()
      if (Array.isArray(data)) setAliases(data)
    } catch {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    fetchAliases()
    fetchAccount()
  }, [fetchAliases, fetchAccount])

  useEffect(() => {
    if (!authLoading && user) refresh()
  }, [authLoading, user, refresh])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const result = await createAlias(newDest, normalizeTag(newLabel))
      
      if (result.detail) {
        const reason = typeof result.detail === 'string' ? UPGRADE_REASONS[result.detail] : undefined
        if (reason) {
          setShowModal(false)
          setUpgradeReason(reason)
          fetchAccount()
          return
        }
        showToast(typeof result.detail === 'string' ? result.detail : 'Erreur lors de la création', 'error')
        return
      }

      setShowModal(false)
      setNewDest('')
      setNewLabel('')
      if (result.status === 'pending') {
        showToast(
          result.confirmation_sent
            ? `Alias créé. Confirmez l'adresse via l'e-mail envoyé à ${result.destination_email}.`
            : 'Alias créé. E-mail de confirmation non envoyé : utilisez « Renvoyer ».',
          'info'
        )
      } else {
        showToast('Alias créé', 'success')
      }
      refresh()
    } catch {
      showToast('Erreur lors de la création', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(alias: Alias) {
    try {
      if (alias.status === 'active') {
        await disableAlias(alias.id)
        showToast('Alias désactivé', 'info')
      } else {
        const result = await enableAlias(alias.id)
        if (result.status === 'pending') {
          showToast('Adresse de destination à confirmer par e-mail', 'info')
        } else {
          showToast('Alias activé', 'success')
        }
      }
      fetchAliases()
    } catch {
      showToast('Erreur', 'error')
    }
  }

  async function handleResend(alias: Alias) {
    try {
      const result = await resendConfirmation(alias.id)
      if (result.detail) {
        showToast(typeof result.detail === 'string' ? result.detail : 'Erreur', 'error')
        return
      }
      showToast(`E-mail de confirmation envoyé à ${alias.destination_email}`, 'success')
    } catch {
      showToast('Erreur', 'error')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cet alias définitivement ?')) return
    try {
      await deleteAlias(id)
      showToast('Alias supprimé', 'info')
      refresh()
    } catch {
      showToast('Erreur', 'error')
    }
  }

  async function handleCopy(alias: Alias) {
    try {
      await navigator.clipboard.writeText(alias.alias_email)
      setCopied(alias.id)
      showToast('Adresse copiée', 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      showToast('Impossible de copier l\u2019adresse', 'error')
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!user) return null

  const q = search.toLowerCase()
  const tagCounts = new Map<string, number>()
  aliases.forEach(a => {
    const tag = (a.label || '').trim().toLowerCase()
    if (tag) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
  })
  const userTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const suggestedTags = [...userTags.map(([name]) => name), ...LABELS.filter(l => !tagCounts.has(l))]
  const currentTag = normalizeTag(newLabel)
  const isNewTag = currentTag.length > 0 && !suggestedTags.includes(currentTag)
  const effectiveTag = activeTag && tagCounts.has(activeTag) ? activeTag : null

  const filtered = aliases.filter(a => {
    const label = (a.label || '').toLowerCase()
    const matchSearch = a.alias_email.toLowerCase().includes(q) || label.includes(q)
    const matchTag = !effectiveTag || label === effectiveTag
    return matchSearch && matchTag
  })

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .account-cards{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px;margin-bottom:28px}
        .account-card-link{transition:border-color .15s}
        .account-card-link:hover{border-color:rgba(124,58,237,0.3)!important}
        .alias-row{display:grid;grid-template-columns:minmax(0,1fr) 180px 110px 210px;gap:20px;align-items:center;min-height:68px;padding:12px 18px;background:#0d0d10;border:1px solid rgba(255,255,255,0.06);border-radius:12px;transition:border-color .15s}
        .alias-row:hover{border-color:rgba(124,58,237,0.2)}
        .alias-dest{font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
        .alias-status{display:flex;align-items:center;justify-content:center;min-width:0}
        .alias-row-actions{display:grid;grid-template-columns:100px 94px;gap:10px;justify-content:center}
        .alias-row-actions button{width:100%}
        .dashboard-table-header{display:grid;grid-template-columns:minmax(0,1fr) 180px 110px 210px;gap:20px}
        @media(max-width:900px){
          .alias-row{grid-template-columns:minmax(0,1fr) auto;gap:10px 12px;align-items:center}
          .alias-row>:first-child{grid-column:1/-1}
          .alias-row-actions{grid-column:1/-1;justify-content:start}
          .alias-status{justify-content:flex-end}
          .dashboard-table-header{display:none!important}
        }
        @media(max-width:640px){
          .account-cards{grid-template-columns:1fr 1fr}
          .account-card-aliases{grid-column:1/-1}
        }
      `}</style>

      {showWarning && <InactivityWarning countdown={countdown} onStay={stayConnected} />}
      {sessionExpired && <SessionExpiredModal onClose={() => setSessionExpired(false)} />}
      {upgradeReason && <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeReason(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <SiteNav
        t={t}
        lang={lang}
        setLang={setLang}
        mode="app"
        rightSlot={
          keyId && (
            <UserMenu
              plan={planLabel(account?.plan)}
              keyIdShort={`K-${keyId.slice(0, 4).toUpperCase()}...${keyId.slice(-4).toUpperCase()}`}
              fullKeyId={keyId}
              badges={account?.badges ?? []}
            />
          )
        }
      />

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', color: '#f1f5f9', marginBottom: 4 }}>Alias email</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              {aliases.length} alias enregistré{aliases.length > 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>+ Nouvel alias</Button>
          </div>
        </div>

        <BetaPanel onFeedbackSent={refresh} />

        <AccountCards
          account={account}
          active={aliases.filter(a => a.status === 'active').length}
          inactive={aliases.filter(a => a.status !== 'active').length}
        />

        {aliases.length > 2 && (
          <div style={{ marginBottom: 18 }}>
            <Input placeholder="Rechercher un alias ou un label..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {userTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              aria-pressed={!effectiveTag}
              style={{ padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: !effectiveTag ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${!effectiveTag ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`, color: !effectiveTag ? '#f1f5f9' : '#64748b' }}
            >
              Tous <span style={{ opacity: 0.6, fontWeight: 600 }}>{aliases.length}</span>
            </button>
            {userTags.map(([name, count]) => (
              <TagChip
                key={name}
                name={name}
                count={count}
                size="md"
                active={effectiveTag === name}
                onClick={() => setActiveTag(effectiveTag === name ? null : name)}
              />
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#334155', fontSize: 13 }}>Chargement...</div>
        ) : aliases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucun alias</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Créez votre premier alias pour protéger votre adresse email.</p>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Créer un alias</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>Aucun résultat pour &quot;{search}&quot;</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="dashboard-table-header" style={{ padding: '0 18px', fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Alias</span><span>Destination</span><span style={{ textAlign: 'center' }}>Statut</span><span style={{ textAlign: 'center' }}>Actions</span>
            </div>
            {filtered.map(alias => (
              <div key={alias.id} className="alias-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: '#e2e8f0' }}>{alias.alias_email}</span>
                    <button
                      onClick={() => handleCopy(alias)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === alias.id ? '#4ade80' : '#475569', fontSize: 11, fontWeight: 600, padding: 0, fontFamily: 'Inter, sans-serif' }}
                    >
                      {copied === alias.id ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                  {alias.label && (
                    <TagChip name={alias.label} onClick={() => setActiveTag(effectiveTag === alias.label!.toLowerCase() ? null : alias.label!.toLowerCase())} />
                  )}
                </div>

                <span className="alias-dest" title={alias.destination_email}>{alias.destination_email}</span>

                <div className="alias-status">
                  <StatusBadge status={alias.status} />
                </div>

                <div className="alias-row-actions">
                  {alias.status === 'pending' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResend(alias)}
                      style={{ color: '#a78bfa', borderColor: 'rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.08)' }}
                    >
                      Renvoyer
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggle(alias)}
                      style={
                        alias.status === 'active'
                          ? { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' }
                          : { color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.08)' }
                      }
                    >
                      {alias.status === 'active' ? 'Désactiver' : 'Activer'}
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => handleDelete(alias.id)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <DeleteAccount />
      </div>

      <SiteFooter t={t} />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowModal(false)}>
          <div style={{ position: 'relative', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, animation: 'fadeUp 0.2s ease' }} onClick={e => e.stopPropagation()}>
            
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>Nouvel alias</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Un alias unique sera généré automatiquement.</p>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input label="Email de destination" type="email" value={newDest} onChange={e => setNewDest(e.target.value)} placeholder="votre@email.com" required />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>
                  Label <span style={{ color: '#334155', fontWeight: 400 }}>(optionnel)</span>
                </label>
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value.slice(0, TAG_MAX_LENGTH))} placeholder="Choisissez ou créez un tag..." />
                {isNewTag && (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>
                    Nouveau tag : <span style={{ color: tagStyle(currentTag).color, fontWeight: 600 }}>{currentTag}</span>
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {suggestedTags.map(tag => (
                    <TagChip
                      key={tag}
                      name={tag}
                      size="md"
                      active={currentTag === tag}
                      onClick={() => setNewLabel(currentTag === tag ? '' : tag)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</Button>
                <Button type="submit" variant="primary" size="md" loading={creating} style={{ flex: 1 }}>Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}