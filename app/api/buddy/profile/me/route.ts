import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { buddyProfileUpdateSchema } from '@/lib/validations/buddy-profile'
import { calculateBuddyCompletionPct } from '@/lib/buddy-profile'

/**
 * GET /api/buddy/profile/me
 * Returns the authenticated buddy's own profile.
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const profile = await prisma.buddyProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('BuddyProfile not found', 404, 'NOT_FOUND')
    }

    return successResponse(profile)
  } catch (err) {
    console.error('[GET /api/buddy/profile/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * PUT /api/buddy/profile/me
 * Updates the authenticated buddy's profile.
 * Recalculates completionPct on each update.
 */
export async function PUT(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = buddyProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Check if profile exists
    const existing = await prisma.buddyProfile.findUnique({
      where: { userId },
    })
    if (!existing) {
      return errorResponse('BuddyProfile not found', 404, 'NOT_FOUND')
    }

    const data = parsed.data

    // Merge socialLinks with existing to avoid overwriting unrelated keys
    const mergedSocialLinks =
      data.socialLinks !== undefined
        ? { ...(existing.socialLinks as Record<string, string>), ...data.socialLinks }
        : existing.socialLinks

    // Build merged snapshot to calculate completionPct
    const mergedSnapshot = {
      ...existing,
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.roleTitle !== undefined && { roleTitle: data.roleTitle }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.major !== undefined && { major: data.major }),
      ...(data.skills !== undefined && { skills: data.skills }),
      ...(data.designTools !== undefined && { designTools: data.designTools }),
      ...(data.interests !== undefined && { interests: data.interests }),
      ...(data.socialLinks !== undefined && { socialLinks: mergedSocialLinks }),
    }

    const completionPct = calculateBuddyCompletionPct(mergedSnapshot)

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = { completionPct }
    if (data.fullName !== undefined) updateData.fullName = data.fullName
    if (data.roleTitle !== undefined) updateData.roleTitle = data.roleTitle
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
    if (data.major !== undefined) updateData.major = data.major
    if (data.skills !== undefined) updateData.skills = data.skills
    if (data.designTools !== undefined) updateData.designTools = data.designTools
    if (data.interests !== undefined) updateData.interests = data.interests
    if (data.socialLinks !== undefined) updateData.socialLinks = mergedSocialLinks ?? {}

    const updatedProfile = await prisma.buddyProfile.update({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updateData as any,
    })

    return successResponse(updatedProfile)
  } catch (err) {
    console.error('[PUT /api/buddy/profile/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
