'use client'

interface Props {
  countdown: number
  onStay: () => void
}

export function InactivityWarning({ countdown, onStay }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 380,
        textAlign: 'center', animation: 'fadeUp 0.3s ease',
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Icône */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Titre */}
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.3px' }}>
          Session inactive
        </h2>

        {/* Message */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          Vous allez être déconnecté pour des raisons de sécurité.
        </p>

        {/* Compte à rebours */}
        <div style={{
          fontSize: 40, fontWeight: 900, letterSpacing: '-2px',
          color: countdown <= 3 ? '#f87171' : '#a78bfa',
          marginBottom: 24, transition: 'color 0.3s',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {countdown}s
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onStay}
            style={{
              width: '100%', padding: '11px', borderRadius: 9,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            Rester connecté
          </button>
          <p style={{ fontSize: 11, color: '#334155' }}>
            Déconnexion automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}