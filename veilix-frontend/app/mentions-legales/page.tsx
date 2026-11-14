'use client'
import { useState } from 'react'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { T, Lang } from '@/lib/translations'

const EDITOR_INFO = {
  fr: {
    name: '[Ton prénom NOM]',
    status: '[Statut : ex. Entrepreneur individuel / Auto-entrepreneur — à préciser une fois le statut créé]',
    address: '[Ville, Pays]',
    email: 'contact@veilix.fr',
    siret: '[Numéro SIRET — à ajouter une fois le statut créé]',
  },
  en: {
    name: '[Your First Name LAST NAME]',
    status: '[Status: e.g. Sole Trader — to be added once registered]',
    address: '[City, Country]',
    email: 'contact@veilix.fr',
    siret: '[Business registration number — to be added once registered]',
  },
}

export default function MentionsLegales() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = T[lang]
  const editor = EDITOR_INFO[lang]
  const isFr = lang === 'fr'

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <SiteNav t={t} lang={lang} setLang={setLang} mode="public" hideNavLinks />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>
            {isFr ? 'Légal' : 'Legal'}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
            {isFr ? 'Mentions légales' : 'Legal Notice'}
          </h1>
          <p style={{ fontSize: 13, color: '#475569' }}>
            {isFr ? 'Dernière mise à jour : juillet 2026' : 'Last updated: July 2026'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {isFr ? '1. Éditeur du site' : '1. Site Publisher'}
            </h2>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.9 }}>
              <p><strong style={{ color: '#94a3b8' }}>{isFr ? 'Nom' : 'Name'} :</strong> {editor.name}</p>
              <p><strong style={{ color: '#94a3b8' }}>{isFr ? 'Statut' : 'Status'} :</strong> {editor.status}</p>
              <p><strong style={{ color: '#94a3b8' }}>{isFr ? 'Adresse' : 'Address'} :</strong> {editor.address}</p>
              <p><strong style={{ color: '#94a3b8' }}>{isFr ? 'Numéro d\'identification' : 'Registration number'} :</strong> {editor.siret}</p>
              <p><strong style={{ color: '#94a3b8' }}>Email :</strong> {editor.email}</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {isFr ? '2. Directeur de la publication' : '2. Publication Director'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>
              {isFr
                ? `${editor.name}, en qualité d'éditeur du site Veilix.`
                : `${editor.name}, as publisher of the Veilix website.`}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {isFr ? '3. Hébergement' : '3. Hosting'}
            </h2>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.9 }}>
              <p style={{ marginBottom: 12 }}>
                <strong style={{ color: '#94a3b8' }}>{isFr ? 'Hébergement du site (frontend)' : 'Website hosting (frontend)'} :</strong><br />
                Vercel Inc.<br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>vercel.com</a>
              </p>
              <p>
                <strong style={{ color: '#94a3b8' }}>{isFr ? 'Hébergement des données (backend)' : 'Data hosting (backend)'} :</strong><br />
                Railway Corp.<br />
                <a href="https://railway.app" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>railway.app</a>
              </p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {isFr ? '4. Propriété intellectuelle' : '4. Intellectual Property'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>
              {isFr
                ? "Le frontend de Veilix est publié sous licence open source. Le backend, l'infrastructure et la marque \"Veilix\" restent la propriété exclusive de l'éditeur."
                : 'The Veilix frontend is published under an open source license. The backend, infrastructure, and the "Veilix" brand remain the exclusive property of the publisher.'}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {isFr ? '5. Contact' : '5. Contact'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>
              {isFr
                ? 'Pour toute question relative à ces mentions légales, contactez-nous via notre page Contact.'
                : 'For any question regarding this legal notice, contact us via our Contact page.'}
            </p>
          </div>
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  )
}