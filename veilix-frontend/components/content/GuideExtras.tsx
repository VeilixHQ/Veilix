import Link from 'next/link'
import { CHECK_TOOL, GUIDES, LEAKS_LIST_PATH } from '@/lib/guides'

export function VeilixCallout() {
  return (
    <>
      <h2 id="eviter">Limiter les dégâts lors de la prochaine fuite</h2>
      <p>La plupart des fuites exposent votre adresse e-mail, qui sert ensuite au spam et au hameçonnage ciblé. La parade la plus simple : donner à chaque site une adresse différente, un <strong>alias</strong>, qui relaie les messages vers votre boîte personnelle. Si un site fuite, vous savez immédiatement lequel, et vous coupez son alias sans toucher à votre vraie adresse.</p>
      <div className="note">
        <p><strong>C&apos;est ce que fait Veilix</strong> : un alias e-mail par site, sans mot de passe pour s&apos;inscrire, sans journal d&apos;activité, open source et hébergé en Europe. <Link href="/alias-email-anonyme">Découvrir comment ça marche</Link>.</p>
      </div>
      <Link href="/beta" className="cta">Rejoindre la bêta</Link>
    </>
  )
}

export function OtherGuides({ current }: { current: string }) {
  const items = [CHECK_TOOL, ...GUIDES].filter(item => item.key !== current)
  return (
    <>
      <h2 id="guides">Nos autres guides</h2>
      <ul>
        {items.map(item => (
          <li key={item.key}><Link href={item.path}>{item.short}</Link></li>
        ))}
        {current !== 'liste' && <li><Link href={LEAKS_LIST_PATH}>La liste des fuites de données en France</Link></li>}
      </ul>
    </>
  )
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <>
      <h2 id="faq">Questions fréquentes</h2>
      {items.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </>
  )
}
