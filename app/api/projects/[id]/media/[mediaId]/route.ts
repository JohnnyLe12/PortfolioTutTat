import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id, mediaId } = await params
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

    // Find the media record
    const media = await prisma.projectMedia.findUnique({
      where: { id: mediaId },
    })

    if (!media || media.projectId !== id) {
      return errorResponse('Media not found', 404, 'NOT_FOUND')
    }

    // Delete from external storage (simulate)
    try {
      await deleteMediaFromStorage(media.url)
    } catch (err) {
      console.error('[DELETE /api/projects/:id/media/:mediaId] Storage delete failed:', err)
      return errorResponse(
        'Media service is temporarily unavailable. Please try again later.',
        503,
        'MEDIA_SERVICE_UNAVAILABLE'
      )
    }

    // Delete DB record
    await prisma.projectMedia.delete({
      where: { id: mediaId },
    })

    return successResponse({ message: 'Media deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/projects/:id/media/:mediaId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * Simulate deleting a media file from external storage service.
 * In production, this would call Vercel Blob del() or Cloudinary destroy().
 * Throws if the media service is unavailable.
 */
async function deleteMediaFromStorage(url: string): Promise<void> {
  const mediaServiceAvailable = process.env.MEDIA_SERVICE_AVAILABLE !== 'false'

  if (!mediaServiceAvailable) {
    throw new Error('Media service unavailable')
  }

  // Simulated success — in production: await del(url)
  void url
  return
}
