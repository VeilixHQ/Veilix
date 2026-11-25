import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { Faq, OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { jsonLd } from '@/lib/blog'
import { GUIDES_PATH, guide } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const CURRENT = guide('telephone')
const UPDATED = '2026-11-25'

const FAQ = [
  { q: 'Peut-on pirater mon téléphone avec seulement mon numéro ?', a: "Non. Connaître votre numéro ne permet pas de prendre le contrôle de votre téléphone. Le risque vient des arnaques : SMS piégés, faux conseillers au téléphone, ou tentative de se faire attribuer votre ligne auprès de votre opérateur." },
  { q: 'Dois-je changer de numéro après une fuite ?', a: "Rarement. C'est contraignant et souvent inutile. Les bons réflexes suffisent dans la grande majorité des cas. Envisagez-le seulement si vous subissez un harcèlement persistant." },
  { q: 'Que faire si mon téléphone ne capte soudain plus aucun réseau ?', a: "Si votre ligne coupe sans raison, contactez immédiatement votre opérateur depuis un autre téléphone : quelqu'un a peut-être obtenu une nouvelle carte SIM à votre nom pour recevoir vos codes de sécurité. Prévenez aussi votre banque." },
  { q: 'Comment signaler un SMS ou un appel frauduleux ?', a: "Transférez gratuitement le SMS au 33700, ou envoyez au 33700 le numéro de l'appel suspect. Ces signalements servent aux opérateurs à bloquer les numéros frauduleux." },
]

export const metadata: Metadata = pageMetadata({ path: CURRENT.path, title: 'Numéro de téléphone dans une fuite : arnaques et protection | Veilix', description: CURRENT.description })

export default function TelephoneFuite() {
  return (
    <ContentShell breadcrumb="Numéro de téléphone dans une fuite" parent={{ href: GUIDES_PATH, label: 'Guides' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: CURRENT.path, title: CURRENT.title, description: CURRENT.description, published: UPDATED, modified: UPDATED, breadcrumb: 'Numéro de téléphone dans une fuite', faq: FAQ, parent: { path: GUIDES_PATH, label: 'Guides' } })) }} />

      <h1>Votre numéro de téléphone est dans une fuite : les arnaques à connaître</h1>
      <p className="lead">Votre numéro de téléphone fait partie des données volées. Il ne permet pas de pirater votre téléphone, mais il fait de vous une cible pour les SMS piégés et les faux conseillers. Voici ce qui vous attend, et comment vous protéger.</p>
      <p className="updated">Mis à jour le 25 novembre 2026</p>

      <h2 id="risques">Ce que les arnaqueurs font d&apos;un numéro qui a fuité</h2>
      <ul>
        <li><strong>Les SMS piégés</strong> : faux colis, fausse amende, faux remboursement, avec un lien vers un site qui imite le vrai pour voler votre carte ou vos identifiants.</li>
        <li><strong>Les faux conseillers</strong> : un appel de votre « banque » ou de votre « opérateur », parfois depuis un numéro qui semble officiel, pour vous soutirer un code ou une validation.</li>
        <li><strong>Le détournement de ligne</strong> : l&apos;escroc se fait passer pour vous auprès de votre opérateur pour obtenir une nouvelle carte SIM. Il reçoit alors vos SMS, dont les codes de sécurité de votre banque.</li>
        <li><strong>Les appels surtaxés</strong> : un appel qui sonne une fois puis raccroche, pour vous inciter à rappeler un numéro payant.</li>
        <li><strong>Le démarchage</strong> : votre numéro est revendu et ajouté à des fichiers de prospection.</li>
      </ul>

      <h2 id="gestes">Les bons réflexes</h2>
      <ol>
        <li><strong>Ne donnez jamais un code reçu par SMS</strong> à qui que ce soit, même à quelqu&apos;un qui se présente comme votre banque ou votre opérateur.</li>
        <li><strong>Ne cliquez sur aucun lien</strong> reçu par SMS. Passez par l&apos;application officielle.</li>
        <li><strong>Ne rappelez pas</strong> les numéros inconnus qui raccrochent après une sonnerie.</li>
        <li><strong>Raccrochez au moindre doute</strong> et rappelez l&apos;organisation au numéro officiel : un numéro affiché peut être falsifié.</li>
        <li><strong>Signalez</strong> les SMS et appels frauduleux en les transférant gratuitement au 33700.</li>
      </ol>

      <h2 id="ligne">Protéger votre ligne contre le détournement</h2>
      <ul>
        <li>Renseignez-vous auprès de votre opérateur sur les protections disponibles pour votre compte client : code confidentiel, mot de passe solide, alertes en cas de changement de carte SIM.</li>
        <li>Préférez une application d&apos;authentification aux codes par SMS pour vos comptes importants : un détournement de ligne ne permet pas de les intercepter.</li>
        <li>Si votre téléphone perd soudain tout réseau sans raison, appelez votre opérateur depuis un autre appareil et prévenez votre banque.</li>
      </ul>

      <h2 id="demarchage">Réduire le démarchage</h2>
      <p>Inscrivez gratuitement votre numéro sur Bloctel, la liste d&apos;opposition au démarchage téléphonique. Les entreprises n&apos;ont plus le droit de vous appeler à des fins de prospection, sauf si vous êtes déjà client. Cela ne bloque pas les escrocs, mais réduit nettement les appels commerciaux.</p>
      <p>Pour reconnaître les messages frauduleux, lisez aussi notre guide <Link href={guide('hameconnage').path}>reconnaître un hameçonnage après une fuite</Link>.</p>

      <VeilixCallout />

      <Faq items={FAQ} />

      <OtherGuides current={CURRENT.key} />
    </ContentShell>
  )
}
