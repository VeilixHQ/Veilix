type BadgeVariant = 'active' | 'disabled' | 'premium'

const variants = {
  active:   { bg: 'rgba(34,197,94,0.08)',   color: '#4ade80',  border: 'rgba(34,197,94,0.2)',   label: 'Actif' },
  disabled: { bg: 'rgba(100,116,139,0.08)', color: '#64748b',  border: 'rgba(100,116,139,0.2)', label: 'Inactif' },
  premium:  { bg: 'rgba(124,58,237,0.08)',  color: '#a78bfa',  border: 'rgba(124,58,237,0.2)',  label: 'Premium' },
}

export function Badge({ variant }: { variant: BadgeVariant }) {
  const v = variants[variant]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      letterSpacing: '0.3px',
    }}>
      {v.label}
    </span>
  )
}