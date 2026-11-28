import { getIdentity } from './crypto'
import { getChannel } from './channel'

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
    body: JSON.stringify({ key_id: keyId, access_code: accessCode, contact_email: contactEmail || null, accept_terms: true, channel: getChannel() }),
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
  destinations_used?: number
  destination_limit?: number | null
  created_at: string | null
  badges: { id: 'pionnier' | 'eclaireur' | 'fondateur'; number: number | null }[]
  custom_domains_available?: boolean
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

export async function createAlias(destination_email: string, label: string, options: { domain_id?: number | null; local_part?: string } = {}) {
  const body: Record<string, unknown> = { destination_email, label }
  if (options.domain_id) body.domain_id = options.domain_id
  if (options.domain_id && options.local_part) body.local_part = options.local_part
  const res = await fetchWithAuth('/alias', {
    method: 'POST',
    body: JSON.stringify(body),
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
    body: JSON.stringify({ email, consent: true, invitation, website: website || null, channel: getChannel() }),
  })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Inscription impossible'))
  return res.json()
}

export async function joinLaunchList(email: string, website: string) {
  const res = await fetch(`${API_URL}/launch/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, consent: true, website: website || null, channel: getChannel() }),
  })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Inscription impossible'))
  return res.json()
}

export async function leaveLaunchList(token: string) {
  const res = await fetch(`${API_URL}/launch/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, 'Désinscription impossible'))
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


async function jsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res, fallback))
  return res.json()
}

export type BlockedSender = { id: number; sender: string; blocked_count: number; created_at: string }

export async function getBlockedSenders(aliasId: number): Promise<BlockedSender[]> {
  return jsonOrThrow(await fetchWithAuth(`/alias/${aliasId}/blocked-senders`), 'Liste indisponible')
}

export async function blockSender(aliasId: number, sender: string): Promise<BlockedSender> {
  return jsonOrThrow(await fetchWithAuth(`/alias/${aliasId}/blocked-senders`, { method: 'POST', body: JSON.stringify({ sender }) }), 'Blocage impossible')
}

export async function unblockSender(aliasId: number, blockId: number): Promise<void> {
  await jsonOrThrow(await fetchWithAuth(`/alias/${aliasId}/blocked-senders/${blockId}`, { method: 'DELETE' }), 'Déblocage impossible')
}

export async function dismissLeak(aliasId: number) {
  return jsonOrThrow(await fetchWithAuth(`/alias/${aliasId}/leak/dismiss`, { method: 'POST' }), 'Action impossible')
}

export type DnsRecord = { type: string; name: string; value: string; priority?: number | null; purpose: 'ownership' | 'receiving' | 'sending' }

export type CustomDomain = {
  id: number
  domain: string
  verified: boolean
  verified_at: string | null
  last_checked_at: string | null
  catch_all: boolean
  catch_all_destination: string | null
  aliases: number
  records: DnsRecord[]
  ownership?: boolean
  receiving?: boolean
  lookup_failed?: boolean
}

export async function getDomains(): Promise<CustomDomain[]> {
  return jsonOrThrow(await fetchWithAuth('/domains'), 'Domaines indisponibles')
}

export async function addDomain(domain: string): Promise<CustomDomain> {
  return jsonOrThrow(await fetchWithAuth('/domains', { method: 'POST', body: JSON.stringify({ domain }) }), 'Ajout impossible')
}

export async function verifyDomain(id: number): Promise<CustomDomain> {
  return jsonOrThrow(await fetchWithAuth(`/domains/${id}/verify`, { method: 'POST' }), 'Vérification impossible')
}

export async function setCatchAll(id: number, enabled: boolean, destination_email?: string): Promise<CustomDomain> {
  return jsonOrThrow(await fetchWithAuth(`/domains/${id}/catch-all`, { method: 'PATCH', body: JSON.stringify({ enabled, destination_email: destination_email || null }) }), 'Catch-all impossible')
}

export async function deleteDomain(id: number): Promise<void> {
  await jsonOrThrow(await fetchWithAuth(`/domains/${id}`, { method: 'DELETE' }), 'Suppression impossible')
}

export type PgpStatus = { configured: boolean; enabled: boolean; fingerprint: string | null; user_ids: string[]; expires_at: string | null }

export async function getPgp(): Promise<PgpStatus> {
  return jsonOrThrow(await fetchWithAuth('/pgp'), 'PGP indisponible')
}

export async function savePgpKey(public_key: string): Promise<PgpStatus> {
  return jsonOrThrow(await fetchWithAuth('/pgp', { method: 'PUT', body: JSON.stringify({ public_key }) }), 'Clé refusée')
}

export async function togglePgp(enabled: boolean): Promise<PgpStatus> {
  return jsonOrThrow(await fetchWithAuth('/pgp', { method: 'PATCH', body: JSON.stringify({ enabled }) }), 'Action impossible')
}

export async function deletePgp(): Promise<PgpStatus> {
  return jsonOrThrow(await fetchWithAuth('/pgp', { method: 'DELETE' }), 'Suppression impossible')
}

export type Preferences = { leak_alerts: boolean; weekly_digest: boolean; digest_sent_at: string | null }

export async function getPreferences(): Promise<Preferences> {
  return jsonOrThrow(await fetchWithAuth('/preferences'), 'Préférences indisponibles')
}

export async function savePreferences(preferences: Partial<Pick<Preferences, 'leak_alerts' | 'weekly_digest'>>): Promise<Preferences> {
  return jsonOrThrow(await fetchWithAuth('/preferences', { method: 'PATCH', body: JSON.stringify(preferences) }), 'Enregistrement impossible')
}

export type ApiToken = { id: number; name: string; prefix: string; created_at: string }

export async function getApiTokens(): Promise<ApiToken[]> {
  return jsonOrThrow(await fetchWithAuth('/api-tokens'), 'Clés indisponibles')
}

export async function createApiToken(name: string): Promise<ApiToken & { token: string }> {
  return jsonOrThrow(await fetchWithAuth('/api-tokens', { method: 'POST', body: JSON.stringify({ name }) }), 'Création impossible')
}

export async function revokeApiToken(id: number): Promise<void> {
  await jsonOrThrow(await fetchWithAuth(`/api-tokens/${id}`, { method: 'DELETE' }), 'Révocation impossible')
}

export type PackAvailability = { total: number; taken: number; remaining: number }

export async function getPackAvailability(): Promise<PackAvailability> {
  const res = await fetch(`${API_URL}/pack/availability`, { cache: 'no-store' })
  if (!res.ok) throw new ApiError(res.status, 'Compteur indisponible')
  return res.json()
}
