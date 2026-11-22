'use client'
import Link from 'next/link'
import { Button } from '@/components/Button'

export type UpgradeReason = 'quota' | 'credits'

interface UpgradeModalProps {
  reason: UpgradeReason
  onClose: () => void
}

const CONTENT: Record<UpgradeReason, { title: string; text: React.ReactNode; primary: { href: string; label: string }; secondary: { href: string; label: string } }> = {
  quota: {
    title: 'Limite de 100 alias atteinte',
    text: (
      <>
        Votre plan Pro inclut 100 alias, désactivés compris. Utilisez des crédits pour en créer d&apos;autres, ou passez au <strong style={{ color: 'var(--c-a78bfa)' }}>Pack de lancement</strong> pour des alias illimités.
      </>
    ),
    primary: { href: '/pricing', label: 'Découvrir le Pack de lancement' },
    secondary: { href: '/pricing#credits', label: 'Acheter des crédits' },
  },
  credits: {
    title: 'Plus de crédits disponibles',
    text: (
      <>
        Chaque alias consomme 1 crédit, qui n&apos;est pas rendu à la suppression. Rachetez des crédits, ou passez à un <strong style={{ color: 'var(--c-a78bfa)' }}>abonnement</strong> pour créer vos alias sans compter.
      </>
    ),
    primary: { href: '/pricing#credits', label: 'Acheter des crédits' },
    secondary: { href: '/pricing', label: 'Voir les abonnements' },
  },
}

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const content = CONTENT[reason]
  return (
    <div
      role="dialog"
      aria-modal="true"
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
          background: 'var(--c-0d0d10)',
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
            color: 'var(--c-64748b)',
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

        <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.4px', color: 'var(--c-f1f5f9)' }}>
          {content.title}
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--c-94a3b8)', lineHeight: 1.6, marginBottom: 24 }}>
          {content.text}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={content.primary.href} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" style={{ width: '100%' }}>
              {content.primary.label}
            </Button>
          </Link>
          <Link href={content.secondary.href} style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md" style={{ width: '100%' }}>
              {content.secondary.label}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
