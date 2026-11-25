import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogCard, BlogCategories, BlogGrid, BlogList, Pagination } from '@/components/content/BlogList'
import { BlogSearch } from '@/components/content/BlogSearch'
import { ContentShell } from '@/components/content/ContentShell'
import { getAllPosts, homeSections, paginate } from '@/lib/blog'
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
  const { featured, highlights, guides, recap, latest } = homeSections()
  const { items, pages } = paginate(latest, 1)
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
      <p className="updated"><a href="/blog/rss.xml">Flux RSS</a> · <a href="#methode">Notre méthode</a></p>

      {posts.length === 0 ? (
        <p>Le premier article arrive très bientôt.</p>
      ) : (
        <>
          <BlogSearch />
          <BlogCategories />

          <section aria-labelledby="une">
            <h2 id="une" className="blog-section-title">À la une</h2>
            <BlogCard post={featured} size="large" />
            {highlights.length > 0 && <BlogGrid posts={highlights} />}
          </section>

          {guides.length > 0 && (
            <section aria-labelledby="guides">
              <h2 id="guides" className="blog-section-title">Guides pratiques <Link href="/blog/categorie/conseils-pratiques" className="blog-section-link">Tous les guides →</Link></h2>
              <BlogGrid posts={guides} />
            </section>
          )}

          {recap && (
            <section aria-labelledby="recap">
              <h2 id="recap" className="blog-section-title">La semaine en bref <Link href="/blog/categorie/recap-de-la-semaine" className="blog-section-link">Tous les récaps →</Link></h2>
              <BlogCard post={recap} />
            </section>
          )}

          {items.length > 0 && (
            <section aria-labelledby="derniers">
              <h2 id="derniers" className="blog-section-title">Derniers articles</h2>
              <BlogList posts={items} />
              <Pagination base="/blog" page={1} pages={pages} />
            </section>
          )}
        </>
      )}

      <h2 id="methode">Notre méthode</h2>
      <ul>
        <li><strong>Des sources citées</strong> : chaque article s&apos;appuie sur des sources publiques, listées en fin d&apos;article, en privilégiant les sources officielles (CNIL, ANSSI, CERT-FR, cybermalveillance.gouv.fr) et les médias spécialisés.</li>
        <li><strong>Des faits vérifiés</strong> : chiffres, dates et noms sont contrôlés par rapport aux sources avant publication. Les revendications de pirates sont présentées au conditionnel.</li>
        <li><strong>Des conseils utiles</strong> : chaque article dit si vous êtes concerné et quoi faire concrètement.</li>
        <li><strong>Une indépendance assumée</strong> : Veilix édite ce blog. Nous mentionnons nos alias e-mail seulement lorsqu&apos;ils répondent vraiment au problème, et toujours avec d&apos;autres conseils.</li>
        <li><strong>Des corrections transparentes</strong> : une erreur ? Écrivez-nous depuis la page <Link href="/contact">Contact</Link>. Chaque correction est datée en haut de l&apos;article.</li>
      </ul>
    </ContentShell>
  )
}
