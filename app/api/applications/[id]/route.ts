import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

// GET /api/applications/:id - Get application detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            jobType: true,
            location: true,
            isRemote: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            company: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            major: true,
            userId: true,
          },
        },
      },
    })

    if (!application) {
      return errorResponse('Application not found', 404, 'NOT_FOUND')
    }

    // Only the applicant (mentee) or the company that posted the job can view
    const isMentee = application.mentee.userId === userId
    const isCompany = application.job.company.id === userId

    if (!isMentee && !isCompany) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN')
    }

    return successResponse(application)
  } catch (err) {
    console.error('[GET /api/applications/:id]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
