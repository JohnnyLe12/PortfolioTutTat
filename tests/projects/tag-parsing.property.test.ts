/**
 * Property-Based Test: Tag string parsing produces trimmed array
 *
 * **Validates: Requirements 4.6**
 *
 * Property: For any array of strings joined by commas, `parseTags()` returns
 * an array where every element is trimmed (no leading/trailing whitespace)
 * and non-empty. The result never contains empty strings.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { parseTags } from '@/lib/validations/project'

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Tag string parsing produces trimmed array', () => {
  it(
    'should return only trimmed non-empty tokens from a comma-separated string',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 30 })),
          (tokens) => {
            // Arrange: join the generated string array with commas to form a
            // raw tag input, then parse it
            const raw = tokens.join(',')

            // Act: parse the comma-separated string
            const result = parseTags(raw)

            // Assert 1: every element in the result is trimmed (no leading/trailing whitespace)
            for (const tag of result) {
              expect(tag).toBe(tag.trim())
            }

            // Assert 2: no element in the result is empty
            for (const tag of result) {
              expect(tag.length).toBeGreaterThan(0)
            }

            // Assert 3: the result should be equivalent to manually splitting
            // the raw string on commas, trimming, and filtering empty strings.
            // This is the exact specification of parseTags behavior.
            const expected = raw
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
            expect(result).toEqual(expected)
          }
        ),
        { numRuns: 20 }
      )
    }
  )

  it('should return an empty array when input is undefined', () => {
    expect(parseTags(undefined)).toEqual([])
  })

  it('should return an empty array when input is an empty string', () => {
    expect(parseTags('')).toEqual([])
  })
})
