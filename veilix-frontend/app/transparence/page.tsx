import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/transparence'
const TITLE = 'Transparence : ce que Veilix conserve et ne conserve pas'
const DESCRIPTION = "No Logs, sans mot de passe, anonymat : ce que Veilix stocke, chiffre et efface, d'après son code open source. Données, durées, prestataires et limites."
const UPDATED = '2026-11-24'

const FAQ = [
  { q: 'Veilix lit-il ou stocke-t-il mes e-mails ?', a: "Non. Le contenu des messages et leurs pièces jointes sont traités en mémoire le temps du relais, puis transmis à votre boîte. Veilix n'enregistre ni le contenu, ni l'historique des messages." },
  { q: "Que signifie « No Logs » chez Veilix ?", a: "Veilix ne tient aucun journal d'activité : pas d'historique des messages, pas d'adresse IP de visiteur enregistrée en clair, pas de contenu. Seuls des compteurs (nombre de messages transférés ou bloqués) et des empreintes techniques à durée limitée sont conservés." },
  { q: 'Veilix connaît-il mon adresse e-mail personnelle ?', a: "Oui, il en a besoin pour vous relayer les messages. Elle est chiffrée en AES-256-GCM dans la base de données et n'est déchiffrée qu'en mémoire, au moment du relais." },
  { q: 'Comment supprimer toutes mes données ?', a: "Depuis Paramètres, Actions dangereuses, la suppression du compte efface votre clé, vos alias, vos adresses de destination et les données associées." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Transparence : données conservées et No Logs | Veilix', description: DESCRIPTION })

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

export default function Transparence() {
  return (
    <ContentShell breadcrumb="Transparence">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Transparence', faq: FAQ })) }} />

      <h1>Transparence : ce que Veilix conserve, et ce qu&apos;il ne conserve pas</h1>
      <p className="lead">Veilix ne lit pas et ne stocke pas le contenu de vos e-mails, et ne tient aucun journal d&apos;activité. Pour faire fonctionner vos alias, il conserve uniquement les données nécessaires, chiffrées ou réduites à une empreinte dès que c&apos;est possible.</p>
      <p>Cette page détaille chacune de ces données d&apos;après le code source de Veilix, publié sous licence AGPL-3.0. Elle précise aussi ce que voient nos prestataires et les limites propres au protocole e-mail.</p>
      <p className="updated">Mise à jour le 24 novembre 2026</p>

      <h2 id="engagements">Ce que veulent dire nos engagements</h2>
      <h3>No Logs : aucun journal d&apos;activité</h3>
      <p>Veilix n&apos;enregistre pas l&apos;historique de vos messages : ni qui vous écrit, ni quand, ni le contenu. Le journal d&apos;accès du serveur est désactivé, et les journaux techniques de l&apos;application ne contiennent que le type d&apos;événement (par exemple « message transféré »), sans adresse, sans adresse IP et sans contenu.</p>
      <p>Ce qui est conservé : des <strong>compteurs</strong> (nombre de messages transférés et bloqués par alias), la <strong>date de dernière activité</strong> du compte et des <strong>empreintes techniques</strong> effacées automatiquement après quelques jours (détail ci-dessous).</p>

      <h3>No Account : ni identifiant ni mot de passe</h3>
      <p>Votre accès repose sur une clé cryptographique générée dans votre navigateur, avec une phrase de récupération de 12 mots (norme BIP39). Cette phrase n&apos;est jamais envoyée à Veilix. Le serveur ne conserve qu&apos;une <strong>empreinte SHA-256</strong> de l&apos;identifiant de votre clé.</p>
      <p>Pendant la bêta, une <strong>adresse e-mail de contact</strong> est demandée à l&apos;inscription. Elle sert <strong>uniquement à communiquer avec vous pendant la bêta</strong> (code d&apos;accès, informations sur le test). Elle est chiffrée et ne sert jamais d&apos;identifiant de connexion.</p>
      <p>Il n&apos;existe <strong>pas de récupération de compte par e-mail</strong> : votre phrase de récupération est la seule clé de votre compte. Si vous la perdez, Veilix ne peut pas restaurer votre accès.</p>

      <h3>Anonymat : ce que voient les sites</h3>
      <p>Un site ne voit que votre alias, par exemple <code>x7k2m9pl4q@alias.veilix.fr</code>. Lorsque vous répondez depuis un alias, votre adresse e-mail personnelle est retirée du message avant son envoi. Les limites de cet anonymat sont décrites plus bas.</p>

      <h2 id="donnees">Les données conservées, une par une</h2>
      <Table
        head={['Donnée', 'Pourquoi', 'Protection', 'Durée']}
        rows={[
          ['Empreinte de votre clé', 'Reconnaître votre compte', 'Empreinte SHA-256, la clé reste dans votre navigateur', "Jusqu'à la suppression du compte"],
          ['Adresse de contact (bêta)', 'Communiquer avec vous pendant la bêta, uniquement', 'Chiffrée (AES-256-GCM)', "Jusqu'à la suppression du compte"],
          ['Alias', 'Recevoir les messages', 'En clair, nécessaire au routage', "Jusqu'à la suppression de l'alias ou du compte"],
          ["Libellé de l'alias", "Vous aider à l'organiser", 'En clair', "Jusqu'à la suppression de l'alias"],
          ['Adresses de destination', 'Relayer les messages', 'Chiffrées (AES-256-GCM), retrouvées par une empreinte HMAC', "Jusqu'à la suppression de l'alias ou du compte"],
          ['Compteurs par alias', 'Statistiques transférés / bloqués', 'Nombres uniquement', "Jusqu'à la suppression de l'alias"],
          ['Domaines expéditeurs déjà vus', 'Alertes de fuite', "Empreinte HMAC du domaine, jamais l'adresse", "Jusqu'à la suppression de l'alias"],
          ['Expéditeurs bloqués', 'Bloquer une adresse ou un domaine', 'Chiffrés, avec empreinte HMAC', "Jusqu'au déblocage ou à la suppression"],
          ['Correspondants à qui vous répondez', 'Acheminer vos réponses depuis l’alias', 'Adresse chiffrée', "Jusqu'à la suppression de l'alias"],
          ['Clé PGP publique', 'Chiffrer les messages relayés', 'Publique par nature', "Jusqu'à son retrait"],
          ['Clés API', 'Accès programmatique', 'Empreinte SHA-256 uniquement', "Jusqu'à leur révocation"],
          ['Dates (création, dernière activité, acceptation des conditions)', 'Fonctionnement et bêta', '-', "Jusqu'à la suppression du compte"],
          ['Plan, crédits et préférences', 'Fournir le service', '-', "Jusqu'à la suppression du compte"],
          ['Inscription à la liste d’attente bêta', 'Vous inviter', 'Adresse chiffrée', 'Effacée à la fin de la phase de bêta'],
          ['Compteurs anti-abus', 'Limiter les requêtes abusives', 'Identifiants, dont l’adresse IP, réduits à une empreinte HMAC', '2 jours au maximum'],
          ['Empreintes des messages reçus', 'Éviter les doublons', 'Empreintes uniquement', '3 jours au maximum'],
        ]}
      />

      <h2 id="jamais">Ce que Veilix ne conserve jamais</h2>
      <ul>
        <li>Le <strong>contenu</strong> de vos e-mails et leurs pièces jointes.</li>
        <li>L&apos;<strong>historique</strong> des messages : qui écrit à quel alias, et quand.</li>
        <li>Les <strong>adresses IP</strong> des visiteurs en clair.</li>
        <li>Votre <strong>phrase de récupération</strong> et votre clé privée.</li>
        <li>Un <strong>mot de passe</strong> : il n&apos;y en a pas.</li>
        <li>Des <strong>cookies de suivi</strong> ou des traceurs publicitaires.</li>
      </ul>

      <h2 id="parcours">Le parcours d&apos;un e-mail</h2>
      <ol>
        <li>Un expéditeur écrit à votre alias. Mailgun, notre prestataire d&apos;acheminement, reçoit le message dans sa région européenne.</li>
        <li>Mailgun le transmet à l&apos;API de Veilix, hébergée à Amsterdam, avec une signature que Veilix vérifie.</li>
        <li>Veilix retrouve l&apos;alias, applique vos blocages, les contrôles anti-usurpation (SPF, DKIM, DMARC) et anti-spam, puis déchiffre votre adresse de destination en mémoire.</li>
        <li>Si vous avez ajouté une clé PGP, le message est chiffré (PGP/MIME) avant d&apos;être relayé.</li>
        <li>Mailgun remet le message à votre boîte. Veilix ne garde que les compteurs et une empreinte anti-doublon de 3 jours.</li>
      </ol>

      <h2 id="prestataires">Nos prestataires et leurs propres journaux</h2>
      <p>Comme tout service en ligne, Veilix s&apos;appuie sur des prestataires qui tiennent leurs propres journaux techniques. Ils échappent au contrôle direct de Veilix, qui les limite par sa configuration : par exemple, le suivi des ouvertures et des clics est désactivé chez Mailgun.</p>
      <Table
        head={['Prestataire', 'Rôle', 'Localisation', 'Ce qu’il peut journaliser']}
        rows={[
          ['Railway', 'API et base de données', 'Union européenne (Amsterdam)', 'Requêtes HTTP (adresse IP, page demandée, navigateur), pour une durée fixée par Railway'],
          ['Vercel', 'Site veilix.fr', 'Fonctions à Paris, fichiers statiques servis par son réseau mondial', 'Requêtes vers le site, pour une durée fixée par Vercel'],
          ['Mailgun', 'Réception et envoi des e-mails', 'Région européenne', 'Messages le temps de leur remise, et événements (expéditeur, destinataire, statut) pour une durée fixée par son offre'],
          ['OVH', 'Nom de domaine et DNS', 'Union européenne', 'Résolution DNS'],
          ['Stripe', 'Paiements (à venir)', 'Selon Stripe', 'Données de paiement, que Veilix ne voit pas'],
        ]}
      />

      <h2 id="limites">Les limites, en toute honnêteté</h2>
      <ul>
        <li><strong>L&apos;e-mail n&apos;est pas chiffré de bout en bout par défaut.</strong> Pendant le relais, Mailgun et votre fournisseur de messagerie traitent le contenu. Le chiffrement PGP, disponible avec le Pack de lancement, chiffre le message avant sa remise dans votre boîte.</li>
        <li><strong>Veilix connaît le lien entre un alias et votre adresse</strong>, chiffré au repos, pour pouvoir relayer.</li>
        <li><strong>Le contenu peut vous identifier</strong> : une signature ou un nom dans le texte d&apos;une réponse reste visible par votre correspondant.</li>
        <li><strong>Votre fournisseur de messagerie voit les messages relayés</strong>, comme tous ceux que vous recevez.</li>
        <li><strong>Sans votre phrase de récupération, aucune récupération n&apos;est possible</strong> : Veilix ne la connaît pas.</li>
      </ul>

      <h2 id="controle">Vos données, sous votre contrôle</h2>
      <ul>
        <li>Supprimer un alias efface ses données associées : libellé, compteurs, expéditeurs bloqués, correspondants.</li>
        <li>Exporter vos données depuis <strong>Paramètres, Confidentialité et données</strong>.</li>
        <li>Supprimer votre compte depuis <strong>Paramètres, Actions dangereuses</strong> : clé, alias, adresses de destination et données associées sont effacés.</li>
        <li>Pour toute question : <a href="mailto:legal@veilix.fr">legal@veilix.fr</a>.</li>
      </ul>

      <h2 id="verifier">Vérifier par vous-même</h2>
      <p>Tout ce qui est décrit ici se vérifie dans le <a href="https://github.com/VeilixHQ/Veilix">code source de Veilix</a> : les tables de la base de données dans <code>Backend/app/models</code>, le chiffrement dans <code>Backend/app/core/encryption.py</code> et le relais dans <code>Backend/app/services/inbound_service.py</code>. Voir aussi la page <Link href="/securite">Sécurité</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.</p>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </ContentShell>
  )
}
