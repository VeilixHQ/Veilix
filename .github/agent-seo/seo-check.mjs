import { readFileSync } from 'node:fs'

import { existsSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const option = name => {
  const index = args.indexOf(name)
  return index >= 0 ? args.splice(index, 2)[1] : null
}
const baselinePath = option('--baseline')
const writeBaseline = option('--write-baseline')
const base = (args[0] || 'http://127.0.0.1:3000').replace(/\/$/, '')
const canonicalHost = args[1] || 'https://veilix.fr'
const guard = JSON.parse(readFileSync(new URL('./guard.json', import.meta.url), 'utf8'))
const errors = []
const warnings = []

const fail = (url, message) => errors.push(`${url} : ${message}`)
const warn = (url, message) => warnings.push(`${url} : ${message}`)

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return match ? (match[2] ?? match[3] ?? '') : ''
}

function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
}

function visibleText(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ')
}

async function fetchText(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'VeilixSeoCheck/1.0' }, signal: AbortSignal.timeout(30000) })
      return { status: response.status, text: response.status === 200 ? await response.text() : '' }
    } catch (error) {
      if (attempt === 3) return { status: 0, text: '', error: String(error.cause?.code || error.message) }
      await new Promise(resolve => setTimeout(resolve, attempt * 2000))
    }
  }
}

function toLocal(url) {
  return url.replace(canonicalHost, base)
}

async function checkPage(url) {
  const { status, text: html } = await fetchText(toLocal(url))
  if (status !== 200) return fail(url, `statut HTTP ${status}`)
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim()
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0])
  const meta = name => attr(metas.find(t => attr(t, 'name').toLowerCase() === name || attr(t, 'property').toLowerCase() === name) || '', 'content')
  const description = meta('description')
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => attr(t, 'rel').toLowerCase() === 'canonical')
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : ''
  const h1 = (html.match(/<h1\b/gi) || []).length
  const robots = meta('robots').toLowerCase()

  if (!title) fail(url, 'balise title absente')
  else if (title.length < 25 || title.length > 65) warn(url, `title de ${title.length} caractères`)
  if (!description) fail(url, 'meta description absente')
  else if (description.length < 70 || description.length > 165) warn(url, `description de ${description.length} caractères`)
  if (!canonical) fail(url, 'canonical absent')
  else if (new URL(canonical, canonicalHost).href.replace(/\/$/, '') !== url.replace(/\/$/, '')) fail(url, `canonical ${canonical} différent de l'URL`)
  if (h1 === 0) fail(url, 'aucun h1')
  if (h1 > 1) warn(url, `${h1} balises h1`)
  if (robots.includes('noindex')) fail(url, 'page du sitemap en noindex')
  if (!meta('og:title') || !meta('og:image')) warn(url, 'Open Graph incomplet')

  for (const block of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block[1])
    } catch {
      fail(url, 'JSON-LD invalide')
    }
  }

  const text = visibleText(html)
  const words = (text.match(/[\p{L}\p{N}]+/gu) || []).length
  if (words < 300) warn(url, `contenu court (${words} mots)`)
  for (const rule of guard.forbidden) {
    if (new RegExp(rule.pattern, 'iu').test(text)) fail(url, `affirmation interdite (${rule.id}) : ${rule.reason}`)
  }
  for (const pattern of guard.signatures) {
    if (new RegExp(pattern, 'iu').test(text)) fail(url, `signature interdite (${pattern})`)
  }

  const links = new Set()
  for (const a of html.matchAll(/<a\b[^>]*href=("([^"]*)"|'([^']*)')/gi)) {
    const href = a[2] ?? a[3] ?? ''
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    const absolute = new URL(href, url)
    if (absolute.origin === new URL(canonicalHost).origin) links.add(absolute.href.split('#')[0])
  }
  return links
}

const sitemapResponse = await fetchText(`${base}/sitemap.xml`)
if (sitemapResponse.status !== 200) {
  console.error(`ERREUR sitemap.xml : statut ${sitemapResponse.status}`)
  process.exit(1)
}
const urls = [...sitemapResponse.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim())
if (urls.length === 0) fail('sitemap.xml', 'aucune URL')
for (const required of ['robots.txt', 'llms.txt']) {
  const { status } = await fetchText(`${base}/${required}`)
  if (status !== 200) fail(required, `statut HTTP ${status}`)
}

const internal = new Set()
for (const url of urls) {
  const links = await checkPage(url)
  if (links) links.forEach(l => internal.add(l))
}
const known = new Set(urls.map(u => u.replace(/\/$/, '')))
for (const link of internal) {
  if (known.has(link.replace(/\/$/, ''))) continue
  const path = new URL(link).pathname
  if (/^\/(dashboard|settings|admin|access|confirm|api)/.test(path) || /\.(png|jpg|svg|txt|xml|pdf)$/.test(path)) continue
  const { status } = await fetchText(toLocal(link))
  if (status >= 400) fail(link, `lien interne cassé (${status})`)
}

if (writeBaseline) writeFileSync(writeBaseline, JSON.stringify(errors, null, 2))
const known_errors = baselinePath && existsSync(baselinePath) ? new Set(JSON.parse(readFileSync(baselinePath, 'utf8'))) : new Set()
const blocking = errors.filter(e => !known_errors.has(e))
const inherited = errors.filter(e => known_errors.has(e))
console.log(`Pages vérifiées : ${urls.length}`)
for (const w of warnings) console.log(`AVERTISSEMENT ${w}`)
for (const e of inherited) console.log(`EXISTANT ${e}`)
for (const e of blocking) console.log(`ERREUR ${e}`)
console.log(blocking.length ? `ÉCHEC : ${blocking.length} erreur(s) bloquante(s) introduite(s)` : 'SUCCÈS : aucune nouvelle erreur bloquante')
process.exit(blocking.length ? 1 : 0)
