/**
 * Property-Based Tests: CompanyProfile (Properties 5, 8)
 *
 * **Validates: Requirements 3.2, 3.5, 3.6, 3.8**
 *
 * Properties tested:
 * - Property 5: URL Format Validation (https:// prefix) — for websiteUrl
 * - Property 8: CompanyProfile Data Round-Trip
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { companyProfileCreateSchema } from '@/lib/validations/company-profile'
import { POST } from '@/app/api/company/profile/route'
import { GET } from '@/app/api/company/profile/me/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown, userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/company/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'company',
    },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/company/profile/me', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'company',
    },
  })
}

let userCounter = 0
async function createCompanyUser(): Promise<string> {
  userCounter++
  const user = await prisma.user.create({
    data: {
      email: `company-pbt-${Date.now()}-${userCounter}@test.com`,
      passwordHash: 'hashed_password',
      role: 'company',
    },
  })
  return user.id
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a non-empty string that does NOT start with https:// */
const nonHttpsUrlArb = fc.oneof(
  fc.constant('http://example.com'),
  fc.constant('ftp://example.com'),
  fc.constant('www.example.com'),
  fc.constant('example.com/path'),
  fc.constant('htt://broken.com'),
  fc.constant('httpp://wrong.com'),
  fc.constant('//no-protocol.com'),
  fc
    .stringOf(fc.char().filter((c) => c.trim().length > 0 && c !== '\\' && c !== '"'), {
      minLength: 1,
      maxLength: 50,
    })
    .filter((s) => !s.startsWith('https://')),
)

/** Arbitrary for a valid https URL */
const validHttpsUrlArb = fc.constantFrom(
  'https://example.com',
  'https://mycompany.io',
  'https://startup.vn/about',
  'https://tech.co/careers',
  'https://corp.company.com',
)

/** Non-whitespace string with at least one visible character */
const nonWhitespaceStringArb = (maxLen: number) =>
  fc.stringOf(
    fc.char().filter((c) => c.trim().length > 0 && c !== '\\' && c !== '"'),
    { minLength: 1, maxLength: maxLen },
  )

/** Arbitrary for a valid team member */
const teamMemberArb = fc.record({
  name: nonWhitespaceStringArb(50),
  role: nonWhitespaceStringArb(50),
  avatarUrl: fc.oneof(
    fc.constant('https://example.com/avatar.png'),
    fc.constant(undefined),
  ),
})

/** Arbitrary for a valid reference link */
const referenceLinkArb = fc.record({
  url: fc.constantFrom(
    'https://example.com/ref',
    'https://portfolio.io/link',
    'https://docs.company.com',
  ),
  label: nonWhitespaceStringArb(50),
})

/** Arbitrary for a valid CompanyProfile creation payload */
const validCompanyProfilePayloadArb = fc.record({
  companyName: nonWhitespaceStringArb(50),
  summary: fc.oneof(
    fc.stringOf(fc.char().filter((c) => c !== '\\' && c !== '"'), { minLength: 1, maxLength: 100 }),
    fc.constant(undefined),
  ),
  productsServices: fc.oneof(
    fc.stringOf(fc.char().filter((c) => c !== '\\' && c !== '"'), { minLength: 1, maxLength: 100 }),
    fc.constant(undefined),
  ),
  websiteUrl: fc.oneof(validHttpsUrlArb, fc.constant(undefined)),
  hrContactEmail: fc.oneof(
    fc.constantFrom('hr@example.com', 'contact@company.vn', 'jobs@startup.io'),
    fc.constant(undefined),
  ),
  hrContactPhone: fc.oneof(
    fc.constantFrom('+84901234567', '0901234567', '(028) 1234 5678'),
    fc.constant(undefined),
  ),
  teamMembers: fc.array(teamMemberArb, { minLength: 0, maxLength: 3 }),
  employeeCount: fc.oneof(
    fc.constantFrom('1-10', '11-50', '51-200', '201-500'),
    fc.constant(undefined),
  ),
  officeAddress: fc.oneof(
    nonWhitespaceStringArb(100),
    fc.constant(undefined),
  ),
  referenceLinks: fc.array(referenceLinkArb, { minLength: 0, maxLength: 3 }),
})

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 5: URL Format Validation (https:// prefix) — CompanyProfile websiteUrl', () => {
  /**
   * **Validates: Requirements 3.8**
   *
   * For any non-empty string that does not start with "https://",
   * when used as websiteUrl in CompanyProfile, the system SHALL reject
   * the input with a validation error.
   */
  it(
    'should reject websiteUrl that does not start with https://',
    async () => {
      await fc.assert(
        fc.property(nonHttpsUrlArb, (invalidUrl) => {
          const payload = {
            companyName: 'Valid Company Name',
            websiteUrl: invalidUrl,
          }
          const result = companyProfileCreateSchema.safeParse(payload)
          expect(result.success).toBe(false)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept websiteUrl that starts with https://',
    async () => {
      await fc.assert(
        fc.property(validHttpsUrlArb, (validUrl) => {
          const payload = {
            companyName: 'Valid Company Name',
            websiteUrl: validUrl,
          }
          const result = companyProfileCreateSchema.safeParse(payload)
          expect(result.success).toBe(true)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )

  it(
    'should accept empty string or undefined websiteUrl',
    async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom('', undefined),
          (emptyVal) => {
            const payload = {
              companyName: 'Valid Company Name',
              websiteUrl: emptyVal,
            }
            const result = companyProfileCreateSchema.safeParse(payload)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 30000 },
  )
})

describe('Property 8: CompanyProfile Data Round-Trip', () => {
  /**
   * **Validates: Requirements 3.2, 3.5, 3.6**
   *
   * For any valid CompanyProfile creation payload (with companyName having at least 1
   * non-whitespace character), after successful creation via POST, a subsequent GET
   * SHALL return data matching the originally submitted values for all fields including
   * teamMembers and referenceLinks.
   */
  it(
    'should return matching data on GET after POST for any valid payload',
    async () => {
      await fc.assert(
        fc.asyncProperty(validCompanyProfilePayloadArb, async (payload) => {
          // Create a fresh user for each test iteration to avoid CONFLICT
          const userId = await createCompanyUser()

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

          // Assert required field matches exactly
          expect(profile.companyName).toBe(cleanPayload.companyName)

          // summary: if not provided, should be null
          if (cleanPayload.summary !== undefined) {
            expect(profile.summary).toBe(cleanPayload.summary)
          } else {
            expect(profile.summary).toBeNull()
          }

          // productsServices: if not provided, should be null
          if (cleanPayload.productsServices !== undefined) {
            expect(profile.productsServices).toBe(cleanPayload.productsServices)
          } else {
            expect(profile.productsServices).toBeNull()
          }

          // websiteUrl: stored as the value or null
          if (cleanPayload.websiteUrl !== undefined && cleanPayload.websiteUrl !== '') {
            expect(profile.websiteUrl).toBe(cleanPayload.websiteUrl)
          } else {
            expect(profile.websiteUrl).toBeNull()
          }

          // hrContactEmail: stored as the value or null
          if (cleanPayload.hrContactEmail !== undefined && cleanPayload.hrContactEmail !== '') {
            expect(profile.hrContactEmail).toBe(cleanPayload.hrContactEmail)
          } else {
            expect(profile.hrContactEmail).toBeNull()
          }

          // hrContactPhone: if not provided, should be null
          if (cleanPayload.hrContactPhone !== undefined) {
            expect(profile.hrContactPhone).toBe(cleanPayload.hrContactPhone)
          } else {
            expect(profile.hrContactPhone).toBeNull()
          }

          // employeeCount: if not provided, should be null
          if (cleanPayload.employeeCount !== undefined) {
            expect(profile.employeeCount).toBe(cleanPayload.employeeCount)
          } else {
            expect(profile.employeeCount).toBeNull()
          }

          // officeAddress: if not provided, should be null
          if (cleanPayload.officeAddress !== undefined) {
            expect(profile.officeAddress).toBe(cleanPayload.officeAddress)
          } else {
            expect(profile.officeAddress).toBeNull()
          }

          // teamMembers: should be an array matching input (defaults to [])
          const expectedTeamMembers = cleanPayload.teamMembers ?? []
          expect(profile.teamMembers).toEqual(expectedTeamMembers)

          // referenceLinks: should be an array matching input (defaults to [])
          const expectedReferenceLinks = cleanPayload.referenceLinks ?? []
          expect(profile.referenceLinks).toEqual(expectedReferenceLinks)
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
