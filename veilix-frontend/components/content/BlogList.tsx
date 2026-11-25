import Link from 'next/link'
import { categoryColor, formatDate, getCategories, readingMinutes, slugify, type BlogPost } from '@/lib/blog'

export function CategoryLabel({ name }: { name: string }) {
  return <Link href={`/blog/categorie/${slugify(name)}`} className="blog-category" style={{ color: categoryColor(name) }}>{name}</Link>
}

export function BlogMeta({ post }: { post: BlogPost }) {
  return (
    <p className="blog-meta">
      <CategoryLabel name={post.category} />
      <time dateTime={post.published}>{formatDate(post.published)}</time>
      <span>{readingMinutes(post)} min de lecture</span>
    </p>
  )
}

export function BlogCard({ post, size = 'default' }: { post: BlogPost; size?: 'large' | 'default' | 'compact' }) {
  return (
    <article className={`blog-card blog-card-${size}`} style={{ borderTopColor: categoryColor(post.category) }}>
      <BlogMeta post={post} />
      {size === 'large' ? <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2> : <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>}
      {size !== 'compact' && <p>{post.description}</p>}
    </article>
  )
}

export function BlogList({ posts }: { posts: BlogPost[] }) {
  return <div className="blog-list">{posts.map(post => <BlogCard key={post.slug} post={post} />)}</div>
}

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return <div className="blog-grid">{posts.map(post => <BlogCard key={post.slug} post={post} size="compact" />)}</div>
}

export function BlogCategories({ active }: { active?: string }) {
  const categories = getCategories()
  if (categories.length < 2) return null
  return (
    <nav aria-label="Catégories" className="blog-filters">
      <Link href="/blog" aria-current={active ? undefined : 'page'}>Tous les articles</Link>
      {categories.map(c => (
        <Link key={c.slug} href={`/blog/categorie/${c.slug}`} aria-current={active === c.slug ? 'page' : undefined}>
          <span className="blog-dot" style={{ background: categoryColor(c.name) }} />{c.name} ({c.count})
        </Link>
      ))}
    </nav>
  )
}

export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages < 2) return null
  const href = (n: number) => (n === 1 ? base : `${base}/page/${n}`)
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
  return (
    <nav aria-label="Pagination" className="blog-pagination">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">← Plus récents</Link> : <span />}
      <span className="blog-pages">
        {numbers.map((n, i) => (
          <span key={n}>
            {i > 0 && n - numbers[i - 1] > 1 && <span className="blog-gap">…</span>}
            {n === page ? <span aria-current="page">{n}</span> : <Link href={href(n)}>{n}</Link>}
          </span>
        ))}
      </span>
      {page < pages ? <Link href={href(page + 1)} rel="next">Plus anciens →</Link> : <span />}
    </nav>
  )
}
