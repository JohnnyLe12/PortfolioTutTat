import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET() {
  try {
    // Get distinct categories from active jobs
    // Categories come from two sources: the `category` field and the `requiredSkills` array
    const activeJobs = await prisma.job.findMany({
      where: { isActive: true },
      select: {
        category: true,
        requiredSkills: true,
      },
    })

    // Collect unique categories
    const categorySet = new Set<string>()

    for (const job of activeJobs) {
      // Add the explicit category field if it exists
      if (job.category && job.category.trim() !== '') {
        categorySet.add(job.category.trim())
      }
    }

    // Sort categories alphabetically
    const categories = Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )

    return successResponse({ categories })
  } catch (err) {
    console.error('[GET /api/jobs/categories]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
