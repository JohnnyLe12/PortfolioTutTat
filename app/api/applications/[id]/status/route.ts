import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

const updateApplicationStatusSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'accepted', 'rejected']),
})

// PATCH /api/applications/:id/status - Company updates application status
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
    const userRole = user.role

    // Only company role can update application status
    if (userRole !== 'company') {
      return errorResponse('Forbidden: only company can update application status', 403, 'FORBIDDEN')
    }

    // Find application with related job and mentee
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

    // Only the company that posted the job can update status
    if (application.job.companyId !== userId) {
      return errorResponse('Forbidden: you are not the owner of this job', 403, 'FORBIDDEN')
    }

    // Parse and validate body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = updateApplicationStatusSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { status: newStatus } = parsed.data
    const currentStatus = application.status

    // Check if same status (no-op)
    if (currentStatus === newStatus) {
      return errorResponse(
        `Application is already in '${currentStatus}' status`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Update the application status
    const updated = await prisma.application.update({
      where: { id },
      data: { status: newStatus as any },
    })

    // Create notification for the Mentee (best-effort, non-blocking)
    const menteeUserId = application.mentee.userId
    const jobTitle = application.job.title

    const statusLabels: Record<string, string> = {
      under_review: 'under review',
      accepted: 'accepted',
      rejected: 'rejected',
      submitted: 'submitted',
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
      .then(() => {
        // Notification created successfully
      })
      .catch((err) => {
        console.error('[PATCH /api/applications/:id/status] Failed to create notification:', err)
      })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/applications/:id/status]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
