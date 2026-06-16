/**
 * Property-Based Tests: Portfolio Selector (Property 25)
 *
 * **Validates: Requirements 13.4**
 *
 * Property 25: Portfolio Selector Shows Only Public Portfolios
 *
 * For any set of projects belonging to a mentee with mixed statuses
 * (draft, public, pending_feedback), the portfolio selector in job
 * application SHALL only display projects with status=public.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/applications/portfolios/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUSES = ['draft', 'public', 'pending_feedback'] as const
type ProjectStatus = (typeof PROJECT_STATUSES)[number]

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

function makePortfolioRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/applications/portfolios', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'mentee',
    },
  })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a single project definition with random status and approval */
const projectDefArb = fc.record({
  title: fc.integer({ min: 1, max: 99999 }).map((n) => `Portfolio-Project-${n}`),
  status: fc.constantFrom(...PROJECT_STATUSES),
  isApproved: fc.boolean(),
  tags: fc.subarray(['react', 'figma', 'photoshop', 'css', 'typescript', 'branding'], {
    minLength: 1,
    maxLength: 4,
  }),
})

/** Arbitrary for a set of projects with mixed statuses - ensure at least one of each status */
const projectSetArb = fc.tuple(
  // Ensure at least one draft
  projectDefArb.map((p) => ({ ...p, status: 'draft' as ProjectStatus })),
  // Ensure at least one public
  projectDefArb.map((p) => ({ ...p, status: 'public' as ProjectStatus })),
  // Ensure at least one pending_feedback
  projectDefArb.map((p) => ({ ...p, status: 'pending_feedback' as ProjectStatus })),
  // Additional random projects
  fc.array(projectDefArb, { minLength: 0, maxLength: 5 }),
).map(([draft, pub, pending, extras]) => [draft, pub, pending, ...extras])

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 25: Portfolio Selector Shows Only Public Portfolios', () => {
  /**
   * **Validates: Requirements 13.4**
   *
   * For any set of projects belonging to a mentee with mixed statuses
   * (draft, public, pending_feedback), the portfolio selector in job
   * application SHALL only display projects with status=public.
   */
  it(
    'should only return public projects and exclude draft/pending_feedback projects',
    async () => {
      await fc.assert(
        fc.asyncProperty(projectSetArb, async (projectDefs) => {
          // Setup: create a mentee user with profile and mixed-status projects
          const { menteeUserId, createdProjects } = await prisma.$transaction(
            async (tx) => {
              const menteeUser = await tx.user.create({
                data: {
                  email: uniqueEmail('ps-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: menteeUser.id,
                  fullName: 'Portfolio Selector Mentee',
                  completionPct: 50,
                },
              })

              // Create projects with varying statuses
              const projects: Array<{
                id: string
                title: string
                status: string
                isApproved: boolean
                tags: string[]
              }> = []

              for (const def of projectDefs) {
                const project = await tx.project.create({
                  data: {
                    menteeId: menteeProfile.id,
                    title: def.title,
                    tags: def.tags,
                    status: def.status,
                    isApproved: def.isApproved,
                  },
                })
                projects.push({
                  id: project.id,
                  title: project.title,
                  status: def.status,
                  isApproved: def.isApproved,
                  tags: def.tags,
                })
              }

              return { menteeUserId: menteeUser.id, createdProjects: projects }
            },
          )

          // Act: call the portfolio selector endpoint
          const req = makePortfolioRequest(menteeUserId)
          const res = await GET(req)
          const body = await res.json()

          expect(res.status).toBe(200)
          expect(body.success).toBe(true)

          const results = body.data as Array<{
            id: string
            title: string
            tags: string[]
            isApproved: boolean
            badge: string
          }>

          // Calculate expected public projects
          const expectedPublicProjects = createdProjects.filter(
            (p) => p.status === 'public',
          )

          // Property assertion 1: ALL returned projects have status=public
          // (verify by checking all returned IDs are from our public set)
          const publicProjectIds = new Set(expectedPublicProjects.map((p) => p.id))
          for (const result of results) {
            expect(publicProjectIds.has(result.id)).toBe(true)
          }

          // Property assertion 2: NO draft or pending_feedback projects appear
          const nonPublicIds = new Set(
            createdProjects
              .filter((p) => p.status !== 'public')
              .map((p) => p.id),
          )
          const returnedIds = new Set(results.map((r) => r.id))
          for (const nonPublicId of nonPublicIds) {
            expect(returnedIds.has(nonPublicId)).toBe(false)
          }

          // Property assertion 3: correct badge values
          for (const result of results) {
            const sourceProject = expectedPublicProjects.find(
              (p) => p.id === result.id,
            )
            if (sourceProject) {
              if (sourceProject.isApproved) {
                expect(result.badge).toBe('Buddy Approved')
              } else {
                expect(result.badge).toBe('Unreviewed')
              }
            }
          }

          // Property assertion 4: count matches the number of public projects
          expect(results.length).toBe(expectedPublicProjects.length)
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
