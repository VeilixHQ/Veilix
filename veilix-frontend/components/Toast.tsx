'use client'
import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

export function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const c = {
    success: { border: 'rgba(34,197,94,0.25)',  dot: 'var(--c-22c55e)' },
    error:   { border: 'rgba(239,68,68,0.25)',   dot: 'var(--c-f87171)' },
    info:    { border: 'rgba(124,58,237,0.25)',  dot: 'var(--c-a78bfa)' },
  }[type]

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: 'var(--c-111213)', border: `1px solid ${c.border}`,
      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideIn 0.25s ease', maxWidth: 320,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--c-cbd5e1)', fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-475569)', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>×</button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type })
  const hideToast = () => setToast(null)
  return { toast, showToast, hideToast }
}