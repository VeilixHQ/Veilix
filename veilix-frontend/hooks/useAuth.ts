'use client'

import { useEffect, useState } from 'react'
import { checkAuth, verifyKey } from '@/lib/api'
import { getIdentity } from '@/lib/crypto'

export function useAuth() {
  const [user, setUser] = useState<boolean | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const run = async () => {
      try {
        const result = await checkAuth()
        if (!alive) return

        const authenticated = !!result
        setUser(authenticated)

        if (authenticated) {
          try {
            const identity = await getIdentity()
            if (identity) {
              const check = await verifyKey(identity.keyId)
              if (!alive) return
              setPlan(check?.plan ?? null)
            }
          } catch {
          }
        }
      } catch {
        if (!alive) return
        setUser(false)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    run()

    return () => {
      alive = false
    }
  }, [])

  return { user, plan, loading }
}