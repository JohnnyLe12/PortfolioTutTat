/**
 * Unit Tests: PATCH /api/projects/:id/status
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 *
 * Tests the project status transition endpoint including:
 * - Valid transitions (draft→public, draft→pending_feedback, etc.)
 * - Invalid transitions are rejected
 * - Only project owner can change status
 * - Unauthorized access is rejected
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../setup'
import { PATCH } from '@/app/api/projects/[id]/status/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

let testUserId: string
let testProfileId: string
let otherUserId: string

beforeEach(async () => {
  // Create test user and profile (setup.ts cleans DB before each test)
  const user = await prisma.user.create({
    data: {
      email: 'status-test@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Status Test Mentee',
      completionPct: 0,
    },
  })
  testUserId = user.id
  testProfileId = profile.id

  // Create another user (non-owner)
  const otherUser = await prisma.user.create({
    data: {
      email: 'other-user-status@test.example.com',
      passwordHash: 'hashed-password-placeholder',
      role: 'mentee',
    },
  })
  await prisma.profile.create({
    data: {
      userId: otherUser.id,
      fullName: 'Other Mentee',
      completionPct: 0,
    },
  })
  otherUserId = otherUser.id
})

/**
 * Helper: Create a project with a specific status for testing
 */
async function createProjectWithStatus(status: string) {
  return prisma.project.create({
    data: {
      menteeId: testProfileId,
      title: `Test Project ${Date.now()}`,
      description: 'Test description',
      tags: ['design'],
      status: status as any,
    },
  })
}

/**
 * Helper: Build a PATCH request for status change
 */
function makeStatusRequest(projectId: string, body: Record<string, unknown>, userId?: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/projects/${projectId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    },
    body: JSON.stringify(body),
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PATCH /api/projects/:id/status', () => {
  describe('Valid transitions', () => {
    it('should transition from draft to public', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'public' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('public')
    })

    it('should transition from draft to pending_feedback', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'pending_feedback' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('pending_feedback')
    })

    it('should transition from pending_feedback to public', async () => {
      const project = await createProjectWithStatus('pending_feedback')
      const req = makeStatusRequest(project.id, { status: 'public' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('public')
    })

    it('should transition from pending_feedback to draft', async () => {
      const project = await createProjectWithStatus('pending_feedback')
      const req = makeStatusRequest(project.id, { status: 'draft' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('draft')
    })

    it('should transition from public to draft (unpublish)', async () => {
      const project = await createProjectWithStatus('public')
      const req = makeStatusRequest(project.id, { status: 'draft' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('draft')
    })
  })

  describe('Invalid transitions', () => {
    it('should reject transition from public to pending_feedback', async () => {
      const project = await createProjectWithStatus('public')
      const req = makeStatusRequest(project.id, { status: 'pending_feedback' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Invalid status transition')
    })

    it('should reject same status transition (no-op)', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'draft' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('already in')
    })
  })

  describe('Authorization', () => {
    it('should return 401 when no user id header is provided', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'public' })
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 when non-owner tries to change status', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'public' }, otherUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('Validation', () => {
    it('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const req = makeStatusRequest(fakeId, { status: 'public' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: fakeId }) })
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid status value', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'invalid_status' }, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing status field', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, {}, testUserId)
      const res = await PATCH(req, { params: Promise.resolve({ id: project.id }) })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Database persistence', () => {
    it('should persist status change to database when transitioning to public', async () => {
      const project = await createProjectWithStatus('draft')
      const req = makeStatusRequest(project.id, { status: 'public' }, testUserId)
      await PATCH(req, { params: Promise.resolve({ id: project.id }) })

      // Verify in database
      const dbProject = await prisma.project.findUnique({ where: { id: project.id } })
      expect(dbProject).not.toBeNull()
      expect(dbProject!.status).toBe('public')
    })
  })
})
