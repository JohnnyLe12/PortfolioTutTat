import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

// POST /api/projects/:id/like - Toggle like on a project
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

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, likeCount: true },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    // Increment like count (simple toggle — for now just increment)
    const updated = await prisma.project.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    })

    return successResponse({ likeCount: updated.likeCount, liked: true })
  } catch (err) {
    console.error('[POST /api/projects/:id/like]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// DELETE /api/projects/:id/like - Unlike a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, likeCount: true },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    const newCount = Math.max(0, project.likeCount - 1)
    const updated = await prisma.project.update({
      where: { id },
      data: { likeCount: newCount },
      select: { likeCount: true },
    })

    return successResponse({ likeCount: updated.likeCount, liked: false })
  } catch (err) {
    console.error('[DELETE /api/projects/:id/like]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
