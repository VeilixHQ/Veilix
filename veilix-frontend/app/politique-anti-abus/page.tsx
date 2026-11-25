import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/politique-anti-abus'
const TITLE = 'Politique anti-abus de Veilix'
const DESCRIPTION = "Usages interdits, limites d'envoi, contrôles automatiques et signalement : comment Veilix empêche que ses alias email servent au spam, à l'hameçonnage ou au harcèlement."
const UPDATED = '2026-11-25'

const FAQ = [
  { q: 'Comment signaler un abus venant d’un alias Veilix ?', a: "Écrivez à legal@veilix.fr en indiquant l'alias concerné, une description du problème et, si possible, le message reçu avec ses en-têtes complets." },
  { q: 'Veilix peut-il révéler qui se cache derrière un alias ?', a: "Non. Veilix ne connaît pas l'identité de ses utilisateurs. Il ne peut transmettre que les données dont il dispose, et uniquement sur réquisition judiciaire." },
  { q: 'Que se passe-t-il en cas d’abus confirmé ?', a: "L'alias concerné est désactivé et la clé du compte peut être suspendue, si possible après avertissement." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Politique anti-abus | Veilix', description: DESCRIPTION })

export default function PolitiqueAntiAbus() {
  return (
    <ContentShell breadcrumb="Politique anti-abus">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Politique anti-abus', faq: FAQ })) }} />

      <h1>Politique anti-abus</h1>
      <p className="lead">Un alias protège votre vie privée. Il ne doit jamais servir à nuire à quelqu&apos;un d&apos;autre. Cette page explique ce qui est interdit sur Veilix, comment le service limite les abus et comment nous signaler un problème.</p>
      <p className="updated">Mise à jour le 25 novembre 2026</p>

      <h2 id="interdit">Usages interdits</h2>
      <p>Il est interdit d&apos;utiliser Veilix pour :</p>
      <ul>
        <li>envoyer du <strong>spam</strong>, de l&apos;<strong>hameçonnage</strong> ou des <strong>logiciels malveillants</strong> ;</li>
        <li><strong>harceler</strong> une personne ou <strong>usurper une identité</strong> ;</li>
        <li><strong>contourner une interdiction</strong> prononcée par un site ou un service ;</li>
        <li>diffuser un <strong>contenu illégal</strong> ;</li>
        <li>perturber le service, contourner ses limites ou tenter d&apos;accéder aux données d&apos;autrui.</li>
      </ul>
      <p>Ces règles font partie des <Link href="/conditions-utilisation">conditions d&apos;utilisation</Link> que chaque utilisateur accepte à l&apos;inscription.</p>

      <h2 id="prevention">Ce que Veilix fait pour les prévenir</h2>
      <h3>Des limites d&apos;envoi</h3>
      <p>Le nombre de messages relayés est limité par alias et par compte, de même que le nombre de réponses envoyées depuis un alias. La création d&apos;alias est elle aussi limitée. Ces seuils protègent le service et sa réputation auprès des fournisseurs de messagerie, sans gêner un usage normal.</p>
      <h3>Des contrôles sur chaque message reçu</h3>
      <p>Avant d&apos;être relayé, chaque message passe par les contrôles anti-usurpation (SPF, DKIM, DMARC) et anti-spam. Les doublons sont écartés.</p>
      <h3>Une surveillance des rebonds et des plaintes</h3>
      <p>Les rebonds et les plaintes pour spam sont suivis. Lorsqu&apos;ils se répètent sur une adresse de destination, les envois vers celle-ci sont suspendus.</p>

      <h2 id="signaler">Signaler un abus</h2>
      <p>Si vous recevez du spam, une tentative d&apos;hameçonnage ou des messages de harcèlement venant d&apos;une adresse en <code>@alias.veilix.fr</code>, écrivez à <a href="mailto:legal@veilix.fr">legal@veilix.fr</a> en précisant :</p>
      <ul>
        <li>l&apos;<strong>alias</strong> concerné ;</li>
        <li>une <strong>description</strong> du problème ;</li>
        <li>si possible, le <strong>message reçu</strong> avec ses en-têtes complets.</li>
      </ul>
      <p>Pour une faille de sécurité dans Veilix lui-même, écrivez plutôt à <a href="mailto:security@veilix.fr">security@veilix.fr</a> (voir la page <Link href="/securite">Sécurité</Link>).</p>

      <h2 id="traitement">Notre traitement</h2>
      <p>Chaque signalement est examiné. En cas d&apos;abus confirmé, l&apos;alias concerné est <strong>désactivé</strong> et la clé du compte peut être <strong>suspendue</strong>, si possible après avertissement. Un alias désactivé ne relaie plus aucun message.</p>
      <div className="note">
        <p style={{ marginBottom: 0 }}>Veilix ne connaît pas l&apos;identité de ses utilisateurs et ne peut donc pas la révéler. Seules les données décrites sur la page <Link href="/transparence">Transparence</Link> peuvent être transmises, et uniquement sur réquisition judiciaire.</p>
      </div>

      <h2 id="autorites">Signalement aux autorités</h2>
      <p>Pour une infraction pénale, vous pouvez aussi contacter la police, la gendarmerie ou la plateforme <a href="https://www.internet-signalement.gouv.fr">PHAROS</a>.</p>

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
