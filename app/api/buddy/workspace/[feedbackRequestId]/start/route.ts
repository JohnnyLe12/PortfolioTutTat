import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * PATCH /api/buddy/workspace/:feedbackRequestId/start
 *
 * Transition a FeedbackRequest from pending to in_review.
 * Creates a notification for the mentee.
 *
 * Valid transition: pending → in_review
 * Returns 422 INVALID_STATE_TRANSITION if not in pending state.
 * Returns 404 NOT_FOUND if feedbackRequest doesn't exist or doesn't belong to this buddy.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackRequestId: string }> }
) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { feedbackRequestId } = await params

    // Get the buddy's Profile record (FeedbackRequest.buddyId references Profile.id)
    const buddyProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!buddyProfile) {
      return errorResponse(
        'Profile not found. Please create a profile first.',
        404,
        'NOT_FOUND'
      )
    }

    // Find the FeedbackRequest
    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id: feedbackRequestId },
      include: {
        project: {
          select: { id: true, title: true },
        },
        mentee: {
          select: { userId: true, fullName: true },
        },
      },
    })

    if (!feedbackRequest) {
      return errorResponse(
        'Feedback request not found',
        404,
        'NOT_FOUND'
      )
    }

    // Verify this feedback request is assigned to this buddy
    if (feedbackRequest.buddyId !== buddyProfile.id) {
      return errorResponse(
        'Feedback request not found',
        404,
        'NOT_FOUND'
      )
    }

    // Validate state transition: only pending → in_review is allowed
    if (feedbackRequest.status !== 'pending') {
      return errorResponse(
        `Invalid state transition: cannot start review from '${feedbackRequest.status}' state. FeedbackRequest must be in 'pending' state.`,
        422,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Perform transition and create notification in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update FeedbackRequest status to in_review
      const updatedRequest = await tx.feedbackRequest.update({
        where: { id: feedbackRequestId },
        data: { status: 'in_review' },
      })

      // Create notification for the mentee
      await tx.notification.create({
        data: {
          userId: feedbackRequest.mentee.userId,
          type: 'feedback_request_in_review',
          title: 'Review started',
          body: `A buddy has started reviewing your project "${feedbackRequest.project.title}".`,
          entityType: 'feedback_request',
          entityId: feedbackRequestId,
        },
      })

      return updatedRequest
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/buddy/workspace/:feedbackRequestId/start]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
