/**
 * Unit Tests: Buddy Profile CRUD Endpoints
 *
 * Tests the POST /api/buddy/profile, GET /api/buddy/profile/me,
 * and PUT /api/buddy/profile/me endpoints.
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../setup'
import { POST } from '@/app/api/buddy/profile/route'
import { GET, PUT } from '@/app/api/buddy/profile/me/route'
import { NextRequest } from 'next/server'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  body: unknown | null,
  userId: string,
  role = 'buddy'
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': role,
  }

  const init: RequestInit = { method, headers }
  if (body !== null) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest('http://localhost:3000/api/buddy/profile', init)
}

async function getResponseBody(res: Response): Promise<any> {
  return res.json()
}

async function createUser(role = 'buddy'): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: `buddy-${Date.now()}-${Math.random()}@test.com`,
      passwordHash: 'hashed_password',
      role: role as any,
    },
  })
  return user.id
}

const validProfilePayload = {
  fullName: 'John Doe',
  roleTitle: 'UI/UX Reviewer',
  bio: 'Experienced designer with 5 years in the field',
  avatarUrl: 'https://example.com/avatar.jpg',
  major: 'UI_UX',
  skills: ['Figma', 'Adobe XD'],
  designTools: ['Sketch', 'InVision'],
  interests: ['Typography', 'Motion Design'],
  socialLinks: {
    behance: 'https://behance.net/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
  },
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/buddy/profile', () => {
  let userId: string

  beforeEach(async () => {
    userId = await createUser()
  })

  it('should create a BuddyProfile with valid data and calculate completionPct', async () => {
    const req = makeRequest('POST', validProfilePayload, userId)
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.fullName).toBe('John Doe')
    expect(body.data.roleTitle).toBe('UI/UX Reviewer')
    expect(body.data.userId).toBe(userId)
    // All 9 fields are filled → completionPct = floor(9/9 * 100) = 100
    expect(body.data.completionPct).toBe(100)
  })

  it('should create a BuddyProfile with only required fields', async () => {
    const req = makeRequest('POST', { fullName: 'Jane', roleTitle: 'Reviewer' }, userId)
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.fullName).toBe('Jane')
    expect(body.data.roleTitle).toBe('Reviewer')
    // Only fullName + roleTitle filled → completionPct = floor(2/9 * 100) = 22
    expect(body.data.completionPct).toBe(22)
  })

  it('should return 409 CONFLICT when profile already exists (Req 2.8)', async () => {
    // Create profile first
    const req1 = makeRequest('POST', validProfilePayload, userId)
    await POST(req1)

    // Try to create again
    const req2 = makeRequest('POST', validProfilePayload, userId)
    const res = await POST(req2)
    const body = await getResponseBody(res)

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('CONFLICT')
  })

  it('should return 400 when fullName is whitespace-only (Req 2.3)', async () => {
    const req = makeRequest('POST', { fullName: '   ', roleTitle: 'Reviewer' }, userId)
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 when roleTitle is whitespace-only (Req 2.3)', async () => {
    const req = makeRequest('POST', { fullName: 'John', roleTitle: '   ' }, userId)
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 when socialLinks URL does not start with https:// (Req 2.7)', async () => {
    const req = makeRequest('POST', {
      fullName: 'John',
      roleTitle: 'Reviewer',
      socialLinks: { behance: 'http://behance.net/johndoe' },
    }, userId)
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 403 when user role is not buddy (Req 12.1)', async () => {
    const menteeId = await createUser('mentee')
    const req = makeRequest('POST', validProfilePayload, menteeId, 'mentee')
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(403)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should allow admin to create buddy profile', async () => {
    const adminId = await createUser('admin')
    const req = makeRequest('POST', validProfilePayload, adminId, 'admin')
    const res = await POST(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
  })
})

describe('GET /api/buddy/profile/me', () => {
  let userId: string

  beforeEach(async () => {
    userId = await createUser()
    // Create a profile first
    await prisma.buddyProfile.create({
      data: {
        userId,
        fullName: 'Test Buddy',
        roleTitle: 'Design Reviewer',
        skills: ['Figma'],
        designTools: ['Sketch'],
        interests: ['Typography'],
        socialLinks: { behance: 'https://behance.net/test' },
        completionPct: 77,
      },
    })
  })

  it('should return the buddy profile for authenticated user (Req 2.5)', async () => {
    const req = makeRequest('GET', null, userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.fullName).toBe('Test Buddy')
    expect(body.data.roleTitle).toBe('Design Reviewer')
    expect(body.data.userId).toBe(userId)
  })

  it('should return 404 when profile does not exist', async () => {
    const newUserId = await createUser()
    const req = makeRequest('GET', null, newUserId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 403 for non-buddy role', async () => {
    const menteeId = await createUser('mentee')
    const req = makeRequest('GET', null, menteeId, 'mentee')
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(403)
    expect(body.success).toBe(false)
  })
})

describe('PUT /api/buddy/profile/me', () => {
  let userId: string

  beforeEach(async () => {
    userId = await createUser()
    await prisma.buddyProfile.create({
      data: {
        userId,
        fullName: 'Original Name',
        roleTitle: 'Original Title',
        skills: [],
        designTools: [],
        interests: [],
        socialLinks: {},
        completionPct: 22,
      },
    })
  })

  it('should update profile and recalculate completionPct (Req 2.6)', async () => {
    const req = makeRequest('PUT', {
      bio: 'Updated bio',
      skills: ['Figma', 'Adobe XD'],
      socialLinks: { github: 'https://github.com/buddy' },
    }, userId)
    const res = await PUT(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.bio).toBe('Updated bio')
    expect(body.data.skills).toEqual(['Figma', 'Adobe XD'])
    // fullName + roleTitle + bio + skills + socialLinks = 5 filled → floor(5/9*100) = 55
    expect(body.data.completionPct).toBe(55)
  })

  it('should return 400 for whitespace-only fullName update (Req 2.3)', async () => {
    const req = makeRequest('PUT', { fullName: '   ' }, userId)
    const res = await PUT(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid socialLinks URL (Req 2.7)', async () => {
    const req = makeRequest('PUT', {
      socialLinks: { linkedin: 'http://linkedin.com/invalid' },
    }, userId)
    const res = await PUT(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when profile does not exist', async () => {
    const newUserId = await createUser()
    const req = makeRequest('PUT', { bio: 'new bio' }, newUserId)
    const res = await PUT(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should merge socialLinks with existing values', async () => {
    // First set linkedin
    const req1 = makeRequest('PUT', {
      socialLinks: { linkedin: 'https://linkedin.com/test' },
    }, userId)
    await PUT(req1)

    // Now set github without losing linkedin
    const req2 = makeRequest('PUT', {
      socialLinks: { github: 'https://github.com/test' },
    }, userId)
    const res = await PUT(req2)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    const links = body.data.socialLinks
    expect(links.linkedin).toBe('https://linkedin.com/test')
    expect(links.github).toBe('https://github.com/test')
  })
})
