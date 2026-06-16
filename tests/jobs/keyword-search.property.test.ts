/**
 * Property-Based Test: Job keyword search returns only matching results
 *
 * **Validates: Requirements 11.3**
 *
 * Property: For any non-empty keyword string, every job returned by
 * GET /api/jobs?keyword=<keyword> MUST contain that keyword (case-insensitive)
 * in either the job title OR the company name (profile fullName or company email,
 * since the API searches across these fields and the response maps company name
 * to profile.fullName ?? email).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/jobs/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Seed the database with a variety of jobs from different companies.
 * We create jobs with known titles and company names so we can verify
 * the search behavior against various random keywords.
 */
beforeEach(async () => {
  // Create multiple company users with profiles (different names)
  const companies = [
    { email: 'design-studio@creative.test', name: 'Creative Design Studio' },
    { email: 'tech-corp@techvision.test', name: 'TechVision Corporation' },
    { email: 'pixel-labs@pixelagency.test', name: 'Pixel Labs Agency' },
    { email: 'artcraft@artcraft.test', name: 'ArtCraft Solutions' },
    { email: 'motion-works@motiondigital.test', name: 'MotionWorks Digital' },
    { email: 'uiux-hub@uiuxhub.test', name: 'UIUX Hub Vietnam' },
    { email: 'branding-co@brandingco.test', name: 'Branding Company' },
    { email: 'freelance-connect@flconnect.test', name: 'Freelance Connect' },
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

    // Create 2-3 jobs per company with varied titles
    const jobTitles = getJobTitlesForCompany(company.name)
    for (const title of jobTitles) {
      await prisma.job.create({
        data: {
          companyId: user.id,
          title,
          jobType: 'internship',
          location: 'Ho Chi Minh City',
          isActive: true,
          requiredSkills: ['Figma', 'Photoshop'],
        },
      })
    }
  }
})

function getJobTitlesForCompany(companyName: string): string[] {
  switch (companyName) {
    case 'Creative Design Studio':
      return ['Senior UI Designer', 'Junior Graphic Artist', 'Brand Identity Intern']
    case 'TechVision Corporation':
      return ['UX Researcher', 'Product Designer', 'Frontend Developer']
    case 'Pixel Labs Agency':
      return ['Motion Graphics Designer', 'Video Editor Intern']
    case 'ArtCraft Solutions':
      return ['Illustration Artist', 'Packaging Designer']
    case 'MotionWorks Digital':
      return ['After Effects Animator', '3D Motion Designer']
    case 'UIUX Hub Vietnam':
      return ['UI/UX Design Lead', 'Interaction Designer Fresher']
    case 'Branding Company':
      return ['Logo Designer', 'Visual Identity Specialist']
    case 'Freelance Connect':
      return ['Freelance Graphic Designer', 'Part-time Illustrator']
    default:
      return ['Designer']
  }
}

/**
 * Helper: create a NextRequest for GET /api/jobs with keyword param
 */
function makeJobSearchReq(keyword: string): NextRequest {
  const url = new URL('http://localhost:3000/api/jobs')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('limit', '100') // High limit to get all results
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Job keyword search returns only matching results', () => {
  it(
    'every job in search results must contain the keyword in title or company name (case-insensitive)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty alphanumeric keywords (1-15 chars) to avoid
          // edge cases with special regex/SQL characters.
          // Exclude '%' and '_' which are LIKE/ILIKE wildcards in PostgreSQL,
          // and other special characters that could cause unexpected matches.
          fc.stringOf(
            fc.char().filter((c) => /[a-zA-Z0-9 ]/.test(c)),
            { minLength: 1, maxLength: 15 }
          ).filter((s) => s.trim().length > 0),
          async (keyword) => {
            const req = makeJobSearchReq(keyword)
            const res = await GET(req)
            const json = await res.json()

            // Response should always be 200 (even if no results)
            expect(res.status).toBe(200)
            expect(json.success).toBe(true)

            const jobs = json.data.jobs as Array<{
              id: string
              title: string
              company: { id: string; name: string; logoUrl: string | null }
            }>

            const keywordLower = keyword.toLowerCase()

            // For each returned job, verify the keyword matches one of the
            // searchable fields. The API searches on: title, company.email,
            // and company.profile.fullName. We verify by looking up the job
            // in the DB to get the company email as well.
            for (const job of jobs) {
              const titleMatch = job.title.toLowerCase().includes(keywordLower)
              const companyNameMatch = job.company.name.toLowerCase().includes(keywordLower)

              if (!titleMatch && !companyNameMatch) {
                // If neither title nor displayed company name matches,
                // check if the company email matches (since the API also
                // searches by email)
                const dbJob = await prisma.job.findUnique({
                  where: { id: job.id },
                  include: { company: { select: { email: true } } },
                })
                const emailMatch = dbJob!.company.email
                  .toLowerCase()
                  .includes(keywordLower)

                expect(
                  emailMatch,
                  `Job "${job.title}" by "${job.company.name}" (email: ${dbJob!.company.email}) does not contain keyword "${keyword}" in title, company name, or email`
                ).toBe(true)
              }
            }

            // Additional assertion: total count should match returned jobs length
            // (since we use limit=100 and we have fewer jobs than that)
            expect(json.data.total).toBe(jobs.length)
          }
        ),
        { numRuns: 20, timeout: 120000 }
      )
    },
    { timeout: 150000 }
  )
})
