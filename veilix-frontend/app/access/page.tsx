'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Toast, useToast } from '@/components/Toast'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import {
  generateIdentity,
  restoreIdentityFromSeed,
  saveIdentity,
  type VeilixIdentity,
} from '@/lib/crypto'
import { registerKey, verifyKey } from '@/lib/api'
import { T, Lang } from '@/lib/translations'

type Step = 'choice' | 'generating' | 'reveal' | 'confirm' | 'recovery-email' | 'restore'

function AccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')

  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [authLoading, user, router])

  const { toast, showToast, hideToast } = useToast()
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  const [step, setStep] = useState<Step>(mode === 'restore' ? 'restore' : 'choice')
  const [identity, setIdentity] = useState<VeilixIdentity | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copiedSeed, setCopiedSeed] = useState(false)
  const [confirmWords, setConfirmWords] = useState<Record<number, string>>({})
  const [checkIndices, setCheckIndices] = useState<number[]>([])
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [restoreWords, setRestoreWords] = useState<string[]>(Array(12).fill(''))
  const restoreInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'restore') {
      setStep('restore')
    }
  }, [mode])

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
      showToast(lang === 'fr' ? 'Erreur lors de la génération de la clé' : 'Error generating key', 'error')
      setStep('choice')
    }
  }

  function handleConfirmSubmit() {
    if (!identity) return
    const words = identity.seedPhrase.split(' ')
    const allCorrect = checkIndices.every(i => confirmWords[i]?.trim().toLowerCase() === words[i])
    if (!allCorrect) {
      showToast(lang === 'fr' ? 'Mots incorrects, vérifiez votre sauvegarde' : 'Incorrect words, check your backup', 'error')
      return
    }
    setStep('recovery-email')
  }

  async function handleFinalize(skipEmail: boolean) {
    if (!identity) return
    setLoading(true)
    try {
      const finalIdentity = { ...identity, recoveryEmail: skipEmail ? undefined : recoveryEmail || undefined }
      await registerKey(finalIdentity.keyId, finalIdentity.recoveryEmail)
      await saveIdentity(finalIdentity)
      showToast(lang === 'fr' ? 'Clé créée avec succès' : 'Key created successfully', 'success')
      router.push('/pricing')
    } catch {
      showToast(lang === 'fr' ? 'Serveur inaccessible. Vérifiez que le backend est actif.' : 'Server unreachable. Check backend status.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    const phrase = restoreWords.map(w => w.trim().toLowerCase()).join(' ')
    if (restoreWords.some(w => !w.trim())) {
      showToast(lang === 'fr' ? 'Veuillez remplir les 12 mots' : 'Please fill in all 12 words', 'error')
      return
    }
    setLoading(true)
    try {
      const restored = await restoreIdentityFromSeed(phrase)
      if (!restored) {
        showToast(lang === 'fr' ? 'Seed phrase invalide' : 'Invalid seed phrase', 'error')
        setLoading(false)
        return
      }
      const check = await verifyKey(restored.keyId)
      if (!check || check.exists !== true) {
        showToast(lang === 'fr' ? 'Aucune clé associée à cette seed phrase' : 'No key associated with this seed phrase', 'error')
        setLoading(false)
        return
      }
      await saveIdentity(restored)
      showToast(lang === 'fr' ? 'Clé restaurée avec succès' : 'Key restored successfully', 'success')
      router.push('/dashboard')
    } catch {
      showToast(lang === 'fr' ? 'Erreur lors de la restauration' : 'Error during restoration', 'error')
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
        words.slice(0, 12).forEach((w, i) => { if (index + i < 12) next[index + i] = w.toLowerCase() })
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
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .step-enter{animation:fadeUp .5s ease both}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <SiteNav t={t} lang={lang} setLang={setLang} mode="auth" />

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

          {step === 'choice' && (
            <div className="step-enter" style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 24 }}>
                {t.access.badge}
              </div>

              <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 14 }}>
                {t.access.title}
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 40px', whiteSpace: 'pre-line' }}>
                {t.access.subtitle}
              </p>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, textAlign: 'left' }}>
                <Button variant="primary" size="lg" onClick={handleGenerate} style={{ width: '100%', marginBottom: 12 }}>
                  {t.access.generateBtn}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep('restore')} style={{ width: '100%' }}>
                  {t.access.restoreBtn}
                </Button>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {t.access.bullets.map((txt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{txt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'generating' && (
            <div className="step-enter" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 24px', borderRadius: '50%', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500, animation: 'pulse 1.5s ease infinite' }}>{lang === 'fr' ? 'Génération de votre clé...' : 'Generating your key...'}</p>
              <p style={{ fontSize: 12, color: '#334155', marginTop: 8 }}>{lang === 'fr' ? 'Chiffrement local en cours' : 'Local encryption in progress'}</p>
            </div>
          )}

          {step === 'reveal' && identity && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  {t.access.revealTitle}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
                  {t.access.revealSub}
                </p>
              </div>

              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 20, background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, filter: revealed ? 'none' : 'blur(8px)', userSelect: revealed ? 'text' : 'none', transition: 'filter 0.3s' }}>
                  {identity.seedPhrase.split(' ').map((word, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, minWidth: 14 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#e2e8f0' }}>{word}</span>
                    </div>
                  ))}
                </div>
                {!revealed && (
                  <button onClick={() => setRevealed(true)} style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.5)', border: 'none', borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{t.access.clickToReveal}</span>
                  </button>
                )}
              </div>

              {revealed && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(identity.seedPhrase)
                    setCopiedSeed(true)
                    showToast(lang === 'fr' ? 'Phrase copiée' : 'Phrase copied', 'success')
                    setTimeout(() => setCopiedSeed(false), 2000)
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '10px', marginBottom: 20, background: copiedSeed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${copiedSeed ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all .15s', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: copiedSeed ? '#4ade80' : '#94a3b8' }}
                >
                  {copiedSeed ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {t.access.copied}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      {t.access.copyWords}
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
                <p style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {t.access.warningText}
                </p>
              </div>

              <Button variant="primary" size="lg" onClick={() => setStep('confirm')} disabled={!revealed} style={{ width: '100%' }}>
                {t.access.notedBtn}
              </Button>
            </div>
          )}

          {step === 'confirm' && identity && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  {t.access.confirmTitle}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  {t.access.confirmSub}
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  {checkIndices.map(i => (
                    <Input key={i} label={`${lang === 'fr' ? 'Mot' : 'Word'} n°${i + 1}`} value={confirmWords[i] || ''} onChange={e => setConfirmWords(prev => ({ ...prev, [i]: e.target.value }))} placeholder="..." />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="md" onClick={() => setStep('reveal')} style={{ flex: 1 }}>{t.access.back}</Button>
                  <Button variant="primary" size="md" onClick={handleConfirmSubmit} style={{ flex: 1 }}>{t.access.confirmBtn}</Button>
                </div>
              </div>
            </div>
          )}

          {step === 'recovery-email' && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  {t.access.recoveryTitle}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
                  {t.access.recoverySub}
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <Input type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} placeholder="you@example.com (optional)" style={{ marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Button variant="primary" size="lg" loading={loading} onClick={() => handleFinalize(false)} disabled={!recoveryEmail} style={{ width: '100%' }}>
                    {t.access.addAndContinue}
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => handleFinalize(true)} style={{ width: '100%' }}>
                    {t.access.skipStep}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'restore' && (
            <div className="step-enter">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10 }}>
                  {t.access.restoreTitle}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  {t.access.restoreSub}
                </p>
              </div>

              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="text" placeholder={t.access.pastePlaceholder} onPaste={e => handleWordPaste(0, e)} onChange={() => {}} value="" style={{ width: '100%', padding: '12px 14px', background: '#0a0a0c', border: '1px dashed rgba(124,58,237,0.3)', borderRadius: 10, fontSize: 13, color: '#94a3b8', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
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
                        showToast(lang === 'fr' ? 'Phrase collée' : 'Phrase pasted', 'success')
                      } catch {
                        showToast(lang === 'fr' ? 'Collage indisponible, utilisez Ctrl+V dans le champ' : 'Paste unavailable, use Ctrl+V in the field', 'error')
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                    {t.access.pasteBtn}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>{t.access.manualSeparator}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {restoreWords.map((word, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, transition: 'border-color .15s' }}>
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
                        style={{ width: '100%', padding: '9px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'monospace', color: '#f1f5f9' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="md" onClick={() => setStep('choice')} style={{ flex: 1 }}>{t.access.back}</Button>
                  <Button variant="primary" size="md" loading={loading} onClick={handleRestore} style={{ flex: 1 }}>{t.access.restoreAction}</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      <SiteFooter t={t} />
    </div>
  )
}

export default function Access() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060608' }} />}>
      <AccessContent />
    </Suspense>
  )
}