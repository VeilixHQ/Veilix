'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Button } from '@/components/Button'
import { T, Lang } from '@/lib/translations'
import { PT } from '@/lib/translations-pages'
import { PackAvailability, getPackAvailability } from '@/lib/api'
import { SIGNUP_OPEN, START_HREF } from '@/lib/launch'

const PACK_REFRESH_MS = 60_000

type Price = { price: string; period: string; sub: string }

type PlanData = {
  name: string
  badge?: string
  desc?: string
  lead?: string
  monthly?: Price
  yearly: Price
  features: string[]
  cta: string
  href: string
  reassure: string
  highlight?: boolean
}

const PLANS: Record<'fr' | 'en', PlanData[]> = {
  fr: [
    {
      name: 'Pro',
      desc: 'L’essentiel pour protéger votre boîte mail.',
      lead: 'Inclus :',
      monthly: { price: '4,99 €', period: '/ mois', sub: 'ou 44,90 € / an, dont 3 mois offerts' },
      yearly: { price: '44,90 €', period: '/ an', sub: 'soit 3,74 € / mois, dont 3 mois offerts' },
      features: [
        '100 alias actifs',
        `Réponse depuis l'alias`,
        'Pièces jointes',
        'Tags personnalisés',
        '3 boîtes de destination',
        `Blocage d'expéditeurs`,
        'Statistiques de spam bloqué',
      ],
      cta: 'Essayer 14 jours',
      href: '/access?plan=pro',
      reassure: `Période d'essai gratuite, annulable à tout moment`,
    },
    {
      name: 'Pack de lancement',
      badge: 'Offre de lancement',
      desc: 'Offre limitée à 100 exemplaires.',
      lead: 'Tout le plan Pro, plus :',
      yearly: { price: '69 €', period: '/ an', sub: 'soit 5,75 € / mois' },
      features: [
        'Alias illimités',
        `Domaines personnalisés (jusqu'à 3) : bientôt disponibles`,
        'Alerte de fuite en temps réel',
        `API et clés d'accès`,
        'Chiffrement PGP',
        '10 boîtes de destination',
        'Catch-all : bientôt disponible',
        'Support prioritaire sous 24 h',
        'Accès anticipé aux nouveautés',
        "Prix garanti tant que l'abonnement est actif",
      ],
      cta: 'Réserver mon pack dès maintenant',
      href: '/access?plan=pack',
      reassure: `14 jours offerts • Prix garanti`,
      highlight: true,
    },
  ],
  en: [
    {
      name: 'Pro',
      desc: 'Essential privacy for your daily emails.',
      lead: 'Included:',
      monthly: { price: '€4.99', period: '/ month', sub: 'or €44.90 / year, 3 months free' },
      yearly: { price: '€44.90', period: '/ year', sub: 'that is €3.74 / month, 3 months free' },
      features: [
        '100 active aliases',
        'Reply from the alias',
        'Attachments',
        'Custom tags',
        '3 destination mailboxes',
        'Sender blocking',
        'Blocked spam statistics',
      ],
      cta: 'Try 14 days',
      href: '/access?plan=pro',
      reassure: `Free trial period, cancel anytime`,
    },
    {
      name: 'Launch pack',
      badge: 'Launch offer',
      desc: 'Limited to 100 copies.',
      lead: 'Everything in Pro, plus:',
      yearly: { price: '€69', period: '/ year', sub: 'that is €5.75 / month' },
      features: [
        'Unlimited aliases',
        'Custom domains (up to 3): coming soon',
        'Real-time breach alerts',
        'API and access keys',
        'PGP encryption',
        '10 destination mailboxes',
        'Catch-all: coming soon',
        'Priority support within 24 h',
        'Early access to new features',
        'Price locked while subscribed',
      ],
      cta: 'Reserve my pack now',
      href: '/access?plan=pack',
      reassure: `14 days free • Price locked`,
      highlight: true,
    },
  ],
}

const TEXT = {
  fr: {
    left: (n: number, total: number) => `${n} packs restants sur ${total}`,
    full: 'Complet',
    reserved: 'Packs de lancement déjà réservés',
    monthly: 'Mensuel',
    yearlyLabel: 'Annuel',
    payment: 'Moyen de paiement requis',
    buyCredits: (amount: string, price: string) => `Acheter ${amount} pour ${price}`,
    creditsSoonTitle: (amount: string, price: string) => `${amount} pour ${price}`,
    creditsSoonText: "Le paiement en ligne ouvre au lancement de Veilix, le 1er février 2027 : vous pourrez alors acheter vos crédits ici en quelques secondes, par carte, Google Pay ou Apple Pay. Pendant la bêta privée, le Pack de lancement inclut des alias illimités : aucun crédit n'est nécessaire.",
    close: 'Compris',
  },
  en: {
    left: (n: number, total: number) => `${n} of ${total} packs left`,
    full: 'Sold out',
    reserved: 'Launch packs already reserved',
    monthly: 'Monthly',
    yearlyLabel: 'Yearly',
    payment: 'Payment method required',
    buyCredits: (amount: string, price: string) => `Buy ${amount} for ${price}`,
    creditsSoonTitle: (amount: string, price: string) => `${amount} for ${price}`,
    creditsSoonText: 'Online payment opens when Veilix launches on February 1, 2027: you will then be able to buy credits here in a few seconds, by card, Google Pay or Apple Pay. During the private beta, the Launch pack includes unlimited aliases, so no credits are needed.',
    close: 'Got it',
  },
}

const FAQS: Record<'fr' | 'en', { q: string; a: string }[]> = {
  fr: [
    {
      q: "Comment fonctionne l'essai de 14 jours ?",
      a: "Vous choisissez un plan et vous enregistrez un moyen de paiement, rien n'est débité pendant 14 jours.\nÀ la fin de l'essai, l'abonnement démarre automatiquement, sauf si vous l'avez annulé avant.",
    },
    {
      q: 'Pourquoi un moyen de paiement est-il requis pour l\'essai ?',
      a: "Cela évite les comptes automatisés et protège le service pour les vrais utilisateurs. Le paiement est traité par Stripe : Veilix ne voit pas et ne conserve pas votre numéro de carte.",
    },
    {
      q: 'Quelle différence entre le plan Pro et le Pack de lancement ?',
      a: "Le Pro inclut 100 alias, la réponse depuis l'alias, les pièces jointes, les tags, 3 boîtes de destination et le blocage d'expéditeurs. Le Pack reprend tout le Pro et ajoute les alias illimités, l'alerte de fuite en temps réel, l'API, le chiffrement PGP, 10 boîtes de destination, un support prioritaire sous 24 h et l'accès anticipé aux nouveautés. Les domaines personnalisés (jusqu'à 3) et le catch-all seront bientôt disponibles.",
    },
    {
      q: 'Que signifie « prix garanti » ?',
      a: "Le Pack de lancement est facturé 69 € par an, uniquement en formule annuelle.\nCe tarif ne change pas tant que votre abonnement reste actif, même si les prix augmentent ensuite.",
    },
    {
      q: 'Combien de packs sont disponibles ?',
      a: "L'offre est limitée à 100 exemplaires, numérotés de 1 à 100. Les Packs offerts aux testeurs de la bêta privée font partie de ces 100 exemplaires. Le compteur affiché sur la carte du Pack montre en temps réel le nombre de places restantes. Une fois les 100 packs réservés, l'offre n'est plus disponible.",
    },
    {
      q: 'Puis-je annuler mon abonnement ?',
      a: "Oui, à tout moment depuis la gestion de votre abonnement, que ce soit le Pro (mensuel ou annuel) ou le Pack de lancement. Si vous annulez pendant l'essai de 14 jours, rien n'est débité.",
    },
  ],
  en: [
    {
      q: 'How does the 14-day trial work?',
      a: 'You pick a plan and add a payment method. Nothing is charged for 14 days.\nWhen the trial ends, your subscription starts automatically unless you cancelled before.',
    },
    {
      q: 'Why is a payment method required for the trial?',
      a: 'It prevents automated accounts and protects the service for real users. Payments are processed by Stripe: Veilix does not see or store your card number.',
    },
    {
      q: 'What is the difference between Pro and the Launch pack?',
      a: 'Pro includes 100 aliases, replying from the alias, attachments, tags, 3 destination mailboxes and sender blocking. The Launch pack includes everything in Pro and adds unlimited aliases, real-time breach alerts, the API, PGP encryption, 10 destination mailboxes, priority support within 24 h and early access to new features. Custom domains (up to 3) and catch-all are coming soon.',
    },
    {
      q: 'What does "price locked" mean?',
      a: 'The Launch pack costs €69 per year, yearly billing only.\nThis price does not change as long as your subscription stays active, even if prices go up later.',
    },
    {
      q: 'How many packs are available?',
      a: 'The offer is limited to 100 numbered copies. Packs given to our private beta testers are part of these 100 copies. The counter on the pack card shows in real time how many are left. Once all 100 packs are reserved, the offer is no longer available.',
    },
    {
      q: 'Can I cancel my subscription?',
      a: 'Yes, at any time from your subscription settings, for Pro (monthly or yearly) or the Launch pack. If you cancel during the 14-day trial, nothing is charged.',
    },
  ],
}

export default function Pricing() {
  const [lang, setLang] = useState<Lang>('fr')
  const [proYearly, setProYearly] = useState(true)
  const [creditPack, setCreditPack] = useState<{ amount: string; price: string } | null>(null)
  const t = T[lang]
  const pt = PT[lang].pricing
  const plans = (PLANS as Record<string, PlanData[]>)[lang] ?? PLANS.fr
  const tx = (TEXT as Record<string, typeof TEXT.fr>)[lang] ?? TEXT.fr
  const faqs = (FAQS as Record<string, { q: string; a: string }[]>)[lang] ?? FAQS.fr
  const [pack, setPack] = useState<PackAvailability | null>(null)
  const soldOut = pack !== null && pack.remaining <= 0

  useEffect(() => {
    let active = true
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      getPackAvailability()
        .then(data => { if (active) setPack(data) })
        .catch(() => {})
    }
    refresh()
    const timer = window.setInterval(refresh, PACK_REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .plan-card{transition:transform .25s, border-color .2s}
        .plan-card:hover{transform:translateY(-4px)}
        @media(max-width:860px){ .plans-grid{grid-template-columns:1fr!important} .credits-row{flex-direction:column!important} }
        .credit-pack:hover, .credit-pack:focus-visible { border-color: rgba(124,58,237,0.45)!important; background: rgba(124,58,237,0.08)!important; outline: none }
      `}</style>

      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" />

      <section style={{ padding: '140px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.6s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>{pt.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 16 }}>{pt.title}</h1>
          <p style={{ fontSize: 15, color: 'var(--c-64748b)', maxWidth: 420, margin: '0 auto', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{pt.subtitle}</p>
        </div>
      </section>

      <section style={{ padding: '0 24px 96px' }}>
        <div className="plans-grid" style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {plans.map((plan, i) => {
            const highlight = !!plan.highlight
            const isPack = highlight
            const hasToggle = !!plan.monthly
            const cur = hasToggle && !proYearly ? plan.monthly! : plan.yearly
            const href = !SIGNUP_OPEN ? START_HREF : hasToggle ? `${plan.href}&billing=${proYearly ? 'yearly' : 'monthly'}` : plan.href

            return (
              <div key={i} className="plan-card" style={{ position: 'relative', background: highlight ? 'linear-gradient(180deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))' : 'var(--c-0d0d10)', border: highlight ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(var(--ink),0.07)', borderRadius: 16, padding: '32px 26px', display: 'flex', flexDirection: 'column' }}>

                {plan.badge && (
                  <div style={{ position: 'absolute', top: -14, left: 26, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#fff', background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, height: 32 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{plan.name}</div>
                    {hasToggle && (
                      <div role="group" aria-label="Facturation" style={{ display: 'flex', padding: 3, borderRadius: 100, background: 'rgba(var(--ink),0.05)', border: '1px solid rgba(var(--ink),0.08)' }}>
                        <button
                          type="button"
                          aria-pressed={!proYearly}
                          onClick={() => setProYearly(false)}
                          style={{ padding: '5px 11px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: !proYearly ? '#fff' : 'var(--c-64748b)', background: !proYearly ? 'rgba(124,58,237,0.35)' : 'transparent', transition: 'background .2s, color .2s' }}
                        >
                          {tx.monthly}
                        </button>
                        <button
                          type="button"
                          aria-pressed={proYearly}
                          onClick={() => setProYearly(true)}
                          style={{ padding: '5px 11px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: proYearly ? '#fff' : 'var(--c-64748b)', background: proYearly ? 'rgba(124,58,237,0.35)' : 'transparent', transition: 'background .2s, color .2s' }}
                        >
                          {tx.yearlyLabel}
                        </button>
                      </div>
                    )}
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--c-64748b)', lineHeight: 1.5, minHeight: 38, marginTop: 6 }}>{plan.desc}</div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 16, height: 44 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' }}>{cur.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--c-64748b)', fontWeight: 500 }}>{cur.period}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-64748b)', minHeight: 18, marginTop: 4 }}>{cur.sub}</div>

                <div style={{ height: 44, marginTop: 18 }} aria-live="polite">
                  {isPack && (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginBottom: 6, minHeight: 18 }}>{pack ? (soldOut ? tx.full : tx.left(pack.remaining, pack.total)) : '\u00a0'}</div>
                      <div role="progressbar" aria-valuemin={0} aria-valuemax={pack?.total ?? 100} aria-valuenow={pack?.taken ?? 0} aria-label={tx.reserved} style={{ height: 5, borderRadius: 100, background: 'rgba(var(--ink),0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pack ? `${(pack.taken / pack.total) * 100}%` : '0%', borderRadius: 100, background: '#7c3aed', transition: 'width .8s ease' }} />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ height: 1, background: 'rgba(var(--ink),0.06)', margin: '6px 0 20px' }} />

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-e2e8f0)', minHeight: 20, marginBottom: 14 }}>{plan.lead}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: highlight ? 'var(--c-a78bfa)' : 'var(--c-4ade80)', flexShrink: 0, marginTop: 3 }}><polyline points="20 6 9 17 4 12" /></svg>
                      <span style={{ fontSize: 13, color: 'var(--c-94a3b8)', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {isPack && soldOut ? (
                    <Button variant="secondary" size="md" disabled style={{ width: '100%', cursor: 'not-allowed' }}>{tx.full}</Button>
                  ) : (
                    <Link href={href} style={{ textDecoration: 'none' }}>
                      <Button variant={highlight ? 'primary' : 'secondary'} size="md" style={{ width: '100%' }}>{SIGNUP_OPEN ? plan.cta : t.waitlist.cta}</Button>
                    </Link>
                  )}

                  <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, lineHeight: 1.6, color: 'var(--c-64748b)' }}>
                    <div>{plan.reassure}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{tx.payment}</div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </section>

      <section id="credits" style={{ padding: '0 24px 96px', scrollMarginTop: 96 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 16, padding: '36px 32px' }}>
          <div className="credits-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 380 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 8 }}>{pt.creditsTitle}</h3>
              <p style={{ fontSize: 13, color: 'var(--c-64748b)', lineHeight: 1.7 }}>{pt.creditsDesc}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {pt.creditsPacks.map((pack, i) => (
                <button
                  key={i}
                  type="button"
                  className="credit-pack"
                  onClick={() => setCreditPack(pack)}
                  aria-label={tx.buyCredits(pack.amount, pack.price)}
                  style={{ textAlign: 'center', padding: '14px 18px', borderRadius: 10, background: 'rgba(var(--ink),0.02)', border: '1px solid rgba(var(--ink),0.06)', minWidth: 100, cursor: 'pointer', color: 'inherit', fontFamily: 'Inter, sans-serif', transition: 'border-color .15s, background .15s' }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{pack.price}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-475569)' }}>{pack.amount}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 32, textAlign: 'center' }}>{pt.faqTitle}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((faq, i) => <PricingFAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {creditPack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="credits-soon-title"
          onClick={() => setCreditPack(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--c-0d0d10)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, textAlign: 'center' }}
          >
            <h3 id="credits-soon-title" style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{tx.creditsSoonTitle(creditPack.amount, creditPack.price)}</h3>
            <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', lineHeight: 1.7, marginBottom: 22 }}>{tx.creditsSoonText}</p>
            <Button variant="primary" size="md" onClick={() => setCreditPack(null)} style={{ width: '100%' }} autoFocus>{tx.close}</Button>
          </div>
        </div>
      )}

      <SiteFooter t={t} />
    </div>
  )
}

function PricingFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--c-0d0d10)', border: `1px solid ${open ? 'rgba(124,58,237,0.3)' : 'rgba(var(--ink),0.06)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-e2e8f0)' }}>{q}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 12, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
      <div hidden={!open} style={{ padding: '0 18px 16px', fontSize: 13, color: 'var(--c-64748b)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{a}</div>
    </div>
  )
}