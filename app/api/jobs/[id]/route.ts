import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Require authenticated user
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const job = await prisma.job.findUnique({
      where: { id, isActive: true },
      include: {
        company: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!job) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    // Check if current user has bookmarked this job
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    let isBookmarked = false
    if (profile) {
      const bookmark = await prisma.jobBookmark.findUnique({
        where: {
          jobId_menteeId: { jobId: id, menteeId: profile.id },
        },
      })
      isBookmarked = !!bookmark
    }

    const jobDetail = {
      id: job.id,
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      requiredSkills: job.requiredSkills,
      jobType: job.jobType,
      location: job.location,
      isRemote: job.isRemote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      experienceLevel: job.experienceLevel,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isBookmarked,
      company: {
        id: job.company.id,
        name: job.company.profile?.fullName ?? job.company.email,
        logoUrl: job.company.profile?.avatarUrl ?? null,
      },
    }

    return successResponse(jobDetail)
  } catch (err) {
    console.error('[GET /api/jobs/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
