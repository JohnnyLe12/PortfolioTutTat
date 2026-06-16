import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose' // Import jwtVerify từ jose để tương thích với Edge Runtime

const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/debug',
  '/api/jobs',
  '/api/projects/public',
]

// Match /api/profiles/:id (UUID) but NOT /api/profiles/me or /api/profiles/me/*
const PROFILE_PUBLIC_PATTERN = /^\/api\/profiles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPublicRoute(pathname: string): boolean {
  if (PROFILE_PUBLIC_PATTERN.test(pathname)) {
    return true
  }

  return PUBLIC_ROUTES.some(
    route =>
      pathname === route ||
      pathname.startsWith(route + '/') ||
      pathname.startsWith('/api/projects/public/')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle /api routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes through without auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract Bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', code: 'NO_AUTH_HEADER', debug: authHeader ? authHeader.substring(0, 50) : 'null' } },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7)

  try {
    const jwtSecret = process.env.JWT_ACCESS_SECRET
    
    if (!jwtSecret) {
      console.error('[middleware] JWT_ACCESS_SECRET is not defined!')
      return NextResponse.json(
        { success: false, error: { message: 'Server configuration error', code: 'CONFIG_ERROR' } },
        { status: 500 }
      )
    }
    
    console.log('[middleware] Secret length:', jwtSecret.length, '| Token first 20:', token.substring(0, 20))
    
    // Giải mã bí mật JWT_ACCESS_SECRET dưới dạng TextEncoder tương thích Edge Runtime
    const secret = new TextEncoder().encode(jwtSecret)
    
    // Sử dụng jose để xác thực token bất đồng bộ (async/await)
    const { payload } = await jwtVerify(token, secret)

    // Forward user info to route handlers via headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-role', payload.role as string)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED', debug: (error as Error).message, secretLen: (process.env.JWT_ACCESS_SECRET || '').length, tokenFirst20: token.substring(0, 20) } },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: '/api/:path*',
}