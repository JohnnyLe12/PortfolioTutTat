import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { createCommentSchema } from '@/lib/validations/feedback'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(
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

    // Verify the feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return errorResponse('Feedback not found', 404, 'NOT_FOUND')
    }

    // Get all comments for this feedback, ordered by createdAt ascending
    const comments = await prisma.feedbackComment.findMany({
      where: { feedbackId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    const result = comments.map((c) => ({
      id: c.id,
      feedbackId: c.feedbackId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        id: c.author.id,
        email: c.author.email,
        role: c.author.role,
        fullName: c.author.profile?.fullName ?? null,
        avatarUrl: c.author.profile?.avatarUrl ?? null,
      },
    }))

    return successResponse(result)
  } catch (err) {
    console.error('[GET /api/feedbacks/[id]/comments]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

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

    // Verify the feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return errorResponse('Feedback not found', 404, 'NOT_FOUND')
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Content must not be empty',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { content } = parsed.data

    // Create the comment
    const comment = await prisma.feedbackComment.create({
      data: {
        feedbackId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    const result = {
      id: comment.id,
      feedbackId: comment.feedbackId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        email: comment.author.email,
        role: comment.author.role,
        fullName: comment.author.profile?.fullName ?? null,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
      },
    }

    return successResponse(result, 201)
  } catch (err) {
    console.error('[POST /api/feedbacks/[id]/comments]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
