import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentShell } from '@/components/content/ContentShell'
import { RichText } from '@/components/content/RichText'
import { formatDate, getAllPosts, getPost, plainText, readingMinutes, relatedPosts } from '@/lib/blog'
import { blogPostingJsonLd, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug)
  if (!post) return {}
  const base = pageMetadata({ path: `/blog/${post.slug}`, title: post.metaTitle, description: post.description })
  return {
    ...base,
    keywords: post.tags,
    openGraph: { ...base.openGraph, publishedTime: post.published, modifiedTime: post.modified, section: post.category, tags: post.tags },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPost((await params).slug)
  if (!post) notFound()
  const path = `/blog/${post.slug}`
  const related = relatedPosts(post)
  const faq = post.faq.map(item => ({ q: item.q, a: plainText(item.a) }))

  return (
    <ContentShell breadcrumb="Blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd({ path, title: post.title, description: post.description, published: post.published, modified: post.modified, keywords: post.tags, faq })) }} />

      <p className="blog-meta">
        <Link href="/blog" className="blog-category">{post.category}</Link>
        <time dateTime={post.published}>{formatDate(post.published)}</time>
        <span>{readingMinutes(post)} min de lecture</span>
      </p>
      <h1>{post.title}</h1>
      <p className="lead"><RichText text={post.lead} /></p>
      <p className="updated">Publié le {formatDate(post.published)}{post.modified !== post.published ? `, mis à jour le ${formatDate(post.modified)}` : ''} par l&apos;équipe Veilix</p>

      {post.takeaways.length > 0 && (
        <div className="note">
          <p><strong>L&apos;essentiel</strong></p>
          <ul>{post.takeaways.map(item => <li key={item}><RichText text={item} /></li>)}</ul>
        </div>
      )}

      {post.sections.map(section => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map(text => <p key={text}><RichText text={text} /></p>)}
          {section.bullets.length > 0 && <ul>{section.bullets.map(item => <li key={item}><RichText text={item} /></li>)}</ul>}
        </section>
      ))}

      {post.faq.length > 0 && (
        <>
          <h2>Questions fréquentes</h2>
          {post.faq.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p><RichText text={item.a} /></p>
            </details>
          ))}
        </>
      )}

      <h2>Sources</h2>
      <ul className="blog-sources">
        {post.sources.map(source => (
          <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> ({source.publisher})</li>
        ))}
      </ul>

      <div className="note">
        <p><strong>Protégez votre adresse e-mail avec Veilix</strong></p>
        <p>Un alias différent pour chaque site : si l&apos;un d&apos;eux fuit ou vous envoie du spam, vous le coupez, et votre adresse personnelle reste intacte. Sans mot de passe, open source et hébergé en Europe.</p>
        <Link href="/alias-email-anonyme" className="cta">Découvrir les alias email</Link>
      </div>

      {related.length > 0 && (
        <>
          <h2>À lire aussi</h2>
          <ul>
            {related.map(p => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}
          </ul>
        </>
      )}
    </ContentShell>
  )
}
