/**
 * Property-Based Tests: Registration Role Assignment and Multi-Role Signup
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9**
 *
 * Property 1: For any valid email/password/role combination, after successful
 * registration a role-appropriate profile record MUST exist linked to the new User.
 * - mentee → Profile with completionPct = 0
 * - buddy → BuddyProfile with completionPct = 0
 * - company → CompanyProfile
 * - admin → no profile created (profileId = null)
 *
 * Property 2: The response includes a redirectPath appropriate to the role.
 *
 * Property 3: Admin registration requires a valid invite code; invalid/missing codes
 * are rejected with 403 FORBIDDEN.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'

/**
 * Helper: create a NextRequest with JSON body for the register endpoint.
 */
function makeRegisterRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const REDIRECT_PATHS: Record<string, string> = {
  mentee: '/create-profile',
  buddy: '/create-buddy-profile',
  company: '/create-company-profile',
  admin: '/admin-dashboard',
}

/**
 * Arbitrary for valid registration payloads (non-admin roles).
 */
const validNonAdminRegistrationArb = fc.record({
  email: fc.uuid().map((id) => `${id}@test.example.com`),
  password: fc.string({ minLength: 8, maxLength: 30 }).filter((s) => s.length >= 8),
  role: fc.constantFrom('mentee', 'buddy', 'company') as fc.Arbitrary<'mentee' | 'buddy' | 'company'>,
})

describe('Property: Registration creates role-appropriate profile and redirectPath', () => {
  it(
    'should create the correct profile type and return correct redirectPath for any valid non-admin registration',
    async () => {
      await fc.assert(
        fc.asyncProperty(validNonAdminRegistrationArb, async ({ email, password, role }) => {
          const req = makeRegisterRequest({ email, password, role })
          const res = await POST(req)
          const json = await res.json()

          // Assert: registration succeeded
          expect(res.status).toBe(201)
          expect(json.success).toBe(true)
          expect(json.data.user.role).toBe(role)
          expect(json.data.redirectPath).toBe(REDIRECT_PATHS[role])

          const userId = json.data.user.id
          const profileId = json.data.profileId

          // Assert: role-appropriate profile exists in the database
          if (role === 'mentee') {
            expect(profileId).not.toBeNull()
            const profile = await prisma.profile.findUnique({ where: { id: profileId } })
            expect(profile).not.toBeNull()
            expect(profile!.userId).toBe(userId)
            expect(profile!.completionPct).toBe(0)
          } else if (role === 'buddy') {
            expect(profileId).not.toBeNull()
            const buddyProfile = await prisma.buddyProfile.findUnique({ where: { id: profileId } })
            expect(buddyProfile).not.toBeNull()
            expect(buddyProfile!.userId).toBe(userId)
            expect(buddyProfile!.completionPct).toBe(0)
          } else if (role === 'company') {
            expect(profileId).not.toBeNull()
            const companyProfile = await prisma.companyProfile.findUnique({ where: { id: profileId } })
            expect(companyProfile).not.toBeNull()
            expect(companyProfile!.userId).toBe(userId)
          }
        }),
        { numRuns: 10, timeout: 240000 }
      )
    },
    { timeout: 300000 }
  )

  it(
    'should create admin user with no profile and return admin-dashboard redirectPath',
    async () => {
      const email = `admin-${Date.now()}@test.example.com`
      const req = makeRegisterRequest({
        email,
        password: 'securepassword123',
        role: 'admin',
        inviteCode: process.env.ADMIN_INVITE_CODE,
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.user.role).toBe('admin')
      expect(json.data.profileId).toBeNull()
      expect(json.data.redirectPath).toBe('/admin-dashboard')
    },
    { timeout: 30000 }
  )

  it(
    'should reject admin registration with invalid invite code',
    async () => {
      const email = `admin-invalid-${Date.now()}@test.example.com`
      const req = makeRegisterRequest({
        email,
        password: 'securepassword123',
        role: 'admin',
        inviteCode: 'wrong-code',
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')

      // Ensure no user was created
      const user = await prisma.user.findUnique({ where: { email } })
      expect(user).toBeNull()
    },
    { timeout: 30000 }
  )

  it(
    'should reject admin registration with missing invite code',
    async () => {
      const email = `admin-missing-${Date.now()}@test.example.com`
      const req = makeRegisterRequest({
        email,
        password: 'securepassword123',
        role: 'admin',
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')

      // Ensure no user was created
      const user = await prisma.user.findUnique({ where: { email } })
      expect(user).toBeNull()
    },
    { timeout: 30000 }
  )
})
