import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/company/jobs/:id/applicants
 * Lists all applicants for a specific job owned by the authenticated company.
 * Returns mentee name, apply date, status, and portfolio link.
 * Sorted by apply date descending (newest first).
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.8
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Verify the job exists and is owned by this company
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        companyId: true,
        isActive: true,
      },
    })

    if (!job) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    if (job.companyId !== userId) {
      return errorResponse(
        'Forbidden: you are not the owner of this job',
        403,
        'FORBIDDEN'
      )
    }

    // Fetch applicants with mentee profile information
    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        mentee: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            skills: true,
            designTools: true,
            avatarUrl: true,
            projects: {
              where: { status: 'public' },
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    const applicants = applications.map((app) => ({
      applicationId: app.id,
      menteeId: app.mentee.id,
      menteeUserId: app.mentee.userId,
      menteeName: app.mentee.fullName,
      menteeAvatarUrl: app.mentee.avatarUrl,
      applyDate: app.createdAt,
      status: app.status,
      portfolioIds: app.portfolioIds,
      portfolios: app.mentee.projects.filter((p) =>
        app.portfolioIds.includes(p.id)
      ),
    }))

    return successResponse({
      job: {
        id: job.id,
        title: job.title,
        isActive: job.isActive,
      },
      applicants,
      total: applicants.length,
    })
  } catch (err) {
    console.error('[GET /api/company/jobs/:id/applicants]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
