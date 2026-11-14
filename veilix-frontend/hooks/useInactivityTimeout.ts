'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { forgetIdentity } from '@/lib/crypto'

const TIMEOUT_MS = 5 * 60 * 1000
const COUNTDOWN_S = 10

export function useInactivityTimeout() {
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_S)
  const [sessionExpired, setSessionExpired] = useState(false)

  const expireSession = useCallback(async () => {
    setShowWarning(false)
    await forgetIdentity()
    setSessionExpired(true)
  }, [])

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S)
    setShowWarning(true)
    let remaining = COUNTDOWN_S
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        expireSession()
      }
    }, 1000)
  }, [expireSession])

  const reset = useCallback(() => {
    if (sessionExpired) return 
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    setCountdown(COUNTDOWN_S)
    warningTimer.current = setTimeout(startCountdown, TIMEOUT_MS)
  }, [startCountdown, sessionExpired])

  const stayConnected = useCallback(() => { reset() }, [reset])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [reset])

  return { showWarning, countdown, stayConnected, sessionExpired, setSessionExpired }
}