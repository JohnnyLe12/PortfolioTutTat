import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * DELETE /api/buddy/portfolios/bookmark/:projectId
 *
 * Remove a portfolio bookmark.
 *
 * - 200 on success
 * - 404 if bookmark does not exist
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { projectId } = await params

    // Validate projectId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return errorResponse('Invalid project ID format', 400, 'VALIDATION_ERROR')
    }

    // Get buddy profile
    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!buddyProfile) {
      return errorResponse('Buddy profile not found. Please create a profile first.', 404, 'NOT_FOUND')
    }

    // Find the bookmark
    const bookmark = await prisma.portfolioBookmark.findUnique({
      where: {
        buddyId_projectId: {
          buddyId: buddyProfile.id,
          projectId,
        },
      },
    })

    if (!bookmark) {
      return errorResponse('Bookmark not found', 404, 'NOT_FOUND')
    }

    // Delete the bookmark
    await prisma.portfolioBookmark.delete({
      where: { id: bookmark.id },
    })

    return successResponse({ message: 'Bookmark removed successfully' })
  } catch (err) {
    console.error('[DELETE /api/buddy/portfolios/bookmark/:projectId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
