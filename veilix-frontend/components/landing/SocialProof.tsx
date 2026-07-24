'use client'

import Image from 'next/image'
import { FadeInSection } from './Utils'

interface Props {
  lang: 'fr' | 'en'
}

const content = {
  fr: {
    kicker: 'Notre histoire',
    title: 'Protéger son identité ne devrait pas être un luxe.',
    paragraphs: [
      "Vous vous inscrivez quelque part. Un site, une app, une newsletter. On vous demande votre email, alors vous le donnez — c'est le prix à payer pour accéder à ce que vous voulez.",
      "Sauf que ce prix, on ne vous le montre jamais vraiment. Votre adresse finit revendue à des annonceurs, ajoutée à des listes de diffusion, exposée lors de la prochaine fuite de données. Votre boîte mail devient un endroit que vous n'avez plus envie d'ouvrir.",
      "On a construit Veilix parce qu'on trouvait ça absurde. Pourquoi devrait-on choisir entre utiliser un service et protéger son identité ?",
      "Avec Veilix, vous donnez un alias à la place de votre vraie adresse. Aucun compte à créer, aucun mot de passe à retenir. Juste une clé générée dans votre navigateur, que vous seul possédez.",
    ],
    pillars: ['No Account', 'No Logs', 'No Tracking', 'Open Source'],
    alt: 'Utilisation de Veilix sur téléphone',
  },
  en: {
    kicker: 'Our story',
    title: "Protecting your identity shouldn't be a luxury.",
    paragraphs: [
      "You sign up somewhere. A website, an app, a newsletter. They ask for your email, so you give it — it's the price to pay for what you want.",
      "Except that price is never really shown to you. Your address ends up resold to advertisers, added to mailing lists, exposed in the next data breach. Your inbox becomes a place you no longer want to open.",
      "We built Veilix because we found that absurd. Why should you have to choose between using a service and protecting your identity?",
      "With Veilix, you give an alias instead of your real address. No account to create, no password to remember. Just a key generated in your browser, that only you own.",
    ],
    pillars: ['No Account', 'No Logs', 'No Tracking', 'Open Source'],
    alt: 'Using Veilix on phone',
  },
}

export function SocialProof({ lang }: Props) {
  const t = content[lang]

  return (
    <section
      style={{
        padding: '96px 24px',
        background: '#0d0d10',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: 1060,
          margin: '0 auto',
        }}
      >
        <div
          className="grid-2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          {}
          <FadeInSection>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 5',
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
                background: '#0a0a0c',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src="/story-photo.jpg"
                alt={t.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                priority={false}
              />
            </div>
          </FadeInSection>

          {}
          <FadeInSection delay={120}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#a78bfa',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: 14,
                }}
              >
                {t.kicker}
              </div>

              <h2
                style={{
                  fontSize: 'clamp(22px, 2.8vw, 36px)',
                  fontWeight: 900,
                  letterSpacing: '-1.2px',
                  lineHeight: 1.15,
                  marginBottom: 28,
                  color: '#f1f5f9',
                }}
              >
                {t.title}
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {t.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    style={{
                      fontSize: 14,
                      color: '#64748b',
                      lineHeight: 1.8,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {t.pillars.map((pillar, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(124,58,237,0.07)',
                      border: '1px solid rgba(124,58,237,0.18)',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#7c3aed',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#a78bfa',
                      }}
                    >
                      {pillar}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  )
}