import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { jobFilterSchema } from '@/lib/validations/job'
import { EmploymentType, SeniorityLevel, Prisma } from '@prisma/client'

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
        },
      }),
    ])

    // Shape the response: flatten company info
    const jobList = jobs.map((job) => ({
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
      category: job.category,
      createdAt: job.createdAt,
      company: {
        id: job.company.id,
        name: job.company.companyProfile?.companyName ?? job.company.profile?.fullName ?? job.company.email,
        logoUrl: job.company.profile?.avatarUrl ?? null,
      },
    }))

    return successResponse({
      jobs: jobList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[GET /api/jobs]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
