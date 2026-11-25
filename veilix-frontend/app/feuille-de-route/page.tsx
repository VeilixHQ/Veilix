import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/feuille-de-route'
const TITLE = 'Feuille de route de Veilix'
const DESCRIPTION = 'Ce qui est disponible sur Veilix, ce qui arrive bientôt et comment proposer une idée : domaines personnalisés, catch-all, lancement public.'
const UPDATED = '2026-11-25'

const AVAILABLE = [
  ['Alias à la demande', 'Une adresse aléatoire par site, avec libellé et tags.'],
  ['Relais des e-mails', 'Pièces jointes incluses, vers une ou plusieurs boîtes de destination.'],
  ["Réponse depuis l'alias", 'Vous répondez sans dévoiler votre adresse personnelle.'],
  ["Blocage d'expéditeurs", 'Par adresse ou par domaine entier, sous-domaines inclus.'],
  ['Statistiques et alertes de fuite', 'Messages transférés et bloqués par alias, alerte quand un alias fuite.'],
  ['Chiffrement PGP', 'Les e-mails relayés peuvent être chiffrés avec votre clé publique (PGP/MIME).'],
  ['Clés API', 'Créez et gérez vos alias par programme.'],
  ['Rapport hebdomadaire et export', "Résumé de l'activité de vos alias et export de vos données."],
]

const NEXT = [
  ['Domaines personnalisés', "Jusqu'à 3 domaines avec le Pack de lancement, pour choisir le nom de vos adresses."],
  ['Catch-all', "Toute adresse de votre domaine personnalisé devient un alias, sans la créer à l'avance."],
  ['Paiements en ligne', 'Abonnements et crédits réglés par carte, Google Pay ou Apple Pay, via Stripe.'],
  ['Lancement public', 'Fin de la bêta privée et ouverture des inscriptions à tous.'],
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Feuille de route | Veilix', description: DESCRIPTION })

function List({ items }: { items: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <tbody>{items.map(([name, desc]) => <tr key={name}><td style={{ width: '34%' }}><strong>{name}</strong></td><td>{desc}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export default function FeuilleDeRoute() {
  return (
    <ContentShell breadcrumb="Feuille de route">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Feuille de route' })) }} />

      <h1>Feuille de route</h1>
      <p className="lead">Veilix est en bêta privée. Voici ce qui fonctionne déjà, ce que nous préparons et comment vous pouvez influencer la suite.</p>
      <p className="updated">Mise à jour le 25 novembre 2026</p>

      <h2 id="disponible">Disponible aujourd&apos;hui</h2>
      <List items={AVAILABLE} />

      <h2 id="bientot">En préparation</h2>
      <List items={NEXT} />
      <p>Nous n&apos;annonçons pas de date tant qu&apos;une fonctionnalité n&apos;est pas prête : elle arrive quand elle est fiable. Les membres du Pack de lancement y ont accès en avant-première.</p>

      <h2 id="principes">Ce qui ne changera pas</h2>
      <ul>
        <li><strong>No Account</strong> : ni identifiant ni mot de passe.</li>
        <li><strong>No Logs</strong> : aucun journal d&apos;activité, aucun contenu conservé.</li>
        <li><strong>Open Source</strong> : tout ce qui tourne en production reste public.</li>
      </ul>

      <h2 id="idees">Proposer une idée</h2>
      <p>Une fonctionnalité vous manque ? Parlez-en sur notre <a href="https://discord.gg/Cfze5qmvhV">Discord</a>, ouvrez une demande sur <a href="https://github.com/VeilixHQ/Veilix">GitHub</a> ou écrivez-nous depuis la page <Link href="/contact">Contact</Link>.</p>
    </ContentShell>
  )
}
