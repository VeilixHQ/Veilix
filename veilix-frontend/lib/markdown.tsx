import Link from 'next/link'
import type { ReactNode } from 'react'

const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g

type Block = { type: 'p' | 'ul' | 'ol' | 'quote' | 'h3'; lines: string[] }

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    const key = `${keyPrefix}-${index++}`
    if (match[2]) out.push(<strong key={key}>{match[2]}</strong>)
    else if (match[3]) out.push(<em key={key}>{match[3]}</em>)
    else if (match[4] && match[5]) {
      const href = match[5]
      if (href.startsWith('/') && !href.startsWith('//')) out.push(<Link key={key} href={href}>{match[4]}</Link>)
      else if (href.startsWith('https://')) out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{match[4]}</a>)
      else out.push(match[4])
    }
    last = start + match[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function lineType(line: string): Block['type'] {
  if (/^[-*] /.test(line)) return 'ul'
  if (/^\d+\. /.test(line)) return 'ol'
  if (line.startsWith('> ')) return 'quote'
  if (line.startsWith('### ')) return 'h3'
  return 'p'
}

function parse(source: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of source.replace(/\r/g, '').split(/\n{2,}/)) {
    for (const raw of chunk.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      const type = lineType(line)
      const previous = blocks[blocks.length - 1]
      if (previous && previous.type === type && type !== 'h3' && !previous.lines.includes('\u0000')) previous.lines.push(line)
      else blocks.push({ type, lines: [line] })
    }
    const last = blocks[blocks.length - 1]
    if (last) last.lines.push('\u0000')
  }
  return blocks.map(b => ({ ...b, lines: b.lines.filter(l => l !== '\u0000') }))
}

export function Markdown({ source }: { source: string }) {
  return (
    <>
      {parse(source).map((block, i) => {
        const key = `b${i}`
        if (block.type === 'ul') return <ul key={key}>{block.lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${key}-${j}`)}</li>)}</ul>
        if (block.type === 'ol') return <ol key={key}>{block.lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ''), `${key}-${j}`)}</li>)}</ol>
        if (block.type === 'quote') return <blockquote key={key} style={{ borderLeft: '3px solid #7c3aed', margin: '18px 0', padding: '4px 0 4px 16px', color: 'var(--c-cbd5e1, #cbd5e1)' }}>{inline(block.lines.map(l => l.slice(2)).join(' '), key)}</blockquote>
        if (block.type === 'h3') return <h3 key={key}>{inline(block.lines[0].slice(4), key)}</h3>
        return <p key={key}>{inline(block.lines.join(' '), key)}</p>
      })}
    </>
  )
}
