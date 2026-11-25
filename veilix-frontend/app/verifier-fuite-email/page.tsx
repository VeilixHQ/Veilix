import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentShell } from '@/components/content/ContentShell'
import { Faq, OtherGuides, VeilixCallout } from '@/components/content/GuideExtras'
import { LeakChecker } from '@/components/content/LeakChecker'
import { jsonLd } from '@/lib/blog'
import { CHECK_TOOL, LEAKS_LIST_PATH, guide } from '@/lib/guides'
import { articleJsonLd, pageMetadata } from '@/lib/seo'

const PATH = CHECK_TOOL.path
const UPDATED = '2026-11-25'

const FAQ = [
  { q: 'Cet outil est-il vraiment gratuit ?', a: "Oui. La vérification est gratuite et ne demande ni inscription ni compte. Elle est limitée à quelques recherches par heure pour éviter les abus." },
  { q: 'Que deviennent les adresses que je vérifie ?', a: "Votre adresse est envoyée de façon chiffrée à Have I Been Pwned, le service de référence qui recense les fuites publiques, uniquement pour faire la recherche. Veilix ne la conserve pas, ne l'enregistre dans aucun journal et ne s'en sert pour rien d'autre." },
  { q: "Mon adresse n'apparaît dans aucune fuite : suis-je protégé ?", a: "Pas forcément. Seules les fuites rendues publiques et analysées sont recensées. Beaucoup de fuites ne sont jamais publiées, ou le sont tardivement. Gardez les bons réflexes : un mot de passe différent par site et de la méfiance face aux messages pressants." },
  { q: 'Pourquoi une fuite très ancienne apparaît-elle ?', a: "Une fuite reste dans la nature pour toujours : les fichiers circulent et se revendent pendant des années. Si le mot de passe exposé à l'époque est encore utilisé quelque part, changez-le maintenant." },
  { q: 'Mon adresse a fuité : dois-je en changer ?', a: "Ce n'est généralement pas nécessaire. Changez les mots de passe concernés, activez la double authentification et méfiez-vous des messages qui citent les services touchés. Pour vos futures inscriptions, un alias par site évite que votre vraie adresse se retrouve dans les prochaines fuites." },
]

export const metadata: Metadata = pageMetadata({ path: PATH, title: 'Mon e-mail a-t-il fuité ? Vérification gratuite | Veilix', description: CHECK_TOOL.description })

export default function VerifierFuiteEmail() {
  return (
    <ContentShell breadcrumb="Vérifier si mon e-mail a fuité">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({ path: PATH, title: CHECK_TOOL.title, description: CHECK_TOOL.description, published: UPDATED, modified: UPDATED, breadcrumb: 'Vérifier si mon e-mail a fuité', faq: FAQ })) }} />

      <h1>Mon adresse e-mail a-t-elle fuité ?</h1>
      <p className="lead">Saisissez votre adresse pour savoir si elle apparaît dans une fuite de données connue : quel site a été touché, quand, et quelles informations ont été exposées avec elle.</p>

      <LeakChecker />

      <h2 id="comment-savoir">Comment savoir si votre adresse e-mail a fuité</h2>
      <p>Le moyen le plus fiable est l&apos;outil ci-dessus. Il interroge la base de Have I Been Pwned, qui recense des milliards de comptes issus de fuites publiques depuis 2013. Mais d&apos;autres signes doivent aussi vous alerter :</p>
      <ul>
        <li><strong>Un e-mail de l&apos;entreprise touchée.</strong> Quand une fuite présente un risque élevé pour vous, le RGPD oblige l&apos;organisation à vous prévenir directement.</li>
        <li><strong>Une hausse soudaine du spam</strong>, surtout des messages qui vous appellent par votre nom ou citent un service que vous utilisez vraiment.</li>
        <li><strong>Des e-mails de réinitialisation de mot de passe</strong> que vous n&apos;avez pas demandés : quelqu&apos;un essaie peut-être d&apos;utiliser vos identifiants.</li>
        <li><strong>Une connexion inhabituelle</strong> signalée par l&apos;un de vos comptes, depuis un appareil ou un pays inconnu.</li>
      </ul>
      <p>Pour suivre les fuites qui touchent les Français, consultez aussi <Link href={LEAKS_LIST_PATH}>notre liste des fuites de données en France</Link>, mise à jour en continu.</p>

      <h2 id="resultat">Comprendre le résultat</h2>
      <p>Chaque fuite listée indique le site concerné, la date de l&apos;incident et les types de données exposées avec votre adresse. C&apos;est cette dernière information qui compte le plus :</p>
      <ul>
        <li><strong>Mots de passe</strong> : changez-les sur le site touché et partout où vous les avez réutilisés, même s&apos;ils étaient chiffrés.</li>
        <li><strong>Numéro de téléphone</strong> : attendez-vous à des SMS et appels frauduleux. Voir <Link href={guide('telephone').path}>notre guide sur les fuites de numéros</Link>.</li>
        <li><strong>IBAN ou carte bancaire</strong> : surveillez vos relevés et méfiez-vous des faux conseillers. Voir <Link href={guide('iban').path}>que faire si votre IBAN a fuité</Link>.</li>
        <li><strong>Nom, adresse, date de naissance</strong> : ces informations rendent les arnaques plus crédibles. Voir <Link href={guide('hameconnage').path}>comment reconnaître un hameçonnage</Link>.</li>
      </ul>
      <p>Un résultat vide ne garantit pas que votre adresse n&apos;a jamais fuité : seules les fuites rendues publiques et analysées sont recensées.</p>

      <h2 id="que-faire">Votre adresse a fuité : les premiers gestes</h2>
      <ol>
        <li>Changez le mot de passe des services touchés, puis celui de tous les sites où vous utilisiez le même.</li>
        <li>Activez la double authentification sur votre messagerie, votre banque et vos comptes importants, de préférence avec une application plutôt que par SMS.</li>
        <li>Méfiez-vous de tout message qui cite la fuite ou le service concerné : c&apos;est le scénario préféré des arnaqueurs.</li>
        <li>Utilisez un gestionnaire de mots de passe pour avoir un mot de passe unique et solide par site.</li>
      </ol>
      <p>Tous les détails, selon les données exposées et vos droits face à l&apos;entreprise, sont dans notre guide <Link href={guide('que-faire').path}>que faire après une fuite de données</Link>.</p>

      <h2 id="confidentialite">Comment nous traitons votre adresse</h2>
      <p>Votre adresse part de votre navigateur vers notre serveur, hébergé en Europe, par une connexion chiffrée. Il la transmet à Have I Been Pwned pour la recherche, renvoie le résultat, puis l&apos;oublie : aucune copie, aucun journal, aucun usage commercial. Le code de cette fonction est public, comme tout Veilix, sur <a href="https://github.com/VeilixHQ/Veilix" rel="noopener noreferrer" target="_blank">GitHub</a>.</p>

      <VeilixCallout />

      <Faq items={FAQ} />

      <OtherGuides current="verifier" />
    </ContentShell>
  )
}
