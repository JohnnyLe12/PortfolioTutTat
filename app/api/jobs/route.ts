import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { jobFilterSchema } from '@/lib/validations/job'
import { EmploymentType, SeniorityLevel, Prisma } from '@prisma/client'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // Parse and validate query params
    const rawParams: Record<string, string | undefined> = {
      type: searchParams.get('type') ?? undefined,
      keyword: searchParams.get('keyword') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      employmentType: searchParams.get('employmentType') ?? undefined,
      seniorityLevel: searchParams.get('seniorityLevel') ?? undefined,
      salaryMin: searchParams.get('salaryMin') ?? undefined,
      salaryMax: searchParams.get('salaryMax') ?? undefined,
      location: searchParams.get('location') ?? undefined,
      isRemote: searchParams.get('isRemote') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    }

    const parsed = jobFilterSchema.safeParse(rawParams)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Invalid query parameters',
        400,
        'VALIDATION_ERROR'
      )
    }

    const {
      type,
      keyword,
      category,
      employmentType,
      seniorityLevel,
      salaryMin,
      salaryMax,
      location,
      isRemote,
      page,
      limit,
    } = parsed.data

    // Get current user and their applied job IDs (for filtering logic)
    const user = await getAuthUser(req)
    let userAppliedJobIds: string[] = []
    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      })
      if (profile) {
        const userApplications = await prisma.application.findMany({
          where: { menteeId: profile.id },
          select: { jobId: true },
        })
        userAppliedJobIds = userApplications.map((a) => a.jobId)
      }
    }

    // Build Prisma where clause — all filters use AND logic
    const where: Prisma.JobWhereInput = {
      isActive: true,
    }

    // Filter by legacy job type (skip if 'all' or not provided)
    if (type && type !== 'all') {
      where.jobType = type as any
    }

    // Filter by new employmentType enum
    if (employmentType) {
      where.employmentType = employmentType as EmploymentType
    }

    // Filter by seniority level
    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel as SeniorityLevel
    }

    // Keyword search: case-insensitive match on title, requiredSkills, or company name
    if (keyword && keyword.trim() !== '') {
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          requiredSkills: {
            hasSome: [keyword],
          },
        },
        {
          company: {
            email: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
        {
          company: {
            profile: {
              fullName: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          company: {
            companyProfile: {
              companyName: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          },
        },
      ]
    }

    // Filter by category — matches jobs whose requiredSkills contain the category
    if (category && category.trim() !== '') {
      const trimmedCategory = category.trim()
      // Category matches if it's in requiredSkills or in the category field
      where.AND = [
        ...(Array.isArray((where as any).AND) ? (where as any).AND : []),
        {
          OR: [
            { category: { equals: trimmedCategory, mode: 'insensitive' } },
            { requiredSkills: { has: trimmedCategory } },
          ],
        },
      ]
    }

    // Filter by location (case-insensitive partial match)
    if (location && location.trim() !== '') {
      where.location = {
        contains: location.trim(),
        mode: 'insensitive',
      }
    }

    // Filter by isRemote
    if (isRemote !== undefined) {
      where.isRemote = isRemote === 'true'
    }

    // Filter by salary range (AND logic: job's salary overlaps with requested range)
    if (salaryMin !== undefined) {
      where.AND = [
        ...(Array.isArray((where as any).AND) ? (where as any).AND : []),
        {
          OR: [
            { salaryMax: { gte: salaryMin } },
            { salaryMax: null, salaryMin: { gte: salaryMin } },
            { salaryMax: null, salaryMin: null },
          ],
        },
      ]
    }

    if (salaryMax !== undefined) {
      where.AND = [
        ...(Array.isArray((where as any).AND) ? (where as any).AND : []),
        {
          OR: [
            { salaryMin: { lte: salaryMax } },
            { salaryMin: null, salaryMax: { lte: salaryMax } },
            { salaryMin: null, salaryMax: null },
          ],
        },
      ]
    }

    const skip = (page - 1) * limit

    // Run count and findMany in parallel for performance
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          salaryPeriod: true,
          isRemote: true,
          requiredSkills: true,
          employmentType: true,
          seniorityLevel: true,
          openSlots: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                },
              },
              companyProfile: {
                select: {
                  companyName: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: {
                where: {
                  status: { in: ['submitted', 'under_review', 'accepted'] },
                },
              },
            },
          },
        },
      }),
    ])

    // Calculate remaining slots and filter out stale full jobs
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const jobList = jobs
      .map((job) => {
        const activeApplicationCount = job._count.applications
        const remainingSlots = job.openSlots !== null
          ? Math.max(0, job.openSlots - activeApplicationCount)
          : null
        const isFull = remainingSlots !== null ? remainingSlots <= 0 : false

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          salaryPeriod: job.salaryPeriod,
          isRemote: job.isRemote,
          requiredSkills: job.requiredSkills,
          employmentType: job.employmentType,
          seniorityLevel: job.seniorityLevel,
          openSlots: job.openSlots,
          remainingSlots,
          isFull,
          category: job.category,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          company: {
            id: job.company.id,
            name: job.company.companyProfile?.companyName ?? job.company.profile?.fullName ?? job.company.email,
            logoUrl: job.company.profile?.avatarUrl ?? null,
          },
        }
      })
      .filter((job) => {
        // Keep jobs the user has applied to regardless of full/stale status
        if (userAppliedJobIds.includes(job.id)) return true
        // Filter out jobs that are full AND older than 7 days (based on updatedAt)
        if (job.isFull && job.updatedAt && new Date(job.updatedAt) < sevenDaysAgo) {
          return false
        }
        return true
      })

    return successResponse({
      jobs: jobList,
      total: jobList.length,
      page,
      limit,
      totalPages: Math.ceil(jobList.length / limit),
    })
  } catch (err) {
    console.error('[GET /api/jobs]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
