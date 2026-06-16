/**
 * Property-Based Test: Recent activity list is bounded at 10 items
 *
 * **Validates: Requirements 15.2**
 *
 * Property: For any mentee with more than 10 recorded activities (notifications),
 * the dashboard activity feed SHALL return at most 10 items, and those items
 * SHALL be the 10 most recent by timestamp (createdAt descending).
 *
 * The dashboard fetches from GET /api/notifications and applies .slice(0, 10).
 * The notifications endpoint returns up to 50 items sorted by createdAt desc.
 * This test verifies the complete flow produces exactly 10 most-recent items.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/notifications/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

const RECENT_ACTIVITY_LIMIT = 10

let testUserId: string

/**
 * Create test fixtures after the global beforeEach cleanup runs.
 */
beforeEach(async () => {
  // Create a mentee user for the test
  const user = await prisma.user.create({
    data: {
      email: 'recent-activity-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  testUserId = user.id
})

/**
 * Helper: create a NextRequest for GET /api/notifications with auth headers
 */
function makeNotificationsReq(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/notifications', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'mentee',
    },
  })
}

/**
 * Activity types that represent recent activity on the dashboard.
 * Matches the types used in the DashBoardPage and RecentActivity component.
 */
const ACTIVITY_TYPES = [
  'project_liked',
  'application_submitted',
  'project_created',
  'feedback_completed',
] as const

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Arbitrary for a count of activities that exceeds the 10-item limit.
 * Generates a number between 11 and 30 to ensure we always have more than 10.
 */
const activityCountArb = fc.integer({ min: 11, max: 30 })

/**
 * Arbitrary for activity type selection.
 */
const activityTypeArb = fc.constantFrom(...ACTIVITY_TYPES)

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Recent activity list is bounded at 10 items', () => {
  it(
    'should return exactly 10 most recent items when more than 10 activities exist',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          activityCountArb,
          fc.array(activityTypeArb, { minLength: 30, maxLength: 30 }),
          async (count, types) => {
            // Clean up notifications from previous iteration
            await prisma.notification.deleteMany({ where: { userId: testUserId } })

            // Arrange: create `count` notifications with staggered timestamps
            // Use a base time and increment by 1 minute per notification
            const baseTime = new Date('2024-01-01T00:00:00Z')
            const notifications = []

            for (let i = 0; i < count; i++) {
              const createdAt = new Date(baseTime.getTime() + i * 60000) // +1 minute each
              notifications.push({
                userId: testUserId,
                type: types[i % types.length],
                title: `Activity ${i + 1}`,
                body: `Activity body ${i + 1}`,
                entityType: 'project',
                entityId: undefined,
                isRead: false,
                createdAt,
              })
            }

            await prisma.notification.createMany({ data: notifications })

            // Act: call the notifications API endpoint (same as DashBoardPage does)
            const req = makeNotificationsReq(testUserId)
            const res = await GET(req)
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.success).toBe(true)

            const allItems = json.data as Array<{ id: string; createdAt: string }>

            // Apply the same slice logic as the dashboard: .slice(0, 10)
            const recentActivities = allItems.slice(0, RECENT_ACTIVITY_LIMIT)

            // Assert: exactly 10 items returned (strict limit)
            expect(recentActivities).toHaveLength(RECENT_ACTIVITY_LIMIT)

            // Assert: items are ordered by most recent first (createdAt descending)
            for (let i = 1; i < recentActivities.length; i++) {
              const prev = new Date(recentActivities[i - 1].createdAt).getTime()
              const curr = new Date(recentActivities[i].createdAt).getTime()
              expect(prev).toBeGreaterThanOrEqual(curr)
            }

            // Assert: the 10 items are indeed the most recent ones
            // The most recent notification should be the last one we created (index count-1)
            const mostRecentTime = new Date(recentActivities[0].createdAt).getTime()
            const expectedMostRecentTime = baseTime.getTime() + (count - 1) * 60000
            expect(mostRecentTime).toBe(expectedMostRecentTime)

            // The 10th item should correspond to the (count - 10)th notification
            const tenthItemTime = new Date(recentActivities[9].createdAt).getTime()
            const expectedTenthTime = baseTime.getTime() + (count - 10) * 60000
            expect(tenthItemTime).toBe(expectedTenthTime)
          }
        ),
        { numRuns: 20, timeout: 300000 }
      )
    },
    { timeout: 360000 }
  )
})
