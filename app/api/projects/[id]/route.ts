import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { updateProjectSchema, parseTags } from '@/lib/validations/project'
import { getAuthUser } from '@/lib/auth-guard'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/projects/:id - Get project detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return errorResponse('Invalid project ID', 400, 'VALIDATION_ERROR')
    }

    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        mentee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            userId: true,
          },
        },
      },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    // Draft projects are only visible to the owner
    if (project.status === 'draft') {
      if (project.mentee.userId !== userId) {
        return errorResponse('Project not found', 404, 'NOT_FOUND')
      }
    }

    // Increment view count for non-owners
    if (project.mentee.userId !== userId) {
      await prisma.project.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      project.viewCount += 1
    }

    return successResponse(project)
  } catch (err) {
    console.error('[GET /api/projects/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// PUT /api/projects/:id - Update project
export async function PUT(
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

    const parsed = updateProjectSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { title, description, tags: rawTags } = parsed.data

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (rawTags !== undefined) updateData.tags = parseTags(rawTags)

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    return successResponse(updated)
  } catch (err) {
    console.error('[PUT /api/projects/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// DELETE /api/projects/:id - Delete project
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
    const userId = user.userId

    // Find project and verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        mentee: { select: { userId: true } },
        media: true,
        feedbackRequests: {
          where: { status: 'in_review' },
        },
      },
    })

    if (!project) {
      return errorResponse('Project not found', 404, 'NOT_FOUND')
    }

    if (project.mentee.userId !== userId) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    // Check for active FeedbackRequests with In_Review status
    const hasActiveReviews = project.feedbackRequests.length > 0
    const forceDelete = req.headers.get('x-confirm-delete') === 'true'

    if (hasActiveReviews && !forceDelete) {
      return errorResponse(
        'This project has active feedback requests in review. Please confirm deletion.',
        409,
        'CONFLICT'
      )
    }

    // Delete media from storage first
    if (project.media.length > 0) {
      try {
        await deleteMediaFromStorage(project.media)
      } catch {
        return errorResponse(
          'Media service is temporarily unavailable. Please try again later.',
          503,
          'MEDIA_SERVICE_UNAVAILABLE'
        )
      }
    }

    // Delete the project (cascades to media and feedback_requests via DB constraints)
    await prisma.project.delete({
      where: { id },
    })

    return successResponse({ message: 'Project deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/projects/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * Simulate deleting media files from external storage service.
 * In production, this would call Vercel Blob or Cloudinary API.
 * Throws if the media service is unavailable.
 */
async function deleteMediaFromStorage(
  media: { id: string; url: string }[]
): Promise<void> {
  // Simulate media service call
  // In production: await Promise.all(media.map(m => del(m.url)))
  // If the service is unavailable, this function should throw
  const mediaServiceAvailable = process.env.MEDIA_SERVICE_AVAILABLE !== 'false'

  if (!mediaServiceAvailable) {
    throw new Error('Media service unavailable')
  }

  // Proceed with deletion (simulated success)
  return
}
