import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

/**
 * GET /api/buddy/profile/:userId
 * Returns a buddy's public profile by their userId.
 * Any authenticated user can view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }

    const { userId } = await params

    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        roleTitle: true,
        bio: true,
        avatarUrl: true,
        major: true,
        skills: true,
        designTools: true,
        interests: true,
        socialLinks: true,
        completionPct: true,
      },
    })

    if (!buddyProfile) {
      return errorResponse('Buddy profile not found', 404, 'NOT_FOUND')
    }

    return successResponse(buddyProfile)
  } catch (err) {
    console.error('[GET /api/buddy/profile/:userId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
