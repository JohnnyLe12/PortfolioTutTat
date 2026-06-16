/**
 * Property-Based Tests: BuddyProfile Validation
 *
 * **Validates: Requirements 2.3, 2.4, 2.6, 2.7, 2.9**
 *
 * Properties tested:
 * - Property 3: CompletionPct Calculation
 * - Property 4: Whitespace Name Rejection
 * - Property 5: URL Format Validation (https:// prefix)
 * - Property 7: Field Length Limit Enforcement
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateBuddyCompletionPct } from '@/lib/buddy-profile'
import { buddyProfileCreateSchema } from '@/lib/validations/buddy-profile'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAJOR_VALUES = ['Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design'] as const
const SOCIAL_LINK_KEYS = ['behance', 'linkedin', 'instagram', 'github'] as const

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a non-whitespace string (at least one printable char) */
const nonWhitespaceStringArb = (maxLen: number) =>
  fc.string({ minLength: 1, maxLength: maxLen }).filter((s) => s.trim().length > 0)

/** Arbitrary for optional string — either filled or empty/undefined */
const optionalFilledStringArb = (maxLen: number) =>
  fc.oneof(
    nonWhitespaceStringArb(maxLen),
    fc.constant(''),
    fc.constant(undefined),
  ) as fc.Arbitrary<string | undefined>

/** Arbitrary for optional Major enum */
const optionalMajorArb = fc.oneof(
  fc.constantFrom(...MAJOR_VALUES),
  fc.constant(undefined),
  fc.constant(null),
) as fc.Arbitrary<string | undefined | null>

/** Arbitrary for optional string array — either filled or empty */
const optionalStringArrayArb = fc.oneof(
  fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
  fc.constant([] as string[]),
)

/** Arbitrary for a valid https URL */
const validHttpsUrlArb = fc.constantFrom(
  'https://behance.net/user',
  'https://linkedin.com/in/user',
  'https://github.com/user',
  'https://instagram.com/user',
  'https://example.com/profile',
)

/** Arbitrary for social links with optional valid URLs */
const socialLinksArb = fc.record({
  behance: fc.oneof(validHttpsUrlArb, fc.constant(''), fc.constant(undefined)),
  linkedin: fc.oneof(validHttpsUrlArb, fc.constant(''), fc.constant(undefined)),
  instagram: fc.oneof(validHttpsUrlArb, fc.constant(''), fc.constant(undefined)),
  github: fc.oneof(validHttpsUrlArb, fc.constant(''), fc.constant(undefined)),
}) as fc.Arbitrary<Record<string, string | undefined>>

/** Arbitrary for a full BuddyProfile data object (for completionPct testing) */
const buddyProfileDataArb = fc.record({
  fullName: optionalFilledStringArb(100),
  roleTitle: optionalFilledStringArb(100),
  bio: optionalFilledStringArb(200),
  avatarUrl: optionalFilledStringArb(100),
  major: optionalMajorArb,
  skills: optionalStringArrayArb,
  designTools: optionalStringArrayArb,
  interests: optionalStringArrayArb,
  socialLinks: fc.oneof(socialLinksArb, fc.constant(null), fc.constant(undefined)),
})

/** Arbitrary for whitespace-only strings */
const whitespaceOnlyArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\u00A0'), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(''))

/** Arbitrary for a non-empty string that does NOT start with https:// */
const nonHttpsUrlArb = fc.oneof(
  fc.constant('http://example.com'),
  fc.constant('ftp://example.com'),
  fc.constant('www.example.com'),
  fc.constant('example.com/path'),
  fc.constant('htt://broken.com'),
  nonWhitespaceStringArb(50).filter((s) => !s.startsWith('https://')),
)

// ─── Helper: Oracle for completionPct ──────────────────────────────────────────

function oracleFilledCount(profile: {
  fullName?: string | undefined
  roleTitle?: string | undefined
  bio?: string | undefined
  avatarUrl?: string | undefined
  major?: string | null | undefined
  skills?: string[]
  designTools?: string[]
  interests?: string[]
  socialLinks?: Record<string, string | undefined> | null | undefined
}): number {
  let count = 0

  if (profile.fullName && profile.fullName.trim().length > 0) count++
  if (profile.roleTitle && profile.roleTitle.trim().length > 0) count++
  if (profile.bio && profile.bio.trim().length > 0) count++
  if (profile.avatarUrl && profile.avatarUrl.trim().length > 0) count++
  if (profile.major != null) count++
  if ((profile.skills?.length ?? 0) > 0) count++
  if ((profile.designTools?.length ?? 0) > 0) count++
  if ((profile.interests?.length ?? 0) > 0) count++

  // socialLinks counts as filled if at least one URL is non-empty and starts with https://
  const links = profile.socialLinks
  if (links && typeof links === 'object') {
    const hasValidUrl = Object.values(links).some(
      (url) => typeof url === 'string' && url.trim().length > 0 && url.startsWith('https://')
    )
    if (hasValidUrl) count++
  }

  return count
}

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 3: BuddyProfile CompletionPct Calculation', () => {
  /**
   * **Validates: Requirements 2.4, 2.6**
   *
   * For any BuddyProfile data (with arbitrary combinations of filled and unfilled fields),
   * the completionPct value SHALL equal Math.floor((filledFieldCount / 9) * 100).
   */
  it(
    'should equal Math.floor((filledFieldCount / 9) * 100) for any combination of fields',
    async () => {
      await fc.assert(
        fc.property(buddyProfileDataArb, (profile) => {
          const result = calculateBuddyCompletionPct(profile as any)
          const filledCount = oracleFilledCount(profile)
          const expected = Math.floor((filledCount / 9) * 100)
          expect(result).toBe(expected)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should always return a value between 0 and 100 inclusive',
    async () => {
      await fc.assert(
        fc.property(buddyProfileDataArb, (profile) => {
          const result = calculateBuddyCompletionPct(profile as any)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 4: BuddyProfile Whitespace Name Rejection', () => {
  /**
   * **Validates: Requirements 2.3**
   *
   * For any string composed entirely of whitespace characters,
   * when used as fullName or roleTitle in BuddyProfile creation,
   * the system SHALL reject the input with a validation error.
   */
  it(
    'should reject fullName that is whitespace-only',
    async () => {
      await fc.assert(
        fc.property(whitespaceOnlyArb, (whitespaceStr) => {
          const payload = {
            fullName: whitespaceStr,
            roleTitle: 'Valid Title',
          }
          const result = buddyProfileCreateSchema.safeParse(payload)
          expect(result.success).toBe(false)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject roleTitle that is whitespace-only',
    async () => {
      await fc.assert(
        fc.property(whitespaceOnlyArb, (whitespaceStr) => {
          const payload = {
            fullName: 'Valid Name',
            roleTitle: whitespaceStr,
          }
          const result = buddyProfileCreateSchema.safeParse(payload)
          expect(result.success).toBe(false)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject when both fullName and roleTitle are whitespace-only',
    async () => {
      await fc.assert(
        fc.property(whitespaceOnlyArb, whitespaceOnlyArb, (ws1, ws2) => {
          const payload = {
            fullName: ws1,
            roleTitle: ws2,
          }
          const result = buddyProfileCreateSchema.safeParse(payload)
          expect(result.success).toBe(false)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 5: URL Format Validation (https:// prefix)', () => {
  /**
   * **Validates: Requirements 2.7**
   *
   * For any non-empty string that does not start with "https://",
   * when used as a Social Link URL in BuddyProfile, the system
   * SHALL reject the input with a validation error.
   */
  it(
    'should reject social link URLs that do not start with https://',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(...SOCIAL_LINK_KEYS),
          nonHttpsUrlArb,
          (linkKey, invalidUrl) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              socialLinks: {
                [linkKey]: invalidUrl,
              },
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept social link URLs that start with https://',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(...SOCIAL_LINK_KEYS),
          validHttpsUrlArb,
          (linkKey, validUrl) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              socialLinks: {
                [linkKey]: validUrl,
              },
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept empty string or undefined social link URLs',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(...SOCIAL_LINK_KEYS),
          fc.constantFrom('', undefined),
          (linkKey, emptyVal) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              socialLinks: {
                [linkKey]: emptyVal,
              },
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 7: Field Length Limit Enforcement', () => {
  /**
   * **Validates: Requirements 2.9**
   *
   * For any string exceeding the maximum character limit for its field
   * (fullName > 255, roleTitle > 255, bio > 2000, URL > 500, skill item > 100)
   * or arrays exceeding 20 items, the BuddyProfile validation SHALL reject the input.
   */

  /** Generate a string of exactly a given length with non-whitespace content */
  const stringOfLength = (len: number) =>
    fc.string({ minLength: len, maxLength: len }).map((s) => 'A'.repeat(len))

  it(
    'should reject fullName exceeding 255 characters',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 256, max: 500 }),
          (len) => {
            const payload = {
              fullName: 'A'.repeat(len),
              roleTitle: 'Valid Title',
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject roleTitle exceeding 255 characters',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 256, max: 500 }),
          (len) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'A'.repeat(len),
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject bio exceeding 2000 characters',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 2001, max: 3000 }),
          (len) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              bio: 'A'.repeat(len),
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject social link URLs exceeding 500 characters',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(...SOCIAL_LINK_KEYS),
          fc.integer({ min: 501, max: 700 }),
          (linkKey, len) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              socialLinks: {
                [linkKey]: 'https://' + 'a'.repeat(len - 8), // total length > 500
              },
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject skill items exceeding 100 characters',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 200 }),
          (len) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              skills: ['A'.repeat(len)],
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject skills array exceeding 20 items',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 30 }),
          (count) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              skills: Array.from({ length: count }, (_, i) => `skill-${i}`),
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject designTools array exceeding 20 items',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 30 }),
          (count) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              designTools: Array.from({ length: count }, (_, i) => `tool-${i}`),
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject interests array exceeding 20 items',
    async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 30 }),
          (count) => {
            const payload = {
              fullName: 'Valid Name',
              roleTitle: 'Valid Title',
              interests: Array.from({ length: count }, (_, i) => `interest-${i}`),
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept fields within limits',
    async () => {
      await fc.assert(
        fc.property(
          nonWhitespaceStringArb(255),
          nonWhitespaceStringArb(255),
          fc.string({ minLength: 0, maxLength: 2000 }),
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 20 }),
          (fullName, roleTitle, bio, skills) => {
            const payload = {
              fullName,
              roleTitle,
              bio,
              skills,
            }
            const result = buddyProfileCreateSchema.safeParse(payload)
            // When fullName and roleTitle are valid non-whitespace and within limits, it should pass
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})
