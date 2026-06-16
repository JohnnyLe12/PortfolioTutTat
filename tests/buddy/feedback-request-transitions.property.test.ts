/**
 * Property-Based Tests: FeedbackRequest State Transitions (Properties 16, 17)
 *
 * **Validates: Requirements 6.2, 6.5, 6.8, 13.1**
 *
 * Property 16: FeedbackRequest State Transition — Start Review
 * Property 17: FeedbackRequest State Transition — Complete Review
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { PATCH as START_PATCH } from '@/app/api/buddy/workspace/[feedbackRequestId]/start/route'
import { PATCH as COMPLETE_PATCH } from '@/app/api/buddy/workspace/[feedbackRequestId]/complete/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_FR_STATUSES = ['pending', 'in_review', 'completed'] as const
type FRStatus = (typeof ALL_FR_STATUSES)[number]

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

function makeRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/buddy/workspace/test/start', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
  })
}

async function setupBuddyAndMentee() {
  return prisma.$transaction(async (tx) => {
    const buddyUser = await tx.user.create({
      data: {
        email: uniqueEmail('fr-buddy'),
        passwordHash: 'hashed_password',
        role: 'buddy',
      },
    })
    const buddyProfile = await tx.profile.create({
      data: {
        userId: buddyUser.id,
        fullName: 'FR Test Buddy',
        completionPct: 50,
      },
    })

    const menteeUser = await tx.user.create({
      data: {
        email: uniqueEmail('fr-mentee'),
        passwordHash: 'hashed_password',
        role: 'mentee',
      },
    })
    const menteeProfile = await tx.profile.create({
      data: {
        userId: menteeUser.id,
        fullName: 'FR Test Mentee',
        completionPct: 50,
      },
    })

    const project = await tx.project.create({
      data: {
        menteeId: menteeProfile.id,
        title: `FR Test Project ${iterCounter}`,
        tags: ['design'],
        status: 'pending_feedback',
        isApproved: false,
      },
    })

    return {
      buddyUserId: buddyUser.id,
      buddyProfileId: buddyProfile.id,
      menteeUserId: menteeUser.id,
      menteeProfileId: menteeProfile.id,
      projectId: project.id,
    }
  }, { timeout: 30000 })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for statuses that are NOT 'pending' — used to test rejection on start-review */
const nonPendingStatusArb = fc.constantFrom<FRStatus>('in_review', 'completed')

/** Arbitrary for statuses that are NOT 'in_review' — used to test rejection on complete-review */
const nonInReviewStatusArb = fc.constantFrom<FRStatus>('pending', 'completed')

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 16: FeedbackRequest State Transition — Start Review', () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any FeedbackRequest with status=pending, executing the start-review action
   * SHALL transition the status to in_review.
   * For any FeedbackRequest NOT in status=pending, the start-review action SHALL be rejected.
   */

  it(
    'should transition from pending to in_review for any FeedbackRequest assigned to the buddy',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // number of pending FRs to test in this run
          async (numFRs) => {
            const setup = await setupBuddyAndMentee()

            // Create multiple pending FeedbackRequests
            for (let i = 0; i < numFRs; i++) {
              // Each FR needs its own project (since workspace design is per-project)
              const project = await prisma.project.create({
                data: {
                  menteeId: setup.menteeProfileId,
                  title: `Pending Project ${iterCounter++}`,
                  tags: ['test'],
                  status: 'pending_feedback',
                },
              })

              const fr = await prisma.feedbackRequest.create({
                data: {
                  projectId: project.id,
                  menteeId: setup.menteeProfileId,
                  buddyId: setup.buddyProfileId,
                  status: 'pending',
                },
              })

              // Execute start-review action
              const req = makeRequest(setup.buddyUserId)
              const res = await START_PATCH(req, {
                params: Promise.resolve({ feedbackRequestId: fr.id }),
              })
              const body = await res.json()

              // Property: transition succeeds with 200
              expect(res.status).toBe(200)
              expect(body.success).toBe(true)
              expect(body.data.status).toBe('in_review')

              // Verify in DB
              const dbFR = await prisma.feedbackRequest.findUnique({
                where: { id: fr.id },
              })
              expect(dbFR?.status).toBe('in_review')
            }
          },
        ),
        { numRuns: 10, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject start-review for any FeedbackRequest NOT in pending status',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          nonPendingStatusArb,
          async (initialStatus) => {
            const setup = await setupBuddyAndMentee()

            const fr = await prisma.feedbackRequest.create({
              data: {
                projectId: setup.projectId,
                menteeId: setup.menteeProfileId,
                buddyId: setup.buddyProfileId,
                status: initialStatus,
              },
            })

            // Execute start-review action
            const req = makeRequest(setup.buddyUserId)
            const res = await START_PATCH(req, {
              params: Promise.resolve({ feedbackRequestId: fr.id }),
            })
            const body = await res.json()

            // Property: rejected with 422 INVALID_STATE_TRANSITION
            expect(res.status).toBe(422)
            expect(body.success).toBe(false)
            expect(body.error.code).toBe('INVALID_STATE_TRANSITION')

            // Property: status remains unchanged in DB
            const dbFR = await prisma.feedbackRequest.findUnique({
              where: { id: fr.id },
            })
            expect(dbFR?.status).toBe(initialStatus)
          },
        ),
        { numRuns: 10, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 17: FeedbackRequest State Transition — Complete Review', () => {
  /**
   * **Validates: Requirements 6.5, 6.8, 13.1**
   *
   * For any FeedbackRequest with status=in_review, executing the complete-review action
   * SHALL transition the status to completed AND set the associated project's isApproved field to true.
   * For any FeedbackRequest NOT in status=in_review, the complete action SHALL be rejected with an error.
   */

  it(
    'should transition from in_review to completed and set project.isApproved=true',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // number of in_review FRs to test
          async (numFRs) => {
            const setup = await setupBuddyAndMentee()

            for (let i = 0; i < numFRs; i++) {
              // Each FR needs its own project
              const project = await prisma.project.create({
                data: {
                  menteeId: setup.menteeProfileId,
                  title: `InReview Project ${iterCounter++}`,
                  tags: ['test'],
                  status: 'pending_feedback',
                  isApproved: false,
                },
              })

              const fr = await prisma.feedbackRequest.create({
                data: {
                  projectId: project.id,
                  menteeId: setup.menteeProfileId,
                  buddyId: setup.buddyProfileId,
                  status: 'in_review',
                },
              })

              // Execute complete-review action
              const req = makeRequest(setup.buddyUserId)
              const res = await COMPLETE_PATCH(req, {
                params: Promise.resolve({ feedbackRequestId: fr.id }),
              })
              const body = await res.json()

              // Property: transition succeeds with 200
              expect(res.status).toBe(200)
              expect(body.success).toBe(true)
              expect(body.data.status).toBe('completed')

              // Property: status is 'completed' in DB
              const dbFR = await prisma.feedbackRequest.findUnique({
                where: { id: fr.id },
              })
              expect(dbFR?.status).toBe('completed')

              // Property: associated project.isApproved is set to true (Req 13.1)
              const dbProject = await prisma.project.findUnique({
                where: { id: project.id },
              })
              expect(dbProject?.isApproved).toBe(true)
            }
          },
        ),
        { numRuns: 10, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject complete-review for any FeedbackRequest NOT in in_review status',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          nonInReviewStatusArb,
          async (initialStatus) => {
            const setup = await setupBuddyAndMentee()

            const fr = await prisma.feedbackRequest.create({
              data: {
                projectId: setup.projectId,
                menteeId: setup.menteeProfileId,
                buddyId: setup.buddyProfileId,
                status: initialStatus,
              },
            })

            // Execute complete-review action
            const req = makeRequest(setup.buddyUserId)
            const res = await COMPLETE_PATCH(req, {
              params: Promise.resolve({ feedbackRequestId: fr.id }),
            })
            const body = await res.json()

            // Property: rejected with 422 INVALID_STATE_TRANSITION
            expect(res.status).toBe(422)
            expect(body.success).toBe(false)
            expect(body.error.code).toBe('INVALID_STATE_TRANSITION')

            // Property: status remains unchanged in DB
            const dbFR = await prisma.feedbackRequest.findUnique({
              where: { id: fr.id },
            })
            expect(dbFR?.status).toBe(initialStatus)

            // Property: project.isApproved remains false (not mutated on rejection)
            const dbProject = await prisma.project.findUnique({
              where: { id: setup.projectId },
            })
            expect(dbProject?.isApproved).toBe(false)
          },
        ),
        { numRuns: 10, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
