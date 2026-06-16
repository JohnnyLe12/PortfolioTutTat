/**
 * Property-Based Test: Job Search Filter Intersection (AND Logic)
 *
 * **Validates: Requirements 11.2, 11.3, 11.5**
 *
 * Property 23: For any combination of active search filters (keyword, category,
 * employmentType, seniorityLevel, salaryRange, location, isRemote), every job in
 * the results SHALL satisfy ALL active filter predicates simultaneously.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/jobs/route'
import { NextRequest } from 'next/server'
import { EmploymentType, SeniorityLevel } from '@prisma/client'

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'full_time',
  'part_time',
  'internship',
  'contract',
  'freelance',
  'temporary',
  'volunteer',
]

const SENIORITY_LEVELS: SeniorityLevel[] = [
  'internship',
  'entry',
  'assistant',
  'mid_senior',
  'director',
  'executive',
]

const CATEGORIES = ['Software', 'Design', 'Marketing', 'Sales', 'Engineering']
const LOCATIONS = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Remote', 'Singapore']
const SKILLS = ['Figma', 'Photoshop', 'React', 'Node.js', 'TypeScript', 'Python', 'Java', 'UI/UX']
const TITLES = [
  'Senior UI Designer',
  'Junior Developer',
  'Marketing Manager',
  'Sales Executive',
  'Software Engineer',
  'Product Designer',
  'Data Analyst',
  'UX Researcher',
  'DevOps Engineer',
  'Frontend Developer',
]

// ─── Seed Data ──────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Create diverse jobs with varied attributes to test filter combinations
  const companies = [
    { email: 'tech-alpha@test.com', name: 'Tech Alpha Corp' },
    { email: 'design-beta@test.com', name: 'Design Beta Studio' },
    { email: 'marketing-gamma@test.com', name: 'Marketing Gamma Inc' },
  ]

  for (const company of companies) {
    const user = await prisma.user.create({
      data: {
        email: company.email,
        passwordHash: 'hashed-password-placeholder',
        role: 'company',
      },
    })
    await prisma.profile.create({
      data: {
        userId: user.id,
        fullName: company.name,
        completionPct: 100,
      },
    })
    await prisma.companyProfile.create({
      data: {
        userId: user.id,
        companyName: company.name,
      },
    })

    // Create multiple jobs per company with varied filter-relevant fields
    const jobConfigs = getJobConfigsForCompany(company.name)
    for (const config of jobConfigs) {
      await prisma.job.create({
        data: {
          companyId: user.id,
          title: config.title,
          jobType: 'internship',
          location: config.location,
          isRemote: config.isRemote,
          isActive: true,
          requiredSkills: config.requiredSkills,
          employmentType: config.employmentType,
          seniorityLevel: config.seniorityLevel,
          salaryMin: config.salaryMin,
          salaryMax: config.salaryMax,
          category: config.category,
        },
      })
    }
  }
})

interface JobConfig {
  title: string
  location: string | null
  isRemote: boolean
  requiredSkills: string[]
  employmentType: EmploymentType | null
  seniorityLevel: SeniorityLevel | null
  salaryMin: number | null
  salaryMax: number | null
  category: string | null
}

function getJobConfigsForCompany(companyName: string): JobConfig[] {
  switch (companyName) {
    case 'Tech Alpha Corp':
      return [
        {
          title: 'Senior Software Engineer',
          location: 'Ho Chi Minh City',
          isRemote: false,
          requiredSkills: ['React', 'TypeScript', 'Node.js'],
          employmentType: 'full_time',
          seniorityLevel: 'mid_senior',
          salaryMin: 2000,
          salaryMax: 4000,
          category: 'Software',
        },
        {
          title: 'Junior Frontend Developer',
          location: 'Hanoi',
          isRemote: true,
          requiredSkills: ['React', 'TypeScript'],
          employmentType: 'full_time',
          seniorityLevel: 'entry',
          salaryMin: 800,
          salaryMax: 1500,
          category: 'Software',
        },
        {
          title: 'DevOps Intern',
          location: 'Da Nang',
          isRemote: false,
          requiredSkills: ['Python', 'Docker'],
          employmentType: 'internship',
          seniorityLevel: 'internship',
          salaryMin: 300,
          salaryMax: 600,
          category: 'Engineering',
        },
      ]
    case 'Design Beta Studio':
      return [
        {
          title: 'Senior UI Designer',
          location: 'Ho Chi Minh City',
          isRemote: false,
          requiredSkills: ['Figma', 'Photoshop', 'UI/UX'],
          employmentType: 'full_time',
          seniorityLevel: 'mid_senior',
          salaryMin: 1500,
          salaryMax: 3000,
          category: 'Design',
        },
        {
          title: 'UX Researcher Part-time',
          location: 'Remote',
          isRemote: true,
          requiredSkills: ['Figma', 'UI/UX'],
          employmentType: 'part_time',
          seniorityLevel: 'entry',
          salaryMin: 500,
          salaryMax: 1000,
          category: 'Design',
        },
        {
          title: 'Freelance Illustrator',
          location: 'Singapore',
          isRemote: true,
          requiredSkills: ['Photoshop', 'Illustrator'],
          employmentType: 'freelance',
          seniorityLevel: 'assistant',
          salaryMin: null,
          salaryMax: null,
          category: 'Design',
        },
      ]
    case 'Marketing Gamma Inc':
      return [
        {
          title: 'Marketing Manager',
          location: 'Ho Chi Minh City',
          isRemote: false,
          requiredSkills: ['Marketing', 'SEO'],
          employmentType: 'full_time',
          seniorityLevel: 'director',
          salaryMin: 3000,
          salaryMax: 5000,
          category: 'Marketing',
        },
        {
          title: 'Sales Executive',
          location: 'Hanoi',
          isRemote: false,
          requiredSkills: ['Sales', 'CRM'],
          employmentType: 'contract',
          seniorityLevel: 'mid_senior',
          salaryMin: 1000,
          salaryMax: 2500,
          category: 'Sales',
        },
        {
          title: 'Marketing Intern Remote',
          location: 'Remote',
          isRemote: true,
          requiredSkills: ['Marketing', 'Social Media'],
          employmentType: 'internship',
          seniorityLevel: 'internship',
          salaryMin: 200,
          salaryMax: 400,
          category: 'Marketing',
        },
      ]
    default:
      return []
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeJobSearchReq(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/jobs')
  url.searchParams.set('limit', '100')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value)
    }
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/** Generate optional keyword from known title fragments and skills */
const keywordArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(
    'Senior', 'Junior', 'Developer', 'Designer', 'Intern',
    'Marketing', 'Sales', 'Frontend', 'React', 'Figma',
    'UX', 'DevOps', 'Software', 'Remote'
  ),
)

/** Generate optional category */
const categoryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(...CATEGORIES),
)

/** Generate optional employment type */
const employmentTypeArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(...EMPLOYMENT_TYPES),
)

/** Generate optional seniority level */
const seniorityLevelArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(...SENIORITY_LEVELS),
)

/** Generate optional salary range (min and/or max) */
const salaryRangeArb = fc.record({
  salaryMin: fc.oneof(fc.constant(undefined), fc.integer({ min: 0, max: 5000 })),
  salaryMax: fc.oneof(fc.constant(undefined), fc.integer({ min: 0, max: 10000 })),
})

/** Generate optional location from known values */
const locationArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('Ho Chi Minh', 'Hanoi', 'Da Nang', 'Singapore', 'Remote'),
)

/** Generate optional isRemote filter */
const isRemoteArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('true', 'false'),
)

/** Combined filter arbitrary — generates any combination of filters */
const filterCombinationArb = fc.record({
  keyword: keywordArb,
  category: categoryArb,
  employmentType: employmentTypeArb,
  seniorityLevel: seniorityLevelArb,
  salaryRange: salaryRangeArb,
  location: locationArb,
  isRemote: isRemoteArb,
})

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property 23: Job Search Filter Intersection (AND Logic)', () => {
  it(
    'every job in results satisfies ALL active filter predicates simultaneously',
    async () => {
      await fc.assert(
        fc.asyncProperty(filterCombinationArb, async (filters) => {
          // Build query params from the generated filter combination
          const params: Record<string, string> = {}
          if (filters.keyword) params.keyword = filters.keyword
          if (filters.category) params.category = filters.category
          if (filters.employmentType) params.employmentType = filters.employmentType
          if (filters.seniorityLevel) params.seniorityLevel = filters.seniorityLevel
          if (filters.salaryRange.salaryMin !== undefined) {
            params.salaryMin = String(filters.salaryRange.salaryMin)
          }
          if (filters.salaryRange.salaryMax !== undefined) {
            params.salaryMax = String(filters.salaryRange.salaryMax)
          }
          if (filters.location) params.location = filters.location
          if (filters.isRemote) params.isRemote = filters.isRemote

          // Skip if no filters are active (trivially true)
          const hasActiveFilter = Object.keys(params).length > 0
          if (!hasActiveFilter) return

          const req = makeJobSearchReq(params)
          const res = await GET(req)
          const json = await res.json()

          expect(res.status).toBe(200)
          expect(json.success).toBe(true)

          const jobs = json.data.jobs as Array<{
            id: string
            title: string
            location: string | null
            isRemote: boolean
            requiredSkills: string[]
            employmentType: string | null
            seniorityLevel: string | null
            salaryMin: number | null
            salaryMax: number | null
            category: string | null
            company: { id: string; name: string; logoUrl: string | null }
          }>

          // Verify each returned job satisfies ALL active filters
          for (const job of jobs) {
            // Check keyword filter: must appear in title, requiredSkills, or company name
            if (filters.keyword) {
              const kw = filters.keyword.toLowerCase()
              const titleMatch = job.title.toLowerCase().includes(kw)
              const skillMatch = job.requiredSkills.some(
                (s) => s.toLowerCase() === kw
              )
              const companyNameMatch = job.company.name.toLowerCase().includes(kw)

              // Also check company email (API searches it too)
              let emailMatch = false
              if (!titleMatch && !skillMatch && !companyNameMatch) {
                const dbJob = await prisma.job.findUnique({
                  where: { id: job.id },
                  include: { company: { select: { email: true } } },
                })
                emailMatch = dbJob!.company.email.toLowerCase().includes(kw)
              }

              expect(
                titleMatch || skillMatch || companyNameMatch || emailMatch,
                `Job "${job.title}" by "${job.company.name}" does not match keyword "${filters.keyword}"`
              ).toBe(true)
            }

            // Check category filter: job's category matches OR requiredSkills contains category
            if (filters.category) {
              const cat = filters.category.toLowerCase()
              const categoryMatch =
                job.category?.toLowerCase() === cat
              const skillHasCategory = job.requiredSkills.some(
                (s) => s.toLowerCase() === filters.category!.toLowerCase()
              )
              expect(
                categoryMatch || skillHasCategory,
                `Job "${job.title}" does not match category "${filters.category}" (category: ${job.category}, skills: ${job.requiredSkills})`
              ).toBe(true)
            }

            // Check employmentType filter
            if (filters.employmentType) {
              expect(
                job.employmentType,
                `Job "${job.title}" has no employmentType but filter requires "${filters.employmentType}"`
              ).toBe(filters.employmentType)
            }

            // Check seniorityLevel filter
            if (filters.seniorityLevel) {
              expect(
                job.seniorityLevel,
                `Job "${job.title}" has no seniorityLevel but filter requires "${filters.seniorityLevel}"`
              ).toBe(filters.seniorityLevel)
            }

            // Check location filter: job location should contain the filter location (case-insensitive)
            if (filters.location) {
              expect(
                job.location?.toLowerCase().includes(filters.location.toLowerCase()),
                `Job "${job.title}" location "${job.location}" does not contain "${filters.location}"`
              ).toBe(true)
            }

            // Check isRemote filter
            if (filters.isRemote !== undefined) {
              const expectedRemote = filters.isRemote === 'true'
              expect(
                job.isRemote,
                `Job "${job.title}" isRemote=${job.isRemote} but filter requires isRemote=${expectedRemote}`
              ).toBe(expectedRemote)
            }

            // Check salary range filters
            // The API uses overlap logic:
            // - salaryMin filter: job's salaryMax >= filter.salaryMin OR (job has no salaryMax and salaryMin >= filter) OR job has no salary at all
            // - salaryMax filter: job's salaryMin <= filter.salaryMax OR (job has no salaryMin and salaryMax <= filter) OR job has no salary at all
            if (filters.salaryRange.salaryMin !== undefined) {
              const filterMin = filters.salaryRange.salaryMin
              // Job satisfies this if:
              // 1. job.salaryMax >= filterMin, OR
              // 2. job has no salaryMax but job.salaryMin >= filterMin, OR
              // 3. job has no salary info at all (both null)
              const satisfies =
                (job.salaryMax !== null && job.salaryMax >= filterMin) ||
                (job.salaryMax === null && job.salaryMin !== null && job.salaryMin >= filterMin) ||
                (job.salaryMax === null && job.salaryMin === null)
              expect(
                satisfies,
                `Job "${job.title}" (salary: ${job.salaryMin}-${job.salaryMax}) does not satisfy salaryMin filter ${filterMin}`
              ).toBe(true)
            }

            if (filters.salaryRange.salaryMax !== undefined) {
              const filterMax = filters.salaryRange.salaryMax
              // Job satisfies this if:
              // 1. job.salaryMin <= filterMax, OR
              // 2. job has no salaryMin but job.salaryMax <= filterMax, OR
              // 3. job has no salary info at all (both null)
              const satisfies =
                (job.salaryMin !== null && job.salaryMin <= filterMax) ||
                (job.salaryMin === null && job.salaryMax !== null && job.salaryMax <= filterMax) ||
                (job.salaryMin === null && job.salaryMax === null)
              expect(
                satisfies,
                `Job "${job.title}" (salary: ${job.salaryMin}-${job.salaryMax}) does not satisfy salaryMax filter ${filterMax}`
              ).toBe(true)
            }
          }
        }),
        { numRuns: 20, timeout: 120000 },
      )
    },
    { timeout: 150000 },
  )
})
