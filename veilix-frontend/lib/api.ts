import { getIdentity } from './crypto'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'


export async function checkAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const identity = await getIdentity()
  return identity !== null
}


async function authHeaders(): Promise<Record<string, string>> {
  const identity = await getIdentity()
  if (!identity) return {}
  return { 'X-Veilix-Key-Id': identity.keyId }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = await authHeaders()
  if (!headers['X-Veilix-Key-Id']) {
    throw new Error('Aucune identité locale')
  }
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  })
  if (res.status === 401) {
    throw new Error('Clé invalide ou révoquée')
  }
  return res
}


export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return typeof data?.detail === 'string' ? data.detail : fallback
  } catch {
    return fallback
  }
}

export type BetaPhase = 'private' | 'public'

export async function checkAccessCode(accessCode: string): Promise<{ valid: boolean; phase: BetaPhase | null; needs_contact: boolean }> {
  const res = await fetch(`${API_URL}/key/check-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: accessCode }),
  })
  if (!res.ok) {
    throw new ApiError(res.status, await errorDetail(res, 'Vérification du code impossible'))
  }
  return res.json()
}

export async function registerKey(keyId: string, accessCode: string, contactEmail?: string) {
  const res = await fetch(`${API_URL}/key/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id: keyId, access_code: accessCode, contact_email: contactEmail || null, accept_terms: true }),
  })
  if (!res.ok) {
    throw new ApiError(res.status, await errorDetail(res, 'Enregistrement de la clé impossible'))
  }
  return res.json()
}


export async function verifyKey(keyId: string) {
  const res = await fetch(`${API_URL}/key/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id: keyId }),
  })
  return res.json()
}

export type Account = {
  plan: string
  status: string
  credits: number
  aliases_used: number
  alias_quota: number | null
  created_at: string | null
  badges: { id: 'pionnier' | 'eclaireur' | 'fondateur'; number: number | null }[]
}

export async function getAccount(): Promise<Account> {
  const res = await fetchWithAuth('/key/me')
  if (!res.ok) {
    throw new ApiError(res.status, await errorDetail(res, 'Compte indisponible'))
  }
  return res.json()
}

export async function getAliases() {
  const res = await fetchWithAuth('/alias')
  return res.json()
}

export async function createAlias(destination_email: string, label: string) {
  const res = await fetchWithAuth('/alias', {
    method: 'POST',
    body: JSON.stringify({ destination_email, label }),
  })
  return res.json()
}

export async function disableAlias(id: number) {
  const res = await fetchWithAuth(`/alias/${id}/disable`, { method: 'PATCH' })
  return res.json()
}

export async function enableAlias(id: number) {
  const res = await fetchWithAuth(`/alias/${id}/enable`, { method: 'PATCH' })
  return res.json()
}

export async function resendConfirmation(id: number) {
  const res = await fetchWithAuth(`/alias/${id}/resend-confirmation`, { method: 'POST' })
  return res.json()
}

export async function confirmDestination(token: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/destination/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return res.ok
}

export async function deleteAlias(id: number) {
  const res = await fetchWithAuth(`/alias/${id}`, { method: 'DELETE' })
  return res.json()
}

type PhaseDates = { open: boolean; opens_at: string | null; signups_close_at: string | null; ends_at: string | null }

export type BetaPublicStatus = {
  private: PhaseDates
  public: PhaseDates & { wave: number | null; wave2_opens_at: string | null }
  launch_at: string | null
}

export async function getBetaStatus(): Promise<BetaPublicStatus> {
  const res = await fetch(`${API_URL}/beta/status`)
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Statut de la bêta indisponible'))
  return res.json()
}

export async function joinBeta(email: string, invitation: string | null, website: string) {
  const res = await fetch(`${API_URL}/beta/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, consent: true, invitation, website: website || null }),
  })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Inscription impossible'))
  return res.json()
}

export type BetaKeyStatus = {
  phase: BetaPhase | null
  ends_at: string | null
  feedback_due_at: string | null
  overdue: boolean
  reminded: boolean
  final_window: boolean
  final_sent: boolean
  suspended_for_feedback: boolean
  feedback_count: number
}

export type BetaFeedback = {
  features_tried: string[]
  alias_lifecycle: 'oui' | 'partiel' | 'non'
  forwarding_ok: 'oui' | 'partiel' | 'non' | 'pas_teste'
  problem: string
  unclear: string
  recommend: number
  recommend_why: string
}

export async function getMyBetaStatus(): Promise<BetaKeyStatus> {
  const res = await fetchWithAuth('/beta/me')
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Statut bêta indisponible'))
  return res.json()
}

export async function sendBetaFeedback(feedback: BetaFeedback): Promise<BetaKeyStatus> {
  const res = await fetchWithAuth('/beta/feedback', { method: 'POST', body: JSON.stringify(feedback) })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Envoi du retour impossible'))
  return res.json()
}

export async function deleteMyAccount(): Promise<void> {
  const res = await fetchWithAuth('/key/me', { method: 'DELETE' })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Suppression impossible'))
}

async function adminRequest(path: string, method: 'GET' | 'POST' = 'GET') {
  const res = await fetchWithAuth(`/admin/beta${path}`, { method })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Action refusée'))
  return res.json()
}

export const adminBeta = {
  overview: () => adminRequest(''),
  feedback: () => adminRequest('/feedback'),
  revoke: (codeId: number) => adminRequest(`/codes/${codeId}/revoke`, 'POST'),
  reactivate: (keyId: number) => adminRequest(`/keys/${keyId}/reactivate`, 'POST'),
  tick: () => adminRequest('/tick', 'POST'),
}
