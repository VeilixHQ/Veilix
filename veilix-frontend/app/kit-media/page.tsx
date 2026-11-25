import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ContentShell } from '@/components/content/ContentShell'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = '/kit-media'
const TITLE = 'Kit média de Veilix'
const DESCRIPTION = 'Logos, couleurs, typographie, présentation et faits clés de Veilix, le service d’alias email anonymes open source hébergé en Europe.'
const UPDATED = '2026-11-25'

const LOGOS = [
  { name: 'Logo blanc', usage: 'Sur fond sombre', file: '/vlx-white.svg', format: 'SVG', bg: '#060608' },
  { name: 'Logo noir', usage: 'Sur fond clair', file: '/vlx-black.svg', format: 'SVG', bg: '#ffffff' },
  { name: "Icône d'application", usage: 'Avatars et icônes', file: '/logo.png', format: 'PNG 512 × 512', bg: '#f1f5f9' },
]

const COLORS = [
  { name: 'Violet Veilix', hex: '#7C3AED' },
  { name: 'Violet clair', hex: '#A78BFA' },
  { name: 'Noir profond', hex: '#060608' },
  { name: 'Gris ardoise', hex: '#94A3B8' },
]

const CARD: React.CSSProperties = { border: '1px solid rgba(var(--ink),0.07)', borderRadius: 12, overflow: 'hidden', background: 'var(--c-0d0d10)' }
const GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, margin: '8px 0 22px' }
const COLOR_GRID: React.CSSProperties = { ...GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Kit média | Veilix', description: DESCRIPTION })

export default function KitMedia() {
  return (
    <ContentShell breadcrumb="Kit média">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, published: UPDATED, modified: UPDATED, breadcrumb: 'Kit média' })) }} />

      <h1>Kit média</h1>
      <p className="lead">Tout ce qu&apos;il faut pour parler de Veilix : présentation, faits clés, logos et couleurs. Vous pouvez les utiliser librement dans un article, un comparatif ou une vidéo consacrés au service.</p>
      <p className="updated">Mise à jour le 25 novembre 2026</p>

      <h2 id="presentation">Veilix en quelques mots</h2>
      <div className="note">
        <p style={{ marginBottom: 0 }}>Veilix est un service d&apos;alias email anonymes, open source et hébergé en Europe. Chaque site reçoit une adresse différente, qui relaie les messages vers votre boîte personnelle sans jamais la dévoiler. Sans compte, sans mot de passe et sans journal d&apos;activité.</p>
      </div>

      <h2 id="faits">Faits clés</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            {[
              ['Nom', 'Veilix (avec une majuscule, sans espace)'],
              ['Site', 'veilix.fr'],
              ['Catégorie', "Service d'alias email (relais)"],
              ['Statut', 'Bêta privée (novembre 2026)'],
              ['Hébergement', 'Union européenne : Railway (Amsterdam), Vercel (Paris), Mailgun (région UE)'],
              ['Code source', 'Open source, licence AGPL-3.0'],
              ['Engagements', 'No Account, No Logs, Open Source'],
            ].map(([k, v]) => <tr key={k}><td style={{ width: '32%' }}><strong>{k}</strong></td><td>{v}</td></tr>)}
          </tbody>
        </table>
      </div>

      <h2 id="logos">Logos</h2>
      <div style={GRID}>
        {LOGOS.map(logo => (
          <div key={logo.file} style={CARD}>
            <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: logo.bg }}>
              <Image src={logo.file} alt={logo.name} width={84} height={84} style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-e2e8f0)' }}>{logo.name}</div>
              <div style={{ fontSize: 13, color: 'var(--c-64748b)', margin: '2px 0 10px' }}>{logo.usage} · {logo.format}</div>
              <a href={logo.file} download style={{ fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Télécharger</a>
            </div>
          </div>
        ))}
      </div>
      <ul>
        <li>Gardez un espace libre autour du logo, au moins égal à la moitié de sa hauteur.</li>
        <li>Ne déformez pas le logo, ne changez pas ses couleurs et n&apos;y ajoutez pas d&apos;effet.</li>
        <li>N&apos;utilisez pas le logo pour laisser entendre un partenariat ou une approbation de Veilix.</li>
      </ul>

      <h2 id="couleurs">Couleurs</h2>
      <div style={COLOR_GRID}>
        {COLORS.map(color => (
          <div key={color.hex} style={CARD}>
            <div style={{ height: 64, background: color.hex, borderBottom: '1px solid rgba(var(--ink),0.07)' }} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-e2e8f0)' }}>{color.name}</div>
              <code>{color.hex}</code>
            </div>
          </div>
        ))}
      </div>

      <h2 id="typographie">Typographie</h2>
      <p>Le site et le nom Veilix sont écrits en <strong>Inter</strong>, une police libre disponible sur Google Fonts. Les titres sont en graisse 800 ou 900, le texte courant en 400.</p>

      <h2 id="contact">Contact presse</h2>
      <p>Pour une interview, un accès à la bêta ou une information qui ne figure pas ici, écrivez à <a href="mailto:contact@veilix.fr">contact@veilix.fr</a> ou passez par la page <Link href="/contact">Contact</Link>. Pour en savoir plus sur le projet, voir <Link href="/a-propos">À propos</Link> et <Link href="/transparence">Transparence</Link>.</p>
    </ContentShell>
  )
}
