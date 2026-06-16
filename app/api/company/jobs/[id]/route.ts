import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import { jobCreateSchema } from '@/lib/validations/job-create'

/**
 * PUT /api/company/jobs/[id]
 * Updates an existing job owned by the authenticated company user.
 * Accepts partial updates using the same validation schema.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { id } = await params

    // Verify the job exists and belongs to the company
    const existingJob = await prisma.job.findUnique({
      where: { id },
    })

    if (!existingJob) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    if (existingJob.companyId !== userId) {
      return errorResponse(
        'You do not have permission to update this job',
        403,
        'FORBIDDEN'
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    // Use partial validation for updates
    const parsed = jobCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const data = parsed.data

    // Build update data
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
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
      },
    })

    return successResponse(updatedJob)
  } catch (err) {
    console.error('[PUT /api/company/jobs/[id]]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

/**
 * DELETE /api/company/jobs/[id]
 * Deletes a job owned by the authenticated company user.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(req, ['company'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    const { id } = await params

    // Verify the job exists and belongs to the company
    const existingJob = await prisma.job.findUnique({
      where: { id },
    })

    if (!existingJob) {
      return errorResponse('Job not found', 404, 'NOT_FOUND')
    }

    if (existingJob.companyId !== userId) {
      return errorResponse(
        'You do not have permission to delete this job',
        403,
        'FORBIDDEN'
      )
    }

    await prisma.job.delete({
      where: { id },
    })

    return successResponse({ message: 'Job deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/company/jobs/[id]]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
