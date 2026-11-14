'use client'
import { useState } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'
import { PT } from '@/lib/translations-pages'

export default function Contact() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const pt = PT[lang].contact

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    window.location.href = `mailto:contact@veilix.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        input,textarea{width:100%;padding:11px 14px;background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:13px;color:#f1f5f9;outline:none;font-family:Inter,sans-serif;transition:border-color .2s;resize:none}
        input:focus,textarea:focus{border-color:rgba(124,58,237,0.4)}
      `}</style>

      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{pt.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{pt.title}</h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{pt.sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
          {[
            { icon: '📧', label: pt.email, value: 'contact@veilix.fr', href: 'mailto:contact@veilix.fr' },
            { icon: '💬', label: pt.discord, value: pt.discordValue, href: '#' },
          ].map((c, i) => (
            <a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, textDecoration: 'none', transition: 'border-color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{c.label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{c.value}</div>
              </div>
            </a>
          ))}
        </div>

        {!sent ? (
          <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px' }}>{pt.formTitle}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{pt.subjectLabel}</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={pt.subjectPlaceholder} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{pt.messageLabel}</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={pt.messagePlaceholder} rows={5} required />
              </div>
              <button type="submit" style={{ padding: '11px', borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>{pt.send}</button>
            </form>
          </div>
        ) : (
          <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>{pt.sentTitle}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{pt.sentDesc}</div>
          </div>
        )}
      </div>

      <SiteFooter t={t} />
    </div>
  )
}