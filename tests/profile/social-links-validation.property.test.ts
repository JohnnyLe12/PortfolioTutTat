/**
 * Property-Based Test: Social link URL validation rejects non-HTTPS strings
 *
 * **Validates: Requirements 2.4**
 *
 * Property: For any string that does NOT start with "https://", the Zod schema
 * should reject it as an invalid social link URL. For any valid HTTPS URL,
 * the schema should accept it.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { updateProfileSchema } from '@/lib/validations/profile'

/**
 * The social link fields in the schema.
 */
const SOCIAL_LINK_FIELDS = ['behance', 'linkedin', 'instagram', 'github'] as const

describe('Property: Social link URL validation rejects non-HTTPS strings', () => {
  it(
    'should reject strings that do not start with "https://" as social link URLs',
    async () => {
      await fc.assert(
        fc.property(
          // Generate a random string that does NOT start with "https://"
          fc.string({ minLength: 1, maxLength: 200 }).filter(
            (s) => !s.startsWith('https://'),
          ),
          // Pick a random social link field to test
          fc.constantFrom(...SOCIAL_LINK_FIELDS),
          (invalidUrl, field) => {
            // Build a payload with the invalid URL in one social link field
            const payload = {
              socialLinks: {
                [field]: invalidUrl,
              },
            }

            // Parse with the Zod schema
            const result = updateProfileSchema.safeParse(payload)

            // Assert: validation should fail (the invalid URL should be rejected)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept valid HTTPS URLs as social link values',
    async () => {
      // Generate HTTPS URLs by mapping fc.webUrl() to always use https:// scheme
      const httpsUrlArb = fc.webUrl().map((url) =>
        url.replace(/^https?:\/\//, 'https://'),
      )

      await fc.assert(
        fc.property(
          httpsUrlArb,
          // Pick a random social link field to test
          fc.constantFrom(...SOCIAL_LINK_FIELDS),
          (validUrl, field) => {
            // Build a payload with the valid HTTPS URL in one social link field
            const payload = {
              socialLinks: {
                [field]: validUrl,
              },
            }

            // Parse with the Zod schema
            const result = updateProfileSchema.safeParse(payload)

            // Assert: validation should succeed
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept empty strings as social link values (optional fields)',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(...SOCIAL_LINK_FIELDS),
          (field) => {
            // Build a payload with an empty string in one social link field
            const payload = {
              socialLinks: {
                [field]: '',
              },
            }

            // Parse with the Zod schema
            const result = updateProfileSchema.safeParse(payload)

            // Assert: empty strings should be accepted (via z.literal(''))
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})
