import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

/**
 * GET /api/applications/portfolios
 *
 * Returns the current mentee's public portfolios for the job application
 * portfolio selector. Each portfolio includes an `isApproved` field so the
 * frontend can display "Buddy Approved" or "Unreviewed" badge.
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */
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

    // Only show projects with status = public (Requirement 13.4)
    const publicProjects = await prisma.project.findMany({
      where: {
        menteeId: profile.id,
        status: 'public',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        isApproved: true,
        createdAt: true,
      },
    })

    // Map to response with badge info (Requirement 13.2, 13.3)
    const portfolios = publicProjects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      isApproved: project.isApproved,
      badge: project.isApproved ? 'Buddy Approved' : 'Unreviewed',
      createdAt: project.createdAt,
    }))

    return successResponse(portfolios)
  } catch (err) {
    console.error('[GET /api/applications/portfolios]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
