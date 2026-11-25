import Link from 'next/link'
import { RichText } from '@/components/content/RichText'
import type { BlogPost } from '@/lib/blog'

const DEFAULTS: Record<string, { accroche: string; texte: string }> = {
  'Fuite de données': { accroche: 'La prochaine fuite ne touchera qu’un alias', texte: 'Avec Veilix, chaque site reçoit sa propre adresse. Si l’un d’eux fuit, vous savez lequel, vous coupez cet alias, et votre adresse personnelle reste hors d’atteinte.' },
  'Phishing et arnaques': { accroche: 'Repérez les faux messages au premier coup d’œil', texte: 'Quand chaque site écrit sur son propre alias, un message de « votre banque » reçu sur l’alias d’une boutique en ligne se trahit immédiatement.' },
  'Vie privée': { accroche: 'Votre adresse e-mail ne devrait pas vous suivre partout', texte: 'Un alias différent par site empêche de recouper vos comptes à partir de votre adresse e-mail personnelle.' },
}

const FALLBACK = { accroche: 'Protégez votre adresse e-mail personnelle', texte: 'Un alias différent pour chaque site : en cas de fuite ou de spam, vous coupez l’alias concerné et votre adresse personnelle reste intacte.' }

export function ctaFor(post: BlogPost) {
  return post.cta ?? DEFAULTS[post.category] ?? FALLBACK
}

export function BlogCta({ post }: { post: BlogPost }) {
  const cta = ctaFor(post)
  return (
    <aside className="blog-cta" aria-label="Veilix">
      <p className="blog-cta-kicker">Veilix · alias e-mail</p>
      <p className="blog-cta-title">{cta.accroche}</p>
      <p><RichText text={cta.texte} /></p>
      <ul>
        <li>Un alias par site, créé en un clic</li>
        <li>Réponse depuis l’alias, sans dévoiler votre adresse</li>
        <li>Sans mot de passe, open source, hébergé en Europe</li>
      </ul>
      <div className="blog-cta-actions">
        <Link href="/pricing" className="cta">Voir les offres</Link>
        <Link href="/alias-email-anonyme" className="blog-cta-secondary">Comment ça marche</Link>
      </div>
      <p className="blog-cta-note">14 jours d’essai, annulable à tout moment.</p>
    </aside>
  )
}

export function BlogInlineCta({ post }: { post: BlogPost }) {
  const accroche = ctaFor(post).accroche
  return (
    <aside className="blog-inline-cta" aria-label="Veilix">
      <p><strong>{/[.?!…]$/.test(accroche) ? accroche : `${accroche}.`}</strong> <Link href="/pricing">Découvrir les offres Veilix →</Link></p>
    </aside>
  )
}
