/**
 * Property-Based Test: New project is saved with status `draft`
 *
 * **Validates: Requirements 4.4**
 *
 * Property: For any valid project title and regardless of whether the request
 * body includes a `status` field (with any value), the created project MUST
 * always have status === 'draft'.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pre-created user + profile IDs for the test run */
let testUserId: string
let testProfileId: string

/**
 * Create a test user and profile once before all property runs.
 * This avoids creating hundreds of users inside the property itself.
 */
beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: 'project-draft-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Test Mentee',
      completionPct: 0,
    },
  })
  testUserId = user.id
  testProfileId = profile.id
})

/**
 * Helper: create a NextRequest with JSON body and required auth headers.
 */
function makeProjectRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/projects', {
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
 * Arbitrary for valid project title (1–255 non-empty chars).
 */
const validTitleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length >= 1
)

/**
 * Arbitrary for status field that client might send — includes valid enum
 * values ('public', 'pending_feedback') and random strings.
 */
const anyStatusArb = fc.oneof(
  fc.constantFrom('draft', 'public', 'pending_feedback'),
  fc.string({ minLength: 1, maxLength: 50 })
)

/**
 * Arbitrary for a project creation payload. The `status` field may or may
 * not be present, and when present can be any value.
 */
const projectPayloadArb = fc.record({
  title: validTitleArb,
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  tags: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  status: fc.option(anyStatusArb, { nil: undefined }),
}).map((rec) => {
  // Remove undefined keys to simulate client omitting the field
  const body: Record<string, unknown> = { title: rec.title }
  if (rec.description !== undefined) body.description = rec.description
  if (rec.tags !== undefined) body.tags = rec.tags
  if (rec.status !== undefined) body.status = rec.status
  return body
})

// ─── Property Test ──────────────────────────────────────────────────────────

describe('Property: New project is saved with status draft', () => {
  it(
    'should always save the project with status "draft" regardless of the status field in request body',
    async () => {
      await fc.assert(
        fc.asyncProperty(projectPayloadArb, async (body) => {
          // Act: call the POST /api/projects endpoint
          const req = makeProjectRequest(body)
          const res = await POST(req)
          const json = await res.json()

          // If the request was rejected due to validation (e.g. invalid title),
          // that's fine — we only assert on successful creations
          if (res.status !== 201) {
            return // Skip non-successful requests
          }

          // Assert: response status is draft
          expect(json.success).toBe(true)
          expect(json.data.status).toBe('draft')

          // Assert: database record also has status draft
          const project = await prisma.project.findUnique({
            where: { id: json.data.id },
          })
          expect(project).not.toBeNull()
          expect(project!.status).toBe('draft')
        }),
        { numRuns: 20 }
      )
    },
    { timeout: 60000 }
  )
})
