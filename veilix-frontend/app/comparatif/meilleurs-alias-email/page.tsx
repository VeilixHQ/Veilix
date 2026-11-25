import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/comparatif/meilleurs-alias-email'
const TITLE = "Meilleurs services d'alias email en 2026 : Veilix face à SimpleLogin, addy.io, Firefox Relay et DuckDuckGo"
const DESCRIPTION = "Comparatif 2026 des services d'alias email : Veilix, SimpleLogin, addy.io, Firefox Relay et DuckDuckGo. Inscription, réponses, chiffrement, hébergement, prix."
const UPDATED = '2026-11-25'

const FAQ = [
  { q: "Quel est le meilleur service d'alias email en 2026 ?", a: "Si vous refusez de créer un compte avec mot de passe et voulez un service open source hébergé dans l'Union européenne, Veilix est le seul de ce comparatif à réunir les trois. SimpleLogin et addy.io restent de bonnes options open source, mais exigent un compte classique." },
  { q: 'Quelle est la meilleure alternative à SimpleLogin ?', a: "Veilix : inscription sans mot de passe par clé et phrase de 12 mots, réponse depuis l'alias, blocage d'expéditeurs, alertes de fuite, code open source sous licence AGPL-3.0 et hébergement dans l'Union européenne." },
  { q: 'Quelle est la meilleure alternative à Firefox Relay ?', a: "Firefox Relay gratuit se limite à 5 masques sans possibilité de répondre, et même en Premium la réponse n'est possible que dans les 3 mois suivant la réception. Veilix permet de répondre depuis l'alias dès l'offre Pro, sans limite de durée." },
  { q: "DuckDuckGo Email Protection est gratuit : pourquoi payer un service d'alias ?", a: "DuckDuckGo impose son navigateur ou son extension pour s'inscrire. Veilix est open source, fonctionne depuis n'importe quel navigateur et documente publiquement chaque donnée conservée." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: "Meilleurs services d'alias email 2026 : comparatif | Veilix", description: DESCRIPTION })

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table className="compare-table" style={{ minWidth: 720 }}>
        <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} style={i === 1 ? { color: 'var(--c-e2e8f0)', fontWeight: 600, background: 'rgba(124,58,237,0.06)' } : undefined}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export default function Comparatif() {
  return (
    <ContentShell breadcrumb="Comparatif des alias email">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Comparatif des alias email', faq: FAQ })) }} />

      <h1>Meilleurs services d&apos;alias email en 2026 : Veilix face à SimpleLogin, addy.io, Firefox Relay et DuckDuckGo</h1>
      <p className="lead">Veilix est le seul service de ce comparatif qui réunit les trois critères décisifs pour la vie privée : une inscription <strong>sans mot de passe</strong>, un code <strong>entièrement open source</strong> et un hébergement <strong>dans l&apos;Union européenne</strong>. Les autres en cochent un ou deux, rarement plus.</p>
      <p>Nous avons comparé les cinq services d&apos;alias email les plus cités, à partir de leurs pages officielles consultées le 25 novembre 2026. Chaque affirmation sur un concurrent renvoie à sa source en bas de page.</p>
      <p className="updated">Mise à jour le 25 novembre 2026</p>

      <h2 id="tableau">Le comparatif en un coup d&apos;œil</h2>
      <Table
        head={['Critère', 'Veilix', 'SimpleLogin', 'addy.io', 'Firefox Relay', 'DuckDuckGo']}
        rows={[
          ['Inscription', 'Clé + phrase de 12 mots, aucun mot de passe', 'Compte avec mot de passe ou compte Proton', 'Compte avec e-mail et mot de passe', 'Compte Mozilla obligatoire', 'Navigateur ou extension DuckDuckGo obligatoire'],
          ['Code source', 'Open source (AGPL-3.0)', 'Open source (AGPL-3.0)', 'Open source (AGPL-3.0)', 'Open source (MPL-2.0)', 'Non publié à notre connaissance'],
          ['Société', 'Projet indépendant', 'Proton AG (Suisse) depuis 2022', 'Développeur indépendant (Royaume-Uni)', 'Mozilla (États-Unis)', 'DuckDuckGo (États-Unis)'],
          ['Infrastructure', "API et base à Amsterdam, e-mails en région UE", 'Non précisé sur ses pages', 'Serveur à Amsterdam', 'E-mails acheminés via Amazon SES', 'Non précisé sur ses pages'],
          ["Répondre depuis l'alias", 'Oui, dès l’offre Pro', 'Oui, même en gratuit', 'Payant (dès Lite), 50 à 200 par jour', 'Premium uniquement, et seulement dans les 3 mois', 'Oui'],
          ["Bloquer un expéditeur ou un domaine", 'Oui, par adresse ou domaine entier', '—', 'Payant (dès Lite)', 'E-mails promotionnels seulement (Premium)', '—'],
          ['Chiffrement PGP', 'Oui (Pack de lancement)', 'Premium uniquement', 'Oui', 'Non présenté', 'Non présenté'],
          ['Alertes de fuite', 'Oui', '—', '—', '—', '—'],
          ['Offre gratuite', 'Essai de 14 jours', '10 alias, 1 boîte', '10 alias actifs, sans réponse, 10 Mo par mois', '5 masques, sans réponse', 'Gratuit'],
          ['Prix de l’offre complète', 'Pro 4,99 €/mois · Pack 69 €/an', '4 $/mois ou 36 $/an', '1 à 4 $/mois selon l’offre', 'Premium payant, selon le pays', 'Gratuit'],
        ]}
      />
      <p style={{ fontSize: 13 }}>« — » : fonction non présentée sur les pages officielles consultées. Prix en dollars pour les services américains, suisses et britanniques, tels qu&apos;affichés sur leurs sites.</p>

      <h2 id="pourquoi-veilix">Pourquoi Veilix prend l&apos;avantage</h2>
      <h3>Aucun mot de passe à vous faire voler</h3>
      <p>Tous les concurrents de ce comparatif vous font créer un compte classique, ou vous imposent leur navigateur. Chez Veilix, votre accès est une <strong>clé générée dans votre navigateur</strong>, avec une phrase de récupération de 12 mots que Veilix ne connaît pas. Pas de mot de passe à réutiliser, à oublier ou à voir fuiter.</p>
      <h3>Hébergé en Europe, documenté donnée par donnée</h3>
      <p>L&apos;API et la base de données sont à Amsterdam, les e-mails passent par la région européenne de notre prestataire. La page <Link href="/transparence">Transparence</Link> liste chaque donnée conservée, sa protection et sa durée, d&apos;après le code source. Peu de services publient un inventaire aussi précis.</p>
      <h3>Tout l&apos;essentiel dès l&apos;offre Pro</h3>
      <p>Réponse depuis l&apos;alias, pièces jointes, blocage d&apos;expéditeurs par adresse ou par domaine entier, statistiques par alias : tout est inclus dès Pro. Le Pack de lancement ajoute les alias illimités, le chiffrement PGP, l&apos;API et les alertes de fuite en temps réel.</p>

      <h2 id="simplelogin">Veilix vs SimpleLogin</h2>
      <p>SimpleLogin est un service sérieux et open source, mais il appartient depuis 2022 à <strong>Proton AG</strong>, un groupe suisse : votre outil d&apos;alias dépend désormais de la stratégie d&apos;un grand groupe. Son offre gratuite plafonne à <strong>10 alias et une seule boîte</strong>, et le chiffrement PGP est réservé au Premium. Surtout, il faut un compte classique, avec mot de passe ou via Proton.</p>
      <p><strong>À son crédit</strong> : la réponse depuis l&apos;alias est incluse gratuitement, et l&apos;écosystème Proton est complet.</p>

      <h2 id="addy">Veilix vs addy.io</h2>
      <p>addy.io annonce des alias « illimités » en gratuit, mais sur un sous-domaine à votre nom : sur ses domaines partagés, c&apos;est <strong>10 alias actifs</strong> au maximum, avec <strong>aucune réponse possible</strong>, <strong>aucun blocage d&apos;expéditeur</strong> et <strong>10 Mo de bande passante par mois</strong>, soit quelques e-mails avec pièces jointes. Même payant, les réponses restent plafonnées à 50 ou 200 par jour.</p>
      <p><strong>À son crédit</strong> : un code open source, un serveur à Amsterdam et le chiffrement PGP inclus dans toutes les offres.</p>

      <h2 id="firefox-relay">Veilix vs Firefox Relay</h2>
      <p>Firefox Relay ne propose que <strong>5 masques gratuits</strong>, sans possibilité de répondre. La réponse est réservée au Premium, et seulement <strong>dans les 3 mois</strong> suivant la réception du message. Relay ne filtre pas le spam lui-même, ses e-mails passent par <strong>Amazon SES</strong>, et Mozilla <strong>déconseille d&apos;utiliser ses masques pour les e-mails importants</strong> ou ceux dont vous devez recevoir les pièces jointes.</p>
      <p><strong>À son crédit</strong> : un code open source et la suppression des traceurs dans les e-mails.</p>

      <h2 id="duckduckgo">Veilix vs DuckDuckGo Email Protection</h2>
      <p>DuckDuckGo Email Protection est gratuit, mais vous oblige à passer par <strong>son navigateur ou son extension</strong> pour vous inscrire. C&apos;est le service d&apos;une société américaine, et à notre connaissance le code de son service de messagerie n&apos;est pas publié : difficile de vérifier ce qui arrive réellement à vos e-mails. Ses pages d&apos;aide ne présentent pas de chiffrement PGP.</p>
      <p><strong>À son crédit</strong> : la gratuité, des adresses illimitées et la suppression des traceurs.</p>

      <h2 id="choisir">Quel service choisir ?</h2>
      <ul>
        <li><strong>Vous voulez le maximum de confidentialité, sans mot de passe et en Europe</strong> : <Link href="/alias-email-anonyme">Veilix</Link>.</li>
        <li><strong>Vous êtes déjà abonné à Proton</strong> : SimpleLogin s&apos;intègre à votre écosystème.</li>
        <li><strong>Vous voulez un service gratuit sans engagement et acceptez un navigateur imposé</strong> : DuckDuckGo.</li>
      </ul>

      <h2 id="faq">Questions fréquentes</h2>
      {FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}

      <h2 id="essayer">Essayer Veilix</h2>
      <p>Veilix est en bêta. Rejoignez la liste d&apos;attente pour recevoir une invitation, et comparez par vous-même. Tarifs détaillés sur la page <Link href="/pricing">Tarifs</Link>.</p>
      <Link href="/beta" className="cta">Rejoindre la bêta</Link>

      <h2 id="sources">Sources</h2>
      <p style={{ fontSize: 13 }}>Pages officielles consultées le 25 novembre 2026 :</p>
      <ul style={{ fontSize: 13 }}>
        <li>SimpleLogin : <a href="https://simplelogin.io/pricing/" rel="nofollow noopener">simplelogin.io/pricing</a>, <a href="https://simplelogin.io/about/" rel="nofollow noopener">simplelogin.io/about</a>, <a href="https://github.com/simple-login/app" rel="nofollow noopener">github.com/simple-login/app</a></li>
        <li>addy.io : <a href="https://addy.io/pricing/" rel="nofollow noopener">addy.io/pricing</a>, <a href="https://addy.io/features/" rel="nofollow noopener">addy.io/features</a>, <a href="https://addy.io/faq/" rel="nofollow noopener">addy.io/faq</a>, <a href="https://github.com/anonaddy/anonaddy" rel="nofollow noopener">github.com/anonaddy/anonaddy</a></li>
        <li>Firefox Relay : <a href="https://relay.firefox.com/premium/" rel="nofollow noopener">relay.firefox.com/premium</a>, <a href="https://relay.firefox.com/faq/" rel="nofollow noopener">relay.firefox.com/faq</a>, <a href="https://github.com/mozilla/fx-private-relay" rel="nofollow noopener">github.com/mozilla/fx-private-relay</a></li>
        <li>DuckDuckGo : <a href="https://duckduckgo.com/duckduckgo-help-pages/email-protection/" rel="nofollow noopener">pages d&apos;aide Email Protection</a></li>
      </ul>
      <p style={{ fontSize: 13 }}>Une information est inexacte ou a changé ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a> : nous corrigeons rapidement.</p>
    </ContentShell>
  )
}
