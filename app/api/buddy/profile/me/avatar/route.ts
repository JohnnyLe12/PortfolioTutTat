import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return errorResponse('Invalid form data', 400, 'VALIDATION_ERROR')
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return errorResponse('No file provided', 400, 'VALIDATION_ERROR')
    }

    const ALLOWED = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      return errorResponse('Invalid file type', 400, 'VALIDATION_ERROR')
    }
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('File too large (max 5MB)', 400, 'VALIDATION_ERROR')
    }

    const buddyProfile = await prisma.buddyProfile.findUnique({ where: { userId } })
    if (!buddyProfile) {
      return errorResponse('Buddy profile not found', 404, 'NOT_FOUND')
    }

    let avatarUrl: string
    try {
      const blob = await put(`buddy-avatars/${userId}/${file.name}`, file, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: true,
      })
      avatarUrl = blob.url
    } catch (err) {
      // Local fallback for development
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
        const fs = await import('fs/promises')
        const path = await import('path')
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        await fs.mkdir(uploadDir, { recursive: true })
        const fileName = `buddy-${userId}-${Date.now()}-${file.name}`
        const filePath = path.join(uploadDir, fileName)
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(filePath, buffer)
        avatarUrl = `/uploads/avatars/${fileName}`
      } else {
        return errorResponse('Media service unavailable', 503, 'MEDIA_SERVICE_UNAVAILABLE')
      }
    }

    await prisma.buddyProfile.update({
      where: { userId },
      data: { avatarUrl },
    })

    // Sync Profile record if exists
    const profileRecord = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
    if (profileRecord) {
      await prisma.profile.update({ where: { userId }, data: { avatarUrl } })
    }

    return successResponse({ avatarUrl })
  } catch (err) {
    console.error('[POST /api/buddy/profile/me/avatar]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
