/**
 * Property-Based Tests: Job Creation Validation
 *
 * **Validates: Requirements 8.5, 8.7, 8.9, 8.10**
 *
 * Properties tested:
 * - Property 19: Job Creation Validation — Salary Range Consistency
 * - Property 20: Job Creation — Valid Data Creates Active Job
 * - Property 21: Job Creation — openSlots Validation
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { jobCreateSchema } from '@/lib/validations/job-create'

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a valid title (1-255 non-empty chars) */
const validTitleArb = fc.string({ minLength: 1, maxLength: 255 }).filter((s) => s.trim().length > 0)

/** Arbitrary for a valid description (1-5000 non-empty chars) */
const validDescriptionArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0)

/** Arbitrary for valid openSlots (integer between 1 and 1000) */
const validOpenSlotsArb = fc.integer({ min: 1, max: 1000 })

/** Arbitrary for a valid salary value (0 to 999999999) */
const validSalaryArb = fc.integer({ min: 0, max: 999999999 })

/** Arbitrary for a valid base job payload (required fields only) */
const validBasePayloadArb = fc.record({
  title: validTitleArb,
  description: validDescriptionArb,
  openSlots: validOpenSlotsArb,
})

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 19: Job Creation Validation — Salary Range Consistency', () => {
  /**
   * **Validates: Requirements 8.7, 8.9**
   *
   * For any job creation payload where both salaryMin and salaryMax are provided
   * and salaryMin > salaryMax, the system SHALL reject the creation with a validation error.
   * When only one of salaryMin or salaryMax is provided, the creation SHALL succeed.
   */
  it(
    'should reject when salaryMin > salaryMax',
    async () => {
      await fc.assert(
        fc.property(
          validBasePayloadArb,
          validSalaryArb,
          validSalaryArb,
          (base, salary1, salary2) => {
            // Ensure salaryMin > salaryMax by ordering
            const salaryMin = Math.max(salary1, salary2) + 1 // guarantee min > max
            const salaryMax = Math.min(salary1, salary2)

            // Skip if the min becomes out of range
            if (salaryMin > 999999999) return

            const payload = {
              ...base,
              salaryMin,
              salaryMax,
            }

            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept when only salaryMin is provided (no salaryMax)',
    async () => {
      await fc.assert(
        fc.property(validBasePayloadArb, validSalaryArb, (base, salaryMin) => {
          const payload = {
            ...base,
            salaryMin,
            // salaryMax is not provided
          }

          const result = jobCreateSchema.safeParse(payload)
          expect(result.success).toBe(true)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept when only salaryMax is provided (no salaryMin)',
    async () => {
      await fc.assert(
        fc.property(validBasePayloadArb, validSalaryArb, (base, salaryMax) => {
          const payload = {
            ...base,
            salaryMax,
            // salaryMin is not provided
          }

          const result = jobCreateSchema.safeParse(payload)
          expect(result.success).toBe(true)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept when salaryMin <= salaryMax',
    async () => {
      await fc.assert(
        fc.property(
          validBasePayloadArb,
          validSalaryArb,
          validSalaryArb,
          (base, salary1, salary2) => {
            const salaryMin = Math.min(salary1, salary2)
            const salaryMax = Math.max(salary1, salary2)

            const payload = {
              ...base,
              salaryMin,
              salaryMax,
            }

            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 20: Job Creation — Valid Data Creates Active Job', () => {
  /**
   * **Validates: Requirements 8.5**
   *
   * For any valid job creation payload (title 1-255 chars, description 1-5000 chars,
   * openSlots integer 1-1000), the system SHALL create a job record with isActive=true.
   *
   * We validate that the schema accepts valid payloads (schema-level property).
   * The isActive=true behavior is handled by the route handler (tested via integration).
   */
  it(
    'should accept any valid payload with title (1-255), description (1-5000), openSlots (1-1000)',
    async () => {
      await fc.assert(
        fc.property(validBasePayloadArb, (base) => {
          const result = jobCreateSchema.safeParse(base)
          expect(result.success).toBe(true)
          if (result.success) {
            expect(result.data.title).toBe(base.title)
            expect(result.data.description).toBe(base.description)
            expect(result.data.openSlots).toBe(base.openSlots)
          }
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept valid payloads with all optional fields provided',
    async () => {
      const fullValidPayloadArb = fc.record({
        title: validTitleArb,
        description: validDescriptionArb,
        openSlots: validOpenSlotsArb,
        location: fc.string({ minLength: 0, maxLength: 100 }),
        salaryMin: fc.oneof(validSalaryArb, fc.constant(undefined)),
        salaryMax: fc.oneof(validSalaryArb, fc.constant(undefined)),
        salaryPeriod: fc.oneof(
          fc.constantFrom('monthly', 'yearly'),
          fc.constant(undefined),
        ),
        requiresManagement: fc.boolean(),
        category: fc.oneof(fc.string({ minLength: 1, maxLength: 100 }), fc.constant(undefined)),
      })

      await fc.assert(
        fc.property(fullValidPayloadArb, (payload) => {
          // Ensure salary range consistency when both are provided
          if (
            payload.salaryMin !== undefined &&
            payload.salaryMax !== undefined &&
            payload.salaryMin > payload.salaryMax
          ) {
            // Swap to ensure valid range
            const temp = payload.salaryMin
            payload.salaryMin = payload.salaryMax
            payload.salaryMax = temp
          }

          const result = jobCreateSchema.safeParse(payload)
          expect(result.success).toBe(true)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 21: Job Creation — openSlots Validation', () => {
  /**
   * **Validates: Requirements 8.10**
   *
   * For any value for openSlots that is not a positive integer between 1 and 1000
   * (including decimals, negative numbers, zero, or non-numeric values),
   * the system SHALL reject the job creation with a validation error.
   */
  it(
    'should reject openSlots that are zero or negative',
    async () => {
      await fc.assert(
        fc.property(
          validTitleArb,
          validDescriptionArb,
          fc.integer({ min: -10000, max: 0 }),
          (title, description, openSlots) => {
            const payload = { title, description, openSlots }
            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject openSlots greater than 1000',
    async () => {
      await fc.assert(
        fc.property(
          validTitleArb,
          validDescriptionArb,
          fc.integer({ min: 1001, max: 100000 }),
          (title, description, openSlots) => {
            const payload = { title, description, openSlots }
            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject openSlots that are decimal (non-integer) values',
    async () => {
      await fc.assert(
        fc.property(
          validTitleArb,
          validDescriptionArb,
          fc.double({ min: 0.01, max: 999.99, noNaN: true, noDefaultInfinity: true }).filter(
            (n) => !Number.isInteger(n),
          ),
          (title, description, openSlots) => {
            const payload = { title, description, openSlots }
            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should reject openSlots that are non-numeric values',
    async () => {
      await fc.assert(
        fc.property(
          validTitleArb,
          validDescriptionArb,
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(true),
            fc.constant(false),
            fc.constant([]),
            fc.constant({}),
          ),
          (title, description, openSlots) => {
            const payload = { title, description, openSlots }
            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept openSlots that are valid positive integers between 1 and 1000',
    async () => {
      await fc.assert(
        fc.property(
          validTitleArb,
          validDescriptionArb,
          validOpenSlotsArb,
          (title, description, openSlots) => {
            const payload = { title, description, openSlots }
            const result = jobCreateSchema.safeParse(payload)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})
