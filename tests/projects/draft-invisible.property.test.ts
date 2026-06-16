/**
 * Property-Based Test: Draft projects are invisible to non-owners
 *
 * **Validates: Requirements 5.5**
 *
 * Property: For any draft project owned by User A, a GET request by User B
 * (non-owner) MUST return 404 (NOT_FOUND), while User A (owner) MUST always
 * receive 200 with the full project data.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/projects/[id]/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pre-created user + profile IDs for the test run */
let ownerUserId: string
let ownerProfileId: string
let nonOwnerUserId: string

/**
 * Create two test users before each test (after global beforeEach cleanup):
 * - User A (owner) with a profile (needed to create projects)
 * - User B (non-owner) who will try to access draft projects
 */
beforeEach(async () => {
  const userA = await prisma.user.create({
    data: {
      email: 'draft-owner@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profileA = await prisma.profile.create({
    data: {
      userId: userA.id,
      fullName: 'Owner Mentee',
      completionPct: 0,
    },
  })

  const userB = await prisma.user.create({
    data: {
      email: 'draft-nonowner@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })

  ownerUserId = userA.id
  ownerProfileId = profileA.id
  nonOwnerUserId = userB.id
})

/**
 * Helper: create a GET request for a project with specified user auth headers.
 */
function makeGetProjectRequest(projectId: string, userId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/projects/${projectId}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'mentee',
    },
  })
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Arbitrary for valid project title (1–100 non-empty chars).
 */
const validTitleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length >= 1
)

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Draft projects are invisible to non-owners', () => {
  it(
    'should return 404 for non-owner and 200 for owner when accessing a draft project',
    async () => {
      await fc.assert(
        fc.asyncProperty(validTitleArb, async (title) => {
          // Arrange: create a draft project owned by User A
          const project = await prisma.project.create({
            data: {
              title,
              status: 'draft',
              menteeId: ownerProfileId,
            },
          })

          try {
            // Act & Assert: Owner (User A) gets 200
            const ownerReq = makeGetProjectRequest(project.id, ownerUserId)
            const ownerRes = await GET(ownerReq, { params: Promise.resolve({ id: project.id }) })
            expect(ownerRes.status).toBe(200)

            const ownerJson = await ownerRes.json()
            expect(ownerJson.success).toBe(true)
            expect(ownerJson.data.id).toBe(project.id)

            // Act & Assert: Non-owner (User B) gets 404
            const nonOwnerReq = makeGetProjectRequest(project.id, nonOwnerUserId)
            const nonOwnerRes = await GET(nonOwnerReq, { params: Promise.resolve({ id: project.id }) })
            expect(nonOwnerRes.status).toBe(404)
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
