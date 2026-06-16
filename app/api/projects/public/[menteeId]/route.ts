import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

// GET /api/projects/public/:menteeId - List public projects for a mentee (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ menteeId: string }> }
) {
  try {
    const { menteeId } = await params

    // Fetch all public projects for this mentee (menteeId is the Profile ID)
    const projects = await prisma.project.findMany({
      where: {
        menteeId,
        status: 'public',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        mentee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return successResponse(projects)
  } catch (err) {
    console.error('[GET /api/projects/public/:menteeId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
