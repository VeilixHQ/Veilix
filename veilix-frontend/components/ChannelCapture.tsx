'use client'

import { useEffect } from 'react'
import { captureChannel } from '@/lib/channel'

export function ChannelCapture() {
  useEffect(() => {
    captureChannel()
  }, [])
  return null
}
