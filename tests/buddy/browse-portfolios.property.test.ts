/**
 * Property-Based Tests: Browse Portfolios (Properties 11, 12, 13)
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 *
 * Property 11: Browse Portfolios Skill-Match Sort Order
 * Property 12: Portfolio Bookmark Uniqueness (Idempotence)
 * Property 13: Portfolio Filter AND Logic
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET as browseGET } from '@/app/api/buddy/portfolios/browse/route'
import { POST as bookmarkPOST } from '@/app/api/buddy/portfolios/bookmark/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAJOR_VALUES = ['Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design'] as const
const TAG_POOL = [
  'react', 'figma', 'photoshop', 'illustrator', 'sketch',
  'typography', 'branding', 'ux-research', 'prototyping', 'animation',
  'html', 'css', 'javascript', 'motion', 'video-editing',
  '3d-modeling', 'color-theory', 'wireframing', 'user-testing', 'accessibility',
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function makeBrowseRequest(
  userId: string,
  params?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/buddy/portfolios/browse')
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val)
    }
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
  })
}

function makeBookmarkRequest(userId: string, projectId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/buddy/portfolios/bookmark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
    body: JSON.stringify({ projectId }),
  })
}

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a non-empty subset of tags from the pool */
const tagsSubsetArb = fc.subarray(TAG_POOL, { minLength: 1, maxLength: 6 })

/** Arbitrary for buddy skills from the tag pool */
const buddySkillsArb = fc.subarray(TAG_POOL, { minLength: 1, maxLength: 8 })

/** Arbitrary for buddy design tools from the tag pool */
const buddyDesignToolsArb = fc.subarray(TAG_POOL, { minLength: 0, maxLength: 5 })

/** Arbitrary for a set of projects with varying tags */
const projectSetArb = fc.array(
  fc.record({
    title: fc.integer({ min: 1, max: 99999 }).map((n) => `Project-${n}`),
    tags: tagsSubsetArb,
  }),
  { minLength: 2, maxLength: 8 },
)

/** Arbitrary for major value */
const majorArb = fc.constantFrom(...MAJOR_VALUES)

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 11: Browse Portfolios Skill-Match Sort Order', () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any set of projects with status=pending_feedback and a buddy's skills/designTools,
   * the browse endpoint SHALL return results sorted in descending order by the count of
   * matching tags between the project's tags and the buddy's combined skills+designTools set,
   * with ties broken by date descending.
   */
  it(
    'should return projects sorted by skill-match score descending, then by date descending',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          buddySkillsArb,
          buddyDesignToolsArb,
          projectSetArb,
          async (skills, designTools, projectDefs) => {
            // Use interactive transaction to ensure all data is atomically committed
            const { buddyUserId, createdProjectIds } = await prisma.$transaction(async (tx) => {
              const buddyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('sort-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddyUser.id,
                  fullName: 'Sort Test Buddy',
                  roleTitle: 'Reviewer',
                  skills,
                  designTools,
                },
              })

              const menteeUser = await tx.user.create({
                data: {
                  email: uniqueEmail('sort-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: menteeUser.id,
                  fullName: 'Sort Test Mentee',
                  completionPct: 50,
                },
              })

              // Create projects with staggered dates for deterministic tie-breaking
              const baseDate = new Date('2024-01-01T00:00:00Z')
              const projectIds: string[] = []
              for (let i = 0; i < projectDefs.length; i++) {
                const p = await tx.project.create({
                  data: {
                    menteeId: menteeProfile.id,
                    title: projectDefs[i].title,
                    tags: projectDefs[i].tags,
                    status: 'pending_feedback',
                    createdAt: new Date(baseDate.getTime() + i * 60000),
                  },
                })
                projectIds.push(p.id)
              }

              return { buddyUserId: buddyUser.id, createdProjectIds: projectIds }
            })

            // Call browse endpoint
            const req = makeBrowseRequest(buddyUserId)
            const res = await browseGET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const results = body.data as Array<{
              id: string
              matchScore: number
              date: string
            }>

            // Verify the FULL result set is sorted correctly
            // (sorting applies to all pending_feedback projects visible to buddy)
            for (let i = 0; i < results.length - 1; i++) {
              const current = results[i]
              const next = results[i + 1]

              if (current.matchScore !== next.matchScore) {
                expect(current.matchScore).toBeGreaterThanOrEqual(next.matchScore)
              } else {
                // Same score: more recent date should come first
                expect(new Date(current.date).getTime()).toBeGreaterThanOrEqual(
                  new Date(next.date).getTime()
                )
              }
            }
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 12: Portfolio Bookmark Uniqueness (Idempotence)', () => {
  /**
   * **Validates: Requirements 5.3, 5.4**
   *
   * For any valid (buddyId, projectId) pair, bookmarking SHALL succeed on first attempt
   * and create exactly one record; subsequent bookmark attempts for the same pair SHALL
   * be rejected with an error, and the total bookmark count SHALL remain unchanged.
   */
  it(
    'should create exactly one bookmark on first attempt and reject duplicates',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // number of duplicate attempts
          async (duplicateAttempts) => {
            // Use interactive transaction to ensure all data is atomically committed
            const { buddyUserId, buddyProfileId, projectId } = await prisma.$transaction(async (tx) => {
              const buddyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('bkmk-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              const buddyProfile = await tx.buddyProfile.create({
                data: {
                  userId: buddyUser.id,
                  fullName: 'Bookmark Test Buddy',
                  roleTitle: 'Reviewer',
                  skills: ['react'],
                  designTools: [],
                },
              })

              const menteeUser = await tx.user.create({
                data: {
                  email: uniqueEmail('bkmk-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: menteeUser.id,
                  fullName: 'Bookmark Test Mentee',
                  completionPct: 50,
                },
              })
              const project = await tx.project.create({
                data: {
                  menteeId: menteeProfile.id,
                  title: 'Bookmark Test Project',
                  tags: ['react'],
                  status: 'pending_feedback',
                },
              })

              return {
                buddyUserId: buddyUser.id,
                buddyProfileId: buddyProfile.id,
                projectId: project.id,
              }
            })

            // First bookmark attempt — should succeed (201)
            const firstReq = makeBookmarkRequest(buddyUserId, projectId)
            const firstRes = await bookmarkPOST(firstReq)
            const firstBody = await firstRes.json()

            expect(firstRes.status).toBe(201)
            expect(firstBody.success).toBe(true)

            // Verify exactly one bookmark exists
            const countAfterFirst = await prisma.portfolioBookmark.count({
              where: { buddyId: buddyProfileId, projectId },
            })
            expect(countAfterFirst).toBe(1)

            // Subsequent attempts — should be rejected (409)
            for (let i = 0; i < duplicateAttempts; i++) {
              const dupReq = makeBookmarkRequest(buddyUserId, projectId)
              const dupRes = await bookmarkPOST(dupReq)
              const dupBody = await dupRes.json()

              expect(dupRes.status).toBe(409)
              expect(dupBody.success).toBe(false)
              expect(dupBody.error.code).toBe('CONFLICT')
            }

            // Verify bookmark count is still exactly 1
            const countAfterDups = await prisma.portfolioBookmark.count({
              where: { buddyId: buddyProfileId, projectId },
            })
            expect(countAfterDups).toBe(1)
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 13: Portfolio Filter AND Logic', () => {
  /**
   * **Validates: Requirements 5.5**
   *
   * For any combination of active filters (tags, major), every project in the filtered
   * results SHALL satisfy ALL active filter criteria simultaneously. A project with tags
   * not intersecting the filter tags SHALL NOT appear in results.
   */
  it(
    'should only return projects that satisfy ALL active filter criteria (AND logic)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filterTags: fc.subarray(TAG_POOL, { minLength: 1, maxLength: 3 }),
            filterMajor: majorArb,
          }),
          fc.array(
            fc.record({
              tags: tagsSubsetArb,
              major: majorArb,
            }),
            { minLength: 3, maxLength: 6 },
          ),
          async (filters, projectSpecs) => {
            // Use interactive transaction with extended timeout to ensure all data is atomically committed
            const { buddyUserId, createdProjectIds } = await prisma.$transaction(async (tx) => {
              const buddyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('filter-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddyUser.id,
                  fullName: 'Filter Test Buddy',
                  roleTitle: 'Reviewer',
                  skills: [],
                  designTools: [],
                },
              })

              const projectIds: string[] = []
              for (let i = 0; i < projectSpecs.length; i++) {
                const spec = projectSpecs[i]
                const menteeUser = await tx.user.create({
                  data: {
                    email: uniqueEmail(`filter-mentee-${i}`),
                    passwordHash: 'hashed_password',
                    role: 'mentee',
                  },
                })
                const menteeProfile = await tx.profile.create({
                  data: {
                    userId: menteeUser.id,
                    fullName: `Filter Mentee ${i}`,
                    major: spec.major,
                    completionPct: 50,
                  },
                })
                const project = await tx.project.create({
                  data: {
                    menteeId: menteeProfile.id,
                    title: `Filter Project ${i}`,
                    tags: spec.tags,
                    status: 'pending_feedback',
                  },
                })
                projectIds.push(project.id)
              }

              return { buddyUserId: buddyUser.id, createdProjectIds: projectIds }
            }, { timeout: 30000 })

            // Build query params with both tag and major filters
            const params: Record<string, string> = {
              tags: filters.filterTags.join(','),
              major: filters.filterMajor,
            }

            // Call browse endpoint with filters
            const req = makeBrowseRequest(buddyUserId, params)
            const res = await browseGET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const results = body.data as Array<{
              id: string
              tags: string[]
              menteeName: string
            }>

            // Filter only results from our test data
            const ourResults = results.filter((r) => createdProjectIds.includes(r.id))

            // Every returned project from our set must have ALL filter tags
            for (const project of ourResults) {
              const projectTagsLower = project.tags.map((t: string) => t.toLowerCase())
              for (const filterTag of filters.filterTags) {
                expect(projectTagsLower).toContain(filterTag.toLowerCase())
              }
            }

            // Verify count matches expected: projects with all tags AND matching major
            const expectedMatchCount = projectSpecs.filter((spec) => {
              const specTagsLower = spec.tags.map((t) => t.toLowerCase())
              const hasAllTags = filters.filterTags.every((ft) =>
                specTagsLower.includes(ft.toLowerCase())
              )
              const matchesMajor = spec.major === filters.filterMajor
              return hasAllTags && matchesMajor
            }).length

            expect(ourResults.length).toBe(expectedMatchCount)
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
