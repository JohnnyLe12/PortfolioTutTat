import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/messages/:portfolioContextId
 *
 * Retrieve chat history for a given portfolio context.
 * Returns max 50 messages sorted by createdAt ascending (oldest first).
 * Supports cursor-based pagination for loading older messages.
 *
 * Query params:
 * - before: ISO date string — load messages older than this timestamp (for "load more")
 * - limit: number (default 50, max 50)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ portfolioContextId: string }> }
) {
  try {
    // Role guard: only buddy or mentee (and admin) can view messages
    const authResult = await requireRole(req, ['buddy', 'mentee'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { portfolioContextId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(portfolioContextId)) {
      return errorResponse(
        'Invalid portfolioContextId format',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const beforeParam = searchParams.get('before')
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

    // Build where clause: messages in this portfolio context that involve the current user
    const whereClause: Record<string, unknown> = {
      portfolioContextId,
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    }

    // If "before" cursor provided, only load messages older than that timestamp
    if (beforeParam) {
      const beforeDate = new Date(beforeParam)
      if (!isNaN(beforeDate.getTime())) {
        whereClause.createdAt = { lt: beforeDate }
      }
    }

    // Fetch messages: get the most recent `limit` messages, then reverse for oldest-first display
    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        portfolioContextId: true,
        createdAt: true,
      },
    })

    // Reverse to return oldest first (ascending order)
    messages.reverse()

    return successResponse(messages)
  } catch (err) {
    console.error('[GET /api/messages/:portfolioContextId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
