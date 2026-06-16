import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/buddy/dashboard/stats
 * Returns dashboard statistics for the authenticated buddy:
 * - completedReviews: count of FeedbackRequests with status=completed assigned to buddy
 * - pendingReviews: count of FeedbackRequests with status=pending assigned to buddy
 * - activeMessages: distinct conversations with messages in last 7 days
 * - helpfulRating: totalHelpfulVotes / totalFeedbacks (rounded to 1 decimal), or 0.0
 * - recentItems: at most 5 recent FeedbackRequests sorted by assigned date descending
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Find the buddy's Profile record (used for FeedbackRequest/Feedback relations)
    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    // If buddy has no Profile, they haven't been assigned any reviews yet
    const profileId = profile?.id

    // Query completedReviews
    const completedReviews = profileId
      ? await prisma.feedbackRequest.count({
          where: { buddyId: profileId, status: 'completed' },
        })
      : 0

    // Query pendingReviews
    const pendingReviews = profileId
      ? await prisma.feedbackRequest.count({
          where: { buddyId: profileId, status: 'pending' },
        })
      : 0

    // Query activeMessages: distinct conversations with messages in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentMessages = await prisma.message.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    })

    // Count distinct conversation partners
    const conversationPartners = new Set<string>()
    for (const msg of recentMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
      conversationPartners.add(partnerId)
    }
    const activeMessages = conversationPartners.size

    // Calculate helpfulRating: totalHelpfulVotes / totalFeedbacks
    let helpfulRating = 0.0
    if (profileId) {
      const feedbacks = await prisma.feedback.findMany({
        where: { buddyId: profileId },
        select: { helpfulCount: true },
      })

      const totalFeedbacks = feedbacks.length
      if (totalFeedbacks > 0) {
        const totalHelpfulVotes = feedbacks.reduce(
          (sum, f) => sum + f.helpfulCount,
          0
        )
        helpfulRating =
          Math.round((totalHelpfulVotes / totalFeedbacks) * 10) / 10
      }
    }

    // Query at most 5 recent FeedbackRequests sorted by assigned date (updatedAt) descending
    const recentItems = profileId
      ? await prisma.feedbackRequest.findMany({
          where: { buddyId: profileId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            project: {
              select: { title: true },
            },
          },
        })
      : []

    const recentItemsResponse = recentItems.map((fr) => ({
      id: fr.id,
      projectName: fr.project.title,
      status: fr.status,
      assignedDate: fr.updatedAt,
    }))

    return successResponse({
      completedReviews,
      pendingReviews,
      activeMessages,
      helpfulRating,
      recentItems: recentItemsResponse,
    })
  } catch (err) {
    console.error('[GET /api/buddy/dashboard/stats]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
