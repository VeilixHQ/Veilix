'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useOnScreen } from '@/lib/hooks'
import { Translations } from '@/lib/translations'

export function TypewriterCTA({ t }: { t: Translations }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(ref)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [title, setTitle] = useState(t.ctaTitle)
  const split = Math.max(0, t.ctaTitle.lastIndexOf(t.ctaHighlight))
  const cursor = <span style={{ color: 'var(--c-a78bfa)', animation: 'blink 0.8s step-end infinite' }}>|</span>

  if (title !== t.ctaTitle) {
    setTitle(t.ctaTitle)
    setDisplayed('')
    setDone(false)
  }

  useEffect(() => {
    if (!visible || done) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(t.ctaTitle.slice(0, i))
      if (i >= t.ctaTitle.length) {
        clearInterval(id)
        setDone(true)
      }
    }, 38)
    return () => clearInterval(id)
  }, [visible, done, t.ctaTitle])

  return (
    <section ref={ref} style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'var(--c-060608)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.2 }}>
          <span>{displayed.slice(0, split)}{!done && displayed.length <= split && cursor}</span>
          {displayed.length > split && <span style={{ display: 'block', color: 'var(--c-a78bfa)' }}>{displayed.slice(split)}{!done && cursor}</span>}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--c-64748b)', marginBottom: 28, lineHeight: 1.7, opacity: done ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>{t.ctaSub}</p>
        <div style={{ opacity: done ? 1 : 0, transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s', transform: done ? 'translateY(0)' : 'translateY(8px)' }}>
          <Link href="/access" style={{ padding: '13px 28px', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', background: '#7c3aed', textDecoration: 'none', display: 'inline-block' }}>{t.ctaBtn}</Link>
        </div>
      </div>
    </section>
  )
}