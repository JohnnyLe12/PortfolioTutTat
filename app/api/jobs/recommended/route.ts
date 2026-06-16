import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { Major, Prisma } from '@prisma/client'
import { getAuthUser } from '@/lib/auth-guard'

// Map each Major to related skill keywords for matching against job requiredSkills
const majorToSkills: Record<Major, string[]> = {
  [Major.Graphic_Design]: [
    'graphic design',
    'illustrator',
    'photoshop',
    'branding',
    'typography',
    'print design',
    'logo design',
    'visual design',
    'indesign',
  ],
  [Major.UI_UX]: [
    'ui design',
    'ux design',
    'ui/ux',
    'figma',
    'prototyping',
    'wireframing',
    'user research',
    'interaction design',
    'usability',
    'design system',
  ],
  [Major.Multimedia]: [
    'multimedia',
    'video editing',
    'photography',
    'audio',
    'animation',
    'premiere',
    'after effects',
    'content creation',
    '3d',
  ],
  [Major.Motion_Design]: [
    'motion design',
    'motion graphics',
    'after effects',
    'animation',
    'cinema 4d',
    'video production',
    'visual effects',
    'vfx',
  ],
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    // Get the mentee's profile to read major and skills
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        major: true,
        skills: true,
      },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    // If mentee hasn't set a major, return empty with message
    if (!profile.major) {
      return successResponse({
        jobs: [],
        message: 'No recommended jobs found. Please complete your profile with a major to get recommendations.',
      })
    }

    // Build skills to match: combine major-related keywords + mentee's own skills
    const majorSkills = majorToSkills[profile.major] ?? []
    const menteeSkills = (profile.skills ?? []).map((s) => s.toLowerCase())
    const allSkillKeywords = [...new Set([...majorSkills, ...menteeSkills])]

    // Build the where clause: active jobs that have overlapping requiredSkills
    // OR have a job type suitable for students (internship, fresher)
    const where: Prisma.JobWhereInput = {
      isActive: true,
      OR: [
        // Jobs with required skills that overlap with mentee's major/skills
        {
          requiredSkills: {
            hasSome: allSkillKeywords,
          },
        },
        // Entry-level jobs suitable for the mentee's background
        {
          jobType: {
            in: ['internship', 'fresher'],
          },
        },
      ],
    }

    const jobs = await prisma.job.findMany({
      where,
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        isRemote: true,
        requiredSkills: true,
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
          },
        },
      },
    })

    // Shape the response to match the job listing format
    const jobList = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      isRemote: job.isRemote,
      requiredSkills: job.requiredSkills,
      createdAt: job.createdAt,
      company: {
        id: job.company.id,
        name: job.company.profile?.fullName ?? job.company.email,
        logoUrl: job.company.profile?.avatarUrl ?? null,
      },
    }))

    if (jobList.length === 0) {
      return successResponse({
        jobs: [],
        message: 'No recommended jobs found',
      })
    }

    return successResponse({ jobs: jobList })
  } catch (err) {
    console.error('[GET /api/jobs/recommended]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
