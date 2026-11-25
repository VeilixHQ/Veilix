import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { BLOG_PATH, formatDate, getPosts, jsonLd } from '@/lib/blog'
import { CHECK_TOOL, GUIDES_PATH, LEAKS_LIST_PATH, METHOD_PATH } from '@/lib/guides'
import { SITE_URL, pageMetadata } from '@/lib/seo'

const TITLE = 'Fuites de données : actualité et bons réflexes'
const DESCRIPTION = "Les fuites de données qui touchent les Français, expliquées simplement : ce qui a fuité, comment savoir si vous êtes concerné et que faire tout de suite."

const BASE = pageMetadata({ path: BLOG_PATH, title: `${TITLE} | Veilix`, description: DESCRIPTION })

export const metadata: Metadata = {
  ...BASE,
  openGraph: { ...BASE.openGraph, type: 'website' },
  alternates: { ...BASE.alternates, types: { 'application/rss+xml': `${BLOG_PATH}/rss.xml` } },
  ...(getPosts().length === 0 ? { robots: { index: false, follow: true } } : {}),
}

export default function Blog() {
  const posts = getPosts()
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}${BLOG_PATH}#blog`,
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${BLOG_PATH}`,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 20).map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}${BLOG_PATH}/${post.slug}`,
      datePublished: post.published,
    })),
  }

  return (
    <ContentShell breadcrumb="Blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

      <h1>{TITLE}</h1>
      <p className="lead">Chaque fuite de données expose des millions d&apos;adresses e-mail, de numéros et parfois d&apos;IBAN. Nous expliquons chacune simplement, à partir de sources vérifiées : ce qui a fuité, comment savoir si vous êtes touché et ce qu&apos;il faut faire tout de suite.</p>
      <p>Vous voulez savoir si vous êtes concerné ? <Link href={CHECK_TOOL.path}>Vérifiez votre adresse e-mail</Link>, consultez <Link href={LEAKS_LIST_PATH}>la liste des fuites de données</Link> ou nos <Link href={GUIDES_PATH}>guides pratiques</Link>. <Link href={METHOD_PATH}>Notre méthode</Link> explique comment nous vérifions chaque information.</p>

      {posts.length === 0 ? (
        <p>Les premiers articles arrivent très bientôt.</p>
      ) : (
        posts.map(post => (
          <section key={post.slug} style={{ borderTop: '1px solid rgba(var(--ink),0.07)', paddingTop: 22, marginTop: 22 }}>
            <p style={{ fontSize: 13, color: 'var(--c-64748b)', marginBottom: 6 }}>{formatDate(post.published)}</p>
            <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>
              <Link href={`${BLOG_PATH}/${post.slug}`} style={{ color: 'var(--c-f1f5f9)', textDecoration: 'none' }}>{post.title}</Link>
            </h2>
            <p>{post.description}</p>
          </section>
        ))
      )}

      <h2 id="se-proteger">Se protéger avant la prochaine fuite</h2>
      <p>La plupart des fuites exposent votre adresse e-mail, ensuite réutilisée pour du spam et du hameçonnage. Avec un alias différent pour chaque site, vous savez immédiatement qui a fuité et vous coupez l&apos;adresse concernée, sans toucher à votre adresse personnelle. <Link href="/alias-email-anonyme">Comprendre les alias e-mail</Link>.</p>
      <Link href="/beta" className="cta">Rejoindre la bêta de Veilix</Link>
    </ContentShell>
  )
}
