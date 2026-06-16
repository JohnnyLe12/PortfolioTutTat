/**
 * Property-Based Test: Feedback request creation sets status to `pending`
 *
 * **Validates: Requirements 8.2**
 *
 * Property: For any valid project_id, when a mentee creates a feedback request
 * via POST /api/feedback-requests, the resulting FeedbackRequest MUST always
 * have status === 'pending' and the correct project_id/mentee_id.
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
 * This ensures test data is available when the property test executes.
 */
beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      email: 'feedback-pending-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Feedback Test Mentee',
      completionPct: 0,
    },
  })
  testUserId = user.id
  testProfileId = profile.id

  // Pre-create 20 projects so each property run uses a unique one
  // (avoids 409 conflict from duplicate active feedback requests)
  const projects = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      prisma.project.create({
        data: {
          menteeId: profile.id,
          title: `Test Project ${i}`,
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
 * Arbitrary for an optional note field (up to 2000 chars).
 */
const noteArb = fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
  nil: undefined,
})

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Feedback request creation sets status to pending', () => {
  it(
    'should always create a feedback request with status "pending" and correct project_id/mentee_id',
    async () => {
      let projectIndex = 0

      await fc.assert(
        fc.asyncProperty(noteArb, async (note) => {
          // Use a unique project for each run to avoid duplicate conflict
          const projectId = testProjectIds[projectIndex % testProjectIds.length]
          projectIndex++

          // Build request body
          const body: Record<string, unknown> = { projectId }
          if (note !== undefined) {
            body.note = note
          }

          // Act: call POST /api/feedback-requests
          const req = makeFeedbackRequestReq(body)
          const res = await POST(req)
          const json = await res.json()

          // Assert: request was created successfully
          expect(res.status).toBe(201)
          expect(json.success).toBe(true)

          // Assert: status is 'pending'
          expect(json.data.status).toBe('pending')

          // Assert: correct project_id and mentee_id
          expect(json.data.projectId).toBe(projectId)
          expect(json.data.menteeId).toBe(testProfileId)

          // Assert: database record confirms status is 'pending'
          const dbRecord = await prisma.feedbackRequest.findUnique({
            where: { id: json.data.id },
          })
          expect(dbRecord).not.toBeNull()
          expect(dbRecord!.status).toBe('pending')
          expect(dbRecord!.projectId).toBe(projectId)
          expect(dbRecord!.menteeId).toBe(testProfileId)
        }),
        { numRuns: 20, timeout: 60000 }
      )
    },
    { timeout: 80000 }
  )
})
