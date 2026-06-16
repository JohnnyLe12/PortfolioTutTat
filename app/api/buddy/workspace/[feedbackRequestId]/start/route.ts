import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * PATCH /api/buddy/workspace/:feedbackRequestId/start
 *
 * Transition a FeedbackRequest from pending to in_review.
 * Buddy self-assigns to the request if unassigned.
 * Creates a notification for the mentee.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackRequestId: string }> }
) {
  try {
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { feedbackRequestId } = await params

    // Get buddy's BuddyProfile (buddy users have this, not Profile)
    const buddyBProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!buddyBProfile) {
      return errorResponse('Buddy profile not found. Please create a profile first.', 404, 'NOT_FOUND')
    }

    // Also check if buddy has a Profile record (for FeedbackRequest.buddyId assignment)
    const buddyProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    // Find the FeedbackRequest
    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id: feedbackRequestId },
      include: {
        project: { select: { id: true, title: true } },
        mentee: { select: { userId: true, fullName: true } },
      },
    })

    if (!feedbackRequest) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Authorization: verify buddy has bookmarked this project
    const bookmark = await prisma.portfolioBookmark.findUnique({
      where: {
        buddyId_projectId: {
          buddyId: buddyBProfile.id,
          projectId: feedbackRequest.project.id,
        },
      },
    })

    if (!bookmark) {
      return errorResponse('You must bookmark this portfolio first', 403, 'FORBIDDEN')
    }

    // Validate state transition: only pending → in_review
    if (feedbackRequest.status !== 'pending') {
      return errorResponse(
        `Cannot start review: request is already '${feedbackRequest.status}'.`,
        422,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Perform transition
    const updated = await prisma.$transaction(async (tx) => {
      // Update status + optionally assign buddyId if Profile exists
      const updateData: { status: 'in_review'; buddyId?: string } = { status: 'in_review' }
      if (buddyProfile) {
        updateData.buddyId = buddyProfile.id
      }

      const updatedRequest = await tx.feedbackRequest.update({
        where: { id: feedbackRequestId },
        data: updateData,
      })

      // Notify mentee
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
