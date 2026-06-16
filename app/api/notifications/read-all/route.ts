import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return successResponse({ updated: result.count })
  } catch (err) {
    console.error('[PATCH /api/notifications/read-all]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
