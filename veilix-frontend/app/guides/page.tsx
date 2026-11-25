import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { VeilixCallout } from '@/components/content/GuideExtras'
import { BLOG_PATH, jsonLd } from '@/lib/blog'
import { CHECK_TOOL, GUIDES, GUIDES_PATH, LEAKS_LIST_PATH } from '@/lib/guides'
import { SITE_URL, pageMetadata } from '@/lib/seo'

const TITLE = 'Guides : se protéger des fuites de données'
const DESCRIPTION = "Nos guides pratiques pour réagir à une fuite de données : vérifier si votre e-mail a fuité, protéger votre IBAN, déjouer l'hameçonnage et les arnaques au téléphone."

export const metadata: Metadata = pageMetadata({ path: GUIDES_PATH, title: `${TITLE} | Veilix`, description: DESCRIPTION })

export default function Guides() {
  const items = [CHECK_TOOL, ...GUIDES]
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${GUIDES_PATH}`,
    inLanguage: 'fr-FR',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, url: `${SITE_URL}${item.path}`, name: item.title })),
    },
  }

  return (
    <ContentShell breadcrumb="Guides">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

      <h1>{TITLE}</h1>
      <p className="lead">Une fuite de données n&apos;est pas une fatalité. Ces guides expliquent, simplement et sans jargon, comment vérifier si vous êtes concerné et comment limiter les dégâts selon les données exposées.</p>

      {items.map(item => (
        <section key={item.key} style={{ borderTop: '1px solid rgba(var(--ink),0.07)', paddingTop: 20, marginTop: 20 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>
            <Link href={item.path} style={{ color: 'var(--c-f1f5f9)', textDecoration: 'none' }}>{item.title}</Link>
          </h2>
          <p>{item.description}</p>
        </section>
      ))}

      <h2 id="actualite">Suivre l&apos;actualité des fuites</h2>
      <p>Retrouvez <Link href={LEAKS_LIST_PATH}>la liste des fuites de données en France</Link> et nos <Link href={BLOG_PATH}>articles sur chaque nouvelle fuite</Link>.</p>

      <VeilixCallout />
    </ContentShell>
  )
}
