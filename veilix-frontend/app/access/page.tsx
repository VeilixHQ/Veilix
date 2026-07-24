'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { Toast, useToast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import {
  generateIdentity,
  restoreIdentityFromSeed,
  saveIdentity,
  type VeilixIdentity,
} from '@/lib/crypto'
import { registerKey, verifyKey } from '@/lib/api'

type Step = 'choice' | 'generating' | 'reveal' | 'confirm' | 'recovery-email' | 'restore'


function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      o: Math.random() * 0.4 + 0.1,
    }))
    let raf: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${p.o})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}


function AccessNav() {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 58, background: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
        <Image src="/vlx-white.svg" alt="Veilix" width={60} height={60} style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }} />
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff', whiteSpace: 'nowrap' }}>Veilix</span>
      </Link>
      <Link href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color .15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
        ← Retour à l&apos;accueil
      </Link>
    </nav>
  )
}


function SiteFooter() {
  const footerCols = [
    { title: 'Produit', links: [{ label: 'Fonctionnalités', href: '/#features' }, { label: 'Fonctionnement', href: '/#how' }, { label: 'Tarifs', href: '/pricing' }, { label: 'Affiliation', href: '/pricing#affiliation' }] },
    { title: 'Ressources', links: [{ label: 'Documentation', href: '#' }, { label: 'API', href: '#' }, { label: 'Changelog', href: '#' }, { label: 'Statut', href: '#' }, { label: 'Blog', href: '#' }] },
    { title: 'Entreprise', links: [{ label: 'À propos', href: '#' }, { label: 'Contact', href: '/contact' }, { label: 'Presse', href: '#' }, { label: 'Open Source', href: '#' }] },
    { title: 'Légal', links: [{ label: 'Confidentialité', href: '/confidentialite' }, { label: 'CGU', href: '/cgu' }, { label: 'Remboursement', href: '#' }, { label: 'Signaler un abus', href: '#' }] },
  ]
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0c' }}>
      <style>{`
        .access-footer-link{font-size:13px;color:#475569;text-decoration:none;transition:color .15s}
        .access-footer-link:hover{color:#a78bfa}
        @media(max-width:768px){ .access-footer-grid{grid-template-columns:1fr 1fr!important} }
      `}</style>
      <div className="access-footer-grid" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 48px 40px', display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, alignItems: 'start' }}>
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', marginBottom: 10 }}>
            <div style={{ width: 60, height: 60, flexShrink: 0, position: 'relative' }}>
              <Image src="/vlx-white.svg" alt="Veilix" fill style={{ objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>Veilix</span>
          </Link>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, marginBottom: 18, maxWidth: 200 }}>
            Protégez votre identité numérique avec des alias email instantanés.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {['No Account', 'No Logs', 'Open Source'].map((pill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#334155', fontWeight: 500 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', flexShrink: 0 }} />
                {pill}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              <svg key="gh" width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
              <svg key="x" width="13" height="13" viewBox="0 0 24 24" fill="#64748b"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            ].map((icon, i) => (
              <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</a>
            ))}
          </div>
        </div>
        {footerCols.map((col, i) => (
          <div key={i}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map((link, j) => (
                <li key={j}><Link href={link.href} className="access-footer-link">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '20px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#1e293b' }}>© 2026 Veilix. Tous droits réservés.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[{ label: 'Confidentialité', href: '/confidentialite' }, { label: 'CGU', href: '/cgu' }, { label: 'Contact', href: '/contact' }].map((l, i) => (
              <Link key={i} href={l.href} style={{ fontSize: 12, color: '#1e293b', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Access() {
  
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()

  const [step, setStep] = useState<Step>('choice')
  const [identity, setIdentity] = useState<VeilixIdentity | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copiedSeed, setCopiedSeed] = useState(false)
  const [confirmWords, setConfirmWords] = useState<Record<number, string>>({})
  const [checkIndices, setCheckIndices] = useState<number[]>([])
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [restoreWords, setRestoreWords] = useState<string[]>(Array(12).fill(''))
  const restoreInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setStep('generating')
    try {
      const id = await generateIdentity()
      setIdentity(id)
      const words = id.seedPhrase.split(' ')
      const indices = new Set<number>()
      while (indices.size < 3) indices.add(Math.floor(Math.random() * words.length))
      setCheckIndices(Array.from(indices).sort((a, b) => a - b))
      setTimeout(() => setStep('reveal'), 600)
    } catch {
      showToast('Erreur lors de la génération de la clé', 'error')
      setStep('choice')
    }
  }

  function handleConfirmSubmit() {
    if (!identity) return
    const words = identity.seedPhrase.split(' ')
    const allCorrect = checkIndices.every(i => confirmWords[i]?.trim().toLowerCase() === words[i])
    if (!allCorrect) {
      showToast('Mots incorrects, vérifiez votre sauvegarde', 'error')
      return
    }
    setStep('recovery-email')
  }

  async function handleFinalize(skipEmail: boolean) {
    if (!identity) return
    setLoading(true)
    try {
      const finalIdentity = { ...identity, recoveryEmail: skipEmail ? undefined : recoveryEmail || undefined }
      await saveIdentity(finalIdentity)
      await registerKey(finalIdentity.keyId, finalIdentity.recoveryEmail)
      showToast('Clé créée avec succès', 'success')
      router.push('/dashboard')
    } catch {
      showToast('Serveur inaccessible. Vérifiez que le backend est actif.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    const phrase = restoreWords.map(w => w.trim().toLowerCase()).join(' ')
    if (restoreWords.some(w => !w.trim())) {
      showToast('Veuillez remplir les 12 mots', 'error')
      return
    }
    setLoading(true)
    try {
      const restored = await restoreIdentityFromSeed(phrase)
      if (!restored) {
        showToast('Seed phrase invalide', 'error')
        setLoading(false)
        return
      }
      const check = await verifyKey(restored.keyId)
      if (!check || check.exists === false) {
        showToast('Aucune clé associée à cette seed phrase', 'error')
        setLoading(false)
        return
      }
      await saveIdentity(restored)
      showToast('Clé restaurée avec succès', 'success')
      router.push('/dashboard')
    } catch {
      showToast('Erreur lors de la restauration', 'error')
    } finally {
      setLoading(false)
    }
  }

  
  function handleWordChange(index: number, value: string) {
    if (value.includes(' ')) {
      const clean = value.replace(/\s+/g, ' ').trim()
      setRestoreWords(prev => {
        const next = [...prev]
        next[index] = clean.split(' ')[0] || ''
        return next
      })
      restoreInputRefs.current[index + 1]?.focus()
      return
    }
    setRestoreWords(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  
  function handleWordPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').trim()
    const words = text.split(/\s+/)
    if (words.length > 1) {
      e.preventDefault()
      setRestoreWords(prev => {
        const next = [...prev]
        words.slice(0, 12).forEach((w, i) => {
          if (index + i < 12) next[index + i] = w.toLowerCase()
        })
        return next
      })
      const lastFilled = Math.min(index + words.length - 1, 11)
      setTimeout(() => restoreInputRefs.current[lastFilled]?.focus(), 0)
    }
  }

  function handleWordKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !restoreWords[index] && index > 0) {
      restoreInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 11) {
      restoreInputRefs.current[index + 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      restoreInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (index < 11) restoreInputRefs.current[index + 1]?.focus()
      else handleRestore()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .step-enter{animation:fadeUp .5s ease both}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <AccessNav />

      {}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <Particles />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

          {}
          {step === 'choice' && (
            <div className="step-enter" style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 24 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', flexShrink: 0 }} />
                No Account · No Logs
              </div>

              <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 14 }}>
                Accédez à Veilix
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 40px' }}>
                Aucun email, aucun mot de passe. Une clé générée localement dans votre navigateur, qui vous appartient entièrement.
              </p>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, textAlign: 'left' }}>
                <Button variant="primary" size="lg" onClick={handleGenerate} style={{ width: '100%', marginBottom: 12 }}>
                  Générer ma clé
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep('restore')} style={{ width: '100%' }}>
                  J&apos;ai déjà une clé
                </Button>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { text: '• Clé générée et stockée uniquement dans votre navigateur' },
                    { text: '• Aucune donnée personnelle envoyée à nos serveurs' },
                    { text: '• Vous seul possédez votre phrase de récupération' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start'}}>
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{item.text} </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {}
          {step === 'generating' && (
            <div className="step-enter" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 24px', borderRadius: '50%', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500, animation: 'pulse 1.5s ease infinite' }}>Génération de votre clé...</p>
              <p style={{ fontSize: 12, color: '#334155', marginTop: 8 }}>Chiffrement local en cours</p>
            </div>
          )}

          {}
          {step === 'reveal' && identity && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  Votre phrase de récupération
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
                  Notez ces 12 mots dans l&apos;ordre et conservez-les en lieu sûr. C&apos;est le seul moyen de récupérer votre compte.
                </p>
              </div>

              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                  padding: 20, background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
                  filter: revealed ? 'none' : 'blur(8px)', userSelect: revealed ? 'text' : 'none',
                  transition: 'filter 0.3s',
                }}>
                  {identity.seedPhrase.split(' ').map((word, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, minWidth: 14 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#e2e8f0' }}>{word}</span>
                    </div>
                  ))}
                </div>
                {!revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.5)', border: 'none', borderRadius: 14,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Cliquez pour révéler</span>
                  </button>
                )}
              </div>

              {revealed && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(identity.seedPhrase)
                    setCopiedSeed(true)
                    showToast('Phrase copiée dans le presse-papier', 'success')
                    setTimeout(() => setCopiedSeed(false), 2000)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    width: '100%', padding: '10px', marginBottom: 20,
                    background: copiedSeed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${copiedSeed ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                    color: copiedSeed ? '#4ade80' : '#94a3b8',
                  }}
                >
                  {copiedSeed ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Copié
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      Copier les 12 mots
                    </>
                  )}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 16px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, marginBottom: 24 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <circle cx="12" cy="17" r="1" fill="#f87171" />
                </svg>
                <p style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
                  Ne partagez jamais cette phrase. Veilix ne vous la demandera jamais par email ou support.
                </p>
              </div>

              <Button variant="primary" size="lg" onClick={() => setStep('confirm')} disabled={!revealed} style={{ width: '100%' }}>
                J&apos;ai noté ma phrase
              </Button>
            </div>
          )}

          {}
          {step === 'confirm' && identity && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  Confirmez votre phrase
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  Entrez les mots demandés pour vérifier votre sauvegarde.
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  {checkIndices.map(i => (
                    <Input
                      key={i}
                      label={`Mot n°${i + 1}`}
                      value={confirmWords[i] || ''}
                      onChange={e => setConfirmWords(prev => ({ ...prev, [i]: e.target.value }))}
                      placeholder="..."
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="md" onClick={() => setStep('reveal')} style={{ flex: 1 }}>
                    Retour
                  </Button>
                  <Button variant="primary" size="md" onClick={handleConfirmSubmit} style={{ flex: 1 }}>
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {}
          {step === 'recovery-email' && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  Email de récupération
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
                  Optionnel, mais recommandé. Utile si vous perdez votre phrase de récupération. Jamais utilisé à d&apos;autres fins.
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <Input
                  type="email"
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  placeholder="vous@exemple.com (optionnel)"
                  style={{ marginBottom: 20 }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Button variant="primary" size="lg" loading={loading} onClick={() => handleFinalize(false)} disabled={!recoveryEmail} style={{ width: '100%' }}>
                    Ajouter et continuer
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => handleFinalize(true)} style={{ width: '100%' }}>
                    Passer cette étape
                  </Button>
                </div>
              </div>
            </div>
          )}

          {}
          {step === 'restore' && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  Restaurer votre clé
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  Entrez votre phrase de récupération de 12 mots, séparés par des espaces.
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>

                {}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Coller votre phrase de 12 mots ici..."
                      onPaste={e => handleWordPaste(0, e)}
                      onChange={() => {}}
                      value=""
                      style={{
                        width: '100%', padding: '12px 14px', background: '#0a0a0c',
                        border: '1px dashed rgba(124,58,237,0.3)', borderRadius: 10,
                        fontSize: 13, color: '#94a3b8', outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        const words = text.trim().split(/\s+/)
                        setRestoreWords(prev => {
                          const next = [...prev]
                          words.slice(0, 12).forEach((w, i) => { next[i] = w.toLowerCase() })
                          return next
                        })
                        showToast('Phrase collée', 'success')
                      } catch {
                        showToast('Collage indisponible, utilisez Ctrl+V dans le champ', 'error')
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
                      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                      borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      fontSize: 12, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                    Coller
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>OU SAISIR MANUELLEMENT</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {restoreWords.map((word, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, transition: 'border-color .15s' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                    >
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, minWidth: 14, flexShrink: 0 }}>{i + 1}</span>
                      <input
                        ref={el => { restoreInputRefs.current[i] = el }}
                        value={word}
                        onChange={e => handleWordChange(i, e.target.value)}
                        onPaste={e => handleWordPaste(i, e)}
                        onKeyDown={e => handleWordKeyDown(i, e)}
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        style={{
                          width: '100%', padding: '9px 0', background: 'transparent', border: 'none', outline: 'none',
                          fontSize: 13, fontFamily: 'monospace', color: '#f1f5f9',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="md" onClick={() => setStep('choice')} style={{ flex: 1 }}>
                    Retour
                  </Button>
                  <Button variant="primary" size="md" loading={loading} onClick={handleRestore} style={{ flex: 1 }}>
                    Restaurer
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      <SiteFooter />
    </div>
  )
}