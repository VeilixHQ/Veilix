'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getIdentity } from '@/lib/crypto'
import { verifyKey, getAliases } from '@/lib/api'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Button } from '@/components/Button'
import { Toast, useToast } from '@/components/Toast'
import { T, Lang } from '@/lib/translations'

type TabType = 'billing' | 'security' | 'privacy'
type CancelReason = 'expensive' | 'unused' | 'missing_feature' | 'other' | null

export default function SettingsPage() {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  const [activeTab, setActiveTab] = useState<TabType>('billing')
  const [identity, setIdentity] = useState<{ keyId: string } | null>(null)
  const [plan, setPlan] = useState<string>('pro')
  const [activeAliasesCount, setActiveAliasesCount] = useState<number>(0)

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelStep, setCancelStep] = useState<1 | 2 | 3>(1)
  const [cancelReason, setCancelReason] = useState<CancelReason>(null)
  const [discountApplied, setDiscountApplied] = useState(false)

  const [leakAlerts, setLeakAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  useEffect(() => {
    getIdentity().then(id => {
      if (id) {
        setIdentity({ keyId: id.keyId })

        verifyKey(id.keyId).then(data => {
          if (data && data.exists && data.plan) {
            setPlan(data.plan)
          }
        }).catch(() => {})

        getAliases().then(aliases => {
          if (Array.isArray(aliases)) {
            const active = aliases.filter((a: any) => a.active !== false).length
            setActiveAliasesCount(active)
          }
        }).catch(() => {})
      } else {
        router.push('/access')
      }
    })
  }, [router])

  async function handleExportData() {
    try {
      const currentIdentity = await getIdentity()
      if (!currentIdentity) {
        router.push('/access')
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiUrl}/alias`, {
        headers: {
          'X-Veilix-Key-Id': currentIdentity.keyId,
          'X-Client-Source': 'veilix-web'
        }
      })

      let aliasesData = []
      if (res.ok) {
        aliasesData = await res.json()
      }

      const exportPayload = {
        exportDate: new Date().toISOString(),
        identityKey: currentIdentity.keyId,
        plan: plan,
        aliases: aliasesData
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = url
      downloadAnchor.download = `veilix-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      document.body.removeChild(downloadAnchor)
      URL.revokeObjectURL(url)

      showToast('Export JSON généré avec succès', 'success')
    } catch {
      showToast('Erreur lors de l export des données', 'error')
    }
  }

  function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault()
    showToast('Préférences de notification enregistrées avec succès', 'success')
  }

  function handleGoToPricing() {
    router.push('/pricing')
  }

  function openCancelTunnel() {
    setCancelStep(1)
    setCancelReason(null)
    setShowCancelModal(true)
  }

  function handleNextFromSurvey() {
    if (!cancelReason) {
      showToast('Veuillez sélectionner une raison pour continuer', 'error')
      return
    }
    setCancelStep(2)
  }

  async function handleAcceptSaveOffer() {
    setShowCancelModal(false)
    setDiscountApplied(true)
    showToast('Offre appliquée : -50 % sur votre prochaine mensualité', 'success')
  }

  async function handleFinalCancel() {
    setShowCancelModal(false)
    setPlan('free')
    showToast('Votre abonnement a été résilié', 'info')
  }

  if (!identity) {
    return (
      <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Chargement des paramètres...
      </div>
    )
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <SiteNav t={t} lang={lang} setLang={setLang} mode="app" />

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '120px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 6 }}>Paramètres</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
          Gérez votre abonnement, vos accès API et vos préférences de confidentialité.
        </p>

        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 28, overflowX: 'auto' }}>
          {[
            { id: 'billing', label: 'Abonnement & Facturation' },
            { id: 'security', label: 'Développeurs & API' },
            { id: 'privacy', label: 'Confidentialité & Données' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                color: activeTab === tab.id ? '#f1f5f9' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.03) 100%)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 14, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#c4b5fd', marginBottom: 6 }}>Protection active</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                  Vous avez actuellement <span style={{ color: '#8b5cf6', fontWeight: 800 }}>{activeAliasesCount} alias actif{activeAliasesCount > 1 ? 's' : ''}</span> qui protègent votre boîte mail principale.
                </p>
              </div>
              {discountApplied && (
                <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)' }}>
                  Réduction -50% active sur le prochain mois
                </span>
              )}
            </div>

            <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Formule active</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '4px 8px', borderRadius: 6 }}>
                    {plan === 'pack' ? 'Pack de lancement' : 'Offre Pro'}
                  </span>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                    {plan === 'pack'
                      ? 'Alias illimités, domaine personnalisé (jusqu à 3), chiffrement PGP et prix bloqué à vie.'
                      : '100 alias actifs, pièces jointes, tags personnalisés et 3 boîtes de destination.'}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={handleGoToPricing} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  Changer de plan
                </Button>
              </div>
            </div>

            <div style={{ background: '#0d0d10', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Résiliation / Désactivation</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Vous pouvez modifier votre formule ou interrompre votre abonnement à tout moment.
              </p>
              <Button variant="danger" size="sm" onClick={openCancelTunnel}>
                Désactiver mon abonnement
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {plan !== 'pack' ? (
              <div style={{ background: '#0d0d10', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', padding: '4px 10px', borderRadius: 6 }}>
                  Exclusivité Pack de lancement
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 8 }}>
                  Automatisez Veilix avec notre API REST
                </h2>
                <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  L'accès à votre clé API et aux endpoints programmatiques est réservé aux membres du Pack de lancement. Débloquez l'API, les alias illimités et le chiffrement PGP à vie.
                </p>
                <Button variant="primary" size="sm" onClick={handleGoToPricing} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  Passer au Pack de lancement
                </Button>
              </div>
            ) : (
              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Clé d accès API</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                  Utilisez cet identifiant dans le header :<br />
                  <code style={{ color: '#8b5cf6', display: 'inline-block', marginTop: 4, fontWeight: 600 }}>X-Veilix-Key-Id</code>
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20, flexWrap: 'wrap' }}>
                  <code style={{ fontSize: 13, fontFamily: 'monospace', color: '#f1f5f9', wordBreak: 'break-all' }}>
                    {identity.keyId}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(identity.keyId)
                      showToast('Clé API copiée dans le presse-papiers', 'success')
                    }}
                  >
                    Copier la clé
                  </Button>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Exemple de requête (cURL)</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                  Testez la récupération de vos alias actifs directement depuis votre terminal :
                </p>

                <div style={{ background: '#070709', padding: 16, borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, fontFamily: 'monospace', color: '#cbd5e1', lineHeight: 1.6, overflowX: 'auto' }}>
                  <pre style={{ margin: 0 }}>
{`curl -X GET "${apiUrl}/alias" \\
  -H "X-Veilix-Key-Id: ${identity.keyId}"`}
                  </pre>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const cmd = `curl -X GET "${apiUrl}/alias" -H "X-Veilix-Key-Id: ${identity.keyId}"`
                        navigator.clipboard.writeText(cmd)
                        showToast('Commande cURL copiée', 'success')
                      }}
                    >
                      Copier la commande
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#e2e8f0' }}>Endpoints disponibles :</strong></div>
                  <div><code style={{ color: '#8b5cf6' }}>POST /key/verify</code> — Vérifier la validité de la clé et le plan actif</div>
                  <div><code style={{ color: '#8b5cf6' }}>GET /alias</code> — Lister l ensemble de vos alias</div>
                  <div><code style={{ color: '#8b5cf6' }}>POST /alias</code> — Générer un nouvel alias à la volée</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleSaveNotifications} style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: plan === 'pack' ? 'pointer' : 'not-allowed', fontSize: 13, opacity: plan === 'pack' ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={plan === 'pack' ? leakAlerts : false}
                      disabled={plan !== 'pack'}
                      onChange={(e) => setLeakAlerts(e.target.checked)}
                    />
                    <span>Alerte en temps réel en cas de fuite de données détectée</span>
                  </div>
                  {plan !== 'pack' && (
                    <span
                      onClick={(e) => {
                        e.preventDefault()
                        handleGoToPricing()
                      }}
                      style={{ fontSize: 11, fontWeight: 700, color: '#ffff', background: '#8b5cf6', border: '1px solid #a78bfa', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(139,92,246,0.4)', transition: 'all 0.2s ease' }}
                    >
                      Pack de lancement
                    </span>
                  )}
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} />
                  <span>Recevoir le rapport hebdomadaire des spams bloqués</span>
                </label>
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Enregistrer les préférences
              </Button>
            </form>

            <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Portabilité des données (RGPD)</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Téléchargez l intégralité de vos alias et configurations enregistrés.
              </p>
              <Button variant="secondary" size="sm" onClick={handleExportData}>
                Télécharger mes données (JSON)
              </Button>
            </div>
          </div>
        )}
      </main>

      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ flex: 1, height: 4, borderRadius: 2, background: cancelStep >= step ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            {cancelStep === 1 && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                  Avant de partir, dites-nous pourquoi...
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>
                  Votre retour nous aide à améliorer Veilix chaque jour. Quelle est la raison principale de votre départ ?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {[
                    { id: 'expensive', label: 'C est trop cher pour mon budget actuel' },
                    { id: 'unused', label: 'Je n utilise pas assez le service' },
                    { id: 'missing_feature', label: 'Il manque une fonctionnalité importante' },
                    { id: 'other', label: 'Autre raison' }
                  ].map(item => (
                    <label
                      key={item.id}
                      onClick={() => setCancelReason(item.id as CancelReason)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: cancelReason === item.id ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                        background: cancelReason === item.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#e2e8f0'
                      }}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={cancelReason === item.id}
                        onChange={() => setCancelReason(item.id as CancelReason)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowCancelModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleNextFromSurvey} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    Continuer
                  </Button>
                </div>
              </>
            )}

            {cancelStep === 2 && (
              <>
                {cancelReason === 'expensive' && (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', padding: '4px 8px', borderRadius: 6 }}>
                      Offre spéciale de maintien
                    </span>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#f1f5f9', marginTop: 10, marginBottom: 10 }}>
                      Et si on coupait la poire en deux ?
                    </h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
                      Veilix est un projet indépendant et je veux qu il reste accessible pour vous. Restez avec nous et bénéficiez immédiatement de <strong style={{ color: '#f1f5f9' }}>50 % de réduction sur votre prochain mois</strong>. Vous gardez tous vos avantages sans interruption.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Button variant="primary" size="md" onClick={handleAcceptSaveOffer} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                        Profiter de -50 % sur mon prochain mois
                      </Button>
                      <button
                        onClick={() => setCancelStep(3)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
                      >
                        Non merci, je souhaite quand même résilier
                      </button>
                    </div>
                  </>
                )}

                {cancelReason === 'unused' && (
                  <>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>
                      Votre protection travaille pourtant en silence
                    </h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                      Vous avez actuellement <strong style={{ color: '#8b5cf6' }}>{activeAliasesCount} alias actif{activeAliasesCount > 1 ? 's' : ''}</strong> sur votre tableau de bord. Même lorsque vous ne créez pas de nouveaux alias, Veilix filtre vos e-mails en arrière-plan et empêche votre vraie adresse d être revendue.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Button variant="primary" size="md" onClick={() => setShowCancelModal(false)} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                        Conserver ma protection active
                      </Button>
                      <button
                        onClick={() => setCancelStep(3)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
                      >
                        Continuer vers la résiliation
                      </button>
                    </div>
                  </>
                )}

                {(cancelReason === 'missing_feature' || cancelReason === 'other') && (
                  <>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>
                      Construisons Veilix ensemble
                    </h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                      Veilix évolue toutes les semaines grâce aux retours de ses utilisateurs. Avant de partir, dites-moi ce qu il vous manque à <strong style={{ color: '#a78bfa' }}>contact@veilix.fr</strong> : je développe souvent les fonctionnalités demandées en priorité.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <a
                        href="mailto:contact@veilix.fr?subject=Suggestion%20de%20fonctionnalit%C3%A9%20Veilix"
                        onClick={() => setShowCancelModal(false)}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          background: '#8b5cf6',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: 13,
                          padding: '10px 16px',
                          borderRadius: 8,
                          textDecoration: 'none'
                        }}
                      >
                        Envoyer un mail
                      </a>
                      <button
                        onClick={() => setCancelStep(3)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
                      >
                        Continuer vers la résiliation
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {cancelStep === 3 && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 12 }}>
                  Attention : Ce que vous allez perdre
                </h3>

                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  {plan === 'pack' ? (
                    <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>
                      <strong>Perte définitive du Pack de lancement :</strong> Cette offre collector est limitée à 100 exemplaires. En résiliant, vous perdez définitivement vos <strong>alias illimités</strong>, vos domaines personnalisés (jusqu à 3), vos alertes de fuite en temps réel, le chiffrement PGP et surtout votre <strong>prix bloqué à vie</strong>. Vous ne pourrez plus jamais y souscrire.
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>
                      <strong>Perte des avantages de l Offre Pro :</strong> En résiliant, vous perdez vos 100 alias actifs, la capacité de répondre depuis vos alias, l accès aux pièces jointes, aux tags personnalisés et à vos boîtes de destination.
                    </p>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 20, borderLeft: '3px solid #8b5cf6' }}>
                  <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, fontStyle: 'italic' }}>
                    Un mot du créateur : Veilix est un service indépendant que je développe seul avec passion. Si quelque chose ne va pas ou si vous avez besoin d un coup de main, écrivez-moi directement à{' '}
                    <a href="mailto:contact@veilix.fr" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
                      contact@veilix.fr
                    </a>
                    .<br />
                    Je lis et réponds personnellement à chaque message.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Button variant="primary" size="sm" onClick={() => setShowCancelModal(false)} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    Garder mon abonnement
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleFinalCancel}>
                    Confirmer la résiliation
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <SiteFooter t={t} />
    </div>
  )
}