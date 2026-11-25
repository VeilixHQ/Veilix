import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogCategories, BlogList } from '@/components/content/BlogList'
import { ContentShell } from '@/components/content/ContentShell'
import { getAllPosts } from '@/lib/blog'
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
      <p className="updated"><a href="/blog/rss.xml">Flux RSS</a> · <a href="#methode">Notre méthode</a></p>

      <BlogCategories />
      {posts.length === 0 ? <p>Le premier article arrive très bientôt.</p> : <BlogList posts={posts} />}

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
