import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { CATEGORY_LABELS_EN, formatDate, getAllPosts } from '@/lib/blog'
import { SITE_URL, pageMetadata } from '@/lib/seo'

const TITLE = 'Veilix Blog: data breaches, hacks and email protection'
const DESCRIPTION = 'Data breaches and cyberattacks that expose your email address, explained from their official sources, with the right moves to keep your personal address private.'

export const metadata: Metadata = {
  ...pageMetadata({ path: '/en/blog', title: TITLE, description: DESCRIPTION }),
  alternates: { canonical: '/en/blog', languages: { en: '/en/blog', 'fr-FR': '/blog', 'x-default': '/blog' } },
}

export default function EnglishBlogIndex() {
  const posts = getAllPosts('en')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/en/blog#blog`,
    name: 'Veilix Blog',
    description: DESCRIPTION,
    url: `${SITE_URL}/en/blog`,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE_URL}/en/blog/${p.slug}`, datePublished: p.published, dateModified: p.updated })),
  }

  return (
    <ContentShell breadcrumb="Blog" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>Data breaches, hacks and email protection</h1>
      <p className="lead">Each article breaks down a real breach or attack from its official sources, explains what was exposed and gives concrete steps to protect your personal email address.</p>
      <p>We only publish when real news calls for it, never filler. Prefer French? Read the <Link href="/blog" hrefLang="fr">French edition</Link>.</p>

      {posts.length === 0 ? (
        <p>The first English articles are on their way. In the meantime, learn <Link href="/alias-email-anonyme">how an anonymous email alias works</Link>.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 28 }}>
          {posts.map(post => (
            <article key={post.slug} style={{ border: '1px solid rgba(var(--ink),0.08)', borderRadius: 14, padding: '20px 22px' }}>
              <p style={{ fontSize: 12, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, margin: '0 0 8px' }}>
                {CATEGORY_LABELS_EN[post.category]} · <time dateTime={post.published}>{formatDate(post.published, 'en')}</time>
              </p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20 }}><Link href={`/en/blog/${post.slug}`}>{post.title}</Link></h2>
              <p style={{ margin: 0 }}>{post.summary}</p>
            </article>
          ))}
        </div>
      )}

      <h2 id="try">Protect your address now</h2>
      <p>With a different alias for every site, a breach only exposes that alias: you switch it off and your personal address stays private.</p>
      <Link href="/beta" className="cta">Join the beta</Link>
    </ContentShell>
  )
}
