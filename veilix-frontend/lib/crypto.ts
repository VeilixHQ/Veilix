/**
 * lib/crypto.ts
 * ─────────────────────────────────────────────────────────
 * Cœur du système "No Account" de Veilix.
 *
 * Principe :
 *   1. On génère 128 bits d'entropie aléatoire (Web Crypto API).
 *   2. On la transforme en seed phrase BIP39 (12 mots) — lisible,
 *      sauvegardable, standard de récupération de l'industrie crypto.
 *   3. On dérive de cette seed phrase :
 *        - un `key_id` PUBLIC (envoyé au serveur, sert d'identifiant)
 *        - une `signingKey` PRIVÉE (ne quitte jamais le navigateur)
 *   4. Tout est stocké en local dans IndexedDB. Le serveur ne reçoit
 *      jamais la seed phrase ni la clé privée — uniquement le key_id,
 *      qui est un hash à sens unique. Impossible de remonter à
 *      l'utilisateur depuis la base serveur.
 *
 * Aucune donnée envoyée au réseau ne permet de retrouver la seed.
 */

import * as bip39 from 'bip39'

const DB_NAME = 'veilix'
const DB_VERSION = 1
const STORE_NAME = 'identity'
const RECORD_KEY = 'current'

export interface VeilixIdentity {
  keyId: string          // identifiant public dérivé — envoyé au serveur
  seedPhrase: string      // 12 mots — JAMAIS envoyée au serveur
  signingKeyHex: string   // clé privée dérivée — JAMAIS envoyée au serveur
  createdAt: number
  recoveryEmail?: string  // optionnel, géré séparément côté serveur si fourni
}

/* ─────────────────────────────────────────────────────────
 * IndexedDB — petit wrapper minimal, pas de dépendance externe
 * ───────────────────────────────────────────────────────── */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ─────────────────────────────────────────────────────────
 * Dérivation cryptographique
 * ───────────────────────────────────────────────────────── */

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Dérive le key_id public et la signing key privée à partir de la seed.
 * Utilise HKDF (SHA-256) avec des "info" différents pour garantir que
 * key_id et signingKey ne permettent pas de se déduire l'un de l'autre.
 */
async function deriveFromSeed(seedBytes: Uint8Array): Promise<{ keyId: string; signingKeyHex: string }> {
  const baseKey = await crypto.subtle.importKey('raw', seedBytes.buffer as ArrayBuffer, 'HKDF', false, ['deriveBits'])

  const keyIdBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('veilix-key-id-v1') },
    baseKey,
    256
  )
  const signingBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('veilix-signing-key-v1') },
    baseKey,
    256
  )

  return {
    keyId: bufferToHex(keyIdBits),
    signingKeyHex: bufferToHex(signingBits),
  }
}

/* ─────────────────────────────────────────────────────────
 * API publique
 * ───────────────────────────────────────────────────────── */

/**
 * Génère une nouvelle identité Veilix : entropie aléatoire → seed phrase
 * BIP39 → key_id + signing key dérivés. Ne persiste rien — c'est à
 * l'appelant de confirmer la seed phrase avant de la sauvegarder
 * (voir `saveIdentity`).
 */
export async function generateIdentity(): Promise<VeilixIdentity> {
  const entropy = crypto.getRandomValues(new Uint8Array(16)) // 128 bits → 12 mots
  const seedPhrase = bip39.entropyToMnemonic(Buffer.from(entropy))
  const seedBytes = await bip39.mnemonicToSeed(seedPhrase) // 64 bytes
  const { keyId, signingKeyHex } = await deriveFromSeed(new Uint8Array(seedBytes).slice(0, 32))

  return {
    keyId,
    seedPhrase,
    signingKeyHex,
    createdAt: Date.now(),
  }
}

/** Reconstruit une identité à partir d'une seed phrase existante (récupération). */
export async function restoreIdentityFromSeed(seedPhrase: string): Promise<VeilixIdentity | null> {
  const normalized = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!bip39.validateMnemonic(normalized)) return null

  const seedBytes = await bip39.mnemonicToSeed(normalized)
  const { keyId, signingKeyHex } = await deriveFromSeed(new Uint8Array(seedBytes).slice(0, 32))

  return {
    keyId,
    seedPhrase: normalized,
    signingKeyHex,
    createdAt: Date.now(),
  }
}

/** Persiste l'identité courante dans IndexedDB. À appeler après confirmation de la seed phrase. */
export async function saveIdentity(identity: VeilixIdentity): Promise<void> {
  await idbSet(RECORD_KEY, identity)
}

/** Récupère l'identité stockée localement, ou null si aucune clé n'a été générée. */
export async function getIdentity(): Promise<VeilixIdentity | null> {
  try {
    return await idbGet<VeilixIdentity>(RECORD_KEY)
  } catch {
    return null
  }
}

/** Supprime l'identité locale ("oublier cette clé"). Irréversible sans la seed phrase sauvegardée ailleurs. */
export async function forgetIdentity(): Promise<void> {
  await idbDelete(RECORD_KEY)
}

/** Vérifie rapidement si une identité existe en local, sans exposer son contenu. */
export async function hasIdentity(): Promise<boolean> {
  const identity = await getIdentity()
  return identity !== null
}

export function validateSeedPhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase.trim().toLowerCase().replace(/\s+/g, ' '))
}