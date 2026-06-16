import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { calculateCompletionPct } from '@/lib/profile'
import { getAuthUser } from '@/lib/auth-guard'

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

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
        `Invalid file type "${file.type}". Allowed types: PNG, JPG, JPEG, WEBP.`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of 5MB.`,
        400,
        'VALIDATION_ERROR'
      )
    }

    // Check that profile exists
    const profile = await prisma.profile.findUnique({ where: { userId } })
    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // Upload to Vercel Blob (or local fallback in development)
    let avatarUrl: string
    try {
      console.log('[POST /api/profiles/me/avatar] Attempting Vercel Blob upload...')
      console.log('[POST /api/profiles/me/avatar] BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN)
      console.log('[POST /api/profiles/me/avatar] Token prefix:', process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20))
      const blob = await put(`avatars/${userId}/${file.name}`, file, {
        access: 'public',
        contentType: file.type,
      })
      avatarUrl = blob.url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[POST /api/profiles/me/avatar] Blob upload failed:', errorMessage)
      console.error('[POST /api/profiles/me/avatar] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err as object)))
      
      // Fallback: save locally in development
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
          await fs.mkdir(uploadDir, { recursive: true })
          const fileName = `${userId}-${Date.now()}-${file.name}`
          const filePath = path.join(uploadDir, fileName)
          const buffer = Buffer.from(await file.arrayBuffer())
          await fs.writeFile(filePath, buffer)
          avatarUrl = `/uploads/avatars/${fileName}`
        } catch (localErr) {
          console.error('[POST /api/profiles/me/avatar] Local fallback also failed:', localErr)
          return errorResponse(
            'Media service is temporarily unavailable. Please try again later.',
            503,
            'MEDIA_SERVICE_UNAVAILABLE'
          )
        }
      } else {
        return errorResponse(
          `Media service error: ${errorMessage}`,
          503,
          'MEDIA_SERVICE_UNAVAILABLE'
        )
      }
    }

    // Update avatarUrl in profile and recalculate completionPct
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    })

    const completionPct = calculateCompletionPct(updatedProfile)

    const finalProfile = await prisma.profile.update({
      where: { userId },
      data: { completionPct },
    })

    return successResponse({
      avatarUrl: finalProfile.avatarUrl,
      completionPct: finalProfile.completionPct,
    })
  } catch (err) {
    console.error('[POST /api/profiles/me/avatar]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
