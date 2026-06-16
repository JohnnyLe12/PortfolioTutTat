import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { companyProfileUpdateSchema } from '@/lib/validations/company-profile'

/**
 * GET /api/company/profile/me
 * Returns the authenticated company's own profile.
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only company (and admin) can access
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('CompanyProfile not found', 404, 'NOT_FOUND')
    }

    return successResponse(profile)
  } catch (err) {
    console.error('[GET /api/company/profile/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * PUT /api/company/profile/me
 * Updates the authenticated company's profile.
 * Handles teamMembers and referenceLinks as JSON arrays.
 */
export async function PUT(req: NextRequest) {
  try {
    // Role guard: only company (and admin) can access
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = companyProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
    })
    if (!existing) {
      return errorResponse('CompanyProfile not found', 404, 'NOT_FOUND')
    }

    const data = parsed.data

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (data.companyName !== undefined) updateData.companyName = data.companyName
    if (data.summary !== undefined) updateData.summary = data.summary ?? null
    if (data.productsServices !== undefined) updateData.productsServices = data.productsServices ?? null
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl || null
    if (data.hrContactEmail !== undefined) updateData.hrContactEmail = data.hrContactEmail || null
    if (data.hrContactPhone !== undefined) updateData.hrContactPhone = data.hrContactPhone ?? null
    if (data.employeeCount !== undefined) updateData.employeeCount = data.employeeCount ?? null
    if (data.officeAddress !== undefined) updateData.officeAddress = data.officeAddress ?? null
    if (data.referenceLinks !== undefined) updateData.referenceLinks = data.referenceLinks
    if (data.teamMembers !== undefined) updateData.teamMembers = data.teamMembers

    const updatedProfile = await prisma.companyProfile.update({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updateData as any,
    })

    return successResponse(updatedProfile)
  } catch (err) {
    console.error('[PUT /api/company/profile/me]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
