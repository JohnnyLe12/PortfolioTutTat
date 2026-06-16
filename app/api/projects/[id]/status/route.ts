import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { updateProjectStatusSchema, VALID_STATUS_TRANSITIONS } from '@/lib/validations/project'
import { getAuthUser } from '@/lib/auth-guard'

// PATCH /api/projects/:id/status - Change project status
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

    // Find project and verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        mentee: { select: { userId: true } },
      },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    if (project.mentee.userId !== userId) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    // Parse and validate body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = updateProjectStatusSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { status: newStatus } = parsed.data
    const currentStatus = project.status

    // Check if the transition is the same status (no-op)
    if (currentStatus === newStatus) {
      return errorResponse(
        `Project is already in '${currentStatus}' status`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      return errorResponse(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Update the project status
    const updated = await prisma.project.update({
      where: { id },
      data: { status: newStatus as any },
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PATCH /api/projects/:id/status]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
