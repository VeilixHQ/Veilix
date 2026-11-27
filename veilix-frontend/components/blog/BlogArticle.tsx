import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { CATEGORY_LABELS, CATEGORY_LABELS_EN, formatDate, type BlogLang, type BlogPost } from '@/lib/blog'
import { Markdown } from '@/lib/markdown'

const TEXT = {
  fr: {
    blog: 'Blog', blogHref: '/blog', published: 'Publié le', updated: 'mis à jour le', by: "par l'équipe Veilix", essential: "L'essentiel",
    todo: 'Que faire maintenant ?', aliasTitle: "Limiter l'impact de la prochaine fuite",
    alias: "Une adresse e-mail utilisée partout est exposée à chaque fuite d'un site où elle a servi. Avec un alias différent pour chaque site, une fuite n'expose que l'alias concerné : vous le désactivez, et votre adresse personnelle reste privée. C'est exactement ce que fait",
    cta: 'Protéger mon adresse avec Veilix', faq: 'Questions fréquentes', sources: 'Sources', related: 'À lire aussi', other: 'Read in English', otherPrefix: '/en/blog',
  },
  en: {
    blog: 'Blog', blogHref: '/en/blog', published: 'Published on', updated: 'updated on', by: 'by the Veilix team', essential: 'Key points',
    todo: 'What to do now', aliasTitle: 'Limit the damage of the next breach',
    alias: 'An email address used everywhere is exposed every time a site where it was used gets breached. With a different alias for each site, a breach only exposes that alias: you switch it off and your personal address stays private. That is exactly what',
    cta: 'Protect my address with Veilix', faq: 'Frequently asked questions', sources: 'Sources', related: 'Read next', other: 'Lire en français', otherPrefix: '/blog',
  },
} as const

export function BlogArticle({ post, lang, related, alternateSlug, jsonLd }: { post: BlogPost; lang: BlogLang; related: BlogPost[]; alternateSlug?: string; jsonLd: object }) {
  const t = TEXT[lang]
  const labels = lang === 'en' ? CATEGORY_LABELS_EN : CATEGORY_LABELS
  return (
    <ContentShell breadcrumb={t.blog} lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p style={{ fontSize: 12, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, margin: '0 0 10px' }}>
        <Link href={t.blogHref} style={{ color: 'inherit', textDecoration: 'none' }}>{t.blog}</Link> · {labels[post.category]}
      </p>
      <h1>{post.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>
        {t.published} <time dateTime={post.published}>{formatDate(post.published, lang)}</time>
        {post.updated !== post.published && <> · {t.updated} <time dateTime={post.updated}>{formatDate(post.updated, lang)}</time></>}
        {' '}{t.by}
        {alternateSlug && <> · <Link href={`${t.otherPrefix}/${alternateSlug}`} hrefLang={lang === 'fr' ? 'en' : 'fr'}>{t.other}</Link></>}
      </p>

      <div style={{ border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.08)', borderRadius: 14, padding: '16px 20px', margin: '18px 0 26px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 6px' }}>{t.essential}</p>
        <p className="lead" style={{ margin: 0 }}>{post.summary}</p>
      </div>

      {post.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.heading}</h2>
          <Markdown source={section.body} />
        </section>
      ))}

      {post.checklist.length > 0 && (
        <>
          <h2 id="que-faire">{t.todo}</h2>
          <ol>{post.checklist.map((item, i) => <li key={i}>{item}</li>)}</ol>
        </>
      )}

      <h2 id="alias">{t.aliasTitle}</h2>
      <p>{t.alias} <Link href="/alias-email-anonyme">Veilix</Link>.</p>
      <Link href="/beta" className="cta">{t.cta}</Link>

      {post.faq.length > 0 && (
        <>
          <h2 id="faq">{t.faq}</h2>
          {post.faq.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </>
      )}

      <h2 id="sources">{t.sources}</h2>
      <ul>
        {post.sources.map(source => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.publisher ? ` (${source.publisher})` : ''}
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <>
          <h2 id="a-lire">{t.related}</h2>
          <ul>{related.map(p => <li key={p.slug}><Link href={`${t.blogHref}/${p.slug}`}>{p.title}</Link></li>)}</ul>
        </>
      )}
    </ContentShell>
  )
}
