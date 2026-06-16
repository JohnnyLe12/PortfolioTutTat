/**
 * Property-Based Test: BuddyProfile Data Round-Trip (Property 6)
 *
 * **Validates: Requirements 2.2, 2.5**
 *
 * For any valid BuddyProfile creation payload, after successful creation via POST,
 * a subsequent GET of that profile SHALL return data where fullName, roleTitle, bio,
 * avatarUrl, major, skills, designTools, interests, and socialLinks match the
 * originally submitted values.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { prisma as appPrisma } from '@/lib/prisma'
import { POST } from '@/app/api/buddy/profile/route'
import { GET } from '@/app/api/buddy/profile/me/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAJOR_VALUES = ['Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design'] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown, userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/buddy/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/buddy/profile/me', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
  })
}

let userCounter = 0
async function createBuddyUser(): Promise<string> {
  userCounter++
  // Use the same prisma client that the route handlers use to avoid FK issues
  // with connection pooling between separate PrismaClient instances
  const user = await appPrisma.user.create({
    data: {
      email: `buddy-rt-${Date.now()}-${userCounter}@test.com`,
      passwordHash: 'hashed_password',
      role: 'buddy',
    },
  })
  return user.id
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Non-whitespace string with at least one visible character */
const nonWhitespaceStringArb = (maxLen: number) =>
  fc
    .stringOf(fc.char().filter((c) => c.trim().length > 0 && c !== '\\' && c !== '"'), {
      minLength: 1,
      maxLength: maxLen,
    })

/** Valid https URL for social links */
const validHttpsUrlArb = fc.constantFrom(
  'https://behance.net/user1',
  'https://linkedin.com/in/user2',
  'https://github.com/user3',
  'https://instagram.com/user4',
  'https://example.com/profile',
)

/** Arbitrary for social links — each field is either a valid URL or undefined */
const socialLinksArb = fc.record({
  behance: fc.oneof(validHttpsUrlArb, fc.constant(undefined)),
  linkedin: fc.oneof(validHttpsUrlArb, fc.constant(undefined)),
  instagram: fc.oneof(validHttpsUrlArb, fc.constant(undefined)),
  github: fc.oneof(validHttpsUrlArb, fc.constant(undefined)),
})

/** Arbitrary for a valid BuddyProfile creation payload */
const validBuddyProfilePayloadArb = fc.record({
  fullName: nonWhitespaceStringArb(50),
  roleTitle: nonWhitespaceStringArb(50),
  bio: fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.constant(undefined),
  ),
  avatarUrl: fc.oneof(
    fc.constant('https://example.com/avatar.png'),
    fc.constant(undefined),
  ),
  major: fc.oneof(
    fc.constantFrom(...MAJOR_VALUES),
    fc.constant(undefined),
  ),
  skills: fc.array(
    fc.stringOf(fc.char().filter((c) => c.trim().length > 0), { minLength: 1, maxLength: 20 }),
    { minLength: 0, maxLength: 3 },
  ),
  designTools: fc.array(
    fc.stringOf(fc.char().filter((c) => c.trim().length > 0), { minLength: 1, maxLength: 20 }),
    { minLength: 0, maxLength: 3 },
  ),
  interests: fc.array(
    fc.stringOf(fc.char().filter((c) => c.trim().length > 0), { minLength: 1, maxLength: 20 }),
    { minLength: 0, maxLength: 3 },
  ),
  socialLinks: fc.oneof(socialLinksArb, fc.constant(undefined)),
})

// ─── Property Test ─────────────────────────────────────────────────────────────

describe('Property 6: BuddyProfile Data Round-Trip', () => {
  /**
   * **Validates: Requirements 2.2, 2.5**
   *
   * For any valid BuddyProfile creation payload, after successful creation via POST,
   * a subsequent GET of that profile SHALL return data where fullName, roleTitle, bio,
   * avatarUrl, major, skills, designTools, interests, and socialLinks match the
   * originally submitted values.
   */
  it(
    'should return matching data on GET after POST for any valid payload',
    async () => {
      await fc.assert(
        fc.asyncProperty(validBuddyProfilePayloadArb, async (payload) => {
          // Create a fresh user for each test iteration to avoid CONFLICT
          const userId = await createBuddyUser()

          // Clean undefined fields from payload (matching what JSON.stringify does)
          const cleanPayload = JSON.parse(JSON.stringify(payload))

          // POST to create profile
          const postReq = makePostRequest(cleanPayload, userId)
          const postRes = await POST(postReq)
          const postBody = await postRes.json()

          // POST must succeed
          expect(postRes.status).toBe(201)
          expect(postBody.success).toBe(true)

          // GET the profile back
          const getReq = makeGetRequest(userId)
          const getRes = await GET(getReq)
          const getBody = await getRes.json()

          // GET must succeed
          expect(getRes.status).toBe(200)
          expect(getBody.success).toBe(true)

          const profile = getBody.data

          // Assert required fields match exactly
          expect(profile.fullName).toBe(cleanPayload.fullName)
          expect(profile.roleTitle).toBe(cleanPayload.roleTitle)

          // bio: if not provided, should be null
          if (cleanPayload.bio !== undefined) {
            expect(profile.bio).toBe(cleanPayload.bio)
          } else {
            expect(profile.bio).toBeNull()
          }

          // avatarUrl: if not provided, should be null
          if (cleanPayload.avatarUrl !== undefined) {
            expect(profile.avatarUrl).toBe(cleanPayload.avatarUrl)
          } else {
            expect(profile.avatarUrl).toBeNull()
          }

          // major: if not provided, should be null
          if (cleanPayload.major !== undefined) {
            expect(profile.major).toBe(cleanPayload.major)
          } else {
            expect(profile.major).toBeNull()
          }

          // skills: defaults to [] if not provided
          const expectedSkills = cleanPayload.skills ?? []
          expect(profile.skills).toEqual(expectedSkills)

          // designTools: defaults to [] if not provided
          const expectedDesignTools = cleanPayload.designTools ?? []
          expect(profile.designTools).toEqual(expectedDesignTools)

          // interests: defaults to [] if not provided
          const expectedInterests = cleanPayload.interests ?? []
          expect(profile.interests).toEqual(expectedInterests)

          // socialLinks: compare provided links
          const expectedSocialLinks = cleanPayload.socialLinks ?? {}
          const profileLinks = profile.socialLinks as Record<string, string | undefined>
          for (const [key, val] of Object.entries(expectedSocialLinks)) {
            if (val !== undefined && val !== null) {
              expect(profileLinks[key]).toBe(val)
            }
          }
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
