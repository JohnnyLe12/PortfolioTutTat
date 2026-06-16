import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    // Look up the mentee's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Query bookmarked jobs for this mentee
    const bookmarks = await prisma.jobBookmark.findMany({
      where: { menteeId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            isRemote: true,
            requiredSkills: true,
            isActive: true,
            createdAt: true,
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
        },
      },
    })

    // Shape the response: return jobs with bookmark metadata
    const bookmarkedJobs = bookmarks.map((bookmark) => ({
      id: bookmark.job.id,
      title: bookmark.job.title,
      description: bookmark.job.description,
      location: bookmark.job.location,
      jobType: bookmark.job.jobType,
      salaryMin: bookmark.job.salaryMin,
      salaryMax: bookmark.job.salaryMax,
      salaryCurrency: bookmark.job.salaryCurrency,
      isRemote: bookmark.job.isRemote,
      requiredSkills: bookmark.job.requiredSkills,
      isActive: bookmark.job.isActive,
      createdAt: bookmark.job.createdAt,
      bookmarkedAt: bookmark.createdAt,
      company: {
        id: bookmark.job.company.id,
        name: bookmark.job.company.profile?.fullName ?? bookmark.job.company.email,
        logoUrl: bookmark.job.company.profile?.avatarUrl ?? null,
      },
    }))

    return successResponse({ jobs: bookmarkedJobs, total: bookmarkedJobs.length })
  } catch (err) {
    console.error('[GET /api/jobs/bookmarked]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
