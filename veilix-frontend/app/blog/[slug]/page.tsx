import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentShell } from '@/components/content/ContentShell'
import { CATEGORY_LABELS, formatDate, getAllPosts, getPost } from '@/lib/blog'
import { Markdown } from '@/lib/markdown'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug)
  if (!post) return {}
  const base = pageMetadata({ path: `/blog/${post.slug}`, title: post.title, description: post.description })
  return { ...base, openGraph: { ...base.openGraph, publishedTime: post.published, modifiedTime: post.updated, tags: post.tags } }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)
  if (!post) notFound()
  const related = getAllPosts().filter(p => p.slug !== post.slug).slice(0, 3)
  const jsonLd = articleJsonLd({ path: `/blog/${post.slug}`, title: post.title, description: post.description, published: post.published, modified: post.updated, breadcrumb: 'Blog', faq: post.faq })

  return (
    <ContentShell breadcrumb="Blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p style={{ fontSize: 12, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, margin: '0 0 10px' }}>
        <Link href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link> · {CATEGORY_LABELS[post.category]}
      </p>
      <h1>{post.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>
        Publié le <time dateTime={post.published}>{formatDate(post.published)}</time>
        {post.updated !== post.published && <> · mis à jour le <time dateTime={post.updated}>{formatDate(post.updated)}</time></>}
        {' '}par l&apos;équipe Veilix
      </p>

      <div style={{ border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.08)', borderRadius: 14, padding: '16px 20px', margin: '18px 0 26px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 6px' }}>L&apos;essentiel</p>
        <p className="lead" style={{ margin: 0 }}>{post.summary}</p>
      </div>

      {post.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.heading}</h2>
          <Markdown source={section.body} />
        </section>
      ))}

      {post.checklist.length > 0 && (
        <>
          <h2 id="que-faire">Que faire maintenant ?</h2>
          <ol>{post.checklist.map((item, i) => <li key={i}>{item}</li>)}</ol>
        </>
      )}

      <h2 id="alias">Limiter l&apos;impact de la prochaine fuite</h2>
      <p>Une adresse e-mail utilisée partout est exposée à chaque fuite d&apos;un site où elle a servi. Avec un alias différent pour chaque site, une fuite n&apos;expose que l&apos;alias concerné : vous le désactivez, et votre adresse personnelle reste privée. C&apos;est exactement ce que fait <Link href="/alias-email-anonyme">Veilix</Link>.</p>
      <Link href="/beta" className="cta">Protéger mon adresse avec Veilix</Link>

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
      <ul>
        {post.sources.map(source => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.publisher ? ` (${source.publisher})` : ''}
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <>
          <h2 id="a-lire">À lire aussi</h2>
          <ul>{related.map(p => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>
        </>
      )}
    </ContentShell>
  )
}
