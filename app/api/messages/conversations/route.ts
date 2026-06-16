import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

/**
 * GET /api/messages/conversations
 *
 * List active conversations for the authenticated user.
 * Returns distinct portfolio contexts with the most recent message and other participant info.
 * A conversation is considered "active" if it has at least one message involving the user.
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only buddy or mentee (and admin) can view conversations
    const authResult = await requireRole(req, ['buddy', 'mentee'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Find distinct portfolio contexts where the user has sent or received messages
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        portfolioContextId: { not: null },
      },
      distinct: ['portfolioContextId'],
      orderBy: { createdAt: 'desc' },
      select: {
        portfolioContextId: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Build conversation list with other participant info
    const conversationList = await Promise.all(
      conversations.map(async (msg) => {
        // Determine the other participant
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId

        // Fetch other participant's basic info
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            email: true,
            role: true,
          },
        })

        // Get the other user's display name based on role
        let otherUserName = otherUser?.email || 'Unknown'
        if (otherUser?.role === 'buddy') {
          const buddyProfile = await prisma.buddyProfile.findUnique({
            where: { userId: otherUserId },
            select: { fullName: true },
          })
          if (buddyProfile) otherUserName = buddyProfile.fullName
        } else if (otherUser?.role === 'mentee') {
          const menteeProfile = await prisma.profile.findUnique({
            where: { userId: otherUserId },
            select: { fullName: true },
          })
          if (menteeProfile) otherUserName = menteeProfile.fullName
        }

        return {
          portfolioContextId: msg.portfolioContextId,
          projectTitle: msg.project?.title || null,
          otherParticipant: {
            id: otherUserId,
            name: otherUserName,
            role: otherUser?.role || null,
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isMine: msg.senderId === userId,
          },
        }
      })
    )

    return successResponse(conversationList)
  } catch (err) {
    console.error('[GET /api/messages/conversations]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
