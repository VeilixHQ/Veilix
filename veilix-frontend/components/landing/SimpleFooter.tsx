'use client'
import Link from 'next/link'

interface Props {
  lang: 'fr' | 'en'
}

const content = {
  fr: { copy: '© 2026 Veilix. Tous droits réservés.', confidentialite: 'Confidentialité', cgu: 'CGU', contact: 'Contact' },
  en: { copy: '© 2026 Veilix. All rights reserved.', confidentialite: 'Privacy', cgu: 'Terms', contact: 'Contact' },
}

export function SimpleFooter({ lang }: Props) {
  const t = content[lang]
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 40px' }}>
      <style>{`
        .footer-link{font-size:13px;color:#475569;text-decoration:none;transition:color .15s}
        .footer-link:hover{color:#a78bfa}
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#334155' }}>{t.copy}</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/confidentialite" className="footer-link">{t.confidentialite}</Link>
          <Link href="/cgu" className="footer-link">{t.cgu}</Link>
          <Link href="/contact" className="footer-link">{t.contact}</Link>
        </div>
      </div>
    </footer>
  )
}