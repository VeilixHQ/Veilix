import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/alias-email-anonyme'
const TITLE = 'Alias email anonyme : protégez votre adresse e-mail personnelle'
const DESCRIPTION = "Qu'est-ce qu'un alias email anonyme, à quoi il sert et comment il fonctionne. Veilix : un alias par site, sans mot de passe, open source et hébergé en Europe."
const UPDATED = '2026-11-24'

const FAQ = [
  { q: "Qu'est-ce qu'un alias email anonyme ?", a: "C'est une adresse intermédiaire que vous donnez à un site à la place de votre adresse e-mail personnelle. Les messages reçus sur l'alias vous sont relayés, et le site ne connaît jamais votre adresse personnelle." },
  { q: 'Le site voit-il mon adresse quand je réponds ?', a: "Non. Avec Veilix, la réponse part depuis l'alias : votre adresse e-mail personnelle est retirée du message avant son envoi." },
  { q: "Que faire si un alias reçoit du spam ?", a: "Désactivez-le en un clic : les messages ne vous sont plus relayés. Vous pouvez aussi bloquer un expéditeur ou un domaine entier sans désactiver l'alias." },
  { q: 'Veilix stocke-t-il mes e-mails ?', a: "Non. Les messages sont relayés sans être enregistrés. La page Transparence détaille les seules données conservées." },
  { q: 'Où sont hébergées les données ?', a: "L'API, la base de données et l'acheminement des e-mails sont hébergés dans l'Union européenne." },
  { q: 'Combien coûte Veilix ?', a: "L'offre Pro coûte 4,99 € par mois ou 44,90 € par an, le Pack de lancement 69 € par an, et des crédits permettent d'acheter des alias à l'unité. Un essai gratuit de 14 jours est proposé." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Alias email anonyme : protégez votre adresse | Veilix', description: DESCRIPTION })

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
    <ContentShell breadcrumb="Alias email anonyme">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Alias email anonyme', faq: FAQ })) }} />

      <h1>Alias email anonyme : protégez votre adresse e-mail personnelle</h1>
      <p className="lead">Un alias email anonyme est une adresse intermédiaire, comme <code>x7k2m9pl4q@alias.veilix.fr</code>, que vous donnez à un site à la place de votre adresse e-mail personnelle. Les messages reçus sur l&apos;alias vous sont relayés, et le site ne connaît jamais votre adresse personnelle.</p>
      <p>Veilix vous donne un alias différent pour chaque site, sans mot de passe pour vous inscrire. Le service est open source et hébergé en Europe.</p>
      <p className="updated">Mise à jour le 24 novembre 2026</p>

      <h2 id="definition">Qu&apos;est-ce qu&apos;un alias email ?</h2>
      <p>Un alias email est une adresse qui ne possède pas de boîte de réception propre : tout ce qu&apos;elle reçoit est transféré vers une autre adresse, la vôtre. Vous continuez à lire vos messages dans votre messagerie habituelle (Gmail, Outlook, Proton Mail ou autre).</p>
      <p>Un alias est <strong>anonyme</strong> quand il ne révèle rien de vous : son nom est aléatoire, il ne contient ni votre nom ni votre adresse, et vos réponses partent depuis l&apos;alias lui-même.</p>
      <p>Contrairement à un <strong>email temporaire</strong>, qui disparaît après quelques minutes, un alias est <strong>permanent</strong> : il reste actif tant que vous le souhaitez, et vous pouvez répondre depuis celui-ci.</p>

      <h2 id="pourquoi">Pourquoi utiliser un alias email ?</h2>
      <ul>
        <li><strong>Moins de spam</strong> : si un alias reçoit des messages indésirables, vous le désactivez sans toucher à votre adresse personnelle.</li>
        <li><strong>Savoir qui revend votre adresse</strong> : un alias par site permet d&apos;identifier immédiatement l&apos;origine d&apos;une fuite ou d&apos;une revente.</li>
        <li><strong>Limiter l&apos;impact des fuites de données</strong> : si un site est piraté, seul l&apos;alias est exposé.</li>
        <li><strong>Éviter le pistage entre sites</strong> : votre adresse personnelle ne sert plus d&apos;identifiant commun à tous vos comptes.</li>
        <li><strong>Garder le contrôle</strong> : vous coupez un alias quand vous voulez, au lieu de dépendre d&apos;un lien de désinscription.</li>
      </ul>

      <h2 id="fonctionnement">Comment fonctionne Veilix, étape par étape</h2>
      <ol>
        <li><strong>Créez un alias</strong> en un clic depuis votre tableau de bord, avec un libellé pour vous y retrouver.</li>
        <li><strong>Donnez l&apos;alias</strong> au site à la place de votre adresse e-mail personnelle.</li>
        <li><strong>Recevez vos messages</strong> : Veilix les relaie vers votre boîte, pièces jointes comprises.</li>
        <li><strong>Répondez depuis l&apos;alias</strong> : votre adresse personnelle est retirée du message avant son envoi.</li>
        <li><strong>Désactivez l&apos;alias</strong> à tout moment, ou bloquez un expéditeur précis.</li>
      </ol>

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
      <p>Un essai gratuit de 14 jours est proposé. Détail complet sur la page <Link href="/pricing">Tarifs</Link>.</p>

      <h2 id="anonymat">Un alias email est-il vraiment anonyme ?</h2>
      <p>Pour les sites auxquels vous le donnez, oui : ils ne voient que l&apos;alias. Il existe toutefois des limites propres au protocole e-mail : le contenu d&apos;un message (une signature, un nom) peut vous identifier, et votre fournisseur de messagerie voit les messages relayés. Veilix les explique sans détour sur la page <Link href="/transparence">Transparence</Link>, et détaille ses mesures de protection sur la page <Link href="/securite">Sécurité</Link>.</p>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
      <p style={{ marginTop: 18 }}>D&apos;autres réponses sur la page <Link href="/faq">FAQ</Link>.</p>

      <h2 id="essayer">Essayer Veilix</h2>
      <p>Veilix est actuellement en bêta. Rejoignez la liste d&apos;attente pour recevoir une invitation.</p>
      <Link href="/beta" className="cta">Rejoindre la bêta</Link>
    </ContentShell>
  )
}
