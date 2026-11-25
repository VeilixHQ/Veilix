import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { Faq, OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { jsonLd } from '@/lib/blog'
import { GUIDES_PATH, guide } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const CURRENT = guide('hameconnage')
const UPDATED = '2026-11-25'

const FAQ = [
  { q: "Comment reconnaître un e-mail d'hameçonnage ?", a: "Méfiez-vous de tout message qui crée l'urgence, demande un mot de passe, un code ou des coordonnées bancaires, ou contient un lien vers une adresse qui ne correspond pas exactement au site officiel. En cas de doute, ne cliquez pas : ouvrez vous-même l'application ou le site officiel." },
  { q: "J'ai cliqué sur un lien frauduleux, que faire ?", a: "Si vous n'avez rien saisi, le risque est faible : fermez la page. Si vous avez saisi un mot de passe, changez-le immédiatement. Si vous avez donné des informations bancaires, appelez votre banque pour faire opposition, puis portez plainte." },
  { q: "Où signaler un e-mail ou un SMS frauduleux ?", a: "Les e-mails se signalent sur signal-spam.fr, les SMS et appels en les transférant gratuitement au 33700. Les sites d'escroquerie peuvent être signalés sur la plateforme Pharos du ministère de l'Intérieur." },
  { q: "Pourquoi l'arnaqueur connaît-il mon nom et mon fournisseur ?", a: "Parce que ces informations proviennent d'une fuite de données. C'est ce qui rend l'hameçonnage après une fuite si efficace : le message paraît authentique. Connaître votre nom ne prouve en rien que l'expéditeur est légitime." },
]

export const metadata: Metadata = pageMetadata({ path: CURRENT.path, title: 'Hameçonnage après une fuite : reconnaître les arnaques | Veilix', description: CURRENT.description })

export default function Hameconnage() {
  return (
    <ContentShell breadcrumb="Hameçonnage après une fuite" parent={{ href: GUIDES_PATH, label: 'Guides' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: CURRENT.path, title: CURRENT.title, description: CURRENT.description, published: UPDATED, modified: UPDATED, breadcrumb: 'Hameçonnage après une fuite', faq: FAQ, parent: { path: GUIDES_PATH, label: 'Guides' } })) }} />

      <h1>Hameçonnage après une fuite de données : reconnaître les arnaques</h1>
      <p className="lead">Une fuite de données ne vide pas votre compte toute seule. Ce sont les arnaques qui suivent qui coûtent cher. Avec votre nom, votre fournisseur et parfois votre adresse, les fraudeurs envoient des messages presque impossibles à distinguer des vrais. Voici comment les repérer.</p>
      <p className="updated">Mis à jour le 25 novembre 2026</p>

      <h2 id="pourquoi">Pourquoi les arnaques explosent après une fuite</h2>
      <p>Un message d&apos;hameçonnage classique s&apos;adresse à « Cher client » et vise au hasard. Après une fuite, l&apos;arnaqueur sait que vous êtes vraiment client du service touché, connaît votre nom, parfois votre numéro de client ou votre adresse. Son message cite ces détails : il paraît authentique, et il arrive au moment où vous attendez justement des nouvelles de l&apos;entreprise.</p>

      <h2 id="signes">Les signes qui doivent vous alerter</h2>
      <ul>
        <li><strong>L&apos;urgence</strong> : « votre compte sera suspendu sous 24 heures », « dernière relance avant poursuites ».</li>
        <li><strong>Une demande sensible</strong> : mot de passe, code reçu par SMS, numéro de carte, validation d&apos;une opération.</li>
        <li><strong>Un lien qui ne mène pas au site officiel</strong> : survolez-le ou appuyez longuement dessus pour voir l&apos;adresse réelle. Une lettre de différence, un tiret en plus ou un nom de domaine inconnu suffisent à le trahir.</li>
        <li><strong>Une adresse d&apos;expéditeur étrange</strong>, même si le nom affiché est le bon.</li>
        <li><strong>Une petite somme à payer</strong> : frais de livraison, régularisation, amende. Le but est d&apos;obtenir votre carte bancaire.</li>
        <li><strong>Une pièce jointe inattendue</strong>, surtout une archive ou un document à « activer ».</li>
      </ul>

      <h2 id="scenarios">Les scénarios les plus courants après une fuite</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Scénario</th><th>Ce que dit le message</th><th>Ce que veut l&apos;arnaqueur</th></tr></thead>
          <tbody>
            <tr><td><strong>La fuite elle-même</strong></td><td>« Suite à l&apos;incident de sécurité, vérifiez votre compte »</td><td>Votre mot de passe</td></tr>
            <tr><td><strong>Le faux dédommagement</strong></td><td>« Vous avez droit à une indemnisation, saisissez votre carte »</td><td>Vos données bancaires</td></tr>
            <tr><td><strong>Le faux conseiller</strong></td><td>Appel ou SMS de votre « banque » signalant une fraude</td><td>Un code de validation ou un virement</td></tr>
            <tr><td><strong>Le faux opérateur</strong></td><td>« Votre ligne va être coupée, confirmez vos informations »</td><td>De quoi détourner votre carte SIM</td></tr>
            <tr><td><strong>Le faux colis ou la fausse amende</strong></td><td>« Frais de livraison de 1,99 € à régler »</td><td>Votre numéro de carte</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="reflexes">Les bons réflexes</h2>
      <ol>
        <li><strong>Ne cliquez sur aucun lien</strong> reçu par e-mail ou SMS. Ouvrez vous-même l&apos;application ou tapez l&apos;adresse du site officiel.</li>
        <li><strong>Ne communiquez jamais</strong> un mot de passe, un code reçu par SMS ou vos coordonnées bancaires par téléphone, e-mail ou SMS.</li>
        <li><strong>Raccrochez et rappelez</strong> l&apos;organisation au numéro officiel si un appel vous met la pression. Un numéro affiché peut être falsifié.</li>
        <li><strong>Prenez votre temps</strong> : l&apos;urgence est l&apos;arme principale des arnaqueurs. Une vraie entreprise vous laissera toujours le temps de vérifier.</li>
      </ol>

      <h2 id="signaler">Signaler les messages frauduleux</h2>
      <ul>
        <li><strong>E-mails</strong> : sur signal-spam.fr.</li>
        <li><strong>SMS et appels</strong> : transférez-les gratuitement au 33700.</li>
        <li><strong>Sites d&apos;escroquerie</strong> : sur la plateforme Pharos du ministère de l&apos;Intérieur (internet-signalement.gouv.fr).</li>
      </ul>

      <h2 id="clique">Vous avez cliqué ou répondu : que faire ?</h2>
      <ol>
        <li><strong>Vous avez saisi un mot de passe</strong> : changez-le immédiatement, sur ce site et partout où vous l&apos;utilisiez.</li>
        <li><strong>Vous avez donné vos coordonnées bancaires</strong> : appelez votre banque pour faire opposition sur votre carte, puis surveillez vos comptes.</li>
        <li><strong>Vous avez perdu de l&apos;argent</strong> : portez plainte auprès de la police ou de la gendarmerie, et signalez l&apos;opération à votre banque au plus vite.</li>
        <li><strong>Vous ne savez pas quoi faire</strong> : cybermalveillance.gouv.fr et le service 17Cyber vous orientent gratuitement.</li>
      </ol>
      <p>Si votre IBAN a fuité, lisez aussi <Link href={guide('iban').path}>notre guide dédié</Link>, et pour votre numéro de téléphone, <Link href={guide('telephone').path}>celui sur les fuites de numéros</Link>.</p>

      <VeilixCallout />

      <Faq items={FAQ} />

      <OtherGuides current={CURRENT.key} />
    </ContentShell>
  )
}
