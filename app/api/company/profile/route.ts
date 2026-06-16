import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { companyProfileCreateSchema } from '@/lib/validations/company-profile'

/**
 * POST /api/company/profile
 * Creates a new CompanyProfile for the authenticated company user.
 * Returns 409 CONFLICT if a profile already exists.
 */
export async function POST(req: NextRequest) {
  try {
    // Role guard: only company (and admin) can access
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Check if profile already exists
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
    })
    if (existing) {
      return errorResponse(
        'CompanyProfile already exists. Please use the edit endpoint.',
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

    const parsed = companyProfileCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const data = parsed.data

    // Create the company profile
    const profile = await prisma.companyProfile.create({
      data: {
        userId,
        companyName: data.companyName,
        summary: data.summary ?? null,
        productsServices: data.productsServices ?? null,
        websiteUrl: data.websiteUrl || null,
        hrContactEmail: data.hrContactEmail || null,
        hrContactPhone: data.hrContactPhone ?? null,
        employeeCount: data.employeeCount ?? null,
        officeAddress: data.officeAddress ?? null,
        referenceLinks: data.referenceLinks,
        teamMembers: data.teamMembers,
      },
    })

    return successResponse(profile, 201)
  } catch (err) {
    console.error('[POST /api/company/profile]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
