'use client'
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Entry = { s: string; t: string; d: string; c: string; p: string; k: string }

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function BlogSearch() {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const loading = useRef(false)

  function load() {
    if (entries || loading.current) return
    loading.current = true
    fetch('/blog/recherche.json').then(r => r.json()).then(setEntries).catch(() => setEntries([])).finally(() => { loading.current = false })
  }

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(w => w.length > 1)
    if (!entries || !words.length) return []
    return entries
      .map(e => {
        const title = normalize(e.t)
        const rest = normalize(`${e.d} ${e.c} ${e.k}`)
        const score = words.reduce((total, w) => total + (title.includes(w) ? 3 : rest.includes(w) ? 1 : -100), 0)
        return { e, score }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score || (a.e.p < b.e.p ? 1 : -1))
      .slice(0, 8)
  }, [entries, query])

  return (
    <div className="blog-search">
      <label htmlFor="blog-search" className="sr-only">Rechercher un article</label>
      <input id="blog-search" type="search" placeholder="Rechercher un article : phishing, fuite, mot de passe…" value={query} onFocus={load} onChange={e => { load(); setQuery(e.target.value) }} autoComplete="off" />
      {query.trim().length > 1 && entries && (
        <ul className="blog-search-results" aria-live="polite">
          {results.length === 0 && <li className="blog-search-empty">Aucun article ne correspond à « {query} ».</li>}
          {results.map(({ e }) => (
            <li key={e.s}><Link href={`/blog/${e.s}`}><strong>{e.t}</strong><span>{e.c}</span></Link></li>
          ))}
        </ul>
      )}
    </div>
  )
}
