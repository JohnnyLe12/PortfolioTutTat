import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const { id } = await params

    // Find the notification and verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return errorResponse('Notification not found', 404, 'NOT_FOUND')
    }

    if (notification.userId !== userId) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    if (notification.isRead) {
      return successResponse(notification)
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/notifications/[id]/read]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
