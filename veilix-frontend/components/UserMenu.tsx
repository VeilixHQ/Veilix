'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { forgetIdentity } from '@/lib/crypto'
import { AccountBadge, BadgeDefs, BadgeRow } from '@/components/Badges'

interface Props {
  plan: string
  keyIdShort: string
  fullKeyId: string
  badges?: AccountBadge[]
}

export function UserMenu({ plan, keyIdShort, fullKeyId, badges = [] }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function handleLogout() {
    await forgetIdentity()
    router.push('/access')
  }

  async function handleChangeIdentity() {
    await forgetIdentity()
    router.push('/access')
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(fullKeyId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <BadgeDefs />
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Menu utilisateur"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#7c3aed',
            border: '1px solid rgba(var(--ink),0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'transform .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 10,
            width: 280, background: 'var(--c-111118)', border: '1px solid rgba(var(--ink),0.08)',
            borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden', zIndex: 300, animation: 'menuIn 0.15s ease',
          }}>
            <style>{`@keyframes menuIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(var(--ink),0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-f1f5f9)' }}>Veilix Identity</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-64748b)', fontFamily: 'monospace', marginBottom: 4 }}>
                Key: {keyIdShort}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 100, background: plan === 'pro' ? 'rgba(124,58,237,0.12)' : 'rgba(100,116,139,0.1)', border: `1px solid ${plan === 'pro' ? 'rgba(124,58,237,0.25)' : 'rgba(100,116,139,0.2)'}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: plan === 'pro' ? 'var(--c-a78bfa)' : 'var(--c-94a3b8)' }}>{plan}</span>
              </div>
              <BadgeRow badges={badges} />
            </div>

            <div style={{ padding: 6 }}>
              <Link href="/settings" style={menuItemStyle} onClick={() => setOpen(false)}>
                <MenuIcon path="settings" />
                <span>Paramètres</span>
              </Link>
              <button style={{ ...menuItemStyle, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setShowKeyModal(true); setOpen(false) }}>
                <MenuIcon path="key" />
                <span>Voir ma clé</span>
              </button>
            </div>

            <div style={{ height: 1, background: 'rgba(var(--ink),0.06)', margin: '0 6px' }} />

            <div style={{ padding: 6 }}>
              <button style={{ ...menuItemStyle, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setOpen(false); handleChangeIdentity() }}>
                <MenuIcon path="refresh" />
                <span>Changer d&apos;identité</span>
              </button>
              <button style={{ ...menuItemStyle, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--c-f87171)' }} onClick={() => { setOpen(false); handleLogout() }}>
                <MenuIcon path="logout" color="var(--c-f87171)" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showKeyModal && (
        <Modal onClose={() => setShowKeyModal(false)}>
          <h2 style={titleStyle}>Votre clé complète</h2>
          <div style={{ padding: '12px 14px', background: 'var(--c-0a0a0c)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--c-e2e8f0)', wordBreak: 'break-all', marginBottom: 16 }}>
            {fullKeyId}
          </div>
          <button
            onClick={copyKey}
            style={{ width: '100%', padding: '10px', borderRadius: 9, background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.25)'}`, color: copied ? 'var(--c-4ade80)' : 'var(--c-a78bfa)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 1000, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, boxSizing: 'border-box',
      }}
    >
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', background: 'var(--c-0e0e0e)',
          border: '1px solid rgba(var(--ink),0.08)', borderRadius: 16,
          padding: 28, width: '100%', maxWidth: 400, maxHeight: '90vh',
          overflowY: 'auto', boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif', animation: 'modalIn 0.2s ease',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: 12, right: 12, width: 28, height: 28,
            borderRadius: 8, border: 'none', background: 'rgba(var(--ink),0.05)',
            color: 'var(--c-94a3b8)', fontSize: 18, lineHeight: 1, cursor: 'pointer',
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}

const titleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--c-f1f5f9)', paddingRight: 28,
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 8,
  fontSize: 13, fontWeight: 500, color: 'var(--c-cbd5e1)',
  textDecoration: 'none', transition: 'background .15s',
}

function MenuIcon({ path, color = 'var(--c-94a3b8)' }: { path: string; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    key: <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color }}>
      {icons[path]}
    </svg>
  )
}