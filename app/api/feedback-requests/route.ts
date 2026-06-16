import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { createFeedbackRequestSchema } from '@/lib/validations/feedback'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    const whereClause: Record<string, unknown> = { menteeId: profile.id }
    if (statusFilter && ['pending', 'in_review', 'completed'].includes(statusFilter)) {
      whereClause.status = statusFilter
    }

    const feedbackRequests = await prisma.feedbackRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { title: true },
        },
        buddy: {
          select: { fullName: true },
        },
      },
    })

    const result = await Promise.all(feedbackRequests.map(async (fr) => {
      // Get buddy name - from Profile (via relation) or BuddyProfile if Profile doesn't exist
      let buddyName = fr.buddy?.fullName ?? null
      if (!buddyName && fr.buddyId) {
        // Try to get name from BuddyProfile via the Profile's userId
        const buddyProfileUser = await prisma.profile.findUnique({
          where: { id: fr.buddyId },
          select: { userId: true },
        })
        if (buddyProfileUser) {
          const bp = await prisma.buddyProfile.findUnique({
            where: { userId: buddyProfileUser.userId },
            select: { fullName: true },
          })
          buddyName = bp?.fullName ?? null
        }
      }

      return {
        id: fr.id,
        projectId: fr.projectId,
        projectName: fr.project.title,
        buddyId: fr.buddyId,
        buddyName,
        note: fr.note,
        status: fr.status,
        createdAt: fr.createdAt,
        updatedAt: fr.updatedAt,
      }
    }))

    return successResponse(result)
  } catch (err) {
    console.error('[GET /api/feedback-requests]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = createFeedbackRequestSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { projectId, note } = parsed.data

    // Validate project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    if (project.menteeId !== profile.id) {
      return errorResponse('Forbidden: you do not own this project', 403, 'FORBIDDEN')
    }

    // Check for duplicate active request (pending or in_review)
    const existingActive = await prisma.feedbackRequest.findFirst({
      where: {
        projectId,
        status: { in: ['pending', 'in_review'] },
      },
    })

    if (existingActive) {
      return errorResponse(
        'An active feedback request already exists for this project',
        409,
        'CONFLICT'
      )
    }

    // Run everything in a single transaction
    const feedbackRequest = await prisma.$transaction(async (tx) => {
      // Create the FeedbackRequest
      const fr = await tx.feedbackRequest.create({
        data: {
          projectId,
          menteeId: profile.id,
          note: note ?? null,
          status: 'pending',
        },
      })

      // Update project status to pending_feedback
      await tx.project.update({
        where: { id: projectId },
        data: { status: 'pending_feedback' },
      })

      // Create notification for buddy if buddyId is set
      if (fr.buddyId) {
        // Look up the buddy's userId to target the notification
        const buddyProfile = await tx.profile.findUnique({
          where: { id: fr.buddyId },
          select: { userId: true },
        })

        if (buddyProfile) {
          await tx.notification.create({
            data: {
              userId: buddyProfile.userId,
              type: 'feedback_request_created',
              title: 'New feedback request',
              body: `You have a new feedback request for project "${project.title}"`,
              entityType: 'feedback_request',
              entityId: fr.id,
            },
          })
        }
      }

      return fr
    })

    return successResponse(feedbackRequest, 201)
  } catch (err) {
    console.error('[POST /api/feedback-requests]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
