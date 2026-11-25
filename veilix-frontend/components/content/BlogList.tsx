import Link from 'next/link'
import { formatDate, getCategories, readingMinutes, slugify, type BlogPost } from '@/lib/blog'

export function BlogCategories({ active }: { active?: string }) {
  const categories = getCategories()
  if (categories.length < 2) return null
  return (
    <nav aria-label="Catégories" className="blog-filters">
      <Link href="/blog" aria-current={active ? undefined : 'page'}>Tous les articles</Link>
      {categories.map(c => (
        <Link key={c.slug} href={`/blog/categorie/${c.slug}`} aria-current={active === c.slug ? 'page' : undefined}>{c.name} ({c.count})</Link>
      ))}
    </nav>
  )
}

export function BlogList({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="blog-list">
      {posts.map(post => (
        <article key={post.slug} className="blog-card">
          <p className="blog-meta">
            <Link href={`/blog/categorie/${slugify(post.category)}`} className="blog-category">{post.category}</Link>
            <time dateTime={post.published}>{formatDate(post.published)}</time>
            <span>{readingMinutes(post)} min de lecture</span>
          </p>
          <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
          <p>{post.description}</p>
        </article>
      ))}
    </div>
  )
}
