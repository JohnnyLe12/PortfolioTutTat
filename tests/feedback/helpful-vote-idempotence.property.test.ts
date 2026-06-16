/**
 * Property-Based Test: Helpful vote is idempotent per user
 *
 * **Validates: Requirements 10.4**
 *
 * Property: For any number of repeated helpful vote attempts (2–10) by the
 * same user on the same feedback, the resulting helpfulCount MUST always be 1.
 * The vote operation is idempotent — repeated calls do not increase the count.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/feedbacks/[id]/helpful/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

let testUserId: string
let testFeedbackIds: string[] = []

/**
 * Create test fixtures: user, buddy, project, feedback request, and multiple feedbacks.
 * Pre-create enough feedbacks so each property run uses a unique one.
 */
beforeEach(async () => {
  // Create mentee user + profile
  const menteeUser = await prisma.user.create({
    data: {
      email: 'helpful-idempotence-mentee@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const menteeProfile = await prisma.profile.create({
    data: {
      userId: menteeUser.id,
      fullName: 'Helpful Idempotence Mentee',
      completionPct: 0,
    },
  })

  // Create buddy user + profile
  const buddyUser = await prisma.user.create({
    data: {
      email: 'helpful-idempotence-buddy@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'buddy',
    },
  })
  const buddyProfile = await prisma.profile.create({
    data: {
      userId: buddyUser.id,
      fullName: 'Helpful Idempotence Buddy',
      completionPct: 0,
    },
  })

  testUserId = menteeUser.id

  // Create a project
  const project = await prisma.project.create({
    data: {
      menteeId: menteeProfile.id,
      title: 'Helpful Vote Idempotence Test Project',
      status: 'public',
    },
  })

  // Create a feedback request (completed)
  const feedbackRequest = await prisma.feedbackRequest.create({
    data: {
      projectId: project.id,
      menteeId: menteeProfile.id,
      buddyId: buddyProfile.id,
      status: 'completed',
    },
  })

  // Pre-create 20 feedbacks so each property run can use a unique one
  const feedbacks = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      prisma.feedback.create({
        data: {
          feedbackRequestId: feedbackRequest.id,
          buddyId: buddyProfile.id,
          rating: 4,
          comment: `Test feedback ${i} for idempotence testing`,
          suggestions: ['improve layout'],
          helpfulCount: 0,
        },
      })
    )
  )
  testFeedbackIds = feedbacks.map((f) => f.id)
})

/**
 * Helper: create a NextRequest for POST /api/feedbacks/:id/helpful
 */
function makeHelpfulVoteReq(feedbackId: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/feedbacks/${feedbackId}/helpful`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-user-role': 'mentee',
      },
    }
  )
}

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Helpful vote is idempotent per user', () => {
  it(
    'should result in helpfulCount === 1 regardless of how many times the same user votes',
    async () => {
      let feedbackIndex = 0

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (voteCount) => {
            // Pick a unique feedback for this run
            const feedbackId = testFeedbackIds[feedbackIndex % testFeedbackIds.length]
            feedbackIndex++

            // Act: vote multiple times
            let lastResponse: any
            for (let i = 0; i < voteCount; i++) {
              const req = makeHelpfulVoteReq(feedbackId)
              const res = await POST(req, {
                params: Promise.resolve({ id: feedbackId }),
              })
              lastResponse = await res.json()

              // Each call should succeed (200)
              expect(res.status).toBe(200)
            }

            // Assert: helpfulCount in the last response should be 1
            expect(lastResponse.data.helpfulCount).toBe(1)

            // Assert: verify in DB that helpfulCount is exactly 1
            const dbFeedback = await prisma.feedback.findUnique({
              where: { id: feedbackId },
              select: { helpfulCount: true },
            })
            expect(dbFeedback!.helpfulCount).toBe(1)

            // Assert: only 1 vote record exists in the database
            const voteRecords = await prisma.feedbackHelpfulVote.findMany({
              where: { feedbackId, userId: testUserId },
            })
            expect(voteRecords).toHaveLength(1)
          }
        ),
        { numRuns: 20, timeout: 240000 }
      )
    },
    { timeout: 300000 }
  )
})
