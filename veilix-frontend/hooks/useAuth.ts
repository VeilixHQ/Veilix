'use client'

import { useEffect, useState } from 'react'
import { checkAuth } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const run = async () => {
      try {
        const result = await checkAuth()
        if (!alive) return

        setUser(!!result)
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

  return { user, loading }
}