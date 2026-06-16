import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const { id: feedbackId } = await params

    // Verify feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return errorResponse('Feedback not found', 404, 'NOT_FOUND')
    }

    // Check if user already voted (using composite key)
    const existingVote = await prisma.feedbackHelpfulVote.findUnique({
      where: {
        feedbackId_userId: { feedbackId, userId },
      },
    })

    // Idempotent: if already voted, return success without incrementing
    if (existingVote) {
      return successResponse({ feedbackId, userId, helpfulCount: feedback.helpfulCount })
    }

    // Create vote and increment helpfulCount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.feedbackHelpfulVote.create({
        data: {
          feedbackId,
          userId,
        },
      })

      const updatedFeedback = await tx.feedback.update({
        where: { id: feedbackId },
        data: { helpfulCount: { increment: 1 } },
        select: { helpfulCount: true },
      })

      return updatedFeedback
    })

    return successResponse({
      feedbackId,
      userId,
      helpfulCount: result.helpfulCount,
    })
  } catch (err) {
    console.error('[POST /api/feedbacks/[id]/helpful]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const { id: feedbackId } = await params

    // Verify feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return errorResponse('Feedback not found', 404, 'NOT_FOUND')
    }

    // Check if vote exists
    const existingVote = await prisma.feedbackHelpfulVote.findUnique({
      where: {
        feedbackId_userId: { feedbackId, userId },
      },
    })

    if (!existingVote) {
      return errorResponse('Vote not found', 404, 'NOT_FOUND')
    }

    // Delete vote and decrement helpfulCount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.feedbackHelpfulVote.delete({
        where: {
          feedbackId_userId: { feedbackId, userId },
        },
      })

      const updatedFeedback = await tx.feedback.update({
        where: { id: feedbackId },
        data: { helpfulCount: { decrement: 1 } },
        select: { helpfulCount: true },
      })

      return updatedFeedback
    })

    return successResponse({
      feedbackId,
      userId,
      helpfulCount: result.helpfulCount,
    })
  } catch (err) {
    console.error('[DELETE /api/feedbacks/[id]/helpful]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
