/**
 * Property-Based Test: Profile update round-trip preserves data
 *
 * **Validates: Requirements 2.3**
 *
 * Property: For any valid profile payload, submitting it via PUT /api/profiles/me
 * and then retrieving it via GET /api/profiles/me should return the same data
 * that was submitted (round-trip preservation).
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { PUT, GET } from '@/app/api/profiles/me/route'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

/**
 * Helper: create a NextRequest with JSON body and x-user-id header for PUT.
 */
function makePutRequest(userId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/profiles/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(body),
  })
}

/**
 * Helper: create a NextRequest with x-user-id header for GET.
 */
function makeGetRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/profiles/me', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
    },
  })
}

/**
 * Helper: create a test user + profile in the database.
 * Returns the userId for subsequent requests.
 */
async function createTestUser(email: string): Promise<string> {
  const passwordHash = await bcrypt.hash('testpass123', 4) // low cost for speed
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'mentee',
    },
  })
  await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Initial Name',
      completionPct: 0,
    },
  })
  return user.id
}

/**
 * Arbitrary for valid profile update payloads.
 * Each field is optional (matching updateProfileSchema), but we generate
 * non-empty values to ensure the round-trip actually tests data persistence.
 */
const validProfilePayloadArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  roleTitle: fc.string({ minLength: 1, maxLength: 100 }),
  bio: fc.string({ minLength: 1, maxLength: 500 }),
  major: fc.constantFrom('Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design') as fc.Arbitrary<string>,
  skills: fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0), { minLength: 1, maxLength: 5 }),
  designTools: fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0), { minLength: 1, maxLength: 5 }),
  interests: fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0), { minLength: 1, maxLength: 5 }),
  socialLinks: fc.record({
    behance: fc.oneof(
      fc.constant('https://www.behance.net/user123'),
      fc.constant(''),
    ),
    linkedin: fc.oneof(
      fc.constant('https://www.linkedin.com/in/user123'),
      fc.constant(''),
    ),
    instagram: fc.oneof(
      fc.constant('https://www.instagram.com/user123'),
      fc.constant(''),
    ),
    github: fc.oneof(
      fc.constant('https://github.com/user123'),
      fc.constant(''),
    ),
  }),
})

describe('Property: Profile update round-trip preserves data', () => {
  it(
    'should return the exact same data via GET after a successful PUT for any valid profile payload',
    async () => {
      // Track unique email counter to avoid collisions within the same test run
      let emailCounter = 0

      await fc.assert(
        fc.asyncProperty(validProfilePayloadArb, async (payload) => {
          // Arrange: create a fresh user for each iteration
          const email = `roundtrip-${Date.now()}-${emailCounter++}@test.example.com`
          const userId = await createTestUser(email)

          try {
            // Act: PUT the profile payload
            const putReq = makePutRequest(userId, payload)
            const putRes = await PUT(putReq)
            const putJson = await putRes.json()

            // Assert: PUT was successful
            expect(putRes.status).toBe(200)
            expect(putJson.success).toBe(true)

            // Act: GET the profile back
            const getReq = makeGetRequest(userId)
            const getRes = await GET(getReq)
            const getJson = await getRes.json()

            // Assert: GET was successful
            expect(getRes.status).toBe(200)
            expect(getJson.success).toBe(true)

            const profile = getJson.data

            // Assert: round-trip preservation — all submitted fields match
            expect(profile.fullName).toBe(payload.fullName)
            expect(profile.roleTitle).toBe(payload.roleTitle)
            expect(profile.bio).toBe(payload.bio)
            expect(profile.major).toBe(payload.major)
            expect(profile.skills).toEqual(payload.skills)
            expect(profile.designTools).toEqual(payload.designTools)
            expect(profile.interests).toEqual(payload.interests)

            // Social links: merged with existing (initially empty), so should match
            const returnedLinks = profile.socialLinks as Record<string, string>
            expect(returnedLinks.behance ?? '').toBe(payload.socialLinks.behance)
            expect(returnedLinks.linkedin ?? '').toBe(payload.socialLinks.linkedin)
            expect(returnedLinks.instagram ?? '').toBe(payload.socialLinks.instagram)
            expect(returnedLinks.github ?? '').toBe(payload.socialLinks.github)
          } finally {
            // Cleanup: remove the user to avoid accumulating data across iterations
            await prisma.profile.deleteMany({ where: { userId } })
            await prisma.user.delete({ where: { id: userId } })
          }
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 300000 },
  )
})
