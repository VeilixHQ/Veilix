'use client'
import { useEffect, useState } from 'react'
import { ApiError, BlockedSender, blockSender, getBlockedSenders, unblockSender } from '@/lib/api'
import { FT, errorMessage } from '@/lib/translations-features'
import type { Lang } from '@/lib/translations'

interface Props {
  lang: Lang
  aliasId: number
  aliasEmail: string
  onClose: () => void
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function BlockedSendersModal({ lang, aliasId, aliasEmail, onClose, onToast }: Props) {
  const t = FT[lang].blocked
  const [items, setItems] = useState<BlockedSender[] | null>(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getBlockedSenders(aliasId).then(list => { if (alive) setItems(list) }).catch(() => { if (alive) setItems([]) })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { alive = false; window.removeEventListener('keydown', onKey) }
  }, [aliasId, onClose])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true)
    try {
      const block = await blockSender(aliasId, value.trim())
      setItems(prev => [block, ...(prev || []).filter(item => item.id !== block.id)])
      setValue('')
      onToast(t.added, 'success')
    } catch (error) {
      onToast(errorMessage(lang, error instanceof ApiError ? error.message : null, FT[lang].settings.error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    try {
      await unblockSender(aliasId, id)
      setItems(prev => (prev || []).filter(item => item.id !== id))
      onToast(t.removed, 'info')
    } catch {
      onToast(FT[lang].settings.error, 'error')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="blocked-title" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-0d0d10)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 id="blocked-title" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: 'var(--c-f1f5f9)' }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--c-64748b)', lineHeight: 1.6, marginBottom: 18, wordBreak: 'break-word' }}>{t.sub(aliasEmail)}</p>
        <form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            autoComplete="off"
            spellCheck={false}
            style={{ flex: 1, minWidth: 0, padding: '10px 12px', background: 'var(--c-060608)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: 8, fontSize: 13, color: 'var(--c-f1f5f9)', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', outline: 'none' }}
          />
          <button type="submit" disabled={busy || !value.trim()} style={{ padding: '0 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--c-f87171)', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: !value.trim() ? 0.5 : 1 }}>
            {t.add}
          </button>
        </form>
        {items === null ? (
          <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{FT[lang].settings.loading}</p>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--c-64748b)', padding: '14px 0', textAlign: 'center' }}>{t.empty}</p>
        ) : (
          <ul style={{ listStyle: 'none', border: '1px solid rgba(var(--ink),0.06)', borderRadius: 10, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--ink),0.05)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--c-e2e8f0)', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sender}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-64748b)' }}>{t.count(item.blocked_count)}</div>
                </div>
                <button type="button" onClick={() => remove(item.id)} style={{ background: 'none', border: '1px solid rgba(var(--ink),0.1)', borderRadius: 7, padding: '5px 10px', fontSize: 12, color: 'var(--c-94a3b8)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{t.remove}</button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(var(--ink),0.08)', background: 'transparent', color: 'var(--c-94a3b8)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{t.close}</button>
      </div>
    </div>
  )
}
