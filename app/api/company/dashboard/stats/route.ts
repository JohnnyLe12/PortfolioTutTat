import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/company/dashboard/stats
 * Returns dashboard statistics for the authenticated company:
 * - activeJobs: count of jobs with isActive=true owned by the company
 * - totalApplications: count of all applications across all company jobs
 * - newApplicantsThisWeek: count of applications with createdAt in the last 7 days
 * - recentJobs: at most 5 recent jobs sorted by createdAt desc, each with application count
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only company (and admin) can access
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Query activeJobs: jobs with isActive=true owned by the company
    const activeJobs = await prisma.job.count({
      where: { companyId: userId, isActive: true },
    })

    // Query totalApplications: all applications across all company jobs
    const totalApplications = await prisma.application.count({
      where: { job: { companyId: userId } },
    })

    // Query newApplicantsThisWeek: applications with createdAt in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const newApplicantsThisWeek = await prisma.application.count({
      where: {
        job: { companyId: userId },
        createdAt: { gte: sevenDaysAgo },
      },
    })

    // Query at most 5 recent jobs sorted by createdAt desc, each with application count
    const recentJobs = await prisma.job.findMany({
      where: { companyId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    const recentJobsResponse = recentJobs.map((job) => ({
      id: job.id,
      title: job.title,
      createdAt: job.createdAt,
      applicationCount: job._count.applications,
    }))

    return successResponse({
      activeJobs,
      totalApplications,
      newApplicantsThisWeek,
      recentJobs: recentJobsResponse,
    })
  } catch (err) {
    console.error('[GET /api/company/dashboard/stats]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
