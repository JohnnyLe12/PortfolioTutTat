/**
 * Property-Based Tests: Dashboard Stats (Properties 9, 10)
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
 *
 * Property 9: Buddy Dashboard Stats Correctness
 * Property 10: Dashboard Recent Items Limit and Sort
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET as dashboardStatsGET } from '@/app/api/buddy/dashboard/stats/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const FEEDBACK_REQUEST_STATUSES = ['pending', 'in_review', 'completed'] as const
type FRStatus = (typeof FEEDBACK_REQUEST_STATUSES)[number]

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function makeStatsRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/buddy/dashboard/stats', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
  })
}

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a set of FeedbackRequests with varying statuses */
const feedbackRequestsArb = fc.array(
  fc.record({
    status: fc.constantFrom(...FEEDBACK_REQUEST_STATUSES),
  }),
  { minLength: 0, maxLength: 12 },
)

/** Arbitrary for feedbacks given by buddy with helpfulCount values */
const feedbacksArb = fc.array(
  fc.record({
    helpfulCount: fc.integer({ min: 0, max: 50 }),
    rating: fc.integer({ min: 1, max: 5 }),
  }),
  { minLength: 0, maxLength: 8 },
)

/** Arbitrary for number of distinct conversation partners with messages in last 7 days */
const activeConversationsArb = fc.integer({ min: 0, max: 5 })

/** Arbitrary for number of old conversation partners (messages older than 7 days) */
const oldConversationsArb = fc.integer({ min: 0, max: 3 })

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 9: Buddy Dashboard Stats Correctness', () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   *
   * For any buddy with a set of assigned FeedbackRequests, Feedbacks, and Messages,
   * the dashboard stats endpoint SHALL return:
   * - completedReviews equal to the count of FeedbackRequests with status=completed
   * - pendingReviews equal to count with status=pending
   * - activeMessages equal to count of distinct conversations with messages in last 7 days
   * - helpfulRating equal to round(totalHelpfulVotes / totalFeedbacks, 1) (or 0.0 when totalFeedbacks is 0)
   */
  it(
    'should return correct stats for completedReviews, pendingReviews, activeMessages, and helpfulRating',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          feedbackRequestsArb,
          feedbacksArb,
          activeConversationsArb,
          oldConversationsArb,
          async (frDefs, feedbackDefs, activeConvCount, oldConvCount) => {
            // Setup test data atomically
            const { buddyUserId, expectedCompleted, expectedPending, expectedActiveMessages, expectedHelpfulRating } =
              await prisma.$transaction(async (tx) => {

                // Create buddy user and profile
                const buddyUser = await tx.user.create({
                  data: {
                    email: uniqueEmail('stats-buddy'),
                    passwordHash: 'hashed_password',
                    role: 'buddy',
                  },
                })
                const buddyProfile = await tx.profile.create({
                  data: {
                    userId: buddyUser.id,
                    fullName: 'Stats Test Buddy',
                    completionPct: 50,
                  },
                })

                // Create a mentee for projects/feedback requests
                const menteeUser = await tx.user.create({
                  data: {
                    email: uniqueEmail('stats-mentee'),
                    passwordHash: 'hashed_password',
                    role: 'mentee',
                  },
                })
                const menteeProfile = await tx.profile.create({
                  data: {
                    userId: menteeUser.id,
                    fullName: 'Stats Test Mentee',
                    completionPct: 50,
                  },
                })

                // Create FeedbackRequests with different statuses assigned to buddy
                let completedCount = 0
                let pendingCount = 0

                for (const frDef of frDefs) {
                  const project = await tx.project.create({
                    data: {
                      menteeId: menteeProfile.id,
                      title: `Stats Project ${iterCounter++}`,
                      tags: ['test'],
                      status: 'pending_feedback',
                    },
                  })
                  await tx.feedbackRequest.create({
                    data: {
                      projectId: project.id,
                      menteeId: menteeProfile.id,
                      buddyId: buddyProfile.id,
                      status: frDef.status,
                    },
                  })
                  if (frDef.status === 'completed') completedCount++
                  if (frDef.status === 'pending') pendingCount++
                }

                // Create Feedbacks given by the buddy (for helpful rating)
                let totalHelpful = 0
                const totalFeedbacks = feedbackDefs.length

                if (feedbackDefs.length > 0) {
                  // Need at least one FeedbackRequest to attach feedbacks to
                  const frProject = await tx.project.create({
                    data: {
                      menteeId: menteeProfile.id,
                      title: `Feedback Host Project ${iterCounter++}`,
                      tags: ['test'],
                      status: 'pending_feedback',
                    },
                  })
                  const hostFR = await tx.feedbackRequest.create({
                    data: {
                      projectId: frProject.id,
                      menteeId: menteeProfile.id,
                      buddyId: buddyProfile.id,
                      status: 'completed',
                    },
                  })
                  // Update completed count to account for the host FR
                  completedCount++

                  for (const fDef of feedbackDefs) {
                    await tx.feedback.create({
                      data: {
                        feedbackRequestId: hostFR.id,
                        buddyId: buddyProfile.id,
                        rating: fDef.rating,
                        comment: 'Test feedback comment',
                        suggestions: [],
                        helpfulCount: fDef.helpfulCount,
                      },
                    })
                    totalHelpful += fDef.helpfulCount
                  }
                }

                // Calculate expected helpful rating
                const expectedRating =
                  totalFeedbacks > 0
                    ? Math.round((totalHelpful / totalFeedbacks) * 10) / 10
                    : 0.0

                // Create active conversations (messages within last 7 days)
                const now = new Date()
                const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago

                for (let i = 0; i < activeConvCount; i++) {
                  const partner = await tx.user.create({
                    data: {
                      email: uniqueEmail(`active-partner-${i}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  await tx.message.create({
                    data: {
                      senderId: buddyUser.id,
                      receiverId: partner.id,
                      content: 'Recent message',
                      createdAt: recentDate,
                    },
                  })
                }

                // Create old conversations (messages older than 7 days — should NOT count)
                const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

                for (let i = 0; i < oldConvCount; i++) {
                  const partner = await tx.user.create({
                    data: {
                      email: uniqueEmail(`old-partner-${i}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  await tx.message.create({
                    data: {
                      senderId: partner.id,
                      receiverId: buddyUser.id,
                      content: 'Old message',
                      createdAt: oldDate,
                    },
                  })
                }

                return {
                  buddyUserId: buddyUser.id,
                  expectedCompleted: completedCount,
                  expectedPending: pendingCount,
                  expectedActiveMessages: activeConvCount,
                  expectedHelpfulRating: expectedRating,
                }
              }, { timeout: 30000 })

            // Call the dashboard stats endpoint
            const req = makeStatsRequest(buddyUserId)
            const res = await dashboardStatsGET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const data = body.data

            // Verify completedReviews
            expect(data.completedReviews).toBe(expectedCompleted)

            // Verify pendingReviews
            expect(data.pendingReviews).toBe(expectedPending)

            // Verify activeMessages
            expect(data.activeMessages).toBe(expectedActiveMessages)

            // Verify helpfulRating
            expect(data.helpfulRating).toBe(expectedHelpfulRating)
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 10: Dashboard Recent Items Limit and Sort', () => {
  /**
   * **Validates: Requirements 4.5**
   *
   * For any buddy with n assigned FeedbackRequests, the dashboard SHALL return
   * at most 5 items sorted by assigned date descending.
   */
  it(
    'should return at most 5 recent items sorted by assigned date descending',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }), // number of FeedbackRequests to create
          async (numFRs) => {
            // Setup test data
            const { buddyUserId, assignedDates } = await prisma.$transaction(async (tx) => {
              // Create buddy user and profile
              const buddyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('limit-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              const buddyProfile = await tx.profile.create({
                data: {
                  userId: buddyUser.id,
                  fullName: 'Limit Test Buddy',
                  completionPct: 50,
                },
              })

              // Create a mentee
              const menteeUser = await tx.user.create({
                data: {
                  email: uniqueEmail('limit-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: menteeUser.id,
                  fullName: 'Limit Test Mentee',
                  completionPct: 50,
                },
              })

              // Create FeedbackRequests with distinct updatedAt dates
              // Use staggered dates so sort order is deterministic
              const baseDate = new Date('2024-01-01T00:00:00Z')
              const dates: Date[] = []

              for (let i = 0; i < numFRs; i++) {
                const assignedDate = new Date(baseDate.getTime() + i * 60000) // 1 minute apart
                dates.push(assignedDate)

                const project = await tx.project.create({
                  data: {
                    menteeId: menteeProfile.id,
                    title: `Limit Project ${i}`,
                    tags: ['test'],
                    status: 'pending_feedback',
                  },
                })
                await tx.feedbackRequest.create({
                  data: {
                    projectId: project.id,
                    menteeId: menteeProfile.id,
                    buddyId: buddyProfile.id,
                    status: FEEDBACK_REQUEST_STATUSES[i % 3],
                    updatedAt: assignedDate,
                  },
                })
              }

              return {
                buddyUserId: buddyUser.id,
                assignedDates: dates,
              }
            }, { timeout: 30000 })

            // Call the dashboard stats endpoint
            const req = makeStatsRequest(buddyUserId)
            const res = await dashboardStatsGET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const recentItems = body.data.recentItems as Array<{
              id: string
              projectName: string
              status: string
              assignedDate: string
            }>

            // Property: at most 5 items returned
            expect(recentItems.length).toBeLessThanOrEqual(5)

            // Property: exactly min(n, 5) items returned
            expect(recentItems.length).toBe(Math.min(numFRs, 5))

            // Property: items are sorted by assigned date descending
            for (let i = 0; i < recentItems.length - 1; i++) {
              const currentDate = new Date(recentItems[i].assignedDate).getTime()
              const nextDate = new Date(recentItems[i + 1].assignedDate).getTime()
              expect(currentDate).toBeGreaterThanOrEqual(nextDate)
            }

            // Property: the returned items are the 5 most recent ones
            if (numFRs > 0) {
              // Sort all dates descending and take top 5
              const sortedDates = [...assignedDates].sort((a, b) => b.getTime() - a.getTime())
              const expectedTopDates = sortedDates.slice(0, 5)

              // The most recent item should match the most recent date we created
              const mostRecentReturned = new Date(recentItems[0].assignedDate).getTime()
              expect(mostRecentReturned).toBe(expectedTopDates[0].getTime())
            }
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
