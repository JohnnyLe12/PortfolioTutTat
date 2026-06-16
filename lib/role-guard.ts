import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from './response'
import { verifyAccessToken } from './auth'

export interface AuthUser {
  userId: string
  role: string
}

const VALID_ROLES = ['mentee', 'buddy', 'company', 'admin'] as const

/**
 * Extracts x-user-id and x-user-role from request headers (set by middleware.ts)
 * and verifies that the user's role is allowed for the endpoint.
 *
 * Falls back to verifying the Bearer token directly if middleware headers
 * are not present (can happen in dev mode with proxy setups).
 *
 * - Returns `{ userId, role }` if role is in allowedRoles or role is "admin"
 * - Returns 401 UNAUTHORIZED if headers are missing or empty
 * - Returns 403 FORBIDDEN if role is not allowed
 *
 * Usage in route handlers:
 * ```ts
 * const authResult = await requireRole(req, ['buddy'])
 * if (authResult instanceof NextResponse) return authResult
 * const { userId, role } = authResult
 * ```
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<AuthUser | NextResponse> {
  let userId = req.headers.get('x-user-id')
  let role = req.headers.get('x-user-role')

  // Fallback: if middleware headers are missing, verify the token directly
  if (!userId || !role || userId.trim() === '' || role.trim() === '') {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        'Authentication credentials are missing or invalid',
        401,
        'UNAUTHORIZED'
      )
    }

    try {
      const token = authHeader.slice(7)
      const payload = await verifyAccessToken(token)
      userId = payload.userId
      role = payload.role
    } catch {
      return errorResponse(
        'Authentication credentials are missing or invalid',
        401,
        'UNAUTHORIZED'
      )
    }
  }

  // 403 if role value is not a recognized role
  if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    return errorResponse(
      `Role "${role}" is not recognized. Access denied.`,
      403,
      'FORBIDDEN'
    )
  }

  // Admin always gets access regardless of endpoint restriction
  if (role === 'admin') {
    return { userId, role }
  }

  // Check if user's role is in the allowed list
  if (!allowedRoles.includes(role)) {
    return errorResponse(
      `Role "${role}" does not have permission to access this resource`,
      403,
      'FORBIDDEN'
    )
  }

  return { userId, role }
}
