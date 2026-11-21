'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuth } from '@/lib/api'
import { T, Lang } from '@/lib/translations'
import { BackToTop } from '@/components/landing/Utils'
import { SiteNav } from '@/components/landing/SiteNav'
import { Hero } from '@/components/landing/Hero'
import { PillarsStrip } from '@/components/landing/PillarsStrip'
import { LogoMarquee } from '@/components/landing/LogoMarquee'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { GmailComparison } from '@/components/landing/GmailComparison'
import { ProofSection } from '@/components/landing/ProofSection'
import { SocialProof } from '@/components/landing/SocialProof'
import { FAQ } from '@/components/landing/FAQ'
import { TypewriterCTA } from '@/components/landing/TypewriterCTA'
import { SiteFooter } from '@/components/landing/SiteFooter'

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]

  useEffect(() => {
    checkAuth().then(authed => {
      if (authed) router.push('/dashboard')
    })
  }, [router])

  return (
    <div style={{ background: 'var(--c-060608)', minHeight: '100vh', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}
        
        .pre-line { white-space: pre-line; }

        .nav-link{font-size:13px;color:var(--c-64748b);font-weight:500;text-decoration:none;transition:color .15s;cursor:pointer}
        .nav-link:hover{color:var(--c-a78bfa)}
        .footer-link{font-size:13px;color:var(--c-475569);text-decoration:none;transition:color .15s}
        .footer-link:hover{color:var(--c-a78bfa)}
        
        .feat-card{background:var(--c-0d0d10);padding:26px 24px;border-radius:14px;border:1px solid rgba(var(--ink),0.06);transition:background .2s,transform .25s,border-color .2s;cursor:default;white-space:pre-line}
        .feat-card:hover{background:var(--c-111118);transform:translateY(-4px);border-color:rgba(124,58,237,0.3)}
        
        .comp-card{transition:transform .25s}
        .comp-card:hover{transform:scale(1.02)}
        
        .marquee-track{display:flex;width:max-content;animation:marquee 38s linear infinite}
        .marquee-track:hover{animation-play-state:paused}
        .marquee-item{display:flex;align-items:center;justify-content:center;padding:0 44px;border-right:1px solid rgba(var(--ink),0.05);transition:opacity .2s;opacity:.55;height:52px;min-width:100px}
        .marquee-item:hover{opacity:1}
        
        .btn-access{padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--c-94a3b8);background:transparent;border:1px solid rgba(var(--ink),0.08);text-decoration:none;transition:all .15s}
        .btn-access:hover{border-color:rgba(var(--ink),0.2);color:var(--c-f1f5f9)}
        
        .btn-start{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:#7c3aed;box-shadow:0 4px 12px rgba(124,58,237,0.25);text-decoration:none;transition:transform .15s, opacity .15s}
        .btn-start:hover{opacity:.95;transform:translateY(-1px)}
        
        @media(max-width:768px){
          .grid-2{grid-template-columns:1fr!important}
          .grid-3{grid-template-columns:1fr!important}
          .nav-center-links{display:none!important}
          .hero-h1{font-size:32px!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      <BackToTop label={t.backToTop} />
      <SiteNav t={t} lang={lang} setLang={setLang} />
      <Hero t={t} />
      <PillarsStrip t={t} />
      <LogoMarquee label={t.marqueeLabel} />
      <HowItWorks t={t} />
      <Features t={t} />
      <GmailComparison t={t} />
      <ProofSection t={t} />
      <SocialProof lang={lang} />
      <FAQ t={t} />
      <TypewriterCTA t={t} />
      <SiteFooter t={t} />
    </div>
  )
}