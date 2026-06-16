import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    })

    return successResponse({ count })
  } catch (err) {
    console.error('[GET /api/notifications/unread-count]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
