/**
 * Unit Tests: Portfolio Selector Endpoint Filtering
 *
 * Tests that GET /api/applications/portfolios:
 * - Only returns projects with status = "public"
 * - Includes isApproved field and correct badge label
 * - Excludes draft and pending_feedback projects
 *
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../setup'
import { GET } from '@/app/api/applications/portfolios/route'
import { NextRequest } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/applications/portfolios', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': 'mentee',
    },
  })
}

// ─── Shared Setup ───────────────────────────────────────────────────────────

let menteeUserId: string
let menteeProfileId: string

beforeEach(async () => {
  // Create mentee user + profile
  const user = await prisma.user.create({
    data: {
      email: 'mentee-selector@test.com',
      passwordHash: 'hashed-pw',
      role: 'mentee',
    },
  })
  menteeUserId = user.id

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Test Mentee',
      completionPct: 80,
    },
  })
  menteeProfileId = profile.id
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/applications/portfolios', () => {
  it('returns only public projects', async () => {
    // Create projects with different statuses
    await prisma.project.createMany({
      data: [
        {
          menteeId: menteeProfileId,
          title: 'Draft Project',
          status: 'draft',
          tags: ['design'],
          isApproved: false,
        },
        {
          menteeId: menteeProfileId,
          title: 'Public Project 1',
          status: 'public',
          tags: ['ui'],
          isApproved: true,
        },
        {
          menteeId: menteeProfileId,
          title: 'Pending Feedback Project',
          status: 'pending_feedback',
          tags: ['ux'],
          isApproved: false,
        },
        {
          menteeId: menteeProfileId,
          title: 'Public Project 2',
          status: 'public',
          tags: ['web'],
          isApproved: false,
        },
      ],
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)

    const titles = json.data.map((p: any) => p.title)
    expect(titles).toContain('Public Project 1')
    expect(titles).toContain('Public Project 2')
    expect(titles).not.toContain('Draft Project')
    expect(titles).not.toContain('Pending Feedback Project')
  })

  it('shows "Buddy Approved" badge when isApproved is true', async () => {
    await prisma.project.create({
      data: {
        menteeId: menteeProfileId,
        title: 'Approved Portfolio',
        status: 'public',
        tags: ['figma'],
        isApproved: true,
      },
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].isApproved).toBe(true)
    expect(json.data[0].badge).toBe('Buddy Approved')
  })

  it('shows "Unreviewed" badge when isApproved is false', async () => {
    await prisma.project.create({
      data: {
        menteeId: menteeProfileId,
        title: 'Unreviewed Portfolio',
        status: 'public',
        tags: ['photoshop'],
        isApproved: false,
      },
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].isApproved).toBe(false)
    expect(json.data[0].badge).toBe('Unreviewed')
  })

  it('returns empty array when mentee has no public projects', async () => {
    // Only draft projects
    await prisma.project.create({
      data: {
        menteeId: menteeProfileId,
        title: 'My Draft',
        status: 'draft',
        tags: [],
        isApproved: false,
      },
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(0)
  })

  it('returns 401 when no auth headers present', async () => {
    const req = new NextRequest('http://localhost:3000/api/applications/portfolios', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 when profile does not exist', async () => {
    // Create a user without a profile
    const noProfileUser = await prisma.user.create({
      data: {
        email: 'no-profile@test.com',
        passwordHash: 'hashed-pw',
        role: 'mentee',
      },
    })

    const req = makeRequest(noProfileUser.id)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('includes expected fields in response', async () => {
    await prisma.project.create({
      data: {
        menteeId: menteeProfileId,
        title: 'Full Fields Project',
        description: 'A detailed description',
        status: 'public',
        tags: ['react', 'nextjs'],
        isApproved: true,
      },
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    const portfolio = json.data[0]
    expect(portfolio).toHaveProperty('id')
    expect(portfolio).toHaveProperty('title', 'Full Fields Project')
    expect(portfolio).toHaveProperty('description', 'A detailed description')
    expect(portfolio).toHaveProperty('tags')
    expect(portfolio.tags).toEqual(['react', 'nextjs'])
    expect(portfolio).toHaveProperty('isApproved', true)
    expect(portfolio).toHaveProperty('badge', 'Buddy Approved')
    expect(portfolio).toHaveProperty('createdAt')
  })

  it('does not show projects belonging to other mentees', async () => {
    // Create another mentee with a public project
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-mentee@test.com',
        passwordHash: 'hashed-pw',
        role: 'mentee',
      },
    })
    const otherProfile = await prisma.profile.create({
      data: {
        userId: otherUser.id,
        fullName: 'Other Mentee',
        completionPct: 50,
      },
    })
    await prisma.project.create({
      data: {
        menteeId: otherProfile.id,
        title: 'Other Mentee Public Project',
        status: 'public',
        tags: ['other'],
        isApproved: true,
      },
    })

    // Our mentee has one public project
    await prisma.project.create({
      data: {
        menteeId: menteeProfileId,
        title: 'My Public Project',
        status: 'public',
        tags: ['mine'],
        isApproved: false,
      },
    })

    const req = makeRequest(menteeUserId)
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].title).toBe('My Public Project')
  })
})
