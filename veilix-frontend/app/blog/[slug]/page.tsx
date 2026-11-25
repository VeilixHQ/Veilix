import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentShell } from '@/components/content/ContentShell'
import { RichText } from '@/components/content/RichText'
import { BlogMeta, BlogGrid } from '@/components/content/BlogList'
import { BlogCta, BlogInlineCta } from '@/components/content/BlogCta'
import { adjacentPosts, formatDate, getAllPosts, getPost, plainText, relatedPosts, slugify } from '@/lib/blog'
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
    openGraph: { title: post.metaTitle, description: post.description, url: `/blog/${post.slug}`, siteName: 'Veilix', type: 'article', locale: 'fr_FR', publishedTime: post.published, modifiedTime: post.modified, section: post.category, tags: post.tags, images: [{ url: `/blog/${post.slug}/opengraph-image`, width: 1200, height: 630, alt: post.title }] },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPost((await params).slug)
  if (!post) notFound()
  const path = `/blog/${post.slug}`
  const related = relatedPosts(post)
  const faq = post.faq.map(item => ({ q: item.q, a: plainText(item.a) }))
  const { older, newer } = adjacentPosts(post)
  const inlineAfter = post.sections.length >= 4 ? Math.floor(post.sections.length / 2) : -1
  const anchors = post.sections.map(section => ({ heading: plainText(section.heading), id: slugify(plainText(section.heading)) }))

  return (
    <ContentShell breadcrumb="Article" parents={[{ href: '/blog', label: 'Blog' }, { href: `/blog/categorie/${slugify(post.category)}`, label: post.category }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd({ path, title: post.title, category: { name: post.category, path: `/blog/categorie/${slugify(post.category)}` }, description: post.description, published: post.published, modified: post.modified, keywords: post.tags, faq })) }} />

      <BlogMeta post={post} />
      <h1>{post.title}</h1>
      <p className="lead"><RichText text={post.lead} /></p>
      <p className="updated">Publié le {formatDate(post.published)}{post.modified !== post.published ? `, mis à jour le ${formatDate(post.modified)}` : ''} par l&apos;équipe Veilix</p>

      {post.takeaways.length > 0 && (
        <div className="note">
          <p><strong>L&apos;essentiel</strong></p>
          <ul>{post.takeaways.map(item => <li key={item}><RichText text={item} /></li>)}</ul>
        </div>
      )}

      {anchors.length >= 4 && (
        <nav aria-label="Sommaire" className="blog-toc">
          <p><strong>Sommaire</strong></p>
          <ol>{anchors.map(a => <li key={a.id}><a href={`#${a.id}`}>{a.heading}</a></li>)}</ol>
        </nav>
      )}

      {post.sections.map((section, i) => (
        <section key={section.heading}>
          <h2 id={anchors[i].id}>{section.heading}</h2>
          {section.paragraphs.map(text => <p key={text}><RichText text={text} /></p>)}
          {section.bullets.length > 0 && <ul>{section.bullets.map(item => <li key={item}><RichText text={item} /></li>)}</ul>}
          {i === inlineAfter && <BlogInlineCta post={post} />}
        </section>
      ))}

      <BlogCta post={post} />

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

      <h2 id="sources">Sources</h2>
      <ul className="blog-sources">
        {post.sources.map(source => (
          <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> ({source.publisher})</li>
        ))}
      </ul>

      {related.length > 0 && (
        <>
          <h2>À lire aussi</h2>
          <BlogGrid posts={related} />
        </>
      )}

      {(older || newer) && (
        <nav aria-label="Articles précédent et suivant" className="blog-adjacent">
          {older ? <Link href={`/blog/${older.slug}`}><span>← Article précédent</span>{older.title}</Link> : <span />}
          {newer ? <Link href={`/blog/${newer.slug}`} className="blog-adjacent-next"><span>Article suivant →</span>{newer.title}</Link> : <span />}
        </nav>
      )}
    </ContentShell>
  )
}
