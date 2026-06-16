import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { updateProfileSchema } from '@/lib/validations/profile'
import { calculateCompletionPct } from '@/lib/profile'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    return successResponse(profile)
  } catch (err) {
    console.error('[GET /api/profiles/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const existing = await prisma.profile.findUnique({ where: { userId } })
    if (!existing) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    const data = parsed.data

    // Merge socialLinks with existing to avoid overwriting unrelated keys
    const mergedSocialLinks =
      data.socialLinks !== undefined
        ? { ...(existing.socialLinks as Record<string, string>), ...data.socialLinks }
        : existing.socialLinks

    // Build the merged profile snapshot to calculate completionPct before writing
    const mergedSnapshot = {
      ...existing,
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.roleTitle !== undefined && { roleTitle: data.roleTitle }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.major !== undefined && { major: data.major }),
      ...(data.skills !== undefined && { skills: data.skills }),
      ...(data.designTools !== undefined && { designTools: data.designTools }),
      ...(data.interests !== undefined && { interests: data.interests }),
      ...(data.socialLinks !== undefined && { socialLinks: mergedSocialLinks }),
    }

    const completionPct = calculateCompletionPct(mergedSnapshot)

    const updateData: Record<string, unknown> = { completionPct }
    if (data.fullName !== undefined) updateData.fullName = data.fullName
    if (data.roleTitle !== undefined) updateData.roleTitle = data.roleTitle
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.major !== undefined) updateData.major = data.major
    if (data.skills !== undefined) updateData.skills = data.skills
    if (data.designTools !== undefined) updateData.designTools = data.designTools
    if (data.interests !== undefined) updateData.interests = data.interests
    if (data.socialLinks !== undefined) updateData.socialLinks = mergedSocialLinks ?? {}

    const finalProfile = await prisma.profile.update({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updateData as any,
    })

    return successResponse(finalProfile)
  } catch (err) {
    console.error('[PUT /api/profiles/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
