import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, paginatedResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

const PAGE_SIZE = 20

/**
 * Calculates the skill-match score between a project's tags and a buddy's
 * combined skills + designTools set. Case-insensitive comparison.
 */
function calculateSkillMatchScore(
  projectTags: string[],
  buddySkills: string[],
  buddyDesignTools: string[]
): number {
  const buddySet = new Set([
    ...buddySkills.map((s) => s.toLowerCase()),
    ...buddyDesignTools.map((s) => s.toLowerCase()),
  ])
  return projectTags.filter((tag) => buddySet.has(tag.toLowerCase())).length
}

/**
 * GET /api/buddy/portfolios/browse
 *
 * Browse portfolios with status=pending_feedback, sorted by skill-match
 * (descending), ties broken by createdAt descending.
 *
 * Query params:
 *   - page: page number (default 1)
 *   - tags: comma-separated tag filter (AND with other filters)
 *   - major: single major value filter (AND with other filters)
 *
 * Response includes: title, truncated description (max 150 chars), tags,
 * mentee name, date, and skill match score.
 */
export async function GET(req: NextRequest) {
  try {
    // Role guard: only buddy (and admin) can access
    const authResult = await requireRole(req, ['buddy'])
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // Parse query params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const tagsParam = searchParams.get('tags')
    const majorParam = searchParams.get('major')

    // Get buddy's skills and designTools for skill-match sorting
    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId },
      select: { skills: true, designTools: true },
    })

    const buddySkills = buddyProfile?.skills ?? []
    const buddyDesignTools = buddyProfile?.designTools ?? []

    // Build where clause for projects
    const whereClause: Record<string, unknown> = {
      status: 'pending_feedback',
    }

    // Filter by tags (AND logic: project must have ALL specified tags)
    if (tagsParam) {
      const filterTags = tagsParam
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      if (filterTags.length > 0) {
        whereClause.tags = {
          hasEvery: filterTags,
        }
      }
    }

    // Filter by major (AND logic: mentee's profile major must match)
    if (majorParam && majorParam.trim().length > 0) {
      whereClause.mentee = {
        major: majorParam.trim(),
      }
    }

    // Get total count for pagination
    const total = await prisma.project.count({
      where: whereClause,
    })

    // Fetch all matching projects (we need to sort by skill-match in-memory)
    // For large datasets this could be optimized with raw SQL, but for now
    // we fetch all and sort in-memory since skill-match requires computation
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        mentee: {
          select: {
            fullName: true,
            major: true,
          },
        },
      },
    })

    // Calculate skill-match score for each project and sort
    const scoredProjects = projects.map((project) => ({
      ...project,
      matchScore: calculateSkillMatchScore(
        project.tags,
        buddySkills,
        buddyDesignTools
      ),
    }))

    // Sort by matchScore descending, then by createdAt descending (ties)
    scoredProjects.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    // Paginate
    const skip = (page - 1) * PAGE_SIZE
    const paginatedProjects = scoredProjects.slice(skip, skip + PAGE_SIZE)

    // Format response
    const data = paginatedProjects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description
        ? project.description.length > 150
          ? project.description.slice(0, 150) + '...'
          : project.description
        : null,
      tags: project.tags,
      menteeName: project.mentee.fullName,
      date: project.createdAt,
      matchScore: project.matchScore,
    }))

    return paginatedResponse(data, total, page, PAGE_SIZE)
  } catch (err) {
    console.error('[GET /api/buddy/portfolios/browse]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
