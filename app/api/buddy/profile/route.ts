import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { buddyProfileCreateSchema } from '@/lib/validations/buddy-profile'
import { calculateBuddyCompletionPct } from '@/lib/buddy-profile'

/**
 * POST /api/buddy/profile
 * Creates a new BuddyProfile for the authenticated buddy user.
 * Returns 409 CONFLICT if a profile already exists.
 */
export async function POST(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Check if profile already exists
    const existing = await prisma.buddyProfile.findUnique({
      where: { userId },
    })
    if (existing) {
      return errorResponse(
        'BuddyProfile already exists. Please use the edit endpoint.',
        409,
        'CONFLICT'
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = buddyProfileCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const data = parsed.data

    // Calculate completion percentage
    const completionPct = calculateBuddyCompletionPct({
      fullName: data.fullName,
      roleTitle: data.roleTitle,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ?? null,
      major: data.major ?? null,
      skills: data.skills,
      designTools: data.designTools,
      interests: data.interests,
      socialLinks: data.socialLinks,
    })

    // Create the buddy profile
    const profile = await prisma.buddyProfile.create({
      data: {
        userId,
        fullName: data.fullName,
        roleTitle: data.roleTitle,
        bio: data.bio ?? null,
        avatarUrl: data.avatarUrl ?? null,
        major: data.major ?? null,
        skills: data.skills,
        designTools: data.designTools,
        interests: data.interests,
        socialLinks: data.socialLinks,
        completionPct,
      },
    })

    return successResponse(profile, 201)
  } catch (err) {
    console.error('[POST /api/buddy/profile]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
