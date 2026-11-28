const STORAGE_KEY = 'veilix_channel'

const REFERRERS: [RegExp, string][] = [
  [/(^|\.)gemini\.google\./, 'gemini'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)qwant\.com$/, 'qwant'],
  [/(^|\.)ecosia\.org$/, 'ecosia'],
  [/(^|\.)search\.brave\.com$/, 'brave'],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)chat\.mistral\.ai$/, 'mistral'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)producthunt\.com$/, 'producthunt'],
]

function fromReferrer(referrer: string): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (host === window.location.hostname || host.endsWith('veilix.fr')) return null
    const match = REFERRERS.find(([pattern]) => pattern.test(host))
    return match ? match[1] : 'autre'
  } catch {
    return null
  }
}

function fromQuery(search: string): string | null {
  const params = new URLSearchParams(search)
  if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) return 'googleads'
  const value = (params.get('utm_source') || params.get('ref') || '').trim().toLowerCase()
  if (!value) return null
  const viaHost = value.includes('.') ? fromReferrer(`https://${value}`) : null
  return (viaHost || value).replace(/[^a-z0-9]/g, '').slice(0, 24) || null
}

export function captureChannel(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const channel = fromQuery(window.location.search) || fromReferrer(document.referrer) || 'direct'
    sessionStorage.setItem(STORAGE_KEY, channel)
  } catch {
    return
  }
}

export function getChannel(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
