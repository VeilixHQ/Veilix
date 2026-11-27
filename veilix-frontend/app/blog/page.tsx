import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { CATEGORY_LABELS, formatDate, getAllPosts } from '@/lib/blog'
import { SITE_URL, pageMetadata } from '@/lib/seo'

const TITLE = 'Blog Veilix : fuites de données, piratages et protection e-mail'
const DESCRIPTION = "Les fuites de données et piratages qui exposent vos e-mails, expliqués avec leurs sources officielles, et les bons réflexes pour protéger votre adresse personnelle."

export const metadata: Metadata = {
  ...pageMetadata({ path: '/blog', title: TITLE, description: DESCRIPTION }),
  alternates: { canonical: '/blog', languages: { 'fr-FR': '/blog', en: '/en/blog', 'x-default': '/blog' }, types: { 'application/rss+xml': '/blog/rss.xml' } },
}

export default function BlogIndex() {
  const posts = getAllPosts()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    name: 'Blog Veilix',
    description: DESCRIPTION,
    url: `${SITE_URL}/blog`,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.published, dateModified: p.updated })),
  }

  return (
    <ContentShell breadcrumb="Blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>Fuites de données, piratages et protection de vos e-mails</h1>
      <p className="lead">Chaque article décrypte une fuite ou une attaque réelle à partir de ses sources officielles, explique ce qui a été exposé et donne les gestes concrets pour protéger votre adresse e-mail personnelle.</p>
      <p>Nous ne publions que lorsqu&apos;une actualité le justifie : pas d&apos;article de remplissage. Suivez le <a href="/blog/rss.xml">flux RSS</a> pour être prévenu. <Link href="/en/blog" hrefLang="en">English edition</Link>.</p>

      {posts.length === 0 ? (
        <p>Les premiers articles arrivent dès la prochaine actualité importante. En attendant, découvrez <Link href="/alias-email-anonyme">comment fonctionne un alias email anonyme</Link>.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 28 }}>
          {posts.map(post => (
            <article key={post.slug} style={{ border: '1px solid rgba(var(--ink),0.08)', borderRadius: 14, padding: '20px 22px' }}>
              <p style={{ fontSize: 12, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, margin: '0 0 8px' }}>
                {CATEGORY_LABELS[post.category]} · <time dateTime={post.published}>{formatDate(post.published)}</time>
              </p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20 }}><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p style={{ margin: 0 }}>{post.summary}</p>
            </article>
          ))}
        </div>
      )}

      <h2 id="essayer">Protéger votre adresse dès maintenant</h2>
      <p>Avec un alias différent pour chaque site, une fuite n&apos;expose que l&apos;alias concerné : vous le désactivez et votre adresse personnelle reste privée.</p>
      <Link href="/beta" className="cta">Rejoindre la bêta</Link>
    </ContentShell>
  )
}
