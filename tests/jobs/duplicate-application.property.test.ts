/**
 * Property-Based Test: Duplicate job applications are rejected
 *
 * **Validates: Requirements 13.3**
 *
 * Property: For any (job_id, mentee_id) pair where an Application already
 * exists, attempting to create a second Application for the same pair
 * MUST return 409 and the database MUST contain only the original record
 * (no duplicate created).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/applications/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

let testUserId: string
let testProfileId: string
let testJobIds: string[] = []
let testPublicProjectId: string

/**
 * Create test fixtures after the global beforeEach cleanup runs.
 */
beforeEach(async () => {
  // Create mentee user
  const user = await prisma.user.create({
    data: {
      email: 'duplicate-app-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Duplicate Application Test Mentee',
      completionPct: 0,
    },
  })
  testUserId = user.id
  testProfileId = profile.id

  // Create a public project so mentee can apply (requirement: at least 1 public project)
  const publicProject = await prisma.project.create({
    data: {
      menteeId: profile.id,
      title: 'Public Project for Application',
      status: 'public',
    },
  })
  testPublicProjectId = publicProject.id

  // Create a company user to own jobs
  const companyUser = await prisma.user.create({
    data: {
      email: 'company-dup-app-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'company',
    },
  })

  // Pre-create 100 jobs so each property run can use a unique one
  const jobs = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      prisma.job.create({
        data: {
          companyId: companyUser.id,
          title: `Duplicate App Test Job ${i}`,
          jobType: 'internship',
          isActive: true,
        },
      })
    )
  )
  testJobIds = jobs.map((j) => j.id)
})

/**
 * Helper: create a NextRequest for POST /api/applications
 */
function makeApplicationReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId,
      'x-user-role': 'mentee',
    },
    body: JSON.stringify(body),
  })
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Arbitrary for additional portfolio IDs (non-empty array of UUIDs).
 * We always include the test public project, but may add more random UUIDs.
 */
const extraPortfolioArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 3 })

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: Duplicate job applications are rejected', () => {
  it(
    'should return 409 and not create a duplicate when a mentee already applied for the same job',
    async () => {
      let jobIndex = 0

      await fc.assert(
        fc.asyncProperty(extraPortfolioArb, async (extraIds) => {
          // Pick a unique job for this run
          const jobId = testJobIds[jobIndex % testJobIds.length]
          jobIndex++

          const portfolioIds = [testPublicProjectId, ...extraIds]

          // Arrange: create the first application via the API
          const firstReq = makeApplicationReq({ jobId, portfolioIds })
          const firstRes = await POST(firstReq)

          // The first application should succeed with 201
          expect(firstRes.status).toBe(201)

          // Act: attempt to create a second application for the same job
          const secondReq = makeApplicationReq({ jobId, portfolioIds })
          const secondRes = await POST(secondReq)
          const secondJson = await secondRes.json()

          // Assert: response should be 409 Conflict
          expect(secondRes.status).toBe(409)
          expect(secondJson.success).toBe(false)

          // Assert: only 1 application exists for this (job_id, mentee_id) pair in DB
          const dbRecords = await prisma.application.findMany({
            where: { jobId, menteeId: testProfileId },
          })
          expect(dbRecords).toHaveLength(1)
          expect(dbRecords[0].status).toBe('submitted')
        }),
        { numRuns: 20, timeout: 300000 }
      )
    },
    { timeout: 360000 }
  )
})
