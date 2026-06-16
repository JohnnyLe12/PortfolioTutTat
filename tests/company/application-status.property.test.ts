/**
 * Property-Based Tests: Application Status State Machine (Property 22)
 *
 * **Validates: Requirements 9.5, 9.6**
 *
 * Property 22: Application Status State Machine
 *
 * For any application with a current status, the system SHALL only allow transitions
 * defined by the valid transition map:
 *   submitted → under_review
 *   under_review → accepted
 *   under_review → rejected
 * Any other transition SHALL be rejected with an error describing the current status
 * and valid next states.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { PATCH } from '@/app/api/company/applications/[id]/status/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_STATUSES = ['submitted', 'under_review', 'accepted', 'rejected'] as const
type AppStatus = (typeof ALL_STATUSES)[number]

/** Valid transitions defined by the state machine */
const VALID_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  submitted: ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

function makeRequest(userId: string, body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/company/applications/test/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'company',
    },
    body: JSON.stringify(body),
  })
}

async function setupCompanyAndApplication(initialStatus: AppStatus) {
  return prisma.$transaction(async (tx) => {
    // Create company user
    const companyUser = await tx.user.create({
      data: {
        email: uniqueEmail('app-status-company'),
        passwordHash: 'hashed_password',
        role: 'company',
      },
    })

    // Create mentee user + profile
    const menteeUser = await tx.user.create({
      data: {
        email: uniqueEmail('app-status-mentee'),
        passwordHash: 'hashed_password',
        role: 'mentee',
      },
    })
    const menteeProfile = await tx.profile.create({
      data: {
        userId: menteeUser.id,
        fullName: 'Test Mentee',
        completionPct: 50,
      },
    })

    // Create a job owned by the company
    const job = await tx.job.create({
      data: {
        companyId: companyUser.id,
        title: `Test Job ${iterCounter}`,
        description: 'Test job description',
        jobType: 'full_time',
        isActive: true,
      },
    })

    // Create an application with the specified initial status
    const application = await tx.application.create({
      data: {
        jobId: job.id,
        menteeId: menteeProfile.id,
        portfolioIds: [],
        status: initialStatus,
      },
    })

    return {
      companyUserId: companyUser.id,
      menteeUserId: menteeUser.id,
      menteeProfileId: menteeProfile.id,
      jobId: job.id,
      applicationId: application.id,
    }
  }, { timeout: 30000 })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary for a valid transition pair (currentStatus, newStatus) */
const validTransitionArb = fc.constantFrom<[AppStatus, AppStatus]>(
  ['submitted', 'under_review'],
  ['under_review', 'accepted'],
  ['under_review', 'rejected'],
)

/** Arbitrary for an invalid transition pair (currentStatus, newStatus) */
const invalidTransitionArb = fc.constantFrom<[AppStatus, AppStatus]>(
  // From submitted: cannot go directly to accepted or rejected
  ['submitted', 'accepted'],
  ['submitted', 'rejected'],
  // From accepted: terminal state, cannot transition anywhere
  ['accepted', 'under_review'],
  ['accepted', 'rejected'],
  // From rejected: terminal state, cannot transition anywhere
  ['rejected', 'under_review'],
  ['rejected', 'accepted'],
  // From under_review: cannot go back to submitted
  ['under_review', 'submitted'],
)

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 22: Application Status State Machine', () => {
  /**
   * **Validates: Requirements 9.5, 9.6**
   */

  it(
    'should allow all valid transitions (submitted→under_review, under_review→accepted, under_review→rejected)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validTransitionArb,
          async ([currentStatus, newStatus]) => {
            const setup = await setupCompanyAndApplication(currentStatus)

            const req = makeRequest(setup.companyUserId, { status: newStatus })
            const res = await PATCH(req, {
              params: Promise.resolve({ id: setup.applicationId }),
            })
            const body = await res.json()

            // Property: valid transition succeeds with 200
            expect(res.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.data.status).toBe(newStatus)

            // Verify the status was persisted in the DB
            const dbApp = await prisma.application.findUnique({
              where: { id: setup.applicationId },
            })
            expect(dbApp?.status).toBe(newStatus)
          },
        ),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject all invalid transitions with 422 and INVALID_STATE_TRANSITION error',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTransitionArb,
          async ([currentStatus, newStatus]) => {
            // Note: 'submitted' is not a valid value in applicationStatusUpdateSchema enum
            // so if newStatus is 'submitted', the validation schema rejects it as 400 first.
            // We only test transitions where newStatus is in the schema enum.
            const validEnumValues = ['under_review', 'accepted', 'rejected']
            if (!validEnumValues.includes(newStatus)) {
              // Skip this combination since the schema will reject it before state machine logic
              return
            }

            const setup = await setupCompanyAndApplication(currentStatus)

            const req = makeRequest(setup.companyUserId, { status: newStatus })
            const res = await PATCH(req, {
              params: Promise.resolve({ id: setup.applicationId }),
            })
            const body = await res.json()

            // Property: invalid transition rejected with 422
            expect(res.status).toBe(422)
            expect(body.success).toBe(false)
            expect(body.error.code).toBe('INVALID_STATE_TRANSITION')

            // Property: error message describes the current status and valid next states
            expect(body.error.message).toContain(currentStatus)
            const validNextStates = VALID_TRANSITIONS[currentStatus]
            if (validNextStates.length > 0) {
              for (const validNext of validNextStates) {
                expect(body.error.message).toContain(validNext)
              }
            } else {
              // Terminal state: error should indicate no valid transitions
              expect(body.error.message).toContain('none (terminal state)')
            }

            // Property: application status remains unchanged in DB
            const dbApp = await prisma.application.findUnique({
              where: { id: setup.applicationId },
            })
            expect(dbApp?.status).toBe(currentStatus)
          },
        ),
        { numRuns: 20, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject transition to "submitted" as it is not a valid target status (schema validation)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<AppStatus>('submitted', 'under_review', 'accepted', 'rejected'),
          async (currentStatus) => {
            const setup = await setupCompanyAndApplication(currentStatus)

            // Attempt to transition to 'submitted' — not in applicationStatusUpdateSchema enum
            const req = makeRequest(setup.companyUserId, { status: 'submitted' })
            const res = await PATCH(req, {
              params: Promise.resolve({ id: setup.applicationId }),
            })
            const body = await res.json()

            // Property: rejected with 400 validation error (schema rejects 'submitted')
            expect(res.status).toBe(400)
            expect(body.success).toBe(false)
            expect(body.error.code).toBe('VALIDATION_ERROR')

            // Property: application status remains unchanged
            const dbApp = await prisma.application.findUnique({
              where: { id: setup.applicationId },
            })
            expect(dbApp?.status).toBe(currentStatus)
          },
        ),
        { numRuns: 10, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject arbitrary invalid status strings (not in enum)',
    async () => {
      const invalidStatusArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => !['under_review', 'accepted', 'rejected'].includes(s))

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<AppStatus>('submitted', 'under_review'),
          invalidStatusArb,
          async (currentStatus, invalidStatus) => {
            const setup = await setupCompanyAndApplication(currentStatus)

            const req = makeRequest(setup.companyUserId, { status: invalidStatus })
            const res = await PATCH(req, {
              params: Promise.resolve({ id: setup.applicationId }),
            })
            const body = await res.json()

            // Property: rejected with 400 validation error
            expect(res.status).toBe(400)
            expect(body.success).toBe(false)
            expect(body.error.code).toBe('VALIDATION_ERROR')

            // Property: application status remains unchanged
            const dbApp = await prisma.application.findUnique({
              where: { id: setup.applicationId },
            })
            expect(dbApp?.status).toBe(currentStatus)
          },
        ),
        { numRuns: 20, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
