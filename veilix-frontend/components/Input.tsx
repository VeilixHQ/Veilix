import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, style, ...props }, ref) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label htmlFor={props.id} style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-94a3b8)' }}>{label}</label>}
    <input
      ref={ref}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'var(--c-0d0d0d)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(var(--ink),0.08)'}`,
        borderRadius: 8, fontSize: 14, color: 'var(--c-f1f5f9)', outline: 'none',
        fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
        ...style,
      }}
      {...props}
    />
    {error && <span style={{ fontSize: 12, color: 'var(--c-f87171)' }}>{error}</span>}
  </div>
))

Input.displayName = 'Input'