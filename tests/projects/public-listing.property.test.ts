/**
 * Property-Based Test: Public projects appear in public listings
 *
 * **Validates: Requirements 5.6, 6.2**
 *
 * Property: For any project whose status is changed to 'public' via
 * PATCH /api/projects/:id/status, that project MUST appear in the
 * GET /api/projects/public/:menteeId response.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { PATCH } from '@/app/api/projects/[id]/status/route'
import { GET } from '@/app/api/projects/public/[menteeId]/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pre-created user + profile IDs for the test run */
let testUserId: string
let testProfileId: string

/**
 * Create a test user and profile before each test (after global cleanup).
 */
beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      email: 'public-listing-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Public Listing Test Mentee',
      completionPct: 0,
    },
  })

  testUserId = user.id
  testProfileId = profile.id
})

/**
 * Helper: create a PATCH request to change project status.
 */
function makePatchStatusRequest(projectId: string, status: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/projects/${projectId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-user-role': 'mentee',
      },
      body: JSON.stringify({ status }),
    }
  )
}

/**
 * Helper: create a GET request to fetch public projects for a mentee.
 */
function makeGetPublicProjectsRequest(menteeId: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/projects/public/${menteeId}`,
    {
      method: 'GET',
    }
  )
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Arbitrary for valid project title (1–100 non-empty chars).
 */
const validTitleArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length >= 1)

/**
 * Arbitrary for optional project description.
 */
const optionalDescArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
  nil: undefined,
})

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Public projects appear in public listings', () => {
  it(
    'should include a project in the public listing after its status is changed to public',
    async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, optionalDescArb, async (title, description) => {
          // Arrange: create a draft project
          const project = await prisma.project.create({
            data: {
              title,
              description: description ?? null,
              status: 'draft',
              menteeId: testProfileId,
            },
          })

          try {
            // Act: PATCH status to 'public'
            const patchReq = makePatchStatusRequest(project.id, 'public')
            const patchRes = await PATCH(patchReq, {
              params: Promise.resolve({ id: project.id }),
            })

            // Verify the PATCH was successful
            expect(patchRes.status).toBe(200)
            const patchJson = await patchRes.json()
            expect(patchJson.success).toBe(true)
            expect(patchJson.data.status).toBe('public')

            // Act: GET public projects for this mentee
            const getReq = makeGetPublicProjectsRequest(testProfileId)
            const getRes = await GET(getReq, {
              params: Promise.resolve({ menteeId: testProfileId }),
            })

            // Assert: the project appears in the public listing
            expect(getRes.status).toBe(200)
            const getJson = await getRes.json()
            expect(getJson.success).toBe(true)

            const projectIds = getJson.data.map((p: { id: string }) => p.id)
            expect(projectIds).toContain(project.id)
          } finally {
            // Cleanup: remove the project to avoid accumulating data
            await prisma.project.delete({ where: { id: project.id } })
          }
        }),
        { numRuns: 20 }
      )
    },
    { timeout: 300000 }
  )
})
