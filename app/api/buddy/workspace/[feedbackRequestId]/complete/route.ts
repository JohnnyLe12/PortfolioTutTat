import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * PATCH /api/buddy/workspace/:feedbackRequestId/complete
 *
 * Transition a FeedbackRequest from in_review to completed.
 * Also sets the associated project's isApproved=true.
 * Creates a notification for the mentee.
 *
 * Valid transition: in_review → completed
 * Returns 422 INVALID_STATE_TRANSITION if not in in_review state.
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

    // Validate state transition: only in_review → completed is allowed
    if (feedbackRequest.status !== 'in_review') {
      return errorResponse(
        `Invalid state transition: cannot complete review from '${feedbackRequest.status}' state. FeedbackRequest must be in 'in_review' state.`,
        422,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Perform transition, set isApproved, and create notification in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update FeedbackRequest status to completed
      const updatedRequest = await tx.feedbackRequest.update({
        where: { id: feedbackRequestId },
        data: { status: 'completed' },
      })

      // Set the associated project's isApproved to true (Requirement 13.1)
      await tx.project.update({
        where: { id: feedbackRequest.project.id },
        data: { isApproved: true },
      })

      // Create notification for the mentee
      await tx.notification.create({
        data: {
          userId: feedbackRequest.mentee.userId,
          type: 'feedback_request_completed',
          title: 'Review completed',
          body: `Your project "${feedbackRequest.project.title}" has been reviewed and approved by a buddy.`,
          entityType: 'feedback_request',
          entityId: feedbackRequestId,
        },
      })

      return updatedRequest
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/buddy/workspace/:feedbackRequestId/complete]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
