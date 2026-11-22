'use client'
import { useEffect, useRef, useState } from 'react'
import { useOnScreen } from '@/lib/hooks'

export function BackToTop({ label }: { label: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const h = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title={label}
      style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 300, width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--c-a78bfa)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.2s', fontSize: 18 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)' }}
    >
      ↑
    </button>
  )
}

export function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(ref)
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
