import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

// GET /api/feedback-requests/:id - Get feedback request detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            tags: true,
          },
        },
        mentee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            userId: true,
          },
        },
        buddy: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            userId: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            rating: true,
            comment: true,
            suggestions: true,
            helpfulCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!feedbackRequest) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Only the related mentee or buddy can view the feedback request
    const isMentee = feedbackRequest.mentee.userId === userId
    const isBuddy = feedbackRequest.buddy?.userId === userId

    if (!isMentee && !isBuddy) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    return successResponse(feedbackRequest)
  } catch (err) {
    console.error('[GET /api/feedback-requests/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
