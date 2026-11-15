'use client'

export type BadgeId = 'pionnier' | 'eclaireur' | 'fondateur'

export type AccountBadge = { id: BadgeId; number: number | null }

const BADGE_INFO: Record<BadgeId, { name: string; detail: string }> = {
  pionnier: { name: 'Pionnier', detail: 'Bêta privée · 15 exemplaires' },
  eclaireur: { name: 'Éclaireur', detail: 'Bêta publique · 30 exemplaires' },
  fondateur: { name: 'Fondateur', detail: 'Pack de lancement · 100 exemplaires' },
}

const FONT = 'Space Grotesk, Inter, sans-serif'

export function badgeTitle(badge: AccountBadge) {
  const info = BADGE_INFO[badge.id]
  const number = badge.number ? ` n°${String(badge.number).padStart(3, '0')}` : ''
  return { name: `${info.name}${number}`, detail: info.detail }
}

export function BadgeDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="vx-c-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5f3ff" /><stop offset="1" stopColor="#c4b5fd" /></linearGradient>
        <linearGradient id="vx-c-light2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ddd6fe" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
        <linearGradient id="vx-c-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a5b4fc" /><stop offset="1" stopColor="#6d28d9" /></linearGradient>
        <linearGradient id="vx-c-mid2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#7c3aed" /></linearGradient>
        <linearGradient id="vx-c-dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5b21b6" /><stop offset="1" stopColor="#2e1065" /></linearGradient>
        <linearGradient id="vx-c-dark2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d28d9" /><stop offset="1" stopColor="#3b0764" /></linearGradient>
        <radialGradient id="vx-c-table" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#ede9fe" /><stop offset="0.35" stopColor="#a78bfa" /><stop offset="0.8" stopColor="#6d28d9" /><stop offset="1" stopColor="#4c1d95" /></radialGradient>

        <linearGradient id="vx-s-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd" /><stop offset="0.35" stopColor="#38bdf8" /><stop offset="0.75" stopColor="#0369a1" /><stop offset="1" stopColor="#0c4a6e" /></linearGradient>
        <linearGradient id="vx-s-inner" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0c4a6e" /><stop offset="1" stopColor="#082f49" /></linearGradient>
        <linearGradient id="vx-s-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0f9ff" /><stop offset="1" stopColor="#7dd3fc" stopOpacity="0.3" /></linearGradient>
        <linearGradient id="vx-s-mark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#bae6fd" /></linearGradient>

        <radialGradient id="vx-g-base" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fef3c7" /><stop offset="0.3" stopColor="#fcd34d" /><stop offset="0.7" stopColor="#d97706" /><stop offset="1" stopColor="#92400e" /></radialGradient>
        <linearGradient id="vx-g-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="0.5" stopColor="#b45309" /><stop offset="1" stopColor="#78350f" /></linearGradient>
        <radialGradient id="vx-g-field" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stopColor="#fbbf24" /><stop offset="0.7" stopColor="#d97706" /><stop offset="1" stopColor="#b45309" /></radialGradient>
        <linearGradient id="vx-g-text" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffbeb" /><stop offset="1" stopColor="#fcd34d" /></linearGradient>
        <path id="vx-g-arc" d="M44 100 A56 56 0 0 1 156 100" />

        <symbol id="vx-b-pionnier" viewBox="0 0 200 200">
          <polygon points="100,20 174,63 174,149 100,192 26,149 26,63" fill="#1e0b3d" />
          <polygon points="100,14 174,57 174,143 100,186 26,143 26,57" fill="#2e1065" stroke="#1e0b3d" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="100,14 174,57 143,75 100,50" fill="url(#vx-c-light2)" />
          <polygon points="174,57 174,143 143,125 143,75" fill="url(#vx-c-mid)" />
          <polygon points="174,143 100,186 100,150 143,125" fill="url(#vx-c-dark)" />
          <polygon points="100,186 26,143 57,125 100,150" fill="url(#vx-c-dark2)" />
          <polygon points="26,143 26,57 57,75 57,125" fill="url(#vx-c-mid2)" />
          <polygon points="26,57 100,14 100,50 57,75" fill="url(#vx-c-light)" />
          <polygon points="100,50 143,75 143,125 100,150 57,125 57,75" fill="url(#vx-c-table)" />
          <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1">
            <line x1="100" y1="100" x2="100" y2="50" /><line x1="100" y1="100" x2="143" y2="75" /><line x1="100" y1="100" x2="143" y2="125" />
            <line x1="100" y1="100" x2="100" y2="150" /><line x1="100" y1="100" x2="57" y2="125" /><line x1="100" y1="100" x2="57" y2="75" />
          </g>
          <polygon points="100,14 174,57 174,143 100,186 26,143 26,57" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="100,50 143,75 143,125 100,150 57,125 57,75" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
          <path d="M100 70 C103 91 109 97 130 100 C109 103 103 109 100 130 C97 109 91 103 70 100 C91 97 97 91 100 70 Z" fill="#ffffff" />
          <path d="M124 70 C125 77 127 79 134 80 C127 81 125 83 124 90 C123 83 121 81 114 80 C121 79 123 77 124 70 Z" fill="#ffffff" fillOpacity="0.85" />
          <polygon points="40,62 62,49 58,56 42,66" fill="#ffffff" fillOpacity="0.5" />
        </symbol>

        <symbol id="vx-b-eclaireur" viewBox="0 0 200 200">
          <path d="M100 18 L170 42 V104 C170 148 140 178 100 194 C60 178 30 148 30 104 V42 Z" fill="#052033" />
          <path d="M100 12 L170 36 V98 C170 142 140 172 100 188 C60 172 30 142 30 98 V36 Z" fill="url(#vx-s-body)" stroke="#052033" strokeWidth="3" strokeLinejoin="round" />
          <path d="M100 12 L30 36 V98 C30 142 60 172 100 188 Z" fill="#ffffff" fillOpacity="0.14" />
          <path d="M100 12 L170 36 V98 C170 142 140 172 100 188 C60 172 30 142 30 98 V36 Z" fill="none" stroke="url(#vx-s-rim)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M100 33 L151 50.5 V97 C151 129.5 129 151.5 100 163.5 C71 151.5 49 129.5 49 97 V50.5 Z" fill="url(#vx-s-inner)" stroke="#7dd3fc" strokeOpacity="0.45" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M100 33 L49 50.5 V97 C49 129.5 71 151.5 100 163.5 Z" fill="#38bdf8" fillOpacity="0.12" />
          <path d="M72 124 L100 98 L128 124" fill="none" stroke="url(#vx-s-mark)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M72 146 L100 120 L128 146" fill="none" stroke="#bae6fd" strokeOpacity="0.5" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M100 56 C101.6 66.5 104.5 69.4 115 71 C104.5 72.6 101.6 75.5 100 86 C98.4 75.5 95.5 72.6 85 71 C95.5 69.4 98.4 66.5 100 56 Z" fill="#ffffff" />
        </symbol>

        <symbol id="vx-b-fondateur" viewBox="0 0 200 200">
          <circle cx="100" cy="106" r="90" fill="#451a03" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="url(#vx-g-edge)" strokeWidth="10" strokeDasharray="3 2.25" />
          <circle cx="100" cy="100" r="83" fill="url(#vx-g-base)" />
          <circle cx="100" cy="100" r="76" fill="none" stroke="#fef3c7" strokeOpacity="0.75" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 7.86" />
          <circle cx="100" cy="100" r="69" fill="none" stroke="#78350f" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx="100" cy="100" r="67" fill="url(#vx-g-field)" />
          <circle cx="100" cy="100" r="67" fill="none" stroke="#fde68a" strokeOpacity="0.6" strokeWidth="1" />
          <text fontFamily={FONT} fontSize="12.5" fontWeight="700" letterSpacing="3.2" fill="#78350f"><textPath href="#vx-g-arc" startOffset="50%" textAnchor="middle">FONDATEUR</textPath></text>
          <text x="100" y="88" textAnchor="middle" fontFamily={FONT} fontSize="11" fontWeight="700" fill="#78350f" letterSpacing="1">N°</text>
          <path d="M100 140 L104 146 L100 152 L96 146 Z" fill="#78350f" fillOpacity="0.6" />
          <path d="M48 62 C60 44 80 34 100 33" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        </symbol>
      </defs>
    </svg>
  )
}

export function BadgeIcon({ badge, size = 30 }: { badge: AccountBadge; size?: number }) {
  const number = badge.number ? String(badge.number).padStart(3, '0') : ''
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" style={{ overflow: 'visible' }}>
      <use href={`#vx-b-${badge.id}`} />
      {badge.id === 'fondateur' && (
        <>
          <text x="101.5" y="129.5" textAnchor="middle" fontFamily={FONT} fontSize="42" fontWeight="700" fill="#78350f" letterSpacing="-1">{number}</text>
          <text x="100" y="128" textAnchor="middle" fontFamily={FONT} fontSize="42" fontWeight="700" fill="url(#vx-g-text)" letterSpacing="-1">{number}</text>
        </>
      )}
    </svg>
  )
}

export function BadgeRow({ badges }: { badges: AccountBadge[] }) {
  if (badges.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
      <style>{`
        .vx-badge{position:relative;width:30px;height:30px;padding:0;border:0;background:none;border-radius:8px;cursor:default}
        .vx-badge svg{filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));transition:transform .2s ease}
        .vx-badge:hover svg,.vx-badge:focus-visible svg{transform:translateY(-2px) scale(1.08)}
        .vx-badge:focus-visible{outline:2px solid #a78bfa;outline-offset:3px}
        .vx-badge-tip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translate(-50%,4px);width:max-content;max-width:200px;padding:7px 10px;border-radius:8px;background:#1a1a24;border:1px solid rgba(255,255,255,.1);font-size:11.5px;line-height:1.4;color:#f1f5f9;text-align:left;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;z-index:5}
        .vx-badge-tip span{display:block;color:#94a3b8;font-size:11px}
        .vx-badge:hover .vx-badge-tip,.vx-badge:focus-visible .vx-badge-tip{opacity:1;transform:translate(-50%,0)}
        @media (prefers-reduced-motion: reduce){.vx-badge svg,.vx-badge-tip{transition:none}}
      `}</style>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginRight: 2 }}>Badges</span>
      {badges.map(badge => {
        const title = badgeTitle(badge)
        return (
          <button key={badge.id} type="button" className="vx-badge" aria-label={`${title.name}, ${title.detail}`}>
            <BadgeIcon badge={badge} />
            <span className="vx-badge-tip" role="tooltip">{title.name}<span>{title.detail}</span></span>
          </button>
        )
      })}
    </div>
  )
}
