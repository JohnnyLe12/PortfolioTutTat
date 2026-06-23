import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { createApplicationSchema } from '@/lib/validations/application'
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

    const applications = await prisma.application.findMany({
      where: { menteeId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { email: true },
            },
          },
        },
      },
    })

    const result = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobName: app.job.title,
      company: app.job.company.email,
      portfolioIds: app.portfolioIds,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }))

    return successResponse(result)
  } catch (err) {
    console.error('[GET /api/applications]', err)
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

    const parsed = createApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { jobId, portfolioIds } = parsed.data

    // Validate the job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    if (!job.isActive) {
      return errorResponse('This job is no longer accepting applications', 400, 'VALIDATION_ERROR')
    }

    // Check if job has open slots remaining
    if (job.openSlots !== null && job.openSlots > 0) {
      const currentApplicationCount = await prisma.application.count({
        where: {
          jobId,
          status: { in: ['submitted', 'under_review', 'accepted'] },
        },
      })
      if (currentApplicationCount >= job.openSlots) {
        return errorResponse(
          'This job has no remaining open slots. All positions have been filled.',
          400,
          'VALIDATION_ERROR'
        )
      }
    }

    // Validate mentee has at least 1 Public project
    const publicProjectCount = await prisma.project.count({
      where: {
        menteeId: profile.id,
        status: 'public',
      },
    })

    if (publicProjectCount === 0) {
      return errorResponse(
        'You must have at least one Public project before applying',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Check for duplicate application (job_id + mentee_id unique constraint)
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_menteeId: {
          jobId,
          menteeId: profile.id,
        },
      },
    })

    if (existingApplication) {
      return errorResponse(
        'You have already applied for this job',
        409,
        'CONFLICT'
      )
    }

    // Create application and notification in a single transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId,
          menteeId: profile.id,
          portfolioIds,
          status: 'submitted',
        },
      })

      // Create confirmation notification for the Mentee
      await tx.notification.create({
        data: {
          userId,
          type: 'application_submitted',
          title: 'Application submitted',
          body: `Your application for "${job.title}" has been submitted successfully`,
          entityType: 'application',
          entityId: app.id,
        },
      })

      return app
    })

    return successResponse(application, 201)
  } catch (err) {
    console.error('[POST /api/applications]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
