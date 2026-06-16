import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

const reorderSchema = z.object({
  items: z.array(
    z.object({
      mediaId: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ).min(1),
})

export async function PATCH(
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

    // Find project and verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        mentee: { select: { userId: true } },
      },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    if (project.mentee.userId !== userId) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    // Parse and validate body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { items } = parsed.data

    // Verify all media IDs belong to this project
    const mediaIds = items.map((item) => item.mediaId)
    const existingMedia = await prisma.projectMedia.findMany({
      where: {
        id: { in: mediaIds },
        projectId: id,
      },
      select: { id: true },
    })

    const existingIds = new Set(existingMedia.map((m) => m.id))
    const invalidIds = mediaIds.filter((mid) => !existingIds.has(mid))

    if (invalidIds.length > 0) {
      return errorResponse(
        `Media not found for this project: ${invalidIds.join(', ')}`,
        404,
        'NOT_FOUND'
      )
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.projectMedia.update({
          where: { id: item.mediaId },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    // Return updated media list
    const updatedMedia = await prisma.projectMedia.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return successResponse(updatedMedia)
  } catch (err) {
    console.error('[PATCH /api/projects/:id/media/reorder]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
