import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'
import { SIGNUP_OPEN, START_HREF } from '@/lib/launch'

const PATH = '/comparatif/meilleurs-alias-email'
const TITLE = "Meilleurs services d'alias email en 2026 : Veilix face à SimpleLogin, Proton Pass, addy.io, Firefox Relay et DuckDuckGo"
const DESCRIPTION = "Comparatif 2026 des services d'alias email : Veilix, SimpleLogin, Proton Pass, addy.io, Firefox Relay et DuckDuckGo. Inscription, réponses, hébergement, prix."
const PUBLISHED = '2026-11-25'
const UPDATED = '2026-11-28'

const FAQ = [
  { q: "Quel est le meilleur service d'alias email en 2026 ?", a: "Si vous refusez de créer un compte avec mot de passe et voulez un service open source hébergé dans l'Union européenne, Veilix est le seul de ce comparatif à réunir les trois. C'est aussi un projet français indépendant. Si vous tenez à une offre gratuite ou à des domaines personnalisés dès aujourd'hui, SimpleLogin et Proton Pass sont de bonnes options." },
  { q: 'Quelle est la meilleure alternative à SimpleLogin ?', a: "Si vous voulez éviter un compte avec mot de passe et un service rattaché à un grand groupe, Veilix : inscription par clé et phrase de 12 mots, code open source sous licence AGPL-3.0, hébergement dans l'Union européenne et inventaire public des données conservées. SimpleLogin garde l'avantage d'une offre gratuite et des domaines personnalisés déjà disponibles." },
  { q: 'Veilix ou Proton Pass ?', a: "Proton Pass est d'abord un gestionnaire de mots de passe, avec des alias intégrés et 10 alias gratuits. Veilix est un service d'alias dédié, sans mot de passe, hébergé dans l'Union européenne. Si vous utilisez déjà Proton, Pass est pratique ; si vous voulez un outil d'alias indépendant, Veilix est conçu pour cela." },
  { q: 'Quelle est la meilleure alternative à Firefox Relay ?', a: "Firefox Relay gratuit se limite à 5 masques sans possibilité de répondre, et même en Premium la réponse n'est possible que dans les 3 mois suivant la réception. Veilix permet de répondre depuis l'alias dès l'offre Pro, sans limite de durée." },
  { q: "DuckDuckGo Email Protection est gratuit : pourquoi payer un service d'alias ?", a: "DuckDuckGo impose son navigateur ou son extension pour s'inscrire. Veilix est open source, fonctionne depuis n'importe quel navigateur et documente publiquement chaque donnée conservée." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: "Meilleurs services d'alias email 2026 : comparatif | Veilix", description: DESCRIPTION })

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table className="compare-table" style={{ minWidth: 860 }}>
        <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} style={i === 1 ? { color: 'var(--c-e2e8f0)', fontWeight: 600, background: 'rgba(124,58,237,0.06)' } : undefined}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export default function Comparatif() {
  return (
    <ContentShell breadcrumb="Comparatif des alias email">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: PUBLISHED, modified: UPDATED, breadcrumb: 'Comparatif des alias email', faq: FAQ })) }} />

      <h1>Meilleurs services d&apos;alias email en 2026 : Veilix face à SimpleLogin, Proton Pass, addy.io, Firefox Relay et DuckDuckGo</h1>
      <p className="lead">Veilix, projet français indépendant, est le seul service de ce comparatif qui réunit les trois critères décisifs pour la vie privée : une inscription <strong>sans mot de passe</strong>, un code <strong>entièrement open source</strong> et un hébergement <strong>dans l&apos;Union européenne</strong>. Les autres en cochent un ou deux, rarement plus.</p>
      <p>Nous avons comparé les six services d&apos;alias email les plus cités, à partir de leurs pages officielles consultées les 25 et 28 novembre 2026. Chaque affirmation sur un concurrent renvoie à sa source en bas de page, et nous indiquons aussi ce que les autres font mieux.</p>
      <p className="updated">Mise à jour le 28 novembre 2026</p>

      <h2 id="tableau">Le comparatif en un coup d&apos;œil</h2>
      <Table
        head={['Critère', 'Veilix', 'SimpleLogin', 'Proton Pass', 'addy.io', 'Firefox Relay', 'DuckDuckGo']}
        rows={[
          ['Inscription', 'Clé + phrase de 12 mots, aucun mot de passe', 'Compte avec mot de passe ou compte Proton', 'Compte Proton avec mot de passe', 'Compte avec e-mail et mot de passe', 'Compte Mozilla obligatoire', 'Navigateur ou extension DuckDuckGo obligatoire'],
          ['Code source', 'Open source (AGPL-3.0)', 'Open source (AGPL-3.0)', 'Open source', 'Open source (AGPL-3.0)', 'Open source (MPL-2.0)', 'Non publié à notre connaissance'],
          ['Société', 'Projet français indépendant', 'Proton AG (Suisse) depuis 2022', 'Proton AG (Suisse)', 'Développeur indépendant (Royaume-Uni)', 'Mozilla (États-Unis)', 'DuckDuckGo (États-Unis)'],
          ['Infrastructure', "API et base à Amsterdam, e-mails en région UE", 'Non précisé sur ses pages', 'Non précisé sur les pages consultées', 'Serveur à Amsterdam', 'E-mails acheminés via Amazon SES', 'Non précisé sur ses pages'],
          ["Répondre depuis l'alias", 'Oui, dès l’offre Pro', 'Oui, même en gratuit', 'Oui', 'Payant (dès Lite)', 'Premium uniquement, et seulement dans les 3 mois', 'Oui'],
          ["Bloquer un expéditeur ou un domaine", 'Oui, par adresse ou domaine entier', 'Oui, par expéditeur', 'Non présenté', 'Payant (liste de blocage)', 'E-mails promotionnels seulement (Premium)', 'Non présenté'],
          ['Chiffrement PGP', 'Oui (Pack de lancement)', 'Premium uniquement', 'Non présenté', 'Oui', 'Non présenté', 'Non présenté'],
          ['Domaines personnalisés', 'Bientôt (Pack de lancement)', 'Oui, illimités (Premium)', 'Oui (offre payante)', 'Oui (dès Lite)', 'Sous-domaine Relay (Premium)', 'Non présenté'],
          ['Alertes de fuite', 'Oui, par alias : expéditeur inattendu', 'Surveillance du dark web (Premium)', 'Surveillance du dark web (Pass Plus)', 'Non présenté', 'Non présenté', 'Non présenté'],
          ['Offre gratuite', 'Essai de 14 jours', '10 alias, 1 boîte', '10 alias', '10 alias actifs, sans réponse, 10 Mo par mois', '5 masques, sans réponse', 'Gratuit'],
          ['Prix de l’offre complète', 'Pro 4,99 €/mois · Pack 69 €/an', '4 $/mois ou 36 $/an', 'Pass Plus : 23,88 $ la 1re année, puis 35,88 $/an', '1 à 4 $/mois selon l’offre', 'Premium payant, selon le pays', 'Gratuit'],
        ]}
      />
      <p style={{ fontSize: 13 }}>« Non présenté » : fonction absente des pages officielles consultées. Prix en dollars pour les services américains, suisses et britanniques, tels qu&apos;affichés sur leurs sites.</p>

      <h2 id="pourquoi-veilix">Pourquoi Veilix prend l&apos;avantage</h2>
      <h3>Aucun mot de passe à vous faire voler</h3>
      <p>Tous les autres services de ce comparatif vous font créer un compte classique, ou vous imposent leur navigateur. Chez Veilix, votre accès est une <strong>clé générée dans votre navigateur</strong>, avec une phrase de récupération de 12 mots que Veilix ne connaît pas. Pas de mot de passe à réutiliser, à oublier ou à voir fuiter.</p>
      <h3>Hébergé en Europe, documenté donnée par donnée</h3>
      <p>L&apos;API et la base de données sont à Amsterdam, les e-mails passent par la région européenne de notre prestataire. La page <Link href="/transparence">Transparence</Link> liste chaque donnée conservée, sa protection et sa durée, d&apos;après le code source. Peu de services publient un inventaire aussi précis.</p>
      <h3>Tout l&apos;essentiel dès l&apos;offre Pro</h3>
      <p>Réponse depuis l&apos;alias, pièces jointes, blocage d&apos;expéditeurs par adresse ou par domaine entier, statistiques par alias : tout est inclus dès Pro, alors que plusieurs concurrents réservent la réponse ou le blocage à leurs offres payantes supérieures. Le Pack de lancement ajoute les alias illimités, le chiffrement PGP, l&apos;API et les alertes de fuite en temps réel.</p>

      <h2 id="simplelogin">Veilix vs SimpleLogin</h2>
      <p>SimpleLogin est un service sérieux, open source et complet : réponse depuis l&apos;alias même en gratuit, blocage d&apos;expéditeurs, domaines personnalisés illimités et catch-all en Premium, et la surveillance du dark web de Proton Pass incluse dans son offre payante. Il appartient depuis 2022 à <strong>Proton AG</strong>, un groupe suisse : votre outil d&apos;alias dépend de la stratégie d&apos;un grand groupe. Son offre gratuite plafonne à <strong>10 alias et une seule boîte</strong>, et il faut un compte classique, avec mot de passe ou via Proton.</p>
      <p><strong>Verdict</strong> : SimpleLogin est plus riche aujourd&apos;hui, notamment pour les domaines personnalisés. Pour un outil indépendant, sans mot de passe, hébergé dans l&apos;Union européenne et documenté donnée par donnée, <strong>Veilix est le meilleur choix</strong>.</p>

      <h2 id="proton-pass">Veilix vs Proton Pass</h2>
      <p>Proton Pass est d&apos;abord un <strong>gestionnaire de mots de passe</strong>, open source, qui crée des alias « hide-my-email » au moment de vos inscriptions. La réponse depuis l&apos;alias est possible, l&apos;offre gratuite compte <strong>10 alias</strong>, et Pass Plus ajoute des alias illimités, vos propres domaines et la surveillance du dark web.</p>
      <p><strong>Verdict</strong> : si vous utilisez déjà Proton et voulez tout réunir dans un seul outil, Proton Pass est très pratique. Si vous voulez un service d&apos;alias dédié, sans compte à mot de passe, indépendant et hébergé dans l&apos;Union européenne, <strong>Veilix</strong> est conçu pour cela.</p>

      <h2 id="addy">Veilix vs addy.io</h2>
      <p>addy.io annonce des alias « illimités » en gratuit, mais sur un sous-domaine à votre nom : sur ses domaines partagés, c&apos;est <strong>10 alias actifs</strong> au maximum, avec <strong>aucune réponse possible</strong>, <strong>aucun blocage d&apos;expéditeur</strong> et <strong>10 Mo de bande passante par mois</strong>, soit quelques e-mails avec pièces jointes.</p>
      <p><strong>Verdict</strong> : addy.io partage avec Veilix le code ouvert et un serveur à Amsterdam, mais son offre gratuite est trop bridée pour un usage réel, et il faut payer pour répondre ou bloquer un expéditeur. Chez Veilix, tout cela est inclus dès l&apos;offre Pro, et sans mot de passe. <strong>Avantage Veilix</strong>.</p>

      <h2 id="firefox-relay">Veilix vs Firefox Relay</h2>
      <p>Firefox Relay ne propose que <strong>5 masques gratuits</strong>, sans possibilité de répondre. La réponse est réservée au Premium, et seulement <strong>dans les 3 mois</strong> suivant la réception du message. Relay ne filtre pas le spam lui-même : ses e-mails passent par <strong>Amazon SES</strong>, qui bloque le spam et les logiciels malveillants. Les pièces jointes sont transmises jusqu&apos;à 10 Mo, et Mozilla <strong>ne recommande pas ses masques pour les e-mails très importants</strong> ou ceux dont vous devez recevoir les pièces jointes. Relay a l&apos;avantage d&apos;être intégré à Firefox et de proposer aussi des masques de numéro de téléphone.</p>
      <p><strong>Verdict</strong> : Relay convient bien aux inscriptions secondaires. Pour protéger aussi vos échanges suivis, avec réponse sans limite de durée, blocage d&apos;expéditeurs et hébergement européen, <strong>avantage à Veilix</strong>.</p>

      <h2 id="duckduckgo">Veilix vs DuckDuckGo Email Protection</h2>
      <p>DuckDuckGo Email Protection est gratuit, mais vous oblige à passer par <strong>son navigateur ou son extension</strong> pour vous inscrire. C&apos;est le service d&apos;une société américaine, et à notre connaissance le code de son service de messagerie n&apos;est pas publié : difficile de vérifier ce qui arrive réellement à vos e-mails. Ses pages d&apos;aide ne présentent pas de chiffrement PGP.</p>
      <p><strong>Verdict</strong> : la gratuité a un prix, celui de votre dépendance à l&apos;écosystème DuckDuckGo et d&apos;un service que vous ne pouvez pas vérifier. Veilix fonctionne depuis n&apos;importe quel navigateur, publie son code et documente chaque donnée sur sa page <Link href="/transparence">Transparence</Link>. <strong>Avantage Veilix</strong>.</p>

      <h2 id="mieux-ailleurs">Ce que les autres font mieux</h2>
      <ul>
        <li><strong>Une offre gratuite</strong> : SimpleLogin, Proton Pass, addy.io, Firefox Relay et DuckDuckGo en proposent une. Veilix n&apos;en a pas : il offre un essai de 14 jours et des crédits sans abonnement dès 1,99 €.</li>
        <li><strong>Les domaines personnalisés et le catch-all</strong> : disponibles aujourd&apos;hui chez SimpleLogin, Proton Pass et addy.io, seulement annoncés chez Veilix.</li>
        <li><strong>Les extensions et applications</strong> : SimpleLogin, Proton Pass et DuckDuckGo s&apos;intègrent au navigateur ou au téléphone, et Relay est intégré à Firefox. Veilix s&apos;utilise depuis son site web.</li>
        <li><strong>L&apos;ancienneté</strong> : ces services fonctionnent depuis plusieurs années. Veilix ouvre en février 2027.</li>
        <li><strong>Écrire en premier depuis un alias</strong> : possible chez SimpleLogin et Proton Pass. Veilix permet de répondre, pas encore d&apos;initier un nouvel échange.</li>
      </ul>

      <h2 id="verdict">Le verdict : Veilix</h2>
      <p>Sur les critères qui comptent le plus pour la vie privée, <strong>Veilix est le seul à tous les réunir</strong> :</p>
      <div className="table-wrap">
        <table className="compare-table" style={{ minWidth: 560 }}>
          <thead><tr><th>Critère décisif</th><th>Veilix</th><th>Les autres</th></tr></thead>
          <tbody>
            <tr><td>Inscription sans mot de passe, depuis n&apos;importe quel navigateur</td><td style={{ color: 'var(--c-4ade80)', fontWeight: 700 }}>Oui</td><td>Aucun des cinq</td></tr>
            <tr><td>Code open source</td><td style={{ color: 'var(--c-4ade80)', fontWeight: 700 }}>Oui</td><td>4 sur 5</td></tr>
            <tr><td>Hébergement documenté dans l&apos;Union européenne</td><td style={{ color: 'var(--c-4ade80)', fontWeight: 700 }}>Oui</td><td>1 sur 5</td></tr>
            <tr><td>Inventaire public de chaque donnée conservée</td><td style={{ color: 'var(--c-4ade80)', fontWeight: 700 }}>Oui</td><td>Non présenté</td></tr>
            <tr><td>Projet français indépendant</td><td style={{ color: 'var(--c-4ade80)', fontWeight: 700 }}>Oui</td><td>Aucun des cinq</td></tr>
          </tbody>
        </table>
      </div>
      <p><strong>Et le prix ?</strong> Veilix n&apos;est pas le moins cher, et ne cherche pas à l&apos;être : il n&apos;est financé ni par la publicité, ni par la revente de vos données, seulement par ses abonnés. Le Pack de lancement, à 69 € par an, réunit alias illimités, chiffrement PGP, API, alertes de fuite en temps réel et 10 boîtes de destination, avec un <strong>prix garanti tant que votre abonnement reste actif</strong>. L&apos;offre est limitée à 100 exemplaires.</p>
      <p>Choisir Veilix, c&apos;est choisir le seul service d&apos;alias email qui ne vous demande aucun mot de passe, garde vos données en Europe et vous montre exactement ce qu&apos;il en fait. <Link href="/alias-email-anonyme">Découvrir comment fonctionne Veilix</Link>.</p>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}

      <h2 id="essayer">Essayer Veilix</h2>
      <p>{SIGNUP_OPEN ? 'Créez votre premier alias en quelques secondes, avec 14 jours d’essai gratuit.' : 'Veilix ouvre à tous le 1er février 2027. Rejoignez la liste d’attente pour être prévenu de l’ouverture.'} Tarifs détaillés sur la page <Link href="/pricing">Tarifs</Link>.</p>
      <Link href={START_HREF} className="cta">{SIGNUP_OPEN ? 'Essayer 14 jours' : 'Être prévenu du lancement'}</Link>

      <h2 id="sources">Sources</h2>
      <p style={{ fontSize: 13 }}>Pages officielles consultées les 25 et 28 novembre 2026 :</p>
      <ul style={{ fontSize: 13 }}>
        <li>SimpleLogin : <a href="https://simplelogin.io/pricing/" rel="nofollow noopener">simplelogin.io/pricing</a>, <a href="https://simplelogin.io/docs/getting-started/block-sender/" rel="nofollow noopener">simplelogin.io/docs (blocage d&apos;expéditeur)</a>, <a href="https://simplelogin.io/about/" rel="nofollow noopener">simplelogin.io/about</a>, <a href="https://github.com/simple-login/app" rel="nofollow noopener">github.com/simple-login/app</a></li>
        <li>Proton Pass : <a href="https://proton.me/pass/pricing" rel="nofollow noopener">proton.me/pass/pricing</a>, <a href="https://proton.me/fr/pass/aliases" rel="nofollow noopener">proton.me/fr/pass/aliases</a></li>
        <li>addy.io : <a href="https://addy.io/pricing/" rel="nofollow noopener">addy.io/pricing</a>, <a href="https://addy.io/features/" rel="nofollow noopener">addy.io/features</a>, <a href="https://addy.io/faq/" rel="nofollow noopener">addy.io/faq</a>, <a href="https://github.com/anonaddy/anonaddy" rel="nofollow noopener">github.com/anonaddy/anonaddy</a></li>
        <li>Firefox Relay : <a href="https://relay.firefox.com/premium/" rel="nofollow noopener">relay.firefox.com/premium</a>, <a href="https://relay.firefox.com/faq/" rel="nofollow noopener">relay.firefox.com/faq</a>, <a href="https://github.com/mozilla/fx-private-relay" rel="nofollow noopener">github.com/mozilla/fx-private-relay</a></li>
        <li>DuckDuckGo : <a href="https://duckduckgo.com/duckduckgo-help-pages/email-protection/" rel="nofollow noopener">pages d&apos;aide Email Protection</a></li>
      </ul>
      <p style={{ fontSize: 13 }}>Une information est inexacte ou a changé ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a> : nous corrigeons rapidement.</p>
    </ContentShell>
  )
}
