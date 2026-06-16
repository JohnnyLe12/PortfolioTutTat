import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

// GET /api/projects/:id/feedback-summary - Get aggregated feedback stats for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    // Get all feedbacks from completed feedback requests for this project
    const feedbacks = await prisma.feedback.findMany({
      where: {
        feedbackRequest: {
          projectId: id,
          status: 'completed',
        },
      },
      select: {
        rating: true,
        helpfulCount: true,
      },
    })

    const feedbackCount = feedbacks.length

    // Calculate avgRating rounded to 1 decimal place
    const avgRating =
      feedbackCount > 0
        ? Math.round(
            (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbackCount) * 10
          ) / 10
        : 0

    // Calculate total helpfulCount
    const totalHelpfulCount = feedbacks.reduce(
      (sum, f) => sum + f.helpfulCount,
      0
    )

    return successResponse({
      projectId: id,
      avgRating,
      totalHelpfulCount,
      feedbackCount,
    })
  } catch (err) {
    console.error('[GET /api/projects/:id/feedback-summary]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
