import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { Faq, OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { jsonLd } from '@/lib/blog'
import { GUIDES_PATH, guide } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const CURRENT = guide('iban')
const UPDATED = '2026-11-25'

const FAQ = [
  { q: "Peut-on vider mon compte avec seulement mon IBAN ?", a: "Non. Un IBAN sert à recevoir des virements et à mettre en place des prélèvements. Il ne permet ni de faire un virement depuis votre compte, ni de payer avec votre carte. Le vrai risque, ce sont les prélèvements frauduleux et les arnaques qui s'appuient sur votre IBAN pour paraître crédibles." },
  { q: 'Comment bloquer un prélèvement frauduleux ?', a: "Contestez-le auprès de votre banque. Un prélèvement que vous n'avez jamais autorisé se conteste jusqu'à 13 mois après le débit, et la banque doit vous rembourser. Vous pouvez aussi bloquer un créancier précis, ou n'autoriser que les créanciers de votre choix, depuis l'espace client de la plupart des banques." },
  { q: 'Faut-il changer de compte bancaire après une fuite d’IBAN ?', a: "Ce n'est généralement pas nécessaire. Une surveillance régulière et la liste des créanciers autorisés suffisent dans la plupart des cas. Si des prélèvements frauduleux se répètent malgré tout, demandez conseil à votre banque : elle peut vous proposer d'ouvrir un nouveau compte." },
  { q: 'Ma banque m’appelle au sujet de la fuite : est-ce normal ?', a: "Méfiance. Un vrai conseiller ne vous demandera jamais de valider une opération, de communiquer un code reçu par SMS ou de faire un virement « de sécurité ». Au moindre doute, raccrochez et rappelez le numéro inscrit au dos de votre carte ou dans votre application." },
]

export const metadata: Metadata = pageMetadata({ path: CURRENT.path, title: 'Mon IBAN a fuité : que faire ? Risques et réflexes | Veilix', description: CURRENT.description })

export default function IbanFuite() {
  return (
    <ContentShell breadcrumb="Mon IBAN a fuité" parent={{ href: GUIDES_PATH, label: 'Guides' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: CURRENT.path, title: CURRENT.title, description: CURRENT.description, published: UPDATED, modified: UPDATED, breadcrumb: 'Mon IBAN a fuité', faq: FAQ, parent: { path: GUIDES_PATH, label: 'Guides' } })) }} />

      <h1>Mon IBAN a fuité : que faire ?</h1>
      <p className="lead">Votre IBAN fait partie d&apos;une fuite de données. Bonne nouvelle : il ne permet pas de vider votre compte. Mauvaise nouvelle : il intéresse quand même les fraudeurs. Voici les risques réels, et comment les neutraliser.</p>
      <p className="updated">Mis à jour le 25 novembre 2026</p>

      <h2 id="risques">Ce qu&apos;un fraudeur peut faire, et ne pas faire, avec votre IBAN</h2>
      <p>Un IBAN est fait pour être partagé : vous le donnez à votre employeur, à votre opérateur, à votre propriétaire. Il ne permet <strong>ni de faire un virement depuis votre compte, ni de payer avec votre carte</strong>. En revanche, il ouvre la porte à trois types de fraude :</p>
      <ul>
        <li><strong>Les prélèvements frauduleux.</strong> Un créancier peu scrupuleux peut créer un faux mandat de prélèvement SEPA à votre nom. La banque ne vérifie pas le mandat au moment du débit : c&apos;est à vous de repérer l&apos;opération.</li>
        <li><strong>L&apos;arnaque au faux conseiller.</strong> L&apos;escroc vous appelle en se faisant passer pour votre banque. Il cite votre IBAN, votre nom et votre adresse pour vous mettre en confiance, puis vous pousse à valider une opération ou à communiquer un code.</li>
        <li><strong>L&apos;usurpation d&apos;identité.</strong> Combiné à votre nom, votre adresse et votre date de naissance, votre IBAN peut servir à souscrire des abonnements ou des contrats à votre nom.</li>
      </ul>

      <h2 id="gestes">Les gestes à faire tout de suite</h2>
      <ol>
        <li><strong>Surveillez vos relevés</strong> chaque semaine pendant plusieurs mois. Activez les notifications de votre application bancaire pour chaque prélèvement.</li>
        <li><strong>Filtrez les prélèvements.</strong> La réglementation européenne vous permet de bloquer un créancier précis, de n&apos;autoriser que les créanciers de votre choix, ou de plafonner les montants. La plupart des banques le proposent dans leur espace client ; sinon, demandez-le à votre conseiller.</li>
        <li><strong>Méfiez-vous des appels de votre « banque ».</strong> Un vrai conseiller ne vous demandera jamais un code reçu par SMS, la validation d&apos;une opération pour en « annuler » une autre, ni un virement vers un compte « sécurisé ».</li>
        <li><strong>Gardez une trace</strong> du message vous annonçant la fuite : il vous sera utile en cas de contestation ou de plainte.</li>
      </ol>

      <h2 id="contester">Vous avez repéré un prélèvement inconnu</h2>
      <p>Contactez votre banque au plus vite et contestez l&apos;opération. Le délai dépend de la situation :</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Situation</th><th>Délai pour contester</th><th>Remboursement</th></tr></thead>
          <tbody>
            <tr><td>Prélèvement que vous n&apos;avez jamais autorisé (aucun mandat signé)</td><td>Jusqu&apos;à 13 mois après le débit</td><td>La banque doit vous rembourser</td></tr>
            <tr><td>Prélèvement autorisé mais contesté (montant, litige)</td><td>8 semaines après le débit</td><td>Remboursement sans avoir à vous justifier</td></tr>
          </tbody>
        </table>
      </div>
      <p>Bloquez ensuite le créancier concerné pour éviter tout nouveau débit, puis portez plainte auprès de la police ou de la gendarmerie. Le site cybermalveillance.gouv.fr vous guide gratuitement dans ces démarches.</p>

      <h2 id="faux-conseiller">Le scénario du faux conseiller, étape par étape</h2>
      <p>C&apos;est l&apos;arnaque la plus coûteuse après une fuite d&apos;IBAN. Elle suit presque toujours le même déroulé :</p>
      <ol>
        <li>Vous recevez un SMS signalant une opération suspecte, ou un appel affichant parfois le vrai numéro de votre banque.</li>
        <li>L&apos;interlocuteur connaît votre nom, votre IBAN, parfois vos dernières opérations : il paraît légitime.</li>
        <li>Il vous annonce une fraude en cours et vous demande, pour la « bloquer », de valider une opération dans votre application, de lui lire un code ou de virer votre argent sur un compte « sécurisé ».</li>
      </ol>
      <p>À la moindre demande de ce type, <strong>raccrochez</strong> et rappelez votre banque au numéro inscrit au dos de votre carte ou dans votre application. Une vraie banque ne vous demandera jamais cela.</p>
      <p>Les autres scénarios d&apos;arnaque sont détaillés dans notre guide <Link href={guide('hameconnage').path}>reconnaître un hameçonnage après une fuite</Link>.</p>

      <VeilixCallout />

      <Faq items={FAQ} />

      <OtherGuides current={CURRENT.key} />
    </ContentShell>
  )
}
