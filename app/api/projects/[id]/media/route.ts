import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/gif',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

    // Parse multipart/form-data
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return errorResponse(
        'Invalid form data. Please send a multipart/form-data request with a file field.',
        400,
        'VALIDATION_ERROR'
      )
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return errorResponse(
        'No file provided. Please include a file field in the form data.',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        `Invalid file type "${file.type}". Allowed types: PNG, JPG, JPEG, WEBP, GIF.`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of 10MB.`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Determine next sort order
    const lastMedia = await prisma.projectMedia.findFirst({
      where: { projectId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const nextSortOrder = (lastMedia?.sortOrder ?? -1) + 1

    // Upload to Vercel Blob
    let mediaUrl: string
    try {
      const blob = await put(`projects/${id}/${file.name}`, file, {
        access: 'public',
        contentType: file.type,
      })
      mediaUrl = blob.url
    } catch (err) {
      console.error('[POST /api/projects/:id/media] Blob upload failed:', err)
      return errorResponse(
        'Media service is temporarily unavailable. Please try again later.',
        503,
        'MEDIA_SERVICE_UNAVAILABLE'
      )
    }

    // Create ProjectMedia record
    const media = await prisma.projectMedia.create({
      data: {
        projectId: id,
        url: mediaUrl,
        mediaType: 'image',
        fileName: file.name,
        fileSize: file.size,
        sortOrder: nextSortOrder,
      },
    })

    return successResponse(media, 201)
  } catch (err) {
    console.error('[POST /api/projects/:id/media]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
