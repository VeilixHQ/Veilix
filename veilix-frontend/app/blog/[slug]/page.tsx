import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentShell } from '@/components/content/ContentShell'
import { VeilixCallout } from '@/components/content/GuideExtras'
import { BLOG_PATH, formatDate, getPost, getPosts, jsonLd, sourceHost } from '@/lib/blog'
import { EXPOSED_LABELS, LEAKS_LIST_PATH, METHOD_PATH, guidesFor } from '@/lib/guides'
import { SITE_URL, articleJsonLd, pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const path = `${BLOG_PATH}/${post.slug}`
  const base = pageMetadata({ path, title: `${post.seoTitle} | Veilix`, description: post.description })
  const { images, ...openGraph } = base.openGraph
  void images
  return {
    ...base,
    openGraph: { ...openGraph, publishedTime: post.published, modifiedTime: post.modified, section: 'Fuites de données' },
    alternates: { ...base.alternates, types: { 'application/rss+xml': `${BLOG_PATH}/rss.xml` } },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const path = `${BLOG_PATH}/${post.slug}`
  const related = getPosts().filter(other => other.slug !== post.slug).slice(0, 3)
  const guides = guidesFor(post.exposed)
  const structured = articleJsonLd({
    path,
    title: post.title,
    description: post.description,
    published: post.published,
    modified: post.modified,
    breadcrumb: post.title,
    faq: post.faq,
    parent: { path: BLOG_PATH, label: 'Blog' },
    type: 'NewsArticle',
    image: `${SITE_URL}${path}/opengraph-image`,
    principles: `${SITE_URL}${METHOD_PATH}`,
  })

  return (
    <ContentShell breadcrumb={post.organization} parent={{ href: BLOG_PATH, label: 'Blog' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

      <h1>{post.title}</h1>
      <p className="lead">{post.lead}</p>
      <p className="updated">
        Publié le {formatDate(post.published)}
        {post.modified !== post.published && <> · mis à jour le {formatDate(post.modified)}</>}
        {' · '}<Link href={METHOD_PATH} style={{ color: 'var(--c-64748b)' }}>Notre méthode</Link>
      </p>

      <div className="table-wrap">
        <table>
          <tbody>
            <tr><td style={{ width: '38%' }}><strong>Organisation</strong></td><td>{post.organization}</td></tr>
            <tr><td><strong>Fuite révélée le</strong></td><td>{formatDate(post.revealed)}</td></tr>
            <tr><td><strong>Personnes concernées</strong></td><td>{post.affected}</td></tr>
            <tr><td><strong>Données exposées</strong></td><td>{post.exposed.map(item => EXPOSED_LABELS[item] ?? item).join(', ')}</td></tr>
          </tbody>
        </table>
      </div>

      {post.updates.length > 0 && (
        <div className="note">
          {[...post.updates].reverse().map(update => (
            <p key={`${update.date}-${update.text.slice(0, 20)}`}><strong>Mise à jour du {formatDate(update.date)}</strong> : {update.text}</p>
          ))}
        </div>
      )}

      {post.sections.map(section => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {section.bullets.length > 0 && (
            <ul>{section.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>
          )}
        </section>
      ))}

      <h2 id="que-faire">Ce qu&apos;il faut faire maintenant</h2>
      <ol>{post.actions.map((action, index) => <li key={index}>{action}</li>)}</ol>

      <h2 id="guides">Nos guides pour aller plus loin</h2>
      <ul>
        {guides.map(item => (
          <li key={item.key}><Link href={item.path}>{item.short}</Link></li>
        ))}
      </ul>

      <VeilixCallout />

      {post.faq.length > 0 && (
        <>
          <h2 id="faq">Questions fréquentes</h2>
          {post.faq.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </>
      )}

      <h2 id="sources">Sources</h2>
      <ul style={{ fontSize: 13 }}>
        {post.sources.map(source => (
          <li key={source.url}>
            <a href={source.url} rel="nofollow noopener noreferrer" target="_blank">{source.title}</a> ({sourceHost(source.url)})
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13 }}>Cet article suit <Link href={METHOD_PATH}>notre méthode éditoriale</Link>. Une information est inexacte ou a changé ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a> : nous corrigeons rapidement.</p>

      <h2 id="a-lire">À lire aussi</h2>
      <ul>
        {related.map(other => (
          <li key={other.slug}><Link href={`${BLOG_PATH}/${other.slug}`}>{other.title}</Link></li>
        ))}
        <li><Link href={LEAKS_LIST_PATH}>Toutes les fuites de données en France</Link></li>
      </ul>
    </ContentShell>
  )
}
