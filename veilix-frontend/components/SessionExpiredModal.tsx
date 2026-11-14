'use client'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
}

export function SessionExpiredModal({ onClose }: Props) {
  const router = useRouter()

  function handleClose() {
    onClose()
    router.push('/access')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'relative', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 380, textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

        <button
          onClick={handleClose}
          aria-label="Fermer"
          style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background .15s, color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#f1f5f9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.3px' }}>
          Session expirée
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          Vous avez été déconnecté automatiquement après une période d&apos;inactivité, pour protéger votre identité.
        </p>

        <button
          onClick={handleClose}
          style={{ width: '100%', padding: '11px', borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  )
}