/**
 * Property-Based Test: Profile completion percentage reflects filled fields
 *
 * **Validates: Requirements 1.5, 2.6**
 *
 * Property: For any combination of optional profile fields, the completion
 * percentage MUST equal Math.round(filledCount / 9 * 100), where filledCount
 * is the number of non-empty fields among the 9 tracked fields:
 * fullName, roleTitle, bio, avatarUrl, major, skills, designTools, interests, socialLinks.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateCompletionPct } from '@/lib/profile'

/**
 * Arbitrary for optional string fields — either a non-empty string or undefined/null.
 */
const optionalStringArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.constant(undefined),
  fc.constant(null),
) as fc.Arbitrary<string | undefined | null>

/**
 * Arbitrary for Major enum values (matching Prisma enum).
 */
const optionalMajorArb = fc.oneof(
  fc.constantFrom('Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design'),
  fc.constant(undefined),
  fc.constant(null),
) as fc.Arbitrary<string | undefined | null>

/**
 * Arbitrary for optional string arrays — either a non-empty array or an empty array.
 */
const optionalStringArrayArb = fc.oneof(
  fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  fc.constant([] as string[]),
)

/**
 * Arbitrary for optional social links object.
 * Each social link field is either a valid HTTPS URL or empty string/undefined.
 */
const socialLinksArb = fc.record({
  behance: fc.oneof(
    fc.webUrl({ withScheme: fc.constant('https') }),
    fc.constant(''),
    fc.constant(undefined),
  ),
  linkedin: fc.oneof(
    fc.webUrl({ withScheme: fc.constant('https') }),
    fc.constant(''),
    fc.constant(undefined),
  ),
  instagram: fc.oneof(
    fc.webUrl({ withScheme: fc.constant('https') }),
    fc.constant(''),
    fc.constant(undefined),
  ),
  github: fc.oneof(
    fc.webUrl({ withScheme: fc.constant('https') }),
    fc.constant(''),
    fc.constant(undefined),
  ),
}) as fc.Arbitrary<Record<string, string | undefined>>

/**
 * Arbitrary for the full profile record with optional fields.
 */
const profileArb = fc.record({
  fullName: optionalStringArb,
  roleTitle: optionalStringArb,
  bio: optionalStringArb,
  avatarUrl: optionalStringArb,
  major: optionalMajorArb,
  skills: optionalStringArrayArb,
  designTools: optionalStringArrayArb,
  interests: optionalStringArrayArb,
  socialLinks: fc.oneof(socialLinksArb, fc.constant(null)),
})

/**
 * Count the number of filled fields matching the logic in calculateCompletionPct.
 * This is the "oracle" — an independent reimplementation for verification.
 */
function countFilledFields(profile: {
  fullName?: string | null
  roleTitle?: string | null
  bio?: string | null
  avatarUrl?: string | null
  major?: string | null
  skills?: string[]
  designTools?: string[]
  interests?: string[]
  socialLinks?: Record<string, string | undefined> | null
}): number {
  let count = 0

  if (profile.fullName) count++
  if (profile.roleTitle) count++
  if (profile.bio) count++
  if (profile.avatarUrl) count++
  if (profile.major) count++
  if ((profile.skills?.length ?? 0) > 0) count++
  if ((profile.designTools?.length ?? 0) > 0) count++
  if ((profile.interests?.length ?? 0) > 0) count++

  // socialLinks counts as filled if ANY of the 4 URLs is truthy
  const links = profile.socialLinks as Record<string, string | undefined> | null
  if (links?.behance || links?.linkedin || links?.instagram || links?.github) {
    count++
  }

  return count
}

describe('Property: Profile completion percentage reflects filled fields', () => {
  it(
    'should equal Math.round(filledCount / 9 * 100) for any combination of profile fields',
    async () => {
      await fc.assert(
        fc.property(profileArb, (profile) => {
          // Act: calculate completion percentage using the actual implementation
          const result = calculateCompletionPct(profile as any)

          // Oracle: independently count filled fields and compute expected pct
          const filledCount = countFilledFields(profile)
          const expected = Math.round((filledCount / 9) * 100)

          // Assert: result matches the expected formula
          expect(result).toBe(expected)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})
