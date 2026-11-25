export type Exposed =
  | 'email'
  | 'telephone'
  | 'adresse'
  | 'nom'
  | 'date-naissance'
  | 'iban'
  | 'carte-bancaire'
  | 'mot-de-passe'
  | 'numero-securite-sociale'
  | 'piece-identite'
  | 'sante'
  | 'autre'

export const EXPOSED_LABELS: Record<Exposed, string> = {
  email: 'E-mail',
  telephone: 'Téléphone',
  adresse: 'Adresse postale',
  nom: 'Nom',
  'date-naissance': 'Date de naissance',
  iban: 'IBAN',
  'carte-bancaire': 'Carte bancaire',
  'mot-de-passe': 'Mot de passe',
  'numero-securite-sociale': 'N° de sécurité sociale',
  'piece-identite': "Pièce d'identité",
  sante: 'Données de santé',
  autre: 'Autres données',
}

export type Guide = { key: string; path: string; title: string; short: string; description: string }

export const CHECK_TOOL: Guide = {
  key: 'verifier',
  path: '/verifier-fuite-email',
  title: 'Mon adresse e-mail a-t-elle fuité ? Vérifiez gratuitement',
  short: 'Vérifier si mon e-mail a fuité',
  description: "Vérifiez gratuitement si votre adresse e-mail apparaît dans une fuite de données connue, et découvrez quoi faire si c'est le cas.",
}

export const GUIDES: Guide[] = [
  {
    key: 'que-faire',
    path: '/guides/que-faire-apres-une-fuite-de-donnees',
    title: 'Que faire après une fuite de données ? Le guide complet',
    short: 'Que faire après une fuite de données',
    description: 'Vos données ont fuité ? Les gestes à faire tout de suite selon les données exposées, vos droits face à l’entreprise et comment éviter la prochaine fois.',
  },
  {
    key: 'iban',
    path: '/guides/iban-fuite-que-faire',
    title: 'Mon IBAN a fuité : que faire ? Risques réels et bons réflexes',
    short: 'Mon IBAN a fuité : que faire',
    description: 'Un IBAN qui fuite ne permet pas de vider votre compte, mais ouvre la porte aux prélèvements frauduleux et aux faux conseillers. Comment vous protéger et vous faire rembourser.',
  },
  {
    key: 'hameconnage',
    path: '/guides/hameconnage-apres-une-fuite',
    title: 'Hameçonnage après une fuite de données : reconnaître les arnaques',
    short: 'Reconnaître un hameçonnage après une fuite',
    description: 'Après une fuite, les arnaqueurs connaissent votre nom et vos services. Les signes qui trahissent un faux message, les scénarios courants et que faire si vous avez cliqué.',
  },
  {
    key: 'telephone',
    path: '/guides/numero-de-telephone-fuite',
    title: 'Numéro de téléphone dans une fuite : les arnaques et comment s’en protéger',
    short: 'Mon numéro de téléphone a fuité',
    description: 'Faux conseillers, SMS frauduleux, détournement de carte SIM : ce que les arnaqueurs font d’un numéro de téléphone qui a fuité et comment vous protéger.',
  },
]

export const GUIDES_PATH = '/guides'
export const LEAKS_LIST_PATH = '/fuites-de-donnees'
export const METHOD_PATH = '/blog/methode'

export function guide(key: string): Guide {
  return [CHECK_TOOL, ...GUIDES].find(item => item.key === key) as Guide
}

export function guidesFor(exposed: string[]): Guide[] {
  const keys: string[] = []
  if (exposed.includes('iban') || exposed.includes('carte-bancaire')) keys.push('iban')
  if (exposed.includes('telephone')) keys.push('telephone')
  if (exposed.includes('email')) keys.push('verifier', 'hameconnage')
  keys.push('que-faire')
  if (!keys.includes('hameconnage')) keys.push('hameconnage')
  return keys.map(guide)
}
