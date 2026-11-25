import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { formatDate, getAllPosts, readingMinutes } from '@/lib/blog'
import { pageMetadata, SITE_URL } from '@/lib/seo'

const TITLE = 'Blog Veilix : actualité cybersécurité et vie privée'
const DESCRIPTION = "Fuites de données, failles, arnaques par e-mail : chaque jour, l'actualité de la cybersécurité expliquée simplement, avec des conseils pour protéger votre adresse e-mail."

export function generateMetadata(): Metadata {
  const base = pageMetadata({ path: '/blog', title: TITLE, description: DESCRIPTION })
  return {
    ...base,
    openGraph: { ...base.openGraph, type: 'website' },
    alternates: { canonical: '/blog', types: { 'application/rss+xml': [{ url: '/blog/rss.xml', title: 'Blog Veilix' }] } },
    robots: getAllPosts().length ? undefined : { index: false, follow: true },
  }
}

export default function BlogIndex() {
  const posts = getAllPosts()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    name: 'Blog Veilix',
    url: `${SITE_URL}/blog`,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.published })),
  }

  return (
    <ContentShell breadcrumb="Blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>Actualité cybersécurité et vie privée</h1>
      <p className="lead">Chaque jour, un fait marquant de la cybersécurité expliqué simplement : fuites de données, failles, campagnes de phishing, et ce que vous pouvez faire concrètement pour protéger votre adresse e-mail.</p>
      <p className="updated"><a href="/blog/rss.xml">Flux RSS</a></p>

      {posts.length === 0 && <p>Le premier article arrive très bientôt.</p>}

      <div className="blog-list">
        {posts.map(post => (
          <article key={post.slug} className="blog-card">
            <p className="blog-meta">
              <span className="blog-category">{post.category}</span>
              <time dateTime={post.published}>{formatDate(post.published)}</time>
              <span>{readingMinutes(post)} min de lecture</span>
            </p>
            <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
            <p>{post.description}</p>
          </article>
        ))}
      </div>
    </ContentShell>
  )
}
