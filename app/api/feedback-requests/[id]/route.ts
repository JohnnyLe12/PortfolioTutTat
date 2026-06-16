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

    // Enrich buddy info from BuddyProfile if buddy Profile has generic name
    let buddyData = feedbackRequest.buddy
    if (buddyData && buddyData.userId) {
      const buddyProfile = await prisma.buddyProfile.findUnique({
        where: { userId: buddyData.userId },
        select: { fullName: true, avatarUrl: true },
      })
      if (buddyProfile && buddyProfile.fullName) {
        buddyData = { ...buddyData, fullName: buddyProfile.fullName, avatarUrl: buddyProfile.avatarUrl || buddyData.avatarUrl }
      }
    }

    const responseData = {
      ...feedbackRequest,
      buddy: buddyData,
    }

    // Only the related mentee or buddy can view the feedback request
    const isMentee = feedbackRequest.mentee.userId === userId
    const isBuddy = feedbackRequest.buddy?.userId === userId

    if (!isMentee && !isBuddy) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    return successResponse(responseData)
  } catch (err) {
    console.error('[GET /api/feedback-requests/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
