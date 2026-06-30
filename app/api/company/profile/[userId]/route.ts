import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

/**
 * GET /api/company/profile/:userId
 * Returns a company's public profile by their userId.
 * Any authenticated user can view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }

    const { userId } = await params

    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        summary: true,
        productsServices: true,
        websiteUrl: true,
        hrContactEmail: true,
        hrContactPhone: true,
        employeeCount: true,
        officeAddress: true,
      },
    })

    if (!companyProfile) {
      return errorResponse('Company profile not found', 404, 'NOT_FOUND')
    }

    return successResponse(companyProfile)
  } catch (err) {
    console.error('[GET /api/company/profile/:userId]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
