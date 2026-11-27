'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Translations } from '@/lib/translations'

const LOGO_SCALE = 54

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    href: 'https://github.com/VeilixHQ/Veilix',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com/VeilixHQ',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#64748b">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/Cfze5qmvhV',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#64748b">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
] as const

export function SiteFooter({ t }: { t: Translations }) {
  return (
    <footer style={{ borderTop: '1px solid rgba(var(--ink),0.06)', background: 'var(--c-0a0a0c)' }}>
      <div className="footer-inner footer-grid" style={{ paddingTop: 48, paddingBottom: 40 }}>
        <div className="footer-brand">
          <Link href="/" aria-label="Veilix" style={{ display: 'flex', alignItems: 'center', gap: 9, height: 24, marginBottom: 16, textDecoration: 'none', width: 'fit-content' }}>
            <span aria-hidden style={{ width: 23, height: 21, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <Image src="/vlx-white.svg" alt="Logo Veilix" width={LOGO_SCALE} height={LOGO_SCALE} style={{ position: 'absolute', left: -16, top: -16, width: LOGO_SCALE, height: LOGO_SCALE, maxWidth: 'none' }} />
            </span>
            <span style={{ fontSize: 20, lineHeight: '24px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--c-heading)' }}>Veilix</span>
          </Link>
          <p style={{ fontSize: 13, color: 'var(--c-475569)', lineHeight: 1.75, marginBottom: 18, maxWidth: 220 }}>{t.footerDesc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {['No Account', 'No Logs', 'Open Source'].map((pill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--c-334155)', fontWeight: 500 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', flexShrink: 0 }} />
                {pill}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {SOCIAL_LINKS.map(social => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--ink),0.04)', border: '1px solid rgba(var(--ink),0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s, border-color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--ink),0.04)'; e.currentTarget.style.borderColor = 'rgba(var(--ink),0.06)' }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        {t.footerCols.map((col, i) => (
          <div key={i}>
            <div style={{ fontSize: 13, lineHeight: '24px', fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map((link, j) => (
                <li key={j}>
                  {link.href.startsWith('http')
                    ? <a href={link.href} target="_blank" rel="noopener noreferrer" className="footer-link">{link.label}</a>
                    : <Link href={link.href} className="footer-link">{link.label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(var(--ink),0.04)' }}>
        <div className="footer-inner" style={{ paddingTop: 20, paddingBottom: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--c-1e293b)' }}>{t.footerCopy}</span>
        </div>
      </div>
    </footer>
  )
}
