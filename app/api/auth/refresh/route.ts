import { NextRequest } from 'next/server'
import { verifyRefreshToken, signAccessToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { refreshToken } = body as { refreshToken?: string }

    if (!refreshToken) {
      return errorResponse('Refresh token required', 400, 'VALIDATION_ERROR')
    }

    const payload = await verifyRefreshToken(refreshToken)
    const accessToken = await signAccessToken({ userId: payload.userId, role: payload.role })

    return successResponse({ accessToken })
  } catch {
    return errorResponse('Invalid or expired refresh token', 401, 'UNAUTHORIZED')
  }
}
