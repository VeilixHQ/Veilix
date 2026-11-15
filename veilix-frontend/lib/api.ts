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


export async function registerKey(keyId: string, recoveryEmail?: string) {
  const res = await fetch(`${API_URL}/key/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id: keyId, recovery_email: recoveryEmail || null }),
  })
  if (!res.ok) {
    throw new Error('Enregistrement de la clé impossible')
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
}

export async function getAccount(): Promise<Account> {
  const res = await fetchWithAuth('/key/me')
  if (!res.ok) {
    throw new Error('Compte indisponible')
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