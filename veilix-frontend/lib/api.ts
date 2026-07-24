import { getIdentity } from './crypto'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

/**
 * checkAuth — vérifie qu'une identité Veilix existe en local (IndexedDB).
 * Remplace l'ancienne vérification par JWT. Async car IndexedDB est asynchrone.
 */
export async function checkAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const identity = await getIdentity()
  return identity !== null
}

/**
 * Construit les headers d'auth pour une requête. Le key_id est envoyé
 * en clair (c'est un identifiant public, pas un secret) ; les requêtes
 * sensibles sont signées côté serveur via signature dérivée — voir
 * `signRequest` pour les routes qui le nécessitent.
 */
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

/**
 * Enregistre une nouvelle clé côté serveur (juste le key_id, aucune
 * donnée personnelle). Appelé une fois après génération + confirmation
 * de la seed phrase côté client.
 */
export async function registerKey(keyId: string, recoveryEmail?: string) {
  const res = await fetch(`${API_URL}/key/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id: keyId, recovery_email: recoveryEmail || null }),
  })
  return res.json()
}

/** Vérifie qu'un key_id restauré depuis une seed phrase existe bien côté serveur. */
export async function verifyKey(keyId: string) {
  const res = await fetch(`${API_URL}/key/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id: keyId }),
  })
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

export async function deleteAlias(id: number) {
  const res = await fetchWithAuth(`/alias/${id}`, { method: 'DELETE' })
  return res.json()
}