export const SITE_URL = 'https://veilix.fr'

type Faq = { q: string; a: string }

export function articleJsonLd({ path, title, description, published, modified, breadcrumb, faq }: { path: string; title: string; description: string; published: string; modified: string; breadcrumb: string; faq?: Faq[] }) {
  const url = `${SITE_URL}${path}`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: title,
      description,
      inLanguage: 'fr-FR',
      datePublished: published,
      dateModified: modified,
      mainEntityOfPage: url,
      image: `${SITE_URL}/opengraph-image.png`,
      author: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: breadcrumb, item: url },
      ],
    },
  ]
  if (faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }) {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: 'Veilix', type: 'article' as const, locale: 'fr_FR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image' as const, title, description },
  }
}
