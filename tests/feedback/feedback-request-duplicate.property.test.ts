/**
 * Property-Based Test: Duplicate active feedback requests are rejected
 *
 * **Validates: Requirements 8.3**
 *
 * Property: For any project that already has a FeedbackRequest with status
 * 'pending' or 'in_review', attempting to create a second FeedbackRequest
 * for the same project MUST return 409 and the database MUST contain only
 * the original record (no duplicate created).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/feedback-requests/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

let testUserId: string
let testProfileId: string
let testProjectIds: string[] = []

/**
 * Create test fixtures after the global beforeEach cleanup runs.
 */
beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      email: 'feedback-duplicate-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Duplicate Feedback Test Mentee',
      completionPct: 0,
    },
  })
  testUserId = user.id
  testProfileId = profile.id

  // Pre-create 100 projects so each property run can use a unique one
  const projects = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      prisma.project.create({
        data: {
          menteeId: profile.id,
          title: `Duplicate Test Project ${i}`,
          status: 'draft',
        },
      })
    )
  )
  testProjectIds = projects.map((p) => p.id)
})

/**
 * Helper: create a NextRequest for POST /api/feedback-requests
 */
function makeFeedbackRequestReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/feedback-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId,
      'x-user-role': 'mentee',
    },
    body: JSON.stringify(body),
  })
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Arbitrary for the initial status that blocks new requests.
 * Requirements 8.3 specifies both 'pending' and 'in_review' should block.
 */
const blockingStatusArb = fc.constantFrom('pending', 'in_review') as fc.Arbitrary<
  'pending' | 'in_review'
>

/**
 * Arbitrary for an optional note field.
 */
const noteArb = fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
  nil: undefined,
})

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Duplicate active feedback requests are rejected', () => {
  it(
    'should return 409 and not create a duplicate when a project already has an active feedback request',
    async () => {
      let projectIndex = 0

      await fc.assert(
        fc.asyncProperty(blockingStatusArb, noteArb, async (existingStatus, note) => {
          // Pick a unique project for this run
          const projectId = testProjectIds[projectIndex % testProjectIds.length]
          projectIndex++

          // Arrange: create an existing FeedbackRequest with blocking status
          await prisma.feedbackRequest.create({
            data: {
              projectId,
              menteeId: testProfileId,
              status: existingStatus,
              note: null,
            },
          })

          // Act: attempt to create a second FeedbackRequest for the same project
          const body: Record<string, unknown> = { projectId }
          if (note !== undefined) {
            body.note = note
          }

          const req = makeFeedbackRequestReq(body)
          const res = await POST(req)
          const json = await res.json()

          // Assert: response should be 409 Conflict
          expect(res.status).toBe(409)
          expect(json.success).toBe(false)

          // Assert: only 1 feedback request exists for this project in DB
          const dbRecords = await prisma.feedbackRequest.findMany({
            where: { projectId },
          })
          expect(dbRecords).toHaveLength(1)
          expect(dbRecords[0].status).toBe(existingStatus)
        }),
        { numRuns: 20, timeout: 120000 }
      )
    },
    { timeout: 150000 }
  )
})
