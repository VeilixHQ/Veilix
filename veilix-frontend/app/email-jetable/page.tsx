import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'
import { SIGNUP_OPEN, START_HREF } from '@/lib/launch'

const PATH = '/email-jetable'
const TITLE = 'Email jetable ou alias : lequel choisir pour protéger votre adresse ?'
const DESCRIPTION = "Mail jetable, email temporaire ou alias : à quoi sert chaque solution, leurs limites, et quand préférer un alias durable pour protéger votre adresse."
const PUBLISHED = '2026-11-28'
const UPDATED = '2026-11-28'

const FAQ = [
  { q: 'Comment créer une adresse mail jetable ?', a: "Il suffit d'ouvrir un service d'email temporaire : une adresse est générée immédiatement, sans inscription. Elle expire ensuite, ou reste accessible à quiconque connaît son nom selon le service. Pour un compte que vous comptez garder, préférez un alias." },
  { q: 'Une adresse mail jetable est-elle sécurisée ?', a: "Elle protège votre adresse personnelle, mais pas vos messages : sur de nombreux services, la boîte n'a pas de mot de passe et toute personne qui connaît l'adresse peut la lire. N'y recevez jamais de code de connexion, de facture ou de document personnel." },
  { q: 'Peut-on transformer une adresse jetable en vraie adresse ?', a: "Non. Une adresse jetable dépend du service qui l'a créée et de sa durée de vie. Si un compte important y est rattaché, changez l'adresse du compte dès que possible pour un alias ou votre adresse habituelle." },
  { q: 'Un alias est-il gratuit ?', a: "Certains services proposent quelques alias gratuits. Veilix est payant : 4,99 € par mois pour 100 alias, ou des crédits sans abonnement dès 1,99 € les 10 alias, avec un essai gratuit de 14 jours." },
  { q: 'Un site peut-il refuser un alias ?', a: "C'est possible : certains sites refusent les domaines d'alias ou d'adresses jetables qu'ils connaissent. Dans ce cas, utilisez votre adresse habituelle. Les domaines personnalisés, qui contournent ce problème, sont bientôt disponibles avec le Pack de lancement de Veilix." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Email jetable : limites et alternative durable | Veilix', description: DESCRIPTION })

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

export default function EmailJetable() {
  return (
    <ContentShell breadcrumb="Email jetable">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: PUBLISHED, modified: UPDATED, breadcrumb: 'Email jetable', faq: FAQ })) }} />

      <h1>Email jetable ou alias : lequel choisir pour protéger votre adresse ?</h1>
      <p className="lead">Un email jetable, ou adresse mail temporaire, sert à s&apos;inscrire quelque part sans donner sa vraie adresse. C&apos;est pratique pour un usage unique, mais risqué pour tout compte que vous comptez garder. L&apos;alias email répond au même besoin, en durable.</p>
      <p className="updated">Mise à jour le 28 novembre 2026</p>

      <h2 id="definition">Qu&apos;est-ce qu&apos;un email jetable ?</h2>
      <p>Un email jetable est une adresse créée en un instant, sans inscription, par un service d&apos;email temporaire. Vous la donnez à un site, vous lisez le message reçu (un lien de confirmation, un code), puis vous l&apos;oubliez.</p>
      <p>Selon le service, l&apos;adresse expire au bout de quelques minutes ou de quelques jours, ou reste ouverte sans mot de passe : toute personne qui connaît son nom peut alors lire les messages.</p>

      <h2 id="quand">Quand l&apos;email jetable suffit</h2>
      <ul>
        <li>Télécharger un document ou un livre blanc une seule fois.</li>
        <li>Obtenir un code de réduction ponctuel.</li>
        <li>Accéder à un wifi public qui demande une adresse.</li>
        <li>Tester un service que vous ne garderez pas.</li>
      </ul>
      <p>Dans ces cas, un service gratuit d&apos;email temporaire fait très bien l&apos;affaire.</p>

      <h2 id="limites">Les limites de l&apos;email jetable</h2>
      <ul>
        <li><strong>Messages perdus</strong> : une facture, une confirmation de commande ou une alerte de sécurité arrivée après l&apos;expiration ne vous parvient jamais.</li>
        <li><strong>Compte irrécupérable</strong> : si vous oubliez votre mot de passe, la réinitialisation part vers une adresse qui n&apos;existe plus.</li>
        <li><strong>Boîte souvent publique</strong> : sans mot de passe, quelqu&apos;un d&apos;autre peut lire vos messages et réinitialiser votre compte à votre place.</li>
        <li><strong>Domaines bloqués</strong> : de nombreux sites refusent les adresses des services jetables qu&apos;ils connaissent.</li>
        <li><strong>Réponse difficile</strong> : la plupart de ces services ne permettent pas de répondre, ou alors depuis une adresse que tout le monde peut utiliser.</li>
      </ul>

      <h2 id="alias">L&apos;alias, une adresse jetable qui dure</h2>
      <p>Un <Link href="/alias-email-anonyme">alias email</Link> garde l&apos;avantage principal de l&apos;adresse jetable (le site ne connaît pas votre adresse) sans ses inconvénients :</p>
      <ul>
        <li>il reste actif tant que vous le souhaitez et relaie les messages vers <strong>votre propre boîte</strong>, que vous seul lisez ;</li>
        <li>vous pouvez <strong>répondre</strong> depuis l&apos;alias sans révéler votre adresse ;</li>
        <li>vous le <strong>désactivez</strong> en un clic s&apos;il reçoit du spam ou s&apos;il fuite ;</li>
        <li>un alias par site vous montre <strong>qui a revendu ou laissé fuiter</strong> votre adresse.</li>
      </ul>

      <h2 id="comparatif">Email jetable, alias Gmail ou alias dédié : le comparatif</h2>
      <Table
        head={['Critère', 'Email jetable', 'Alias Gmail avec +', 'Alias dédié (Veilix)']}
        rows={[
          ['Durée de vie', 'Minutes à quelques jours', 'Permanente', 'Tant que vous le gardez actif'],
          ['Qui peut lire les messages', 'Souvent toute personne qui connaît l’adresse', 'Vous', 'Vous'],
          ['Adresse personnelle cachée', 'Oui', 'Non, elle reste lisible avant le +', 'Oui'],
          ['Répondre', 'Rarement', 'Oui, depuis votre adresse réelle', 'Oui, depuis l’alias'],
          ['Récupérer un compte', 'Impossible après expiration', 'Oui', 'Oui'],
          ['Couper les messages', 'Inutile, l’adresse expire', 'Par filtres', 'Désactivation en un clic'],
          ['Prix', 'Gratuit', 'Gratuit', 'Dès 1,99 € les 10 alias, ou 4,99 € par mois'],
        ]}
      />
      <p>Les services d&apos;email temporaire répondent bien au besoin ponctuel. Ils ne sont pas conçus pour les comptes que vous gardez : banque, administration, achats, réseaux sociaux.</p>

      <h2 id="choisir">Quelle solution choisir ?</h2>
      <ol>
        <li><strong>Usage unique et sans importance</strong> : un email jetable gratuit suffit.</li>
        <li><strong>Compte que vous garderez</strong> (boutique, newsletter, service en ligne) : un alias, pour pouvoir le couper plus tard sans perdre l&apos;accès.</li>
        <li><strong>Comptes sensibles</strong> (banque, impôts, santé) : votre adresse habituelle, protégée par un mot de passe fort et la double authentification.</li>
      </ol>
      <p>Les différences entre services d&apos;alias, dont SimpleLogin, Proton Pass et Firefox Relay, sont détaillées dans notre <Link href="/comparatif/meilleurs-alias-email">comparatif</Link>. Les prix de Veilix sont sur la page <Link href="/pricing">Tarifs</Link> : pour quelques comptes seulement, les crédits sans abonnement sont souvent le plus adapté.</p>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}

      <h2 id="essayer">Essayer Veilix</h2>
      <p>{SIGNUP_OPEN ? 'Créez votre premier alias en quelques secondes, avec 14 jours d’essai gratuit.' : 'Veilix ouvre à tous le 1er février 2027. Rejoignez la liste d’attente pour être prévenu de l’ouverture.'}</p>
      <Link href={START_HREF} className="cta">{SIGNUP_OPEN ? 'Essayer 14 jours' : 'Être prévenu du lancement'}</Link>
    </ContentShell>
  )
}
