import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-080808)', color: 'var(--c-f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-4px', color: 'var(--c-a78bfa)', marginBottom: 12 }}>404</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--c-94a3b8)' }}>Page introuvable</h1>
        <p style={{ fontSize: 14, color: 'var(--c-334155)', marginBottom: 32 }}>Cette page n’existe pas ou a été déplacée.</p>
        <Link href="/" style={{ padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', background: '#7c3aed', textDecoration: 'none' }}>
          Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}