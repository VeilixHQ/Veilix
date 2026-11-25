import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { BLOG_PATH, formatDate, getPosts, jsonLd } from '@/lib/blog'
import { EXPOSED_LABELS, Exposed, LEAKS_LIST_PATH, METHOD_PATH, guide } from '@/lib/guides'
import { SITE_URL, pageMetadata } from '@/lib/seo'

const MIN_INDEXED = 3

function year(): string {
  const posts = getPosts()
  return posts.length ? posts[0].revealed.slice(0, 4) : String(new Date().getFullYear())
}

export function generateMetadata(): Metadata {
  const posts = getPosts()
  const title = `Fuites de données en France : la liste ${year()} mise à jour | Veilix`
  const description = `Toutes les fuites de données qui touchent les Français en ${year()} : organisation, date, nombre de victimes et données exposées, avec ce qu'il faut faire pour chacune.`
  return {
    ...pageMetadata({ path: LEAKS_LIST_PATH, title, description }),
    ...(posts.length < MIN_INDEXED ? { robots: { index: false, follow: true } } : {}),
  }
}

export default function FuitesDeDonnees() {
  const posts = [...getPosts()].sort((a, b) => b.revealed.localeCompare(a.revealed) || b.published.localeCompare(a.published))
  const latest = posts.reduce((value, post) => (post.modified > value ? post.modified : value), posts[0]?.modified ?? '')
  const counts = new Map<Exposed, number>()
  for (const post of posts) {
    for (const item of post.exposed) counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  const byYear = new Map<string, typeof posts>()
  for (const post of posts) {
    const key = post.revealed.slice(0, 4)
    byYear.set(key, [...(byYear.get(key) ?? []), post])
  }
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Fuites de données en France : la liste ${year()}`,
    url: `${SITE_URL}${LEAKS_LIST_PATH}`,
    inLanguage: 'fr-FR',
    ...(latest ? { dateModified: latest } : {}),
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 50).map((post, index) => ({ '@type': 'ListItem', position: index + 1, url: `${SITE_URL}${BLOG_PATH}/${post.slug}`, name: post.title })),
    },
  }

  return (
    <ContentShell breadcrumb="Liste des fuites de données">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

      <h1>Fuites de données en France : la liste {year()}</h1>
      <p className="lead">Toutes les fuites de données qui touchent les Français, recensées et vérifiées à partir de sources officielles et de médias reconnus. Pour chacune : qui est concerné, quelles données ont été exposées et ce qu&apos;il faut faire.</p>
      {latest && <p className="updated">Mise à jour le {formatDate(latest)} · <Link href={METHOD_PATH} style={{ color: 'var(--c-64748b)' }}>Notre méthode</Link></p>}

      {posts.length === 0 ? (
        <p>Le recensement commence : les premières fuites apparaîtront ici dès leur publication.</p>
      ) : (
        <>
          <p><strong>{posts.length} fuite{posts.length > 1 ? 's' : ''} recensée{posts.length > 1 ? 's' : ''}</strong>{top.length > 0 && <>. Données les plus souvent exposées : {top.map(([item, count]) => `${EXPOSED_LABELS[item] ?? item} (${count})`).join(', ')}.</>}</p>
          {[...byYear.entries()].map(([key, items]) => (
            <section key={key}>
              <h2 id={`fuites-${key}`}>Fuites de données en {key}</h2>
              <div className="table-wrap">
                <table className="compare-table" style={{ minWidth: 640 }}>
                  <thead><tr><th>Révélée le</th><th>Organisation</th><th>Personnes concernées</th><th>Données exposées</th></tr></thead>
                  <tbody>
                    {items.map(post => (
                      <tr key={post.slug}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(post.revealed)}</td>
                        <td><Link href={`${BLOG_PATH}/${post.slug}`}>{post.organization}</Link></td>
                        <td>{post.affected}</td>
                        <td>{post.exposed.map(item => EXPOSED_LABELS[item] ?? item).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}

      <h2 id="concerne">Êtes-vous concerné ?</h2>
      <p>Vérifiez gratuitement si votre adresse apparaît dans une fuite connue avec <Link href={guide('verifier').path}>notre outil de vérification</Link>. Si c&apos;est le cas, suivez notre guide <Link href={guide('que-faire').path}>que faire après une fuite de données</Link>.</p>

      <h2 id="citer">Citer cette liste</h2>
      <p>Journalistes, blogueurs, enseignants : vous pouvez citer et reprendre cette liste librement, avec un lien vers cette page. Une fuite manque ou une information a changé ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a>.</p>

      <VeilixCallout />

      <OtherGuides current="liste" />
    </ContentShell>
  )
}
