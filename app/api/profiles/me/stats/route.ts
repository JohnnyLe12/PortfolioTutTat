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

    // Find the mentee's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Aggregate total viewCount and likeCount from all projects
    const projectStats = await prisma.project.aggregate({
      where: { menteeId: profile.id },
      _sum: {
        viewCount: true,
        likeCount: true,
      },
    })

    // Count total applications
    const applicationCount = await prisma.application.count({
      where: { menteeId: profile.id },
    })

    return successResponse({
      totalViews: projectStats._sum.viewCount ?? 0,
      totalLikes: projectStats._sum.likeCount ?? 0,
      totalApplications: applicationCount,
    })
  } catch (err) {
    console.error('[GET /api/profiles/me/stats]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
