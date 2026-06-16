import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const { id: feedbackId, commentId } = await params

    // Find the comment
    const comment = await prisma.feedbackComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return errorResponse('Comment not found', 404, 'NOT_FOUND')
    }

    // Verify the comment belongs to this feedback
    if (comment.feedbackId !== feedbackId) {
      return errorResponse('Comment not found', 404, 'NOT_FOUND')
    }

    // Only the comment author can delete their own comment
    if (comment.authorId !== userId) {
      return errorResponse('Forbidden: you can only delete your own comments', 403, 'FORBIDDEN')
    }

    // Delete the comment
    await prisma.feedbackComment.delete({
      where: { id: commentId },
    })

    return successResponse({ message: 'Comment deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/feedbacks/[id]/comments/[commentId]]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
