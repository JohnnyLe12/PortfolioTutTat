import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return errorResponse('Profile ID is required', 400, 'VALIDATION_ERROR')
    }

    const profile = await prisma.profile.findUnique({
      where: { id },
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
        createdAt: true,
      },
    })

    // If not found by profile ID, try by userId
    const result = profile || await prisma.profile.findUnique({
      where: { userId: id },
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
        createdAt: true,
      },
    })

    if (!result) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    return successResponse(result)
  } catch (err) {
    console.error('[GET /api/profiles/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
