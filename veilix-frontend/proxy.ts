import { NextRequest, NextResponse } from 'next/server'

function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').origin
  } catch {
    return 'http://127.0.0.1:8000'
  }
}

function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const connectSources = ["'self'", apiOrigin()]
  if (isDev) {
    connectSources.push('ws://localhost:*', 'ws://127.0.0.1:*')
  }

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' blob: data:",
    `connect-src ${connectSources.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]
  if (!isDev) {
    directives.push('upgrade-insecure-requests')
  }
  return directives.join('; ')
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'development')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('Content-Security-Policy', contentSecurityPolicy)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
