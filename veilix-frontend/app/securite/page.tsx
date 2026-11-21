'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Ban, CodeXml, KeyRound, Mail, Server, UserX, type LucideIcon } from 'lucide-react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'
import { PT } from '@/lib/translations-pages'

const LINK: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--c-a78bfa)', textDecoration: 'none' }
const TEXT: React.CSSProperties = { fontSize: 14, color: 'var(--c-94a3b8)', lineHeight: 1.8 }

function Block({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} style={{ scrollMarginTop: 96, background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 14, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-a78bfa)' }}>
          <Icon size={18} strokeWidth={2} aria-hidden />
        </span>
        <h2 id={`${id}-title`} style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--c-f1f5f9)' }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function Securite() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const s = PT[lang].securite
  const toc: [string, string][] = [
    ['knows', s.knows.title],
    ['does-not', s.doesNot.title],
    ['key', s.key.title],
    ['verify', s.verify.title],
    ['infra', s.infra.title],
    ['report', s.report.title],
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .sec-grid{display:grid;grid-template-columns:200px minmax(0,1fr);gap:40px;align-items:start}
        .sec-toc a{display:block;padding:6px 8px;border-radius:7px;font-size:13px;color:var(--c-64748b);text-decoration:none;transition:color .15s,background .15s}
        .sec-toc a:hover{color:var(--c-f1f5f9);background:rgba(var(--ink),0.03)}
        .sec-link:hover{opacity:.85}
        @media(max-width:860px){.sec-grid{grid-template-columns:1fr}.sec-toc{display:none}}
      `}</style>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{s.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{s.title}</h1>
          <p style={{ fontSize: 15, color: 'var(--c-64748b)', lineHeight: 1.7, maxWidth: 560 }}>{s.sub}</p>
        </div>

        <div className="sec-grid">
          <nav aria-label={s.nav} className="sec-toc" style={{ position: 'sticky', top: 96 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, padding: '0 8px' }}>{s.nav}</div>
            {toc.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Block id="knows" icon={UserX} title={s.knows.title}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-e2e8f0)', marginBottom: 10 }}>{s.knows.lead}</p>
              <p style={TEXT}>{s.knows.body}</p>
              <Link href="/confidentialite" className="sec-link" style={LINK}>{s.knows.link}<ArrowRight size={14} aria-hidden /></Link>
            </Block>

            <Block id="does-not" icon={Ban} title={s.doesNot.title}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                {s.doesNot.items.map((item, i) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--ink),0.05)', ...TEXT }}>
                    <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-f87171)', flexShrink: 0, marginTop: 9 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Block>

            <Block id="key" icon={KeyRound} title={s.key.title}>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.key.steps.map((step, i) => (
                  <li key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, ...TEXT, color: i === s.key.steps.length - 1 ? 'var(--c-e2e8f0)' : 'var(--c-94a3b8)', fontWeight: i === s.key.steps.length - 1 ? 600 : 400 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)' }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </Block>

            <Block id="verify" icon={CodeXml} title={s.verify.title}>
              <p style={TEXT}>{s.verify.body}</p>
              <a href="https://github.com/VeilixHQ/Veilix" target="_blank" rel="noopener noreferrer" className="sec-link" style={LINK}>
                {s.verify.link}<ArrowUpRight size={14} aria-hidden />
                <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>({s.newTab})</span>
              </a>
            </Block>

            <Block id="infra" icon={Server} title={s.infra.title}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-e2e8f0)', marginBottom: 14 }}>{s.infra.lead}</p>
              <dl style={{ border: '1px solid rgba(var(--ink),0.06)', borderRadius: 10, overflow: 'hidden' }}>
                {s.infra.rows.map((row, i) => (
                  <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--ink),0.05)', fontSize: 13 }}>
                    <dt style={{ fontWeight: 700, color: 'var(--c-e2e8f0)' }}>{row.name}</dt>
                    <dd style={{ color: 'var(--c-94a3b8)' }}>{row.role}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/confidentialite" className="sec-link" style={LINK}>{s.infra.link}<ArrowRight size={14} aria-hidden /></Link>
            </Block>

            <Block id="report" icon={Mail} title={s.report.title}>
              <p style={TEXT}>{s.report.body}</p>
              <p style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--c-fbbf24)' }}>
                <span style={{ padding: '2px 9px', borderRadius: 100, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontWeight: 600 }}>{s.toFill}</span>
                {s.report.pending}
              </p>
              <a href="mailto:security@veilix.fr" style={{ display: 'inline-block', marginTop: 18, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--c-e2e8f0)', border: '1px solid rgba(var(--ink),0.1)', textDecoration: 'none' }}>{s.report.cta}</a>
            </Block>
          </div>
        </div>
      </main>

      <SiteFooter t={t} />
    </div>
  )
}
