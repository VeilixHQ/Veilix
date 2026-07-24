import { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const styles: Record<Variant, object> = {
  primary: {
    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
    color: '#fff', border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  danger: {
    background: 'transparent',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  ghost: {
    background: 'transparent',
    color: '#64748b',
    border: 'none',
  },
}

const sizes: Record<Size, object> = {
  sm: { padding: '5px 12px', fontSize: 12, borderRadius: 7 },
  md: { padding: '8px 16px', fontSize: 13, borderRadius: 8 },
  lg: { padding: '11px 22px', fontSize: 14, borderRadius: 9 },
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, style, ...props }: ButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      style={{
        fontWeight: 600, cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.6 : 1,
        transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
        ...styles[variant], ...sizes[size], ...style,
      }}
      {...props}
    >
      {loading ? 'Chargement...' : children}
    </button>
  )
}