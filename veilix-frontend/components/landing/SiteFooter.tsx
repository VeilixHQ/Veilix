'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Translations } from '@/lib/translations'

const LOGO_SIZE = 48

export function SiteFooter({ t }: { t: Translations }) {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0c' }}>
      <div className="footer-grid" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 48px 40px', display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, alignItems: 'start' }}>
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', marginBottom: 10 }}>
            <div style={{ width: LOGO_SIZE, height: LOGO_SIZE, flexShrink: 0, position: 'relative' }}>
              <Image src="/vlx-white.svg" alt="Veilix" fill style={{ objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>Veilix</span>
          </Link>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, marginBottom: 18, maxWidth: 200 }}>{t.footerDesc}</p>
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
        {t.footerCols.map((col, i) => (
          <div key={i}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map((link, j) => (
                <li key={j}><Link href={link.href} className="footer-link">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '20px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#1e293b' }}>{t.footerCopy}</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {t.footerLegal.map((l, i) => (
              <Link key={i} href={l.href} style={{ fontSize: 12, color: '#1e293b', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}