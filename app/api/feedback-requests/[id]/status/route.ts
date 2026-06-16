import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

// Valid status transitions: Pending → In_Review → Completed (sequential only)
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_review'],
  in_review: ['completed'],
  completed: [], // terminal state
}

const updateFeedbackRequestStatusSchema = z.object({
  status: z.enum(['pending', 'in_review', 'completed']),
})

// PATCH /api/feedback-requests/:id/status - Update feedback request status
export async function PATCH(
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

    // Find feedback request with related profiles
    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id },
      include: {
        mentee: {
          select: { id: true, userId: true, fullName: true },
        },
        buddy: {
          select: { id: true, userId: true, fullName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    })

    if (!feedbackRequest) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Only the related mentee or buddy can update the status
    const isMentee = feedbackRequest.mentee.userId === userId
    const isBuddy = feedbackRequest.buddy?.userId === userId

    if (!isMentee && !isBuddy) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    // Parse and validate body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = updateFeedbackRequestStatusSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { status: newStatus } = parsed.data
    const currentStatus = feedbackRequest.status

    // Check if same status (no-op)
    if (currentStatus === newStatus) {
      return errorResponse(
        `Feedback request is already in '${currentStatus}' status`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Validate status transition (sequential only: pending → in_review → completed)
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      return errorResponse(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Update status and create notification for mentee in a single transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update the feedback request status
      const updatedRequest = await tx.feedbackRequest.update({
        where: { id },
        data: { status: newStatus as any },
      })

      // Create notification for the Mentee about status change
      // Note: When Completed, do NOT automatically change project status (Requirement 6.4)
      const menteeUserId = feedbackRequest.mentee.userId
      const projectTitle = feedbackRequest.project.title

      let notificationTitle: string
      let notificationBody: string

      if (newStatus === 'in_review') {
        notificationTitle = 'Feedback request in review'
        notificationBody = `Your feedback request for "${projectTitle}" is now being reviewed.`
      } else {
        // completed
        notificationTitle = 'Feedback completed'
        notificationBody = `The feedback for your project "${projectTitle}" has been completed.`
      }

      await tx.notification.create({
        data: {
          userId: menteeUserId,
          type: `feedback_request_${newStatus}`,
          title: notificationTitle,
          body: notificationBody,
          entityType: 'feedback_request',
          entityId: id,
        },
      })

      return updatedRequest
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/feedback-requests/:id/status]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
