import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { Faq, OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { jsonLd } from '@/lib/blog'
import { GUIDES_PATH, LEAKS_LIST_PATH, guide } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const CURRENT = guide('que-faire')
const UPDATED = '2026-11-25'

const FAQ = [
  { q: "Une entreprise doit-elle me prévenir d'une fuite de mes données ?", a: "Oui, lorsque la fuite présente un risque élevé pour vos droits et libertés, par exemple si elle expose des données bancaires ou de santé. C'est l'article 34 du RGPD. Elle doit aussi déclarer la fuite à la CNIL dans les 72 heures, sauf si le risque est jugé improbable." },
  { q: 'Puis-je être indemnisé après une fuite de données ?', a: "Le RGPD (article 82) prévoit un droit à réparation si la fuite vous a causé un dommage matériel ou moral. Il faut en général le démontrer devant un juge. Des actions de groupe peuvent aussi être lancées par des associations agréées : suivez les annonces liées à la fuite qui vous concerne." },
  { q: "Dois-je changer d'adresse e-mail après une fuite ?", a: "Rarement. Changez vos mots de passe, activez la double authentification et redoublez de vigilance face aux messages suspects. Pour l'avenir, utilisez une adresse différente par site, un alias, afin qu'une prochaine fuite n'expose plus votre adresse principale." },
  { q: 'Combien de temps mes données restent-elles dangereuses ?', a: "Très longtemps. Les fichiers volés se revendent et se recombinent pendant des années. Un mot de passe, un IBAN ou une date de naissance qui ont fuité doivent être considérés comme connus des fraudeurs, définitivement." },
  { q: 'À qui signaler une fuite dont je suis victime ?', a: "Vous pouvez déposer une plainte auprès de la CNIL si l'entreprise ne respecte pas ses obligations, et porter plainte auprès de la police ou de la gendarmerie si vous subissez une fraude. Le site cybermalveillance.gouv.fr et le service 17Cyber vous orientent gratuitement selon votre situation." },
]

export const metadata: Metadata = pageMetadata({ path: CURRENT.path, title: 'Que faire après une fuite de données ? Guide complet | Veilix', description: CURRENT.description })

export default function QueFaire() {
  return (
    <ContentShell breadcrumb="Que faire après une fuite" parent={{ href: GUIDES_PATH, label: 'Guides' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: CURRENT.path, title: CURRENT.title, description: CURRENT.description, published: UPDATED, modified: UPDATED, breadcrumb: 'Que faire après une fuite', faq: FAQ, parent: { path: GUIDES_PATH, label: 'Guides' } })) }} />

      <h1>Que faire après une fuite de données ?</h1>
      <p className="lead">Vous avez reçu un e-mail vous annonçant que vos données ont fuité, ou vous l&apos;avez appris dans la presse. Pas de panique : la plupart des risques se maîtrisent avec quelques gestes simples, à condition de les faire vite et dans le bon ordre.</p>
      <p className="updated">Mis à jour le 25 novembre 2026</p>

      <h2 id="identifier">1. Identifier précisément ce qui a fuité</h2>
      <p>Tout dépend des données exposées. Une adresse e-mail seule n&apos;appelle pas les mêmes précautions qu&apos;un IBAN ou un numéro de sécurité sociale. Pour le savoir :</p>
      <ul>
        <li>Relisez le message de l&apos;entreprise touchée : quand le risque est élevé, le RGPD l&apos;oblige à vous prévenir et à préciser la nature des données concernées.</li>
        <li>Consultez <Link href={LEAKS_LIST_PATH}>notre liste des fuites de données en France</Link> : chaque fuite y est détaillée, avec les données exposées et épargnées.</li>
        <li>Vérifiez votre adresse avec <Link href={guide('verifier').path}>notre outil gratuit</Link> pour découvrir d&apos;éventuelles autres fuites plus anciennes.</li>
      </ul>

      <h2 id="gestes">2. Les gestes à faire selon les données exposées</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Donnée exposée</th><th>Risque principal</th><th>Ce qu&apos;il faut faire</th></tr></thead>
          <tbody>
            <tr><td><strong>Adresse e-mail</strong></td><td>Spam et hameçonnage ciblé</td><td>Méfiance envers tout message citant le service touché</td></tr>
            <tr><td><strong>Mot de passe</strong></td><td>Piratage de vos comptes</td><td>Le changer partout où il était utilisé, activer la double authentification</td></tr>
            <tr><td><strong>Numéro de téléphone</strong></td><td>SMS frauduleux, faux conseillers</td><td>Ne jamais donner de code par téléphone, sécuriser votre ligne</td></tr>
            <tr><td><strong>IBAN</strong></td><td>Prélèvements frauduleux, arnaque au faux conseiller</td><td>Surveiller vos relevés, contester tout prélèvement inconnu</td></tr>
            <tr><td><strong>Nom, adresse, date de naissance</strong></td><td>Arnaques plus crédibles, usurpation d&apos;identité</td><td>Vigilance accrue, surveiller les courriers inattendus</td></tr>
            <tr><td><strong>N° de sécurité sociale, pièce d&apos;identité</strong></td><td>Usurpation d&apos;identité</td><td>Porter plainte en cas d&apos;usage frauduleux, garder une trace de vos démarches</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="mots-de-passe">3. Sécuriser vos comptes</h2>
      <p>Si un mot de passe a fuité, même chiffré, considérez-le comme connu. Les pirates testent automatiquement les identifiants volés sur des centaines d&apos;autres sites : c&apos;est le « bourrage d&apos;identifiants ».</p>
      <ol>
        <li>Changez le mot de passe du service touché.</li>
        <li>Changez-le aussi sur tous les sites où vous utilisiez le même, en commençant par votre messagerie : c&apos;est elle qui permet de réinitialiser tous les autres.</li>
        <li>Activez la double authentification sur vos comptes importants, de préférence avec une application d&apos;authentification plutôt que par SMS.</li>
        <li>Adoptez un gestionnaire de mots de passe : un mot de passe unique et long par site, sans effort de mémoire.</li>
      </ol>

      <h2 id="arnaques">4. Redoubler de vigilance face aux arnaques</h2>
      <p>Dans les semaines qui suivent une fuite, les arnaqueurs exploitent les données volées pour rendre leurs messages crédibles : ils connaissent votre nom, le service que vous utilisez, parfois votre adresse. Le scénario le plus courant se sert de la fuite elle-même : « suite à l&apos;incident de sécurité, vérifiez votre compte » ou « recevez votre dédommagement ».</p>
      <p>Règle d&apos;or : ne cliquez sur aucun lien reçu, passez toujours par l&apos;application ou le site officiel que vous tapez vous-même. Tous les signes à repérer sont dans notre guide <Link href={guide('hameconnage').path}>reconnaître un hameçonnage après une fuite</Link>.</p>

      <h2 id="banque">5. Surveiller vos comptes bancaires</h2>
      <p>Si des données bancaires ont fuité, consultez vos relevés chaque semaine pendant plusieurs mois. Un prélèvement que vous n&apos;avez jamais autorisé se conteste auprès de votre banque jusqu&apos;à 13 mois après le débit. Tout est expliqué dans notre guide <Link href={guide('iban').path}>mon IBAN a fuité : que faire</Link>.</p>

      <h2 id="droits">6. Faire valoir vos droits</h2>
      <p>Le RGPD vous donne des moyens d&apos;agir face à l&apos;organisation responsable de la fuite :</p>
      <ul>
        <li><strong>Être informé</strong> : quand la fuite présente un risque élevé pour vous, l&apos;organisation doit vous prévenir directement (article 34). Elle doit aussi la déclarer à la CNIL dans les 72 heures (article 33).</li>
        <li><strong>Savoir ce qu&apos;elle détient sur vous</strong> : votre droit d&apos;accès (article 15) vous permet de demander quelles données elle conserve. Elle doit répondre dans un délai d&apos;un mois.</li>
        <li><strong>Saisir la CNIL</strong> : si l&apos;organisation ne vous répond pas ou ne respecte pas ses obligations, vous pouvez déposer une plainte en ligne sur le site de la CNIL.</li>
        <li><strong>Demander réparation</strong> : l&apos;article 82 du RGPD prévoit une indemnisation en cas de dommage, à faire valoir en justice, seul ou via une action de groupe.</li>
      </ul>
      <p>Si vous êtes victime d&apos;une fraude (prélèvement, usurpation d&apos;identité), portez plainte auprès de la police ou de la gendarmerie. Le site cybermalveillance.gouv.fr et le service 17Cyber vous orientent gratuitement vers les bonnes démarches.</p>

      <VeilixCallout />

      <Faq items={FAQ} />

      <OtherGuides current={CURRENT.key} />
    </ContentShell>
  )
}
