/**
 * Property-Based Test: Role-Based API Access Control
 *
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.7**
 *
 * Property 24: For any request to a role-restricted endpoint
 * (/api/buddy/** requires buddy|admin, /api/company/** requires company|admin),
 * if the authenticated user's role is not in the allowed set, the system SHALL
 * return HTTP 403 with response body { success: false, error: { message, code: 'FORBIDDEN' } }.
 * If the role is "admin", access SHALL always be granted regardless of endpoint restriction.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/role-guard'

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_ROLES = ['mentee', 'buddy', 'company', 'admin'] as const
type ValidRole = typeof VALID_ROLES[number]
const NON_ADMIN_ROLES = ['mentee', 'buddy', 'company'] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a NextRequest with specified x-user-id and x-user-role headers.
 */
function makeRequest(userId: string | null, role: string | null): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (userId !== null) headers['x-user-id'] = userId
  if (role !== null) headers['x-user-role'] = role
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'GET',
    headers,
  })
}

/**
 * Extract JSON body from a NextResponse.
 */
async function getResponseBody(res: NextResponse): Promise<any> {
  return res.json()
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a valid UUID-like user ID */
const userIdArb = fc.uuid()

/** Arbitrary for valid roles */
const validRoleArb = fc.constantFrom(...VALID_ROLES)

/** Arbitrary for non-admin valid roles */
const nonAdminRoleArb = fc.constantFrom(...NON_ADMIN_ROLES)

/** Arbitrary for invalid role strings (not in the valid set) */
const invalidRoleArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !VALID_ROLES.includes(s as ValidRole) && s.trim().length > 0)

/**
 * Arbitrary for a non-empty subset of non-admin roles to use as allowedRoles.
 * This simulates endpoint role restrictions like ['buddy'] or ['company'].
 */
const allowedRolesArb = fc
  .subarray([...NON_ADMIN_ROLES], { minLength: 1 })
  .map((arr) => [...arr] as string[])

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 24: Role-Based API Access Control', () => {
  it(
    'should grant access when user role is in the allowed set (buddy can access buddy endpoints, company can access company endpoints)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          allowedRolesArb,
          async (userId, allowedRoles) => {
            // Pick a role that IS in the allowedRoles list
            const role = allowedRoles[0]
            const req = makeRequest(userId, role)
            const result = requireRole(req, allowedRoles)

            // Should return AuthUser, not a NextResponse
            expect(result).not.toBeInstanceOf(NextResponse)
            expect(result).toHaveProperty('userId', userId)
            expect(result).toHaveProperty('role', role)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should always grant access to admin regardless of endpoint restriction',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          allowedRolesArb,
          async (userId, allowedRoles) => {
            // Admin should always get access, even if 'admin' is NOT in allowedRoles
            const req = makeRequest(userId, 'admin')
            const result = requireRole(req, allowedRoles)

            // Should return AuthUser, not a NextResponse
            expect(result).not.toBeInstanceOf(NextResponse)
            expect(result).toHaveProperty('userId', userId)
            expect(result).toHaveProperty('role', 'admin')
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should return 403 FORBIDDEN with correct error format when role is not in allowed set',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          allowedRolesArb,
          nonAdminRoleArb,
          async (userId, allowedRoles, userRole) => {
            // Skip cases where the role IS in allowedRoles (tested above)
            fc.pre(!allowedRoles.includes(userRole))

            const req = makeRequest(userId, userRole)
            const result = requireRole(req, allowedRoles)

            // Should return a NextResponse with 403
            expect(result).toBeInstanceOf(NextResponse)
            const res = result as NextResponse
            expect(res.status).toBe(403)

            const body = await getResponseBody(res)
            expect(body).toMatchObject({
              success: false,
              error: {
                message: expect.any(String),
                code: 'FORBIDDEN',
              },
            })
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should return 403 FORBIDDEN for invalid/unrecognized role values',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          allowedRolesArb,
          invalidRoleArb,
          async (userId, allowedRoles, invalidRole) => {
            const req = makeRequest(userId, invalidRole)
            const result = requireRole(req, allowedRoles)

            // Should return a NextResponse with 403
            expect(result).toBeInstanceOf(NextResponse)
            const res = result as NextResponse
            expect(res.status).toBe(403)

            const body = await getResponseBody(res)
            expect(body).toMatchObject({
              success: false,
              error: {
                message: expect.any(String),
                code: 'FORBIDDEN',
              },
            })
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should return 401 UNAUTHORIZED when x-user-id or x-user-role headers are missing or empty',
    async () => {
      // Test missing headers and empty values
      const missingHeaderCases = fc.oneof(
        // Missing userId entirely
        fc.record({
          userId: fc.constant(null),
          role: fc.constantFrom(...VALID_ROLES) as fc.Arbitrary<string | null>,
        }),
        // Missing role entirely
        fc.record({
          userId: userIdArb as fc.Arbitrary<string | null>,
          role: fc.constant(null),
        }),
        // Both missing
        fc.record({
          userId: fc.constant(null) as fc.Arbitrary<string | null>,
          role: fc.constant(null) as fc.Arbitrary<string | null>,
        }),
        // Empty userId
        fc.record({
          userId: fc.constantFrom('', '   ', '\t') as fc.Arbitrary<string | null>,
          role: fc.constantFrom(...VALID_ROLES) as fc.Arbitrary<string | null>,
        }),
        // Empty role
        fc.record({
          userId: userIdArb as fc.Arbitrary<string | null>,
          role: fc.constantFrom('', '   ', '\t') as fc.Arbitrary<string | null>,
        }),
      )

      await fc.assert(
        fc.asyncProperty(
          missingHeaderCases,
          allowedRolesArb,
          async ({ userId, role }, allowedRoles) => {
            const req = makeRequest(userId, role)
            const result = requireRole(req, allowedRoles)

            // Should return a NextResponse with 401
            expect(result).toBeInstanceOf(NextResponse)
            const res = result as NextResponse
            expect(res.status).toBe(401)

            const body = await getResponseBody(res)
            expect(body).toMatchObject({
              success: false,
              error: {
                message: expect.any(String),
                code: 'UNAUTHORIZED',
              },
            })
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})
