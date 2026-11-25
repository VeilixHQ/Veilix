import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { BLOG_PATH, jsonLd } from '@/lib/blog'
import { LEAKS_LIST_PATH, METHOD_PATH } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const TITLE = 'Notre méthode : comment nous couvrons les fuites de données'
const DESCRIPTION = "Comment Veilix choisit, vérifie et rédige ses articles sur les fuites de données : sources, vérification des faits, mises à jour, corrections et indépendance."
const UPDATED = '2026-11-25'

export const metadata: Metadata = pageMetadata({ path: METHOD_PATH, title: 'Notre méthode éditoriale | Veilix', description: DESCRIPTION })

export default function Methode() {
  return (
    <ContentShell breadcrumb="Notre méthode" parent={{ href: BLOG_PATH, label: 'Blog' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: METHOD_PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Notre méthode', parent: { path: BLOG_PATH, label: 'Blog' } })) }} />

      <h1>{TITLE}</h1>
      <p className="lead">Veilix protège les adresses e-mail de ses utilisateurs. Notre blog a un seul objectif : aider chacun à réagir quand ses données ont fuité. Voici comment nous travaillons, sans rien cacher.</p>
      <p className="updated">Mise à jour le 25 novembre 2026</p>

      <h2 id="sujets">Les fuites que nous couvrons</h2>
      <p>Nous ne traitons que des fuites qui remplissent toutes ces conditions :</p>
      <ul>
        <li>elles touchent des personnes en France : organisation française, service public ou service très utilisé en France ;</li>
        <li>elles exposent des données personnelles de clients, d&apos;usagers ou d&apos;adhérents ;</li>
        <li>elles sont <strong>confirmées</strong> par l&apos;organisation elle-même, par une autorité (CNIL, ANSSI, police, justice) ou par au moins deux médias reconnus.</li>
      </ul>
      <p>Une simple revendication de pirates sur un forum ne suffit pas. Quand nous n&apos;avons pas de fuite confirmée, nous ne publions rien : nous préférons le silence à l&apos;approximation.</p>

      <h2 id="redaction">Comment nos articles sont produits</h2>
      <p>Pour publier vite, au moment où les personnes concernées cherchent des réponses, nos articles sont <strong>préparés avec l&apos;aide d&apos;une intelligence artificielle</strong>, encadrée par des règles strictes :</p>
      <ol>
        <li><strong>Recherche</strong> : les faits sont relevés dans le communiqué officiel de l&apos;organisation et dans au moins deux sources indépendantes, lues en entier.</li>
        <li><strong>Rédaction</strong> : l&apos;article ne peut contenir que des faits présents dans ces sources. Chaque information sensible est attribuée à sa source, et ce qui reste incertain est présenté comme tel.</li>
        <li><strong>Vérification</strong> : une relecture indépendante compare chaque fait, chiffre et date aux sources, corrige ce qui n&apos;y figure pas, et bloque la publication si la fuite n&apos;est pas assez confirmée.</li>
        <li><strong>Contrôles automatiques</strong> : sources accessibles et réellement consultées, au moins deux sites différents, pas de doublon avec un article existant.</li>
      </ol>
      <p>Les conseils pratiques de nos <Link href="/guides">guides</Link> et la section sur Veilix en fin d&apos;article sont, eux, écrits à la main par l&apos;équipe.</p>

      <h2 id="sources">Nos sources</h2>
      <p>Nous privilégions, dans l&apos;ordre : les communiqués et e-mails officiels des organisations touchées, les publications des autorités (CNIL, ANSSI, cybermalveillance.gouv.fr), puis les médias reconnus. Toutes les sources sont citées en bas de chaque article, avec un lien.</p>

      <h2 id="mises-a-jour">Mises à jour</h2>
      <p>Une fuite évolue : le nombre de victimes augmente, une plainte est déposée, la CNIL sanctionne. Nous suivons chaque fuite pendant un mois et mettons l&apos;article à jour quand un fait nouveau est confirmé. Chaque mise à jour est datée et résumée en haut de l&apos;article. La <Link href={LEAKS_LIST_PATH}>liste des fuites de données</Link> reprend ces informations.</p>

      <h2 id="corrections">Corrections</h2>
      <p>Une erreur, une information dépassée, une organisation qui souhaite apporter une précision ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a>. Nous vérifions et corrigeons rapidement, en indiquant la correction dans l&apos;article.</p>

      <h2 id="independance">Indépendance</h2>
      <p>Veilix ne vend pas de publicité et n&apos;est rémunéré par aucune des organisations dont nous parlons. Le blog sert à aider les personnes touchées et à faire connaître notre service : chaque article se termine par une courte présentation de Veilix, clairement séparée du reste. Nous ne mentionnons jamais Veilix dans le récit des faits ni dans les conseils.</p>
    </ContentShell>
  )
}
