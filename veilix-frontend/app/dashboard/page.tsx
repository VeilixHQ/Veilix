'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAliases, createAlias, disableAlias, enableAlias, deleteAlias } from '@/lib/api'
import { forgetIdentity } from '@/lib/crypto'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { InactivityWarning } from '@/components/InactivityWarning'
import { Toast, useToast } from '@/components/Toast'
import { DashboardNav, Footer } from '@/components/Layout'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'

type Alias = {
  id: number
  alias_email: string
  destination_email: string
  label: string | null
  status: string
}

const LABELS = ['shopping', 'gaming', 'travail', 'newsletter', 'social', 'autre']

export default function Dashboard() {
  const { showWarning, countdown, stayConnected } = useInactivityTimeout()

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast, showToast, hideToast } = useToast()
  const [aliases, setAliases] = useState<Alias[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newDest, setNewDest] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/access')
    }
  }, [user, authLoading, router])

  const fetchAliases = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAliases()
      if (Array.isArray(data)) setAliases(data)
    } catch {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchAliases()
    }
  }, [authLoading, user, fetchAliases])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const result = await createAlias(newDest, newLabel)
      if (result.detail) {
        showToast(result.detail, 'error')
        return
      }
      setShowModal(false)
      setNewDest('')
      setNewLabel('')
      showToast('Alias créé', 'success')
      fetchAliases()
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
        await enableAlias(alias.id)
        showToast('Alias activé', 'success')
      }
      fetchAliases()
    } catch {
      showToast('Erreur', 'error')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cet alias définitivement ?')) return
    try {
      await deleteAlias(id)
      showToast('Alias supprimé', 'info')
      fetchAliases()
    } catch {
      showToast('Erreur', 'error')
    }
  }

  function handleCopy(alias: Alias) {
    navigator.clipboard.writeText(alias.alias_email)
    setCopied(alias.id)
    showToast('Adresse copiée', 'success')
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleLogout() {
    await forgetIdentity()
    router.push('/access')
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!user) return null

  const filtered = aliases.filter(a =>
    a.alias_email.includes(search.toLowerCase()) ||
    (a.label || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>

      {}
      {showWarning && (
        <InactivityWarning countdown={countdown} onStay={stayConnected} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <DashboardNav onLogout={handleLogout} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '88px 24px 64px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#f1f5f9', marginBottom: 4 }}>Alias email</h1>
            <p style={{ fontSize: 13, color: '#475569' }}>{aliases.length} alias enregistré{aliases.length > 1 ? 's' : ''}</p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            Nouvel alias
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: aliases.length },
            { label: 'Actifs', value: aliases.filter(a => a.status === 'active').length },
            { label: 'Inactifs', value: aliases.filter(a => a.status !== 'active').length },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {aliases.length > 2 && (
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Rechercher un alias ou un label..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#334155', fontSize: 13 }}>Chargement...</div>
        ) : aliases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucun alias</p>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Créez votre premier alias pour protéger votre adresse email.</p>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Créer un alias</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>Aucun résultat pour &quot;{search}&quot;</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 160px', gap: 16, padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Alias</span>
              <span>Destination</span>
              <span>Statut</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {filtered.map((alias, i) => (
              <div key={alias.id} style={{ animationDelay: `${i * 0.04}s`, display: 'grid', gridTemplateColumns: '1fr 160px 100px 160px', gap: 16, alignItems: 'center', padding: '13px 16px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: '#e2e8f0' }}>{alias.alias_email}</span>
                    <button onClick={() => handleCopy(alias)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === alias.id ? '#4ade80' : '#334155', fontSize: 11, fontWeight: 500, padding: 0, fontFamily: 'Inter, sans-serif' }}>
                      {copied === alias.id ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  {alias.label && (
                    <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500, background: 'rgba(124,58,237,0.08)', padding: '2px 8px', borderRadius: 4 }}>{alias.label}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alias.destination_email}</span>
                <Badge variant={alias.status === 'active' ? 'active' : 'disabled'} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => handleToggle(alias)}>
                    {alias.status === 'active' ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(alias.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '28px 28px', width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>Nouvel alias</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Un alias unique sera généré automatiquement.</p>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input
                label="Email de destination"
                type="email"
                value={newDest}
                onChange={e => setNewDest(e.target.value)}
                placeholder="votre@email.com"
                required
              />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>
                  Label <span style={{ color: '#334155', fontWeight: 400 }}>(optionnel)</span>
                </label>
                <Input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="shopping, gaming, travail..."
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {LABELS.map(tag => (
                    <button key={tag} type="button" onClick={() => setNewLabel(tag === newLabel ? '' : tag)}
                      style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: newLabel === tag ? 'rgba(124,58,237,0.15)' : 'transparent', border: `1px solid ${newLabel === tag ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`, color: newLabel === tag ? '#a78bfa' : '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="md" loading={creating} style={{ flex: 1 }}>
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}