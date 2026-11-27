'use client'
import { useState, useSyncExternalStore } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'

type Tab = 'cgu' | 'cgv' | 'beta' | 'abus'
type Section = { title: string; content: string }

const TAB_IDS: Tab[] = ['cgu', 'cgv', 'beta', 'abus']

const CONTENT: Record<Lang, {
  kicker: string
  title: string
  updated: string
  tabs: Record<Tab, string>
  titles: Record<Tab, string>
  intro: Partial<Record<Tab, string>>
  sections: Record<Tab, Section[]>
}> = {
  fr: {
    kicker: 'Légal',
    title: "Conditions d'utilisation",
    updated: 'Dernière mise à jour : 27 novembre 2026',
    tabs: { cgu: 'CGU', cgv: 'CGV', beta: 'Bêta', abus: 'Signaler un abus' },
    titles: {
      cgu: "Conditions générales d'utilisation",
      cgv: 'Conditions générales de vente',
      beta: 'Conditions de participation à la bêta',
      abus: 'Signaler un abus',
    },
    intro: {
      abus: 'Si vous constatez une utilisation abusive de Veilix (spam, hameçonnage, contenu illégal, harcèlement via un alias Veilix), vous pouvez le signaler.',
    },
    sections: {
      cgu: [
        { title: '1. Objet', content: "Les présentes conditions encadrent l'utilisation de Veilix, service d'alias e-mail édité par la personne identifiée dans les mentions légales. Utiliser Veilix vaut acceptation de ces conditions." },
        { title: '2. Le service', content: "Veilix permet de créer des adresses e-mail de substitution (alias) qui transfèrent les messages reçus vers une adresse de destination que vous avez confirmée, et de répondre depuis ces alias sans révéler votre adresse e-mail personnelle. Le service fonctionne sans compte : l'accès repose sur une clé générée dans votre navigateur." },
        { title: '3. Votre clé', content: "Votre phrase de récupération de 12 mots est le seul moyen de retrouver votre clé. Veilix ne la connaît pas et ne peut pas la retrouver à votre place : si vous la perdez, l'accès à vos alias est définitivement perdu. Gardez-la en lieu sûr et ne la communiquez à personne." },
        { title: '4. Utilisation acceptable', content: "Il est interdit d'utiliser Veilix pour envoyer du spam, de l'hameçonnage ou des logiciels malveillants, pour harceler, usurper une identité, contourner une interdiction ou diffuser un contenu illégal. Il est également interdit de tenter de perturber le service, de contourner ses limites ou d'accéder aux données d'autrui." },
        { title: '5. Limites et suspension', content: "Des limites d'envoi et de création d'alias protègent le service et sa réputation auprès des fournisseurs de messagerie. En cas de manquement aux présentes conditions, de rebonds ou de plaintes répétés, Veilix peut désactiver un alias ou suspendre une clé, si possible après avertissement." },
        { title: '6. Disponibilité', content: "Veilix s'efforce de rendre le service disponible en continu, sans garantie d'absence d'interruption, notamment pendant les maintenances et pendant la bêta. N'utilisez pas Veilix comme unique moyen de recevoir des messages indispensables." },
        { title: '7. Responsabilité', content: "Veilix n'est pas responsable du contenu des messages transférés ni des pertes indirectes. Sa responsabilité, si elle était engagée, est limitée aux sommes que vous avez versées au cours des 12 derniers mois, sauf faute lourde ou disposition légale contraire." },
        { title: '8. Fin du service', content: "Vous pouvez supprimer à tout moment votre clé, vos alias et vos données depuis le tableau de bord. La suppression est immédiate et définitive : les messages envoyés à vos anciens alias ne sont plus transférés." },
        { title: '9. Données personnelles', content: 'Le traitement de vos données est décrit dans la politique de confidentialité.' },
        { title: '10. Propriété intellectuelle', content: "L'intégralité du code de Veilix, site et backend, est open source sous licence AGPL-3.0 et publiquement consultable sur github.com/VeilixHQ/Veilix. La marque Veilix et son logo restent la propriété de l'éditeur." },
        { title: '11. Modifications', content: "Toute modification importante des présentes conditions est annoncée sur le site au moins 30 jours avant son entrée en vigueur." },
        { title: '12. Droit applicable', content: "Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable est recherchée en priorité ; à défaut, les tribunaux français sont compétents, sous réserve des règles protectrices du consommateur." },
      ],
      cgv: [
        { title: '1. Objet', content: "Les présentes conditions régissent la vente des abonnements Veilix et des crédits d'alias. Le paiement en ligne ouvre le 1er février 2027." },
        { title: '2. Offres et prix', content: "Pro : 4,99 € par mois ou 44,90 € par an, 100 alias inclus, alias désactivés compris. Pack de lancement : 69 € par an, alias illimités, 100 exemplaires numérotés, dont ceux attribués aux testeurs de la bêta privée. Il n'existe pas de plan gratuit." },
        { title: '3. Crédits', content: "Un crédit permet de créer un alias. Il est consommé à la création et n'est pas rendu si l'alias est supprimé. Les crédits restent utilisables au-delà du quota d'un abonnement Pro." },
        { title: "4. Période d'essai", content: "Les abonnements commencent par un essai de 14 jours. Un moyen de paiement est demandé à l'inscription, sans débit pendant l'essai. Sans résiliation avant la fin de l'essai, l'abonnement démarre automatiquement." },
        { title: '5. Paiement et renouvellement', content: "Les paiements sont traités par Stripe par carte, Google Pay ou Apple Pay. Les abonnements se renouvellent automatiquement à chaque échéance. En cas d'échec de paiement, l'accès est suspendu jusqu'à régularisation." },
        { title: '6. Prix garanti du Pack de lancement', content: "Le prix d'un Pack de lancement payé reste inchangé tant que l'abonnement reste actif. Il est perdu en cas de résiliation ou de paiement non régularisé." },
        { title: '7. Droit de rétractation et remboursement', content: "Vous disposez de 14 jours après votre premier paiement pour demander un remboursement intégral, sans justification, en écrivant à support@veilix.fr. Les crédits déjà utilisés ne sont pas remboursés." },
        { title: '8. Résiliation', content: "Les abonnements sont sans engagement. Vous pouvez résilier à tout moment depuis les paramètres ; la résiliation prend effet à la fin de la période déjà payée." },
        { title: '9. Évolution des prix', content: "Les prix peuvent évoluer avec un préavis de 30 jours par e-mail ou sur le site, sans effet sur un Pack de lancement payé et toujours actif." },
        { title: '10. Factures', content: "Les factures sont disponibles dans votre espace de paiement Stripe." },
      ],
      beta: [
        { title: '1. Calendrier', content: "Bêta privée du 1er décembre 2026 au 15 janvier 2027, sur invitation, inscriptions jusqu'au 31 décembre 2026. Bêta publique du 1er au 28 février 2027, ouverte par vagues. Lancement officiel le 1er mars 2027. Ces dates peuvent évoluer ; tout changement est annoncé par e-mail." },
        { title: "2. Code d'accès", content: "Votre code est personnel et lié à l'adresse avec laquelle vous vous êtes inscrit. Il est valable 7 jours : passé ce délai, la place est proposée à la personne suivante de la liste d'attente. Partager, vendre ou publier un code entraîne sa révocation." },
        { title: '3. Bêta privée', content: "Elle est gratuite et vous donne le Pack de lancement pendant la bêta et jusqu'au lancement. Au lancement, vous gardez le Pack avec 3 mois offerts : une carte bancaire vous est demandée, sans prélèvement pendant ces 3 mois, puis l'abonnement se poursuit au prix du Pack sauf résiliation. Sans carte enregistrée, l'accès est coupé. Vous recevez le badge Pionnier." },
        { title: '4. Bêta publique', content: "Elle est payante : après la création de votre clé, vous choisissez l'offre Pro ou le Pack de lancement. Sans paiement dans les 7 jours, la place est libérée. Vous recevez le badge Éclaireur." },
        { title: '5. Vos retours', content: "Participer à la bêta implique de transmettre vos retours via le formulaire du tableau de bord : un premier retour 7 jours après la création de votre clé, puis un retour chaque semaine en bêta privée et toutes les 2 semaines en bêta publique, et un retour final au plus tard 48 heures avant la clôture. Vous disposez toujours d'au moins 3 jours d'utilisation avant un retour." },
        { title: '6. Rappels et suspension', content: "Un e-mail vous prévient 24 heures avant chaque échéance. En cas de retour manquant, un rappel vous est envoyé ; sans retour 48 heures après ce rappel, votre accès est suspendu. Il est réactivé dès réception de votre retour si la bêta est toujours en cours." },
        { title: '7. Données', content: "Votre adresse de contact est obligatoire pendant la bêta. Elle est chiffrée et sert uniquement à vous écrire au sujet de la bêta. Vos réponses aux formulaires sont chiffrées. Votre inscription est effacée à la fin de la phase de bêta." },
        { title: '8. Quitter la bêta', content: "Vous pouvez quitter la bêta à tout moment en supprimant votre compte depuis le tableau de bord. Pendant la bêta, le service peut connaître des interruptions : ne l'utilisez pas pour des messages indispensables." },
      ],
      abus: [
        { title: 'Comment signaler', content: "Écrivez à legal@veilix.fr en précisant l'alias concerné si vous le connaissez, une description du problème et, si possible, un exemple du message reçu." },
        { title: 'Notre traitement', content: "Chaque signalement est examiné. En cas d'abus confirmé, l'alias concerné est désactivé et la clé peut être suspendue. Veilix ne connaît pas l'identité de ses utilisateurs et ne peut donc pas la révéler, sauf réquisition judiciaire portant sur les données dont il dispose." },
        { title: 'Signalement légal', content: "Pour une infraction pénale, vous pouvez aussi contacter les autorités compétentes : police, gendarmerie ou plateforme PHAROS (internet-signalement.gouv.fr)." },
      ],
    },
  },
  en: {
    kicker: 'Legal',
    title: 'Terms of Use',
    updated: 'Last updated: November 27, 2026',
    tabs: { cgu: 'Terms of Service', cgv: 'Sales Terms', beta: 'Beta', abus: 'Report Abuse' },
    titles: {
      cgu: 'Terms of Service',
      cgv: 'Terms of Sale',
      beta: 'Beta participation terms',
      abus: 'Report Abuse',
    },
    intro: {
      abus: 'If you notice abusive use of Veilix (spam, phishing, illegal content, harassment through a Veilix alias), you can report it.',
    },
    sections: {
      cgu: [
        { title: '1. Purpose', content: 'These terms govern the use of Veilix, an email alias service published by the person identified in the legal notice. Using Veilix means you accept these terms.' },
        { title: '2. The service', content: 'Veilix lets you create substitute email addresses (aliases) that forward incoming messages to a destination address you have confirmed, and reply from these aliases without revealing your personal email address. The service works without an account: access relies on a key generated in your browser.' },
        { title: '3. Your key', content: 'Your 12-word recovery phrase is the only way to recover your key. Veilix does not know it and cannot recover it for you: if you lose it, access to your aliases is lost for good. Keep it safe and never share it.' },
        { title: '4. Acceptable use', content: 'You may not use Veilix to send spam, phishing or malware, to harass, impersonate, evade a ban or spread illegal content. You may not try to disrupt the service, bypass its limits or access other people\'s data.' },
        { title: '5. Limits and suspension', content: 'Sending and alias creation limits protect the service and its reputation with email providers. If these terms are breached, or after repeated bounces or complaints, Veilix may disable an alias or suspend a key, with prior warning where possible.' },
        { title: '6. Availability', content: 'Veilix aims to keep the service available at all times, without guaranteeing it will never be interrupted, especially during maintenance and the beta. Do not rely on Veilix as your only way to receive essential messages.' },
        { title: '7. Liability', content: 'Veilix is not responsible for the content of forwarded messages or for indirect losses. Its liability, if any, is limited to the amounts you paid in the last 12 months, except in case of gross negligence or where the law provides otherwise.' },
        { title: '8. Ending the service', content: 'You can delete your key, aliases and data at any time from the dashboard. Deletion is immediate and permanent: messages sent to your former aliases are no longer forwarded.' },
        { title: '9. Personal data', content: 'How your data is processed is described in the privacy policy.' },
        { title: '10. Intellectual property', content: 'All of the Veilix code, website and backend, is open source under the AGPL-3.0 license and publicly available at github.com/VeilixHQ/Veilix. The Veilix brand and logo remain the property of the publisher.' },
        { title: '11. Changes', content: 'Any significant change to these terms is announced on the site at least 30 days before it takes effect.' },
        { title: '12. Governing law', content: 'These terms are governed by French law. Any dispute will first be settled amicably where possible; otherwise French courts have jurisdiction, subject to consumer protection rules.' },
      ],
      cgv: [
        { title: '1. Purpose', content: 'These terms govern the sale of Veilix subscriptions and alias credits. Online payment opens on February 1, 2027.' },
        { title: '2. Offers and prices', content: 'Pro: €4.99 per month or €44.90 per year, 100 aliases included, disabled aliases counted. Launch pack: €69 per year, unlimited aliases, 100 numbered copies, including those given to private beta testers. There is no free plan.' },
        { title: '3. Credits', content: 'One credit creates one alias. It is used when the alias is created and is not refunded if the alias is deleted. Credits remain usable beyond the quota of a Pro subscription.' },
        { title: '4. Trial', content: 'Subscriptions start with a 14-day trial. A payment method is required at signup, with no charge during the trial. Unless cancelled before the trial ends, the subscription starts automatically.' },
        { title: '5. Payment and renewal', content: 'Payments are processed by Stripe by card, Google Pay or Apple Pay. Subscriptions renew automatically at each term. If a payment fails, access is suspended until it is settled.' },
        { title: '6. Locked Launch pack price', content: 'The price of a paid Launch pack stays the same as long as the subscription remains active. It is lost if you cancel or if a payment remains unsettled.' },
        { title: '7. Withdrawal and refunds', content: 'You have 14 days after your first payment to request a full refund, without giving a reason, by writing to support@veilix.fr. Credits already used are not refunded.' },
        { title: '8. Cancellation', content: 'Subscriptions have no commitment. You can cancel at any time from settings; cancellation takes effect at the end of the period already paid.' },
        { title: '9. Price changes', content: 'Prices may change with 30 days\' notice by email or on the site, with no effect on a paid and still active Launch pack.' },
        { title: '10. Invoices', content: 'Invoices are available in your Stripe payment portal.' },
      ],
      beta: [
        { title: '1. Schedule', content: 'Private beta from December 1, 2026 to January 15, 2027, by invitation, signups until December 31, 2026. Public beta from February 1 to 28, 2027, opened in waves. Official launch on March 1, 2027. These dates may change; any change is announced by email.' },
        { title: '2. Access code', content: 'Your code is personal and tied to the address you signed up with. It is valid for 7 days: after that, the seat goes to the next person on the waiting list. Sharing, selling or publishing a code gets it revoked.' },
        { title: '3. Private beta', content: 'It is free and gives you the Launch pack during the beta and until launch. At launch, you keep the Launch pack with 3 months free: a card is requested, with no charge during those 3 months, then the subscription continues at the Launch pack price unless you cancel. Without a saved card, access is cut. You receive the Pioneer badge.' },
        { title: '4. Public beta', content: 'It is paid: after creating your key, you choose the Pro plan or the Launch pack. Without payment within 7 days, the seat is released. You receive the Scout badge.' },
        { title: '5. Your feedback', content: 'Taking part in the beta means sending feedback through the dashboard form: a first one 7 days after your key is created, then one every week in the private beta and every 2 weeks in the public beta, and a final one at least 48 hours before the end. You always get at least 3 days of use before feedback is due.' },
        { title: '6. Reminders and suspension', content: 'An email warns you 24 hours before each deadline. If feedback is missing, a reminder is sent; without feedback 48 hours after that reminder, your access is suspended. It is restored as soon as your feedback is received if the beta is still running.' },
        { title: '7. Data', content: 'Your contact address is required during the beta. It is encrypted and only used to write to you about the beta. Your form answers are encrypted. Your signup is erased when the beta phase ends.' },
        { title: '8. Leaving the beta', content: 'You can leave the beta at any time by deleting your account from the dashboard. The service may be interrupted during the beta: do not use it for essential messages.' },
      ],
      abus: [
        { title: 'How to report', content: 'Write to legal@veilix.fr with the alias involved if you know it, a description of the problem and, if possible, an example of the message received.' },
        { title: 'Our process', content: 'Every report is reviewed. If abuse is confirmed, the alias is disabled and the key may be suspended. Veilix does not know who its users are and therefore cannot reveal their identity, except under a court order covering the data it holds.' },
        { title: 'Legal reporting', content: 'For a criminal offense, you can also contact the relevant authorities.' },
      ],
    },
  },
}

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function readHash() {
  return window.location.hash.slice(1)
}

function noHashOnServer() {
  return ''
}

export default function ConditionsUtilisation() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const c = CONTENT[lang]
  const hash = useSyncExternalStore(subscribeToHash, readHash, noHashOnServer)
  const [chosen, setChosen] = useState<Tab | null>(null)
  const active: Tab = chosen ?? (TAB_IDS.includes(hash as Tab) ? (hash as Tab) : 'cgu')

  function choose(tab: Tab) {
    setChosen(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>{c.kicker}</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>{c.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--c-475569)' }}>{c.updated}</p>
        </div>

        <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', columnGap: 20, marginBottom: 40, borderBottom: '1px solid rgba(var(--ink),0.06)' }}>
          {TAB_IDS.map(id => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active === id}
              onClick={() => choose(id)}
              style={{
                padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                color: active === id ? 'var(--c-a78bfa)' : 'var(--c-64748b)',
                borderBottom: active === id ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'color .15s, border-color .15s', marginBottom: -1,
              }}
            >
              {c.tabs[id]}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 24 }}>{c.titles[active]}</h2>

        {c.intro[active] && (
          <p style={{ fontSize: 14, color: 'var(--c-94a3b8)', lineHeight: 1.8, marginBottom: 28, padding: '16px 18px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
            {c.intro[active]}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {c.sections[active].map(section => (
            <div key={section.title}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 10 }}>{section.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  )
}
