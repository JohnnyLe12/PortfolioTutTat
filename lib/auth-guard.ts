import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Extract and verify the JWT from the request Authorization header.
 * Returns the decoded payload (userId, role) or null if invalid.
 * 
 * Use this in route handlers as a fallback when middleware headers
 * (x-user-id) are not present.
 */
export async function getAuthUser(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  // First check if middleware already set x-user-id
  const middlewareUserId = req.headers.get('x-user-id')
  const middlewareRole = req.headers.get('x-user-role')
  if (middlewareUserId && middlewareRole) {
    return { userId: middlewareUserId, role: middlewareRole }
  }

  // Fallback: verify token directly
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  
  try {
    const jwtSecret = process.env.JWT_ACCESS_SECRET
    if (!jwtSecret) {
      return null
    }
    const secret = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId as string, role: payload.role as string }
  } catch {
    return null
  }
}
