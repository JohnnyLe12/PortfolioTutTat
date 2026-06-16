import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, paginatedResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/buddy/workspace
 *
 * List bookmarked portfolios with review status for the Feedback Workspace.
 * Returns: project name, mentee name, review status (Not Started, In Progress, Completed),
 * bookmark date, sorted by newest bookmark first, paginated max 20 per page.
 *
 * Query params:
 * - page (default: 1)
 * - limit (default: 20, max: 20)
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Get buddy profile
    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!buddyProfile) {
      return errorResponse(
        'Buddy profile not found. Please create a profile first.',
        404,
        'NOT_FOUND'
      )
    }

    // Parse pagination params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Count total bookmarks for this buddy
    const total = await prisma.portfolioBookmark.count({
      where: { buddyId: buddyProfile.id },
    })

    // Fetch bookmarks with project and mentee info, sorted by newest bookmark first
    const bookmarks = await prisma.portfolioBookmark.findMany({
      where: { buddyId: buddyProfile.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            mentee: {
              select: { fullName: true },
            },
          },
        },
      },
    })

    // Note: FeedbackRequest buddyId references Profile.id (mentee profile table), not BuddyProfile.id
    // We need to find the buddy's Profile record to match FeedbackRequests
    const buddyMenteeProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    // Re-fetch with correct buddy profile ID for feedback requests
    // Also look for unassigned (buddyId = null) feedback requests on bookmarked projects
    const workspaceItems = await Promise.all(
      bookmarks.map(async (bookmark) => {
        // Get the most recent FeedbackRequest for this project
        // Either assigned to this buddy OR unassigned (pending)
        let feedbackRequest = null

        // First try to find one assigned to this buddy
        if (buddyMenteeProfile) {
          feedbackRequest = await prisma.feedbackRequest.findFirst({
            where: {
              projectId: bookmark.project.id,
              buddyId: buddyMenteeProfile.id,
            },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, status: true },
          })
        }

        // If none assigned, look for unassigned pending requests
        if (!feedbackRequest) {
          feedbackRequest = await prisma.feedbackRequest.findFirst({
            where: {
              projectId: bookmark.project.id,
              buddyId: null,
              status: 'pending',
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true },
          })
        }

        // Map status to display label
        let reviewStatus: string
        if (!feedbackRequest) {
          reviewStatus = 'Not Started'
        } else if (feedbackRequest.status === 'pending') {
          reviewStatus = 'Not Started'
        } else if (feedbackRequest.status === 'in_review') {
          reviewStatus = 'In Progress'
        } else {
          reviewStatus = 'Completed'
        }

        return {
          bookmarkId: bookmark.id,
          projectId: bookmark.project.id,
          projectName: bookmark.project.title,
          menteeName: bookmark.project.mentee.fullName,
          reviewStatus,
          feedbackRequestId: feedbackRequest?.id || null,
          feedbackRequestStatus: feedbackRequest?.status || null,
          bookmarkDate: bookmark.createdAt,
        }
      })
    )

    return paginatedResponse(workspaceItems, total, page, limit)
  } catch (err) {
    console.error('[GET /api/buddy/workspace]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
