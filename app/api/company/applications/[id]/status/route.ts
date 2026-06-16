import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { applicationStatusUpdateSchema } from '@/lib/validations/application-status'

/**
 * Valid status transitions (one-way flow):
 * submitted → under_review
 * under_review → accepted | rejected
 * accepted → (terminal)
 * rejected → (terminal)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
}

/**
 * PATCH /api/company/applications/:id/status
 * Updates the status of an application following the state machine.
 * Verifies company owns the job before allowing status updates.
 * Sends best-effort notification to mentee on status change.
 * Requirements: 9.5, 9.6, 9.7
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Find the application with its related job and mentee
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
        mentee: {
          select: {
            id: true,
            userId: true,
            fullName: true,
          },
        },
      },
    })

    if (!application) {
      return errorResponse('Application not found', 404, 'NOT_FOUND')
    }

    // Verify the company owns the job
    if (application.job.companyId !== userId) {
      return errorResponse(
        'Forbidden: you are not the owner of this job',
        403,
        'FORBIDDEN'
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = applicationStatusUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { status: newStatus } = parsed.data
    const currentStatus = application.status

    // Validate state machine transition
    const validNextStates = VALID_TRANSITIONS[currentStatus] ?? []
    if (!validNextStates.includes(newStatus)) {
      return errorResponse(
        `Invalid status transition: cannot move from "${currentStatus}" to "${newStatus}". ` +
          `Current status is "${currentStatus}" and valid next states are: ${
            validNextStates.length > 0
              ? validNextStates.map((s) => `"${s}"`).join(', ')
              : 'none (terminal state)'
          }.`,
        422,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Update the application status
    const updated = await prisma.application.update({
      where: { id },
      data: { status: newStatus as any },
    })

    // Create notification for the mentee (best-effort, don't fail if notification fails)
    const menteeUserId = application.mentee.userId
    const jobTitle = application.job.title

    const statusLabels: Record<string, string> = {
      under_review: 'under review',
      accepted: 'accepted',
      rejected: 'rejected',
    }

    const notificationTitle = `Application ${statusLabels[newStatus] || newStatus}`
    const notificationBody = `Your application for "${jobTitle}" has been ${statusLabels[newStatus] || newStatus}.`

    // Best-effort notification: fire and forget, don't block the response
    prisma.notification
      .create({
        data: {
          userId: menteeUserId,
          type: `application_${newStatus}`,
          title: notificationTitle,
          body: notificationBody,
          entityType: 'application',
          entityId: id,
        },
      })
      .catch((err) => {
        console.error(
          '[PATCH /api/company/applications/:id/status] Failed to create notification:',
          err
        )
      })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/company/applications/:id/status]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
