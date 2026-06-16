import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/response'

// JWT is stateless — no server-side token blacklist.
// The client is responsible for clearing tokens from localStorage/cookies.
// Middleware already verified the access token before reaching this handler.
export async function POST(_req: NextRequest) {
  return successResponse({ message: 'Logged out successfully' })
}
