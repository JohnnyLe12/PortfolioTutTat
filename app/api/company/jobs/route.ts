import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { jobCreateSchema } from '@/lib/validations/job-create'

/**
 * GET /api/company/jobs
 * Lists all jobs owned by the authenticated company user.
 * Supports pagination via `page` and `limit` query params.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { companyId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where: { companyId: userId } }),
    ])

    return paginatedResponse(jobs, total, page, limit)
  } catch (err) {
    console.error('[GET /api/company/jobs]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * POST /api/company/jobs
 * Creates a new job posting for the authenticated company user.
 * Validates with jobCreateSchema. Sets isActive=true on creation.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = jobCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const data = parsed.data

    // Create the job with isActive=true
    const job = await prisma.job.create({
      data: {
        companyId: userId,
        title: data.title,
        description: data.description,
        openSlots: data.openSlots,
        location: data.location ?? null,
        employmentType: data.employmentType ?? null,
        seniorityLevel: data.seniorityLevel ?? null,
        minExperienceYears: data.minExperienceYears ?? null,
        requiredSkills: data.requiredSkills,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryPeriod: data.salaryPeriod ?? null,
        requiresManagement: data.requiresManagement,
        minManagedEmployees: data.requiresManagement ? (data.minManagedEmployees ?? null) : null,
        category: data.category ?? null,
        isActive: true,
        // Required fields with sensible defaults for existing Job model fields
        jobType: data.employmentType === 'full_time' ? 'full_time'
          : data.employmentType === 'part_time' ? 'part_time'
          : data.employmentType === 'internship' ? 'internship'
          : data.employmentType === 'freelance' ? 'freelance'
          : 'full_time',
        responsibilities: [],
        requirements: [],
      },
    })

    return successResponse(job, 201)
  } catch (err) {
    console.error('[POST /api/company/jobs]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
