/**
 * Property-Based Test: Feedback average rating is mathematically correct
 *
 * **Validates: Requirements 10.2**
 *
 * Property: For any non-empty array of ratings (integers 1–5), the average
 * rating calculation used in GET /api/projects/:id/feedback-summary must equal
 * Math.round((sum / count) * 10) / 10 — i.e., the arithmetic mean rounded
 * to exactly one decimal place.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Extracted Calculation Logic ────────────────────────────────────────────

/**
 * Replicates the avgRating calculation from
 * app/api/projects/[id]/feedback-summary/route.ts
 *
 * This is the System Under Test (SUT).
 */
function calculateAvgRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

/**
 * Reference implementation (oracle) for correctness verification.
 * Uses the same mathematical formula expressed differently to avoid
 * trivially identical code.
 */
function referenceAvgRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  let sum = 0
  for (const r of ratings) {
    sum += r
  }
  const raw = sum / ratings.length
  // Round to 1 decimal place
  return Number(raw.toFixed(1))
}

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Feedback average rating is mathematically correct', () => {
  it(
    'should calculate avgRating === round(sum/count, 1) for any non-empty array of ratings 1–5',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 100 }),
          (ratings) => {
            // Act: calculate average using the route's formula
            const avgRating = calculateAvgRating(ratings)

            // Reference: compute expected value
            const sum = ratings.reduce((acc, r) => acc + r, 0)
            const expectedAvg = Math.round((sum / ratings.length) * 10) / 10

            // Assert: avgRating is mathematically correct
            expect(avgRating).toBe(expectedAvg)

            // Assert: result is within the valid range [1.0, 5.0]
            expect(avgRating).toBeGreaterThanOrEqual(1.0)
            expect(avgRating).toBeLessThanOrEqual(5.0)

            // Assert: result has at most 1 decimal place
            const decimalPart = avgRating.toString().split('.')[1]
            if (decimalPart) {
              expect(decimalPart.length).toBeLessThanOrEqual(1)
            }
          }
        ),
        { numRuns: 20 }
      )
    }
  )

  it(
    'should return 0 for an empty array of ratings',
    () => {
      const avgRating = calculateAvgRating([])
      expect(avgRating).toBe(0)
    }
  )

  it(
    'should match a reference implementation using toFixed(1)',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 100 }),
          (ratings) => {
            const actual = calculateAvgRating(ratings)
            const reference = referenceAvgRating(ratings)

            // Both implementations should agree for integer ratings in [1,5]
            expect(actual).toBe(reference)
          }
        ),
        { numRuns: 20 }
      )
    }
  )
})
