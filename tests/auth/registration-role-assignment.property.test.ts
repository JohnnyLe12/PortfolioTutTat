/**
 * Property-Based Tests: Registration Role Assignment
 *
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7, 1.8**
 *
 * Property 1: Registration Role Assignment Round-Trip
 * For any valid registration payload with a role value in {mentee, buddy, company, admin},
 * after successful registration, the created User record's role field SHALL equal
 * the submitted role value exactly.
 *
 * Property 2: Invalid Role Rejection at Registration
 * For any string value that is not a member of the set {mentee, buddy, company, admin},
 * the registration endpoint SHALL reject the request with a validation error and
 * SHALL NOT create a User record.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * The set of valid roles accepted by the registration endpoint.
 * Note: 'admin' role registration requires invite code (task 5.1) and is not
 * yet implemented; tests use the currently accepted roles.
 */
const VALID_REGISTRATION_ROLES = ['mentee', 'buddy', 'company'] as const
const ALL_VALID_ROLES = ['mentee', 'buddy', 'company', 'admin'] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a NextRequest with JSON body for the register endpoint.
 */
function makeRegisterRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Arbitrary for valid email addresses with UUID prefix for uniqueness.
 */
const emailArb = fc.uuid().map((id) => `${id}@test.example.com`)

/**
 * Arbitrary for valid passwords (8-30 alphanumeric characters).
 */
const passwordArb = fc
  .stringOf(fc.char().filter((c) => /[a-zA-Z0-9]/.test(c)), { minLength: 8, maxLength: 30 })
  .filter((s) => s.length >= 8)

/**
 * Arbitrary for valid roles that the registration endpoint currently accepts.
 */
const validRoleArb = fc.constantFrom(...VALID_REGISTRATION_ROLES)

/**
 * Arbitrary for invalid role strings — strings NOT in the valid role set.
 * Includes various string patterns that should all be rejected.
 */
const invalidRoleArb = fc.oneof(
  // Random non-empty strings that aren't valid roles
  fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !ALL_VALID_ROLES.includes(s as typeof ALL_VALID_ROLES[number]) && s.trim().length > 0),
  // Common typos or case variations
  fc.constantFrom(
    'Mentee', 'MENTEE', 'Buddy', 'BUDDY', 'Company', 'COMPANY',
    'Admin', 'ADMIN', 'student', 'teacher', 'reviewer', 'employer',
    'mentor', 'user', 'moderator', 'superadmin', ' mentee', 'mentee ',
  ),
)

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 1: Registration Role Assignment Round-Trip', () => {
  it(
    'for any valid registration payload with a valid role, the created User record role field SHALL equal the submitted role value exactly',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          validRoleArb,
          async (email, password, role) => {
            // Act: register a new user with the given role
            const req = makeRegisterRequest({ email, password, role })
            const res = await POST(req)
            const json = await res.json()

            // Assert: registration succeeded
            expect(res.status).toBe(201)
            expect(json.success).toBe(true)

            const userId = json.data.user.id

            // Assert: the User record in the database has the exact role submitted
            const user = await prisma.user.findUnique({
              where: { id: userId },
            })

            expect(user).not.toBeNull()
            expect(user!.role).toBe(role)

            // Assert: the response also reflects the correct role
            expect(json.data.user.role).toBe(role)
          },
        ),
        { numRuns: 20, timeout: 240000 },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 2: Invalid Role Rejection at Registration', () => {
  it(
    'for any string value not in the valid role set, the registration endpoint SHALL reject with a validation error and SHALL NOT create a User record',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          invalidRoleArb,
          async (email, password, invalidRole) => {
            // Count users before the request
            const countBefore = await prisma.user.count({ where: { email } })

            // Act: attempt registration with an invalid role
            const req = makeRegisterRequest({ email, password, role: invalidRole })
            const res = await POST(req)
            const json = await res.json()

            // Assert: request was rejected with 400 VALIDATION_ERROR
            expect(res.status).toBe(400)
            expect(json.success).toBe(false)
            expect(json.error.code).toBe('VALIDATION_ERROR')

            // Assert: no User record was created
            const countAfter = await prisma.user.count({ where: { email } })
            expect(countAfter).toBe(countBefore)
          },
        ),
        { numRuns: 20, timeout: 240000 },
      )
    },
    { timeout: 300000 },
  )
})
