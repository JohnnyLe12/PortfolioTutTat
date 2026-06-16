import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    // Look up mentee profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Verify job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId, isActive: true },
      select: { id: true },
    })

    if (!job) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    // Upsert bookmark (idempotent — if already bookmarked, no error)
    await prisma.jobBookmark.upsert({
      where: {
        jobId_menteeId: { jobId, menteeId: profile.id },
      },
      create: {
        jobId,
        menteeId: profile.id,
      },
      update: {},
    })

    return successResponse({ jobId, isBookmarked: true }, 201)
  } catch (err) {
    console.error('[POST /api/jobs/:id/bookmark]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    // Look up mentee profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Delete bookmark (if it doesn't exist, deleteMany returns count 0 — no error)
    await prisma.jobBookmark.deleteMany({
      where: {
        jobId,
        menteeId: profile.id,
      },
    })

    return successResponse({ jobId, isBookmarked: false })
  } catch (err) {
    console.error('[DELETE /api/jobs/:id/bookmark]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
