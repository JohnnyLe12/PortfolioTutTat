import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { z } from 'zod'

const bookmarkCreateSchema = z.object({
  projectId: z.string().uuid(),
})

/**
 * POST /api/buddy/portfolios/bookmark
 *
 * Bookmark a portfolio (project) for later review.
 * Body: { projectId: string (UUID) }
 *
 * - 201 on success
 * - 404 if project does not exist
 * - 409 if bookmark already exists (duplicate)
 */
export async function POST(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse and validate body
    const body = await req.json()
    const parsed = bookmarkCreateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR')
    }

    const { projectId } = parsed.data

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    // Get buddy profile (buddyId maps to BuddyProfile.id, not User.id)
    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!buddyProfile) {
      return errorResponse('Buddy profile not found. Please create a profile first.', 404, 'NOT_FOUND')
    }

    // Check for duplicate bookmark
    const existingBookmark = await prisma.portfolioBookmark.findUnique({
      where: {
        buddyId_projectId: {
          buddyId: buddyProfile.id,
          projectId,
        },
      },
    })

    if (existingBookmark) {
      return errorResponse(
        'Portfolio is already bookmarked',
        409,
        'CONFLICT'
      )
    }

    // Create bookmark
    const bookmark = await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddyProfile.id,
        projectId,
      },
    })

    return successResponse(bookmark, 201)
  } catch (err) {
    console.error('[POST /api/buddy/portfolios/bookmark]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
