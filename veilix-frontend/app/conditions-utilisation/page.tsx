'use client'
import { useState } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'

const CONTENT = {
  fr: {
    kicker: 'Légal',
    title: "Conditions d'utilisation",
    updated: 'Dernière mise à jour : juillet 2026',
    tabs: [
      { id: 'cgu', label: 'CGU' },
      { id: 'cgv', label: 'CGV' },
      { id: 'abus', label: 'Signaler un abus' },
    ],
    cgu: {
      title: "Conditions Générales d'Utilisation",
      sections: [
        { title: '1. Acceptation des conditions', content: "En utilisant Veilix, vous acceptez les présentes Conditions Générales d'Utilisation." },
        { title: '2. Description du service', content: "Veilix permet de créer des alias email temporaires, sans compte utilisateur traditionnel." },
        { title: '3. Utilisation du service', content: "Interdiction d'utiliser Veilix pour spam, phishing ou contenus illégaux." },
        { title: '4. Disponibilité du service', content: 'Service disponible 24/7, hors maintenance ponctuelle.' },
        { title: '5. Résiliation', content: 'Suppression possible à tout moment via "Oublier cette clé" ou "Supprimer toutes mes données" dans les Paramètres.' },
        { title: '6. Limitation de responsabilité', content: 'Responsabilité limitée aux sommes versées sur 12 mois.' },
        { title: '7. Propriété intellectuelle', content: 'Frontend open source, backend et marque propriétaires.' },
        { title: '8. Modifications des CGU', content: 'Préavis de 30 jours pour tout changement substantiel.' },
        { title: '9. Droit applicable', content: 'Droit français, tribunaux français compétents.' },
      ],
    },
    cgv: {
      title: 'Conditions Générales de Vente',
      sections: [
        { title: '1. Objet', content: 'Les présentes CGV régissent la vente des abonnements payants Veilix (plan Pro) et des packs de crédits.' },
        { title: '2. Tarifs', content: 'Plan Starter gratuit (5 alias). Plan Pro : 4,99€/mois (100 alias). Crédits : 1,99€/10 alias, 3,99€/25 alias, 6,99€/50 alias. Les tarifs peuvent évoluer avec un préavis de 30 jours.' },
        { title: '3. Paiement', content: 'Les paiements sont traités de manière sécurisée via Stripe. Aucune donnée bancaire n\'est stockée par Veilix.' },
        { title: '4. Droit de rétractation et remboursement', content: 'Conformément à la législation en vigueur, vous disposez de 14 jours à compter de la souscription pour demander un remboursement intégral, sans justification, via notre page Contact.' },
        { title: '5. Résiliation de l\'abonnement', content: 'Le plan Pro est sans engagement. Vous pouvez résilier à tout moment depuis les Paramètres ; la résiliation prend effet à la fin de la période déjà payée.' },
        { title: '6. Facturation', content: 'Les factures sont accessibles depuis votre espace de paiement Stripe. Aucune facture papier n\'est émise par défaut.' },
      ],
    },
    abus: {
      title: 'Signaler un abus',
      intro: 'Si vous constatez une utilisation abusive de Veilix (spam, phishing, contenu illégal, harcèlement via un alias Veilix), vous pouvez le signaler.',
      sections: [
        { title: 'Comment signaler', content: 'Contactez-nous via notre page Contact en précisant : l\'alias email concerné (si connu), une description du contenu abusif, et si possible une capture d\'écran ou un exemple du message reçu.' },
        { title: 'Notre traitement', content: 'Chaque signalement est examiné. En cas d\'abus confirmé, l\'alias concerné est désactivé. Veilix ne peut cependant pas révéler l\'identité de l\'utilisateur à l\'origine de l\'abus, conformément à son architecture No Account — nous ne la connaissons pas nous-mêmes.' },
        { title: 'Signalement légal', content: 'Pour tout signalement relevant d\'une infraction pénale, vous pouvez également contacter les autorités compétentes (police, gendarmerie, plateforme PHAROS pour la France).' },
      ],
    },
  },
  en: {
    kicker: 'Legal',
    title: 'Terms of Use',
    updated: 'Last updated: July 2026',
    tabs: [
      { id: 'cgu', label: 'Terms of Service' },
      { id: 'cgv', label: 'Sales Terms' },
      { id: 'abus', label: 'Report Abuse' },
    ],
    cgu: {
      title: 'Terms of Service',
      sections: [
        { title: '1. Acceptance of terms', content: 'By using Veilix, you accept these Terms of Service.' },
        { title: '2. Service description', content: 'Veilix allows the creation of temporary email aliases, without a traditional user account.' },
        { title: '3. Service usage', content: 'Prohibited to use Veilix for spam, phishing or illegal content.' },
        { title: '4. Service availability', content: 'Service available 24/7, except scheduled maintenance.' },
        { title: '5. Termination', content: 'Deletion possible anytime via "Forget this key" or "Delete all my data" in Settings.' },
        { title: '6. Limitation of liability', content: 'Liability limited to amounts paid over 12 months.' },
        { title: '7. Intellectual property', content: 'Frontend open source, backend and brand proprietary.' },
        { title: '8. Terms modifications', content: '30-day notice for any substantial change.' },
        { title: '9. Governing law', content: 'French law, French courts have jurisdiction.' },
      ],
    },
    cgv: {
      title: 'Sales Terms',
      sections: [
        { title: '1. Purpose', content: 'These Sales Terms govern the sale of paid Veilix subscriptions (Pro plan) and credit packs.' },
        { title: '2. Pricing', content: 'Free Starter plan (5 aliases). Pro plan: €4.99/month (100 aliases). Credits: €1.99/10 aliases, €3.99/25 aliases, €6.99/50 aliases. Prices may change with 30 days notice.' },
        { title: '3. Payment', content: 'Payments are securely processed via Stripe. No banking data is stored by Veilix.' },
        { title: '4. Right of withdrawal and refund', content: 'In accordance with applicable law, you have 14 days from subscription to request a full refund, without justification, via our Contact page.' },
        { title: '5. Subscription cancellation', content: 'The Pro plan has no commitment. You can cancel anytime from Settings; cancellation takes effect at the end of the already-paid period.' },
        { title: '6. Billing', content: 'Invoices are accessible from your Stripe payment portal. No paper invoice is issued by default.' },
      ],
    },
    abus: {
      title: 'Report Abuse',
      intro: 'If you notice abusive use of Veilix (spam, phishing, illegal content, harassment via a Veilix alias), you can report it.',
      sections: [
        { title: 'How to report', content: 'Contact us via our Contact page, specifying: the alias involved (if known), a description of the abusive content, and if possible a screenshot or example of the message received.' },
        { title: 'Our process', content: 'Every report is reviewed. If abuse is confirmed, the alias involved is disabled. However, Veilix cannot reveal the identity of the user behind the abuse, in line with its No Account architecture — we do not know it ourselves.' },
        { title: 'Legal reporting', content: 'For any report involving a criminal offense, you may also contact the relevant authorities.' },
      ],
    },
  },
}

export default function ConditionsUtilisation() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const c = CONTENT[lang]
  const [active, setActive] = useState<'cgu' | 'cgv' | 'abus'>('cgu')

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{c.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{c.title}</h1>
          <p style={{ fontSize: 13, color: '#475569' }}>{c.updated}</p>
        </div>

        {/* Onglets de navigation interne */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
          {c.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id as 'cgu' | 'cgv' | 'abus')}
              style={{
                padding: '10px 4px', marginRight: 20, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                color: active === tab.id ? '#a78bfa' : '#64748b',
                borderBottom: active === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'color .15s, border-color .15s', marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CGU */}
        {active === 'cgu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {c.cgu.sections.map((section, i) => (
              <div key={i}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{section.title}</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* CGV */}
        {active === 'cgv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {c.cgv.sections.map((section, i) => (
              <div key={i}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{section.title}</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Signaler un abus */}
        {active === 'abus' && (
          <div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 28, padding: '16px 18px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
              {c.abus.intro}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {c.abus.sections.map((section, i) => (
                <div key={i}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{section.title}</h2>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter t={t} />
    </div>
  )
}