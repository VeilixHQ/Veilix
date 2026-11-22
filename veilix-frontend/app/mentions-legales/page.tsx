'use client'
import { useState } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'

const EDITOR_INFO = {
  fr: {
    name: "[Prénom NOM de l'éditeur]",
    status: '[Statut : entrepreneur individuel (micro-entreprise)]',
    address: '[Adresse de domiciliation]',
    email: 'contact@veilix.fr',
    siret: '[Numéro SIRET]',
  },
  en: {
    name: '[Publisher first name and LAST NAME]',
    status: '[Status: sole trader (micro-enterprise)]',
    address: '[Registered address]',
    email: 'contact@veilix.fr',
    siret: '[SIRET number]',
  },
}

export default function MentionsLegales() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const editor = EDITOR_INFO[lang]
  const isFr = lang === 'fr'
  const pending = isFr
    ? "Les informations relatives à l'éditeur seront publiées lors du lancement officiel de la bêta publique."
    : 'Information about the publisher will be published at the official launch of the public beta.'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-060608)', color: 'var(--c-f1f5f9)', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-a78bfa)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>
            {isFr ? 'Légal' : 'Legal'}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
            {isFr ? 'Mentions légales' : 'Legal Notice'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-475569)' }}>
            {isFr ? 'Dernière mise à jour : 16 novembre 2026' : 'Last updated: November 16, 2026'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 12 }}>
              {isFr ? '1. Éditeur du site' : '1. Site Publisher'}
            </h2>
            <div style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.9 }}>
              <p style={{ marginBottom: 8 }}>{pending}</p>
              <p><strong style={{ color: 'var(--c-94a3b8)' }}>Email :</strong> {editor.email}</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 12 }}>
              {isFr ? '2. Directeur de la publication' : '2. Publication Director'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8 }}>
              {pending}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 12 }}>
              {isFr ? '3. Hébergement' : '3. Hosting'}
            </h2>
            <div style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.9 }}>
              <p style={{ marginBottom: 12 }}>
                <strong style={{ color: 'var(--c-94a3b8)' }}>{isFr ? 'Hébergement du site (frontend)' : 'Website hosting (frontend)'} :</strong><br />
                Vercel Inc.<br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-a78bfa)' }}>vercel.com</a>
              </p>
              <p>
                <strong style={{ color: 'var(--c-94a3b8)' }}>{isFr ? "Hébergement de l'API et des données (backend)" : 'API and data hosting (backend)'} :</strong><br />
                Railway Corporation, {isFr ? 'serveurs situés à Amsterdam (Union européenne)' : 'servers located in Amsterdam (European Union)'}<br />
                <a href="https://railway.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-a78bfa)' }}>railway.com</a>
              </p>
              <p style={{ marginTop: 12 }}>
                <strong style={{ color: 'var(--c-94a3b8)' }}>{isFr ? 'Acheminement des e-mails' : 'Email routing'} :</strong><br />
                Mailgun Technologies, Inc., {isFr ? 'région européenne' : 'European region'}<br />
                <a href="https://www.mailgun.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-a78bfa)' }}>mailgun.com</a>
              </p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 12 }}>
              {isFr ? '4. Propriété intellectuelle' : '4. Intellectual Property'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8 }}>
              {isFr
                ? "L'intégralité du code de Veilix, site et backend, est open source sous licence AGPL-3.0 et publiquement consultable sur github.com/VeilixHQ/Veilix. La marque \"Veilix\" et son logo restent la propriété de l'éditeur."
                : 'All of the Veilix code, website and backend, is open source under the AGPL-3.0 license and publicly available at github.com/VeilixHQ/Veilix. The "Veilix" brand and logo remain the property of the publisher.'}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-e2e8f0)', marginBottom: 12 }}>
              {isFr ? '5. Contact' : '5. Contact'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', lineHeight: 1.8 }}>
              {isFr
                ? 'Pour toute question juridique ou relative à ces mentions légales : legal@veilix.fr.'
                : 'For any legal question or question regarding this legal notice: legal@veilix.fr.'}
            </p>
          </div>
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  )
}