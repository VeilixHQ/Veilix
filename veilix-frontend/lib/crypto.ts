import * as bip39 from 'bip39'

const DB_NAME = 'veilix'
const DB_VERSION = 1
const STORE_NAME = 'identity'
const RECORD_KEY = 'current'

export interface VeilixIdentity {
  keyId: string
  seedPhrase: string
  signingKeyHex: string
  createdAt: number
  recoveryEmail?: string
}

export interface StoredIdentity {
  keyId: string
  createdAt: number
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
  const entropy = crypto.getRandomValues(new Uint8Array(16))
  const seedPhrase = bip39.entropyToMnemonic(Buffer.from(entropy))
  const seedBytes = await bip39.mnemonicToSeed(seedPhrase)
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


export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const stored: StoredIdentity = { keyId: identity.keyId, createdAt: identity.createdAt }
  await idbSet(RECORD_KEY, stored)
}


export async function getIdentity(): Promise<StoredIdentity | null> {
  try {
    const record = await idbGet<Record<string, unknown>>(RECORD_KEY)
    if (!record || typeof record.keyId !== 'string') return null
    const stored: StoredIdentity = {
      keyId: record.keyId,
      createdAt: typeof record.createdAt === 'number' ? record.createdAt : Date.now(),
    }
    if (Object.keys(record).some(field => field !== 'keyId' && field !== 'createdAt')) {
      await idbSet(RECORD_KEY, stored)
    }
    return stored
  } catch {
    return null
  }
}


export async function forgetIdentity(): Promise<void> {
  await idbDelete(RECORD_KEY)
}
