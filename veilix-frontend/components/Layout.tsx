import Link from 'next/link'
import { ReactNode } from 'react'

const S = {
  nav: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 60,
    background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: {
    fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
    WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const,
    textDecoration: 'none',
  },
  navLink: {
    fontSize: 13, color: '#64748b', textDecoration: 'none',
    fontWeight: 500, transition: 'color 0.2s',
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '28px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: 16,
    maxWidth: 1100, margin: '0 auto',
  },
  footerLink: {
    fontSize: 13, color: '#475569', textDecoration: 'none',
  },
}

export function PublicNav() {
  return (
    <nav style={S.nav}>
      <Link href="/" style={S.logo}>Veilix</Link>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Link href="#features" style={S.navLink}>Fonctionnalités</Link>
        <Link href="#pricing" style={S.navLink}>Tarifs</Link>
        <Link href="/login" style={{ ...S.navLink, color: '#94a3b8' }}>Connexion</Link>
        <Link href="/register" style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', background: '#7c3aed', textDecoration: 'none' }}>
          Commencer
        </Link>
      </div>
    </nav>
  )
}

export function DashboardNav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav style={S.nav}>
      <Link href="/dashboard" style={S.logo}>Veilix</Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/dashboard" style={{ ...S.navLink, color: '#94a3b8' }}>Dashboard</Link>
        <button onClick={onLogout} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#94a3b8', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
          Déconnexion
        </button>
      </div>
    </nav>
  )
}

export function AuthNav() {
  return (
    <nav style={S.nav}>
      <Link href="/" style={S.logo}>Veilix</Link>
      <Link href="/" style={{ ...S.navLink, color: '#64748b', fontSize: 13 }}>Retour</Link>
    </nav>
  )
}

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 0' }}>
      <div style={S.footer}>
        <span style={{ fontSize: 13, color: '#334155' }}>© 2026 Veilix</span>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Confidentialité', '/confidentialite'], ['CGU', '/cgu'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={h} href={h} style={S.footerLink}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}