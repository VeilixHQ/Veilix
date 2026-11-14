'use client'
import Link from 'next/link'
import { Button } from '@/components/Button'

interface UpgradeModalProps {
  onClose: () => void
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          background: '#0d0d10',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 440,
          textAlign: 'center',
          animation: 'fadeUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: 4,
          }}
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.3)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>

        <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.4px', color: '#f1f5f9' }}>
          Limite de 100 alias atteinte
        </h3>
        <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
          Votre plan Pro est limité à 100 alias actifs. Passez au <strong style={{ color: '#a78bfa' }}>Pack de lancement</strong> pour profiter des alias illimités à vie.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" style={{ width: '100%' }}>
              Découvrir le Pack de lancement
            </Button>
          </Link>
          <Button variant="secondary" size="md" onClick={onClose} style={{ width: '100%' }}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}