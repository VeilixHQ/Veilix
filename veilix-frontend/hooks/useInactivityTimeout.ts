'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { forgetIdentity } from '@/lib/crypto'

const TIMEOUT_MS = 5 * 60 * 1000
const COUNTDOWN_S = 10

export function useInactivityTimeout() {
  const router = useRouter()
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_S)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logout = useCallback(async () => {
    setShowWarning(false)
    await forgetIdentity()
    router.push('/access')
  }, [router])

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S)
    setShowWarning(true)

    let remaining = COUNTDOWN_S
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        logout()
      }
    }, 1000)
  }, [logout])

  const reset = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    setCountdown(COUNTDOWN_S)
    warningTimer.current = setTimeout(startCountdown, TIMEOUT_MS)
  }, [startCountdown])

  const stayConnected = useCallback(() => {
    reset()
  }, [reset])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [reset])

  return { showWarning, countdown, stayConnected }
}