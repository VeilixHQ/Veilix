import Link from 'next/link'
import { Fragment } from 'react'

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0
    if (start > last) parts.push(<Fragment key={index++}>{text.slice(last, start)}</Fragment>)
    if (match[1] && match[2]) {
      const href = match[2]
      if (href.startsWith('/')) parts.push(<Link key={index++} href={href}>{match[1]}</Link>)
      else if (href.startsWith('https://')) parts.push(<a key={index++} href={href} target="_blank" rel="noopener noreferrer">{match[1]}</a>)
      else parts.push(<Fragment key={index++}>{match[1]}</Fragment>)
    } else if (match[3]) {
      parts.push(<strong key={index++}>{match[3]}</strong>)
    }
    last = start + match[0].length
  }
  if (last < text.length) parts.push(<Fragment key={index++}>{text.slice(last)}</Fragment>)
  return <>{parts}</>
}
