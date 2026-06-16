/**
 * Unit Tests: Buddy Feedback Workspace Endpoints
 *
 * Tests the GET /api/buddy/workspace, PATCH .../start, and PATCH .../complete endpoints.
 *
 * Validates: Requirements 6.1, 6.2, 6.5, 6.8, 13.1
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../setup'
import { GET } from '@/app/api/buddy/workspace/route'
import { PATCH as START_PATCH } from '@/app/api/buddy/workspace/[feedbackRequestId]/start/route'
import { PATCH as COMPLETE_PATCH } from '@/app/api/buddy/workspace/[feedbackRequestId]/complete/route'
import { NextRequest } from 'next/server'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  url: string,
  userId: string,
  role = 'buddy'
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': role,
  }

  return new NextRequest(url, { method, headers })
}

async function getResponseBody(res: Response): Promise<any> {
  return res.json()
}

async function createBuddyUser(): Promise<{ userId: string; profileId: string; buddyProfileId: string }> {
  const user = await prisma.user.create({
    data: {
      email: `buddy-${Date.now()}-${Math.random()}@test.com`,
      passwordHash: 'hashed_password',
      role: 'buddy',
    },
  })

  // Create a Profile record (used by FeedbackRequest.buddyId)
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Test Buddy',
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
    },
  })

  // Create a BuddyProfile record (used by PortfolioBookmark.buddyId)
  const buddyProfile = await prisma.buddyProfile.create({
    data: {
      userId: user.id,
      fullName: 'Test Buddy',
      roleTitle: 'Reviewer',
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
      completionPct: 22,
    },
  })

  return { userId: user.id, profileId: profile.id, buddyProfileId: buddyProfile.id }
}

async function createMenteeWithProject(): Promise<{ userId: string; profileId: string; projectId: string }> {
  const user = await prisma.user.create({
    data: {
      email: `mentee-${Date.now()}-${Math.random()}@test.com`,
      passwordHash: 'hashed_password',
      role: 'mentee',
    },
  })

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Test Mentee',
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
    },
  })

  const project = await prisma.project.create({
    data: {
      menteeId: profile.id,
      title: 'Test Portfolio',
      description: 'A test portfolio project',
      tags: ['design', 'ui'],
      status: 'pending_feedback',
    },
  })

  return { userId: user.id, profileId: profile.id, projectId: project.id }
}

// ─── GET /api/buddy/workspace Tests ────────────────────────────────────────────

describe('GET /api/buddy/workspace', () => {
  let buddy: { userId: string; profileId: string; buddyProfileId: string }
  let mentee: { userId: string; profileId: string; projectId: string }

  beforeEach(async () => {
    buddy = await createBuddyUser()
    mentee = await createMenteeWithProject()
  })

  it('should return empty list when no bookmarks exist (Req 6.1)', async () => {
    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
    expect(body.pagination.total).toBe(0)
  })

  it('should return bookmarked portfolios with review status (Req 6.1)', async () => {
    // Create bookmark
    await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddy.buddyProfileId,
        projectId: mentee.projectId,
      },
    })

    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].projectName).toBe('Test Portfolio')
    expect(body.data[0].menteeName).toBe('Test Mentee')
    expect(body.data[0].reviewStatus).toBe('Not Started')
    expect(body.data[0].feedbackRequestId).toBeNull()
  })

  it('should show In Progress status for in_review FeedbackRequest', async () => {
    // Create bookmark
    await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddy.buddyProfileId,
        projectId: mentee.projectId,
      },
    })

    // Create a FeedbackRequest in in_review state assigned to this buddy
    await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.data[0].reviewStatus).toBe('In Progress')
  })

  it('should show Completed status for completed FeedbackRequest', async () => {
    await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddy.buddyProfileId,
        projectId: mentee.projectId,
      },
    })

    await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'completed',
      },
    })

    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.data[0].reviewStatus).toBe('Completed')
  })

  it('should paginate with max 20 items per page (Req 6.1)', async () => {
    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace?page=1&limit=20', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.pagination.limit).toBe(20)
  })

  it('should sort by newest bookmark first (Req 6.1)', async () => {
    // Create a second mentee project
    const project2 = await prisma.project.create({
      data: {
        menteeId: mentee.profileId,
        title: 'Second Portfolio',
        tags: ['ux'],
        status: 'pending_feedback',
      },
    })

    // Create bookmarks - first one earlier
    await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddy.buddyProfileId,
        projectId: mentee.projectId,
        createdAt: new Date('2024-01-01'),
      },
    })

    await prisma.portfolioBookmark.create({
      data: {
        buddyId: buddy.buddyProfileId,
        projectId: project2.id,
        createdAt: new Date('2024-06-01'),
      },
    })

    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId)
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(2)
    // Newest bookmark first
    expect(body.data[0].projectName).toBe('Second Portfolio')
    expect(body.data[1].projectName).toBe('Test Portfolio')
  })

  it('should return 403 for non-buddy role', async () => {
    const req = makeRequest('GET', 'http://localhost:3000/api/buddy/workspace', buddy.userId, 'mentee')
    const res = await GET(req)
    const body = await getResponseBody(res)

    expect(res.status).toBe(403)
    expect(body.success).toBe(false)
  })
})

// ─── PATCH /api/buddy/workspace/:feedbackRequestId/start Tests ─────────────────

describe('PATCH /api/buddy/workspace/:feedbackRequestId/start', () => {
  let buddy: { userId: string; profileId: string; buddyProfileId: string }
  let mentee: { userId: string; profileId: string; projectId: string }

  beforeEach(async () => {
    buddy = await createBuddyUser()
    mentee = await createMenteeWithProject()
  })

  it('should transition FeedbackRequest from pending to in_review (Req 6.2)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'pending',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/start`, buddy.userId)
    const res = await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('in_review')
  })

  it('should create a notification for the mentee on start (Req 6.2)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'pending',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/start`, buddy.userId)
    await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })

    // Check notification was created for mentee
    const notifications = await prisma.notification.findMany({
      where: { userId: mentee.userId },
    })

    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('feedback_request_in_review')
    expect(notifications[0].entityId).toBe(fr.id)
  })

  it('should return 422 when trying to start review on non-pending FeedbackRequest (Req 6.8)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/start`, buddy.userId)
    const res = await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(422)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('should return 422 when trying to start review on completed FeedbackRequest', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'completed',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/start`, buddy.userId)
    const res = await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(422)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('should return 404 for non-existent FeedbackRequest', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fakeId}/start`, buddy.userId)
    const res = await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fakeId }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 404 when FeedbackRequest belongs to another buddy', async () => {
    const otherBuddy = await createBuddyUser()

    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: otherBuddy.profileId,
        status: 'pending',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/start`, buddy.userId)
    const res = await START_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

// ─── PATCH /api/buddy/workspace/:feedbackRequestId/complete Tests ──────────────

describe('PATCH /api/buddy/workspace/:feedbackRequestId/complete', () => {
  let buddy: { userId: string; profileId: string; buddyProfileId: string }
  let mentee: { userId: string; profileId: string; projectId: string }

  beforeEach(async () => {
    buddy = await createBuddyUser()
    mentee = await createMenteeWithProject()
  })

  it('should transition FeedbackRequest from in_review to completed (Req 6.5)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('completed')
  })

  it('should set project.isApproved=true on complete (Req 13.1)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })

    // Verify project is now approved
    const project = await prisma.project.findUnique({
      where: { id: mentee.projectId },
    })

    expect(project?.isApproved).toBe(true)
  })

  it('should create a notification for the mentee on complete (Req 6.5)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })

    // Check notification was created for mentee
    const notifications = await prisma.notification.findMany({
      where: { userId: mentee.userId },
    })

    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('feedback_request_completed')
    expect(notifications[0].entityId).toBe(fr.id)
  })

  it('should return 422 when trying to complete a pending FeedbackRequest (Req 6.8)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'pending',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(422)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('should return 422 when trying to complete an already completed FeedbackRequest (Req 6.8)', async () => {
    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: buddy.profileId,
        status: 'completed',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(422)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('should return 404 for non-existent FeedbackRequest', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fakeId}/complete`, buddy.userId)
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fakeId }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 404 when FeedbackRequest belongs to another buddy', async () => {
    const otherBuddy = await createBuddyUser()

    const fr = await prisma.feedbackRequest.create({
      data: {
        projectId: mentee.projectId,
        menteeId: mentee.profileId,
        buddyId: otherBuddy.profileId,
        status: 'in_review',
      },
    })

    const req = makeRequest('PATCH', `http://localhost:3000/api/buddy/workspace/${fr.id}/complete`, buddy.userId)
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: fr.id }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 403 for non-buddy role', async () => {
    const req = makeRequest('PATCH', 'http://localhost:3000/api/buddy/workspace/any-id/complete', buddy.userId, 'mentee')
    const res = await COMPLETE_PATCH(req, { params: Promise.resolve({ feedbackRequestId: 'any-id' }) })
    const body = await getResponseBody(res)

    expect(res.status).toBe(403)
    expect(body.success).toBe(false)
  })
})
