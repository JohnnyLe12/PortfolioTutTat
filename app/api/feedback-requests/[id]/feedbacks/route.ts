import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { createFeedbackSchema } from '@/lib/validations/feedback'
import { getAuthUser } from '@/lib/auth-guard'

// GET /api/feedback-requests/:id/feedbacks - List feedbacks for a feedback request
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

    // Verify the feedback request exists
    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id },
    })

    if (!feedbackRequest) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Only return feedbacks when the FeedbackRequest status is completed
    if (feedbackRequest.status !== 'completed') {
      return errorResponse(
        'Feedbacks are only available when the feedback request is completed',
        403,
        'FORBIDDEN'
      )
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { feedbackRequestId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        buddy: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            roleTitle: true,
          },
        },
      },
    })

    const result = feedbacks.map((f) => ({
      id: f.id,
      feedbackRequestId: f.feedbackRequestId,
      buddyId: f.buddyId,
      buddyName: f.buddy.fullName,
      buddyAvatar: f.buddy.avatarUrl,
      buddyRoleTitle: f.buddy.roleTitle,
      rating: f.rating,
      comment: f.comment,
      suggestions: f.suggestions,
      helpfulCount: f.helpfulCount,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }))

    return successResponse(result)
  } catch (err) {
    console.error('[GET /api/feedback-requests/:id/feedbacks]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// POST /api/feedback-requests/:id/feedbacks - Buddy creates feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId
    const userRole = user.role

    // Only buddies can create feedback
    if (userRole !== 'buddy') {
      return errorResponse('Only buddies can submit feedback', 403, 'FORBIDDEN')
    }

    // Look up the buddy's profile
    const buddyProfile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!buddyProfile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Verify the feedback request exists
    const feedbackRequest = await prisma.feedbackRequest.findUnique({
      where: { id },
    })

    if (!feedbackRequest) {
      return errorResponse('Feedback request not found', 404, 'NOT_FOUND')
    }

    // Parse and validate the request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = createFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { rating, comment, suggestions } = parsed.data

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        feedbackRequestId: id,
        buddyId: buddyProfile.id,
        rating,
        comment,
        suggestions: suggestions ?? [],
      },
    })

    return successResponse(feedback, 201)
  } catch (err) {
    console.error('[POST /api/feedback-requests/:id/feedbacks]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
