

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



function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}


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


export async function saveIdentity(identity: VeilixIdentity): Promise<void> {
  await idbSet(RECORD_KEY, identity)
}


export async function getIdentity(): Promise<VeilixIdentity | null> {
  try {
    return await idbGet<VeilixIdentity>(RECORD_KEY)
  } catch {
    return null
  }
}


export async function forgetIdentity(): Promise<void> {
  await idbDelete(RECORD_KEY)
}


export async function hasIdentity(): Promise<boolean> {
  const identity = await getIdentity()
  return identity !== null
}

export function validateSeedPhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase.trim().toLowerCase().replace(/\s+/g, ' '))
}