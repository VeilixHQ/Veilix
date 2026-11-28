import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'
import { SIGNUP_OPEN, START_HREF } from '@/lib/launch'

const PATH = '/alias-email-anonyme'
const TITLE = 'Alias email : protégez votre adresse avec un alias mail par site'
const DESCRIPTION = "Un alias email relaie vos messages sans révéler votre adresse. Créez un alias mail par site avec Veilix : sans mot de passe, open source, hébergé en Europe."
const PUBLISHED = '2026-11-24'
const UPDATED = '2026-11-28'

const FAQ = [
  { q: "Qu'est-ce qu'un alias email ?", a: "C'est une adresse intermédiaire, aussi appelée alias mail ou adresse alias, que vous donnez à un site à la place de votre adresse e-mail personnelle. Les messages reçus sur l'alias vous sont relayés, et le site ne connaît jamais votre adresse personnelle." },
  { q: 'Quelle différence entre un alias email et une adresse jetable ?', a: "Une adresse jetable est une boîte temporaire, souvent publique, qui disparaît après quelques minutes ou quelques jours. Un alias est permanent : il relaie les messages vers votre propre boîte tant que vous le gardez actif, et vous pouvez répondre depuis celui-ci." },
  { q: "Un alias Gmail avec le signe + suffit-il ?", a: "Il aide à trier vos messages, mais il ne cache pas votre adresse : dans votre.nom+site@gmail.com, votre adresse réelle reste lisible, et un site peut retirer la partie après le +. Un alias dédié est une adresse distincte, sans lien visible avec la vôtre." },
  { q: 'Le site voit-il mon adresse quand je réponds ?', a: "Non. Avec Veilix, la réponse part depuis l'alias : votre adresse e-mail personnelle est retirée du message avant son envoi." },
  { q: "Que faire si un alias reçoit du spam ?", a: "Désactivez-le en un clic : les messages ne vous sont plus relayés. Vous pouvez aussi bloquer un expéditeur ou un domaine entier sans désactiver l'alias." },
  { q: 'Veilix stocke-t-il mes e-mails ?', a: "Non. Les messages sont relayés sans être enregistrés. La page Transparence détaille les seules données conservées." },
  { q: 'Où sont hébergées les données ?', a: "L'API, la base de données et l'acheminement des e-mails sont hébergés dans l'Union européenne." },
  { q: 'Combien coûte Veilix ?', a: "L'offre Pro coûte 4,99 € par mois ou 44,90 € par an, le Pack de lancement 69 € par an, et des crédits permettent d'acheter des alias à l'unité dès 1,99 € les 10. Un essai gratuit de 14 jours est proposé, moyen de paiement requis." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Alias email : créer un alias mail par site | Veilix', description: DESCRIPTION })

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export default function AliasEmailAnonyme() {
  return (
    <ContentShell breadcrumb="Alias email">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: PUBLISHED, modified: UPDATED, breadcrumb: 'Alias email', faq: FAQ })) }} />

      <h1>Alias email : protégez votre adresse avec un alias mail par site</h1>
      <p className="lead">Un alias email est une adresse intermédiaire, comme <code>x7k2m9pl4q@alias.veilix.fr</code>, que vous donnez à un site à la place de votre adresse e-mail personnelle. Les messages reçus sur l&apos;alias vous sont relayés, et le site ne connaît jamais votre adresse personnelle.</p>
      <p>Veilix vous donne un alias différent pour chaque site, sans mot de passe pour vous inscrire. Le service est open source et hébergé en Europe.</p>
      <p className="updated">Mise à jour le 28 novembre 2026</p>

      <h2 id="definition">Qu&apos;est-ce qu&apos;un alias email ?</h2>
      <p>Un alias email, qu&apos;on appelle aussi alias mail ou adresse alias, est une adresse qui ne possède pas de boîte de réception propre : tout ce qu&apos;elle reçoit est transféré vers une autre adresse, la vôtre. Vous continuez à lire vos messages dans votre messagerie habituelle (Gmail, Outlook, Proton Mail ou autre).</p>
      <p>Le mot alias veut dire « autre nom » : c&apos;est un second nom pour la même boîte. Un alias est <strong>anonyme</strong> quand il ne révèle rien de vous : son nom est aléatoire, il ne contient ni votre nom ni votre adresse, et vos réponses partent depuis l&apos;alias lui-même.</p>

      <h2 id="jetable">Alias mail ou adresse jetable ?</h2>
      <p>Une <strong>adresse jetable</strong> est une boîte temporaire, souvent publique, qui disparaît après quelques minutes ou quelques jours. Elle suffit pour un téléchargement ponctuel, mais vous perdez tout message ultérieur : facture, confirmation, réinitialisation de mot de passe.</p>
      <p>Un <strong>alias</strong> est permanent : il reste actif tant que vous le souhaitez, relaie les messages vers votre propre boîte et vous permet de répondre. Le comparatif complet est sur la page <Link href="/email-jetable">email jetable ou alias</Link>.</p>

      <h2 id="pourquoi">Pourquoi utiliser un alias email ?</h2>
      <ul>
        <li><strong>Moins de spam</strong> : si un alias reçoit des messages indésirables, vous le désactivez sans toucher à votre adresse personnelle.</li>
        <li><strong>Savoir qui revend votre adresse</strong> : un alias par site permet d&apos;identifier immédiatement l&apos;origine d&apos;une fuite ou d&apos;une revente.</li>
        <li><strong>Limiter l&apos;impact des fuites de données</strong> : si un site est piraté, seul l&apos;alias est exposé.</li>
        <li><strong>Éviter le pistage entre sites</strong> : votre adresse personnelle ne sert plus d&apos;identifiant commun à tous vos comptes.</li>
        <li><strong>Garder le contrôle</strong> : vous coupez un alias quand vous voulez, au lieu de dépendre d&apos;un lien de désinscription.</li>
      </ul>

      <h2 id="creer">Comment créer un alias email avec Veilix</h2>
      <ol>
        <li><strong>Créez un alias</strong> en un clic depuis votre tableau de bord, avec un libellé pour vous y retrouver.</li>
        <li><strong>Donnez l&apos;alias</strong> au site à la place de votre adresse e-mail personnelle.</li>
        <li><strong>Recevez vos messages</strong> : Veilix les relaie vers votre boîte, pièces jointes comprises.</li>
        <li><strong>Répondez depuis l&apos;alias</strong> : votre adresse personnelle est retirée du message avant son envoi.</li>
        <li><strong>Désactivez l&apos;alias</strong> à tout moment, ou bloquez un expéditeur précis.</li>
      </ol>

      <h2 id="gmail-outlook">Alias Gmail, Outlook ou service dédié : les différences</h2>
      <p>Les messageries proposent leurs propres alias. Ils sont utiles pour trier, beaucoup moins pour protéger votre adresse.</p>
      <Table
        head={['Solution', 'Ce que voit le site', 'Limite principale']}
        rows={[
          ['Alias Gmail avec + (votre.nom+site@gmail.com)', 'Votre adresse réelle, suivie d’un mot', 'Le site peut retirer la partie après le + et retrouver votre adresse'],
          ['Alias de votre messagerie (Outlook, Proton Mail…)', 'Une autre adresse du même compte', 'Nombre limité, souvent liée à votre nom, désactivation peu pratique'],
          ['Service d’alias dédié (Veilix et autres)', 'Une adresse aléatoire sans lien avec vous', 'Dépend d’un service tiers, qu’il faut choisir avec soin'],
        ]}
      />
      <p>Pour choisir un service dédié, comparez la confidentialité, l&apos;hébergement et le prix : notre <Link href="/comparatif/meilleurs-alias-email">comparatif des services d&apos;alias email</Link> met Veilix face à SimpleLogin, Proton Pass, addy.io, Firefox Relay et DuckDuckGo, en reconnaissant leurs points forts.</p>

      <h2 id="sans-mot-de-passe">Une inscription sans mot de passe</h2>
      <p>Veilix ne vous demande ni identifiant ni mot de passe. Votre navigateur génère une clé cryptographique et une phrase de récupération de 12 mots (norme BIP39), que vous seul possédez. Pour retrouver votre accès sur un autre appareil, vous saisissez ces 12 mots.</p>
      <p>Pendant la bêta, une adresse de contact est demandée : elle sert uniquement à communiquer avec vous pendant le test, est chiffrée et ne sert jamais à vous connecter. Il n&apos;existe pas de récupération par e-mail : si vous perdez votre phrase de récupération, Veilix ne peut pas restaurer votre accès. Le détail figure sur la page <Link href="/transparence">Transparence</Link>.</p>

      <h2 id="differences">Ce qui distingue Veilix</h2>
      <Table
        head={['Point', 'Chez Veilix']}
        rows={[
          ['Code source', 'Entièrement open source, sous licence AGPL-3.0'],
          ['Hébergement', "API, base de données et acheminement des e-mails dans l'Union européenne"],
          ['Inscription', 'Clé générée dans le navigateur, phrase de récupération de 12 mots, sans mot de passe'],
          ['Adresses de destination', 'Chiffrées en AES-256-GCM dans la base de données'],
          ['Contenu des e-mails', 'Relayé sans être stocké, aucun journal d’activité'],
          ['Chiffrement des messages', 'PGP/MIME avec votre clé publique (Pack de lancement)'],
          ['Protection', "Blocage d'expéditeurs par adresse ou par domaine, alertes de fuite, contrôles SPF, DKIM et DMARC"],
          ['Automatisation', 'Clés API pour gérer vos alias par programme (Pack de lancement)'],
        ]}
      />

      <h2 id="offres">Les offres</h2>
      <Table
        head={['Offre', 'Prix', 'Points clés']}
        rows={[
          ['Pro', '4,99 € / mois ou 44,90 € / an', "100 alias actifs, réponse depuis l'alias, pièces jointes, tags, 3 boîtes de destination, blocage d'expéditeurs"],
          ['Pack de lancement', '69 € / an, limité à 100 exemplaires', 'Tout le Pro, alias illimités, 10 boîtes de destination, chiffrement PGP, API, alertes de fuite en temps réel'],
          ['Crédits', 'Dès 1,99 € les 10 alias', 'Des alias à l’unité, sans abonnement'],
        ]}
      />
      <p>Veilix n&apos;a pas d&apos;offre gratuite : il est financé uniquement par ses abonnés, sans publicité ni revente de données. Un essai gratuit de 14 jours est proposé, moyen de paiement requis. Détail complet sur la page <Link href="/pricing">Tarifs</Link>.</p>

      <h2 id="limites">Ce que l&apos;alias protège, et ses limites</h2>
      <p>Pour les sites auxquels vous le donnez, l&apos;alias masque votre adresse : ils ne voient que lui. Il existe toutefois des limites propres au protocole e-mail : le contenu d&apos;un message (une signature, un nom) peut vous identifier, et votre fournisseur de messagerie voit les messages relayés. Veilix les explique sans détour sur la page <Link href="/transparence">Transparence</Link>, et détaille ses mesures de protection sur la page <Link href="/securite">Sécurité</Link>.</p>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
      <p style={{ marginTop: 18 }}>D&apos;autres réponses sur la page <Link href="/faq">FAQ</Link>.</p>

      <h2 id="essayer">Essayer Veilix</h2>
      <p>{SIGNUP_OPEN ? 'Créez votre premier alias en quelques secondes, avec 14 jours d’essai gratuit.' : 'Veilix ouvre à tous le 1er février 2027. Rejoignez la liste d’attente pour être prévenu de l’ouverture.'}</p>
      <Link href={START_HREF} className="cta">{SIGNUP_OPEN ? 'Essayer 14 jours' : 'Être prévenu du lancement'}</Link>
    </ContentShell>
  )
}
