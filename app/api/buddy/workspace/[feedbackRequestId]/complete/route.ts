import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * PATCH /api/buddy/workspace/:feedbackRequestId/complete
 * POST /api/buddy/workspace/:feedbackRequestId/complete
 *
 * Transition a FeedbackRequest from in_review to completed.
 * Accepts optional body: { rating, comment, passed }
 * Creates a Feedback record with the buddy's review.
 * Creates a notification for the mentee.
 *
 * Valid transition: in_review → completed
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackRequestId: string }> }
) {
  return handleComplete(req, params)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackRequestId: string }> }
) {
  return handleComplete(req, params)
}

async function handleComplete(
  req: NextRequest,
  params: Promise<{ feedbackRequestId: string }>
) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { feedbackRequestId } = await params

    // Parse optional body
    let body: { rating?: number; comment?: string; passed?: boolean } = {}
    try {
      body = await req.json()
    } catch {
      // No body is OK for backward compatibility
    }

    // Get the buddy's Profile record (FeedbackRequest.buddyId references Profile.id)
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    // Get BuddyProfile for bookmark verification
    const buddyBProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    const buddyId = profile?.id || buddyBProfile?.id
    if (!buddyId) {
      return errorResponse('Profile not found.', 404, 'NOT_FOUND')
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
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Verify this buddy has access (via bookmark or assignment)
    if (buddyBProfile) {
      const bookmark = await prisma.portfolioBookmark.findUnique({
        where: {
          buddyId_projectId: {
            buddyId: buddyBProfile.id,
            projectId: feedbackRequest.project.id,
          },
        },
      })
      // Allow if bookmarked OR if assigned
      if (!bookmark && feedbackRequest.buddyId !== buddyId) {
        return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
      }
    } else if (feedbackRequest.buddyId !== buddyId) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Validate state transition: only in_review → completed is allowed
    if (feedbackRequest.status !== 'in_review') {
      return errorResponse(
        `Invalid state transition: cannot complete review from '${feedbackRequest.status}' state.`,
        422,
        'INVALID_STATE_TRANSITION'
      )
    }

    const passed = body.passed !== false
    const rating = body.rating || (passed ? 5 : 2)
    const comment = body.comment || (passed ? 'Portfolio approved' : 'Needs improvement')

    // Perform transition + create feedback record in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update FeedbackRequest status to completed
      const updatedRequest = await tx.feedbackRequest.update({
        where: { id: feedbackRequestId },
        data: { status: 'completed' },
      })

      // Create Feedback record
      await tx.feedback.create({
        data: {
          feedbackRequestId,
          buddyId,
          rating,
          comment,
          suggestions: passed ? [] : [comment],
        },
      })

      // Set project isApproved based on pass/fail
      await tx.project.update({
        where: { id: feedbackRequest.project.id },
        data: {
          isApproved: passed,
          status: 'public',
        },
      })

      // Notify the mentee
      await tx.notification.create({
        data: {
          userId: feedbackRequest.mentee.userId,
          type: 'feedback_request_completed',
          title: passed ? 'Portfolio approved!' : 'Feedback received',
          body: passed
            ? `Your project "${feedbackRequest.project.title}" has been approved by a buddy.`
            : `Your project "${feedbackRequest.project.title}" received feedback. Please review the suggestions.`,
          entityType: 'feedback_request',
          entityId: feedbackRequestId,
        },
      })

      return updatedRequest
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[/api/buddy/workspace/:feedbackRequestId/complete]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
