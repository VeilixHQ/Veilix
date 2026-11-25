import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogCategories, BlogList, Pagination } from '@/components/content/BlogList'
import { ContentShell } from '@/components/content/ContentShell'
import { getAllPosts, getCategories, paginate, slugify } from '@/lib/blog'
import { pageMetadata } from '@/lib/seo'

export function findCategory(slug: string) {
  return getCategories().find(c => c.slug === slug)
}

export const INTROS: Record<string, string> = {
  'Fuite de données': 'Les fuites de données qui touchent des adresses e-mail et des informations personnelles : qui est concerné, quels risques, et comment réagir.',
  'Phishing et arnaques': 'Les campagnes de phishing et les arnaques en cours, et comment les reconnaître avant de cliquer.',
  'Vulnérabilité': 'Les failles de sécurité importantes dans les services et logiciels du quotidien, et les mises à jour à faire.',
  'Ransomware': 'Les attaques par rançongiciel, leurs conséquences pour les clients des entreprises touchées et les bons réflexes.',
  'Vie privée': 'Traçage, collecte de données, surveillance : comment garder la maîtrise de vos informations personnelles.',
  'Réglementation': 'RGPD, décisions de la CNIL, nouvelles lois : ce qui change pour la protection de vos données.',
  'Conseils pratiques': 'Des guides pas à pas pour sécuriser vos comptes, votre adresse e-mail et vos données personnelles.',
  'Récap de la semaine': 'Chaque dimanche, l’essentiel de la semaine en cybersécurité en quelques minutes de lecture.',
}

export async function categoryMetadata(slug: string, page: number): Promise<Metadata> {
  const category = findCategory(slug)
  if (!category) return {}
  const path = page > 1 ? `/blog/categorie/${category.slug}/page/${page}` : `/blog/categorie/${category.slug}`
  const suffix = page > 1 ? `, page ${page}` : ''
  const base = pageMetadata({ path, title: `${category.name} : articles et conseils${suffix} | Veilix`, description: INTROS[category.name] ?? `Tous les articles du blog Veilix sur le thème « ${category.name} ».` })
  return { ...base, openGraph: { ...base.openGraph, type: 'website' }, robots: category.count < 2 ? { index: false, follow: true } : undefined }
}

export function CategoryView({ slug, page }: { slug: string; page: number }) {
  const category = findCategory(slug)
  if (!category) notFound()
  const { items, pages } = paginate(getAllPosts().filter(p => slugify(p.category) === category.slug), page)
  if (page < 1 || page > pages) notFound()
  const base = `/blog/categorie/${category.slug}`
  return (
    <ContentShell breadcrumb={page > 1 ? `Page ${page}` : category.name} parents={page > 1 ? [{ href: '/blog', label: 'Blog' }, { href: base, label: category.name }] : [{ href: '/blog', label: 'Blog' }]}>
      <h1>{category.name}{page > 1 ? `, page ${page}` : ''}</h1>
      <p className="lead">{INTROS[category.name] ?? `${category.count} articles sur ce thème.`}</p>
      <BlogCategories active={category.slug} />
      <BlogList posts={items} />
      <Pagination base={base} page={page} pages={pages} />
    </ContentShell>
  )
}
