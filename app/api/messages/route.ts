import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { messageCreateSchema } from '@/lib/validations/message'

/**
 * POST /api/messages
 *
 * Send a new message in a portfolio-scoped conversation.
 * Only users with role "buddy" or "mentee" can send messages.
 *
 * Body:
 * - receiverId: UUID of the recipient
 * - content: message text (1-2000 chars, non-whitespace)
 * - portfolioContextId: UUID of the portfolio context (project/feedbackRequest)
 */
export async function POST(req: NextRequest) {
  try {
    // Role guard: only buddy or mentee (and admin) can send messages
    const authResult = await requireRole(req, ['buddy', 'mentee'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse and validate body
    const body = await req.json()
    const parsed = messageCreateSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return errorResponse(
        firstError?.message || 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { receiverId, content, portfolioContextId } = parsed.data

    // Prevent sending message to self
    if (receiverId === userId) {
      return errorResponse(
        'Cannot send a message to yourself',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    })

    if (!receiver) {
      return errorResponse('Receiver not found', 404, 'NOT_FOUND')
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim(),
        portfolioContextId,
      },
    })

    return successResponse(message, 201)
  } catch (err) {
    console.error('[POST /api/messages]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
