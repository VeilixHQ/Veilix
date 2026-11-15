export const BETA_TERMS = "En rejoignant la bêta de Veilix, vous acceptez de participer activement aux tests et de transmettre les retours demandés dans les délais indiqués. Votre code d'accès est strictement personnel : tout partage, vente, publication ou contournement des règles entraînera sa révocation immédiate et la suspension de votre accès sans préavis. En cas de retour manquant, un rappel vous sera envoyé. Sans réponse dans les 48 heures suivant ce rappel, votre accès à la bêta sera automatiquement suspendu. Votre accès pourra être réactivé après réception du retour si la phase de test est toujours en cours."

export const BETA_RHYTHM = "Premier retour sous 7 jours après l'activation, puis un retour chaque semaine en bêta privée et toutes les 2 semaines en bêta publique. Retour final au plus tard 48 heures avant la clôture."

export const BETA_RIGHTS = "Vous pouvez quitter la bêta à tout moment et supprimer vos données depuis votre tableau de bord. N'utilisez pas Veilix pour des messages indispensables pendant la bêta."

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toDate(value: string) {
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}

export function formatDate(value: string | null) {
  if (!value) return ''
  return toDate(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

export function formatLastDay(value: string | null) {
  if (!value) return ''
  return new Date(toDate(value).getTime() - 60_000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

export function isPast(value: string | null) {
  return Boolean(value) && toDate(value as string).getTime() <= Date.now()
}
