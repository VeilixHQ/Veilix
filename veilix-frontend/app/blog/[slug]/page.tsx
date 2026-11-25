import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentShell } from '@/components/content/ContentShell'
import { BLOG_PATH, formatDate, getPost, getPosts, jsonLd, sourceHost } from '@/lib/blog'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const base = pageMetadata({ path: `${BLOG_PATH}/${post.slug}`, title: `${post.seoTitle} | Veilix`, description: post.description })
  return { ...base, openGraph: { ...base.openGraph, publishedTime: post.published, modifiedTime: post.modified } }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const path = `${BLOG_PATH}/${post.slug}`
  const related = getPosts().filter(other => other.slug !== post.slug).slice(0, 3)
  const structured = articleJsonLd({
    path,
    title: post.title,
    description: post.description,
    published: post.published,
    modified: post.modified,
    breadcrumb: post.title,
    faq: post.faq,
    parent: { path: BLOG_PATH, label: 'Blog' },
    type: 'NewsArticle',
  })

  return (
    <ContentShell breadcrumb={post.organization} parent={{ href: BLOG_PATH, label: 'Blog' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

      <h1>{post.title}</h1>
      <p className="lead">{post.lead}</p>
      <p className="updated">
        Publié le {formatDate(post.published)}
        {post.modified !== post.published && <> · mis à jour le {formatDate(post.modified)}</>}
      </p>

      {post.sections.map(section => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {section.bullets.length > 0 && (
            <ul>{section.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>
          )}
        </section>
      ))}

      <h2 id="que-faire">Ce qu&apos;il faut faire maintenant</h2>
      <ol>{post.actions.map((action, index) => <li key={index}>{action}</li>)}</ol>

      <h2 id="eviter">Limiter les dégâts lors de la prochaine fuite</h2>
      <p>Une fuite comme celle-ci expose presque toujours votre adresse e-mail, qui sert ensuite au spam et au hameçonnage ciblé. La parade la plus simple : donner à chaque site une adresse différente, un <strong>alias</strong>, qui relaie les messages vers votre boîte personnelle.</p>
      <p>Si votre compte {post.organization} utilisait un alias plutôt que votre adresse personnelle, vous sauriez immédiatement d&apos;où viennent les messages suspects, et il suffirait de désactiver cet alias : votre vraie adresse resterait inconnue des fraudeurs.</p>
      <div className="note">
        <p><strong>C&apos;est ce que fait Veilix</strong> : un alias e-mail par site, sans mot de passe pour s&apos;inscrire, sans journal d&apos;activité, open source et hébergé en Europe. <Link href="/alias-email-anonyme">Découvrir comment ça marche</Link>.</p>
      </div>
      <Link href="/beta" className="cta">Rejoindre la bêta</Link>

      {post.faq.length > 0 && (
        <>
          <h2 id="faq">Questions fréquentes</h2>
          {post.faq.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </>
      )}

      <h2 id="sources">Sources</h2>
      <ul style={{ fontSize: 13 }}>
        {post.sources.map(source => (
          <li key={source.url}>
            <a href={source.url} rel="nofollow noopener noreferrer" target="_blank">{source.title}</a> ({sourceHost(source.url)})
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13 }}>Une information est inexacte ou a changé ? Écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a> : nous corrigeons rapidement.</p>

      {related.length > 0 && (
        <>
          <h2 id="a-lire">À lire aussi</h2>
          <ul>
            {related.map(other => (
              <li key={other.slug}><Link href={`${BLOG_PATH}/${other.slug}`}>{other.title}</Link></li>
            ))}
          </ul>
        </>
      )}
    </ContentShell>
  )
}
