/**
 * Property-Based Tests: Messaging (Properties 14, 15)
 *
 * **Validates: Requirements 6.4, 6.6, 6.7, 6.9, 10.2, 10.4, 10.5**
 *
 * Property 14: Message Content Validation Boundaries
 * Property 15: Message History Retrieval Order and Limit
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { POST as messagesPOST } from '@/app/api/messages/route'
import { GET as messagesGET } from '@/app/api/messages/[portfolioContextId]/route'
import { NextRequest } from 'next/server'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

function makeSendMessageRequest(
  userId: string,
  role: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest('http://localhost:3000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': role,
    },
    body: JSON.stringify(body),
  })
}

function makeGetMessagesRequest(
  userId: string,
  portfolioContextId: string,
  params?: Record<string, string>
): NextRequest {
  const url = new URL(`http://localhost:3000/api/messages/${portfolioContextId}`)
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val)
    }
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'buddy',
    },
  })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Arbitrary for valid message content: 1-2000 characters with at least 1 non-whitespace char.
 */
const validContentArb = fc
  .tuple(
    fc.stringOf(fc.char(), { minLength: 0, maxLength: 1998 }),
    fc.stringOf(
      fc.char().filter((c) => c.trim().length > 0),
      { minLength: 1, maxLength: 1 }
    ),
    fc.stringOf(fc.char(), { minLength: 0, maxLength: 1998 })
  )
  .map(([prefix, required, suffix]) => {
    // Ensure total length is at most 2000 and has at least 1 non-whitespace
    const combined = prefix + required + suffix
    return combined.slice(0, MAX_MESSAGE_LENGTH)
  })
  .filter((s) => s.trim().length > 0 && s.length >= 1 && s.length <= MAX_MESSAGE_LENGTH)

/**
 * Arbitrary for whitespace-only content (should be rejected).
 */
const whitespaceOnlyArb = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r', ' \t', '\n\r'),
  { minLength: 1, maxLength: 50 }
).map((s) => {
  // Ensure it's truly whitespace-only
  return s.replace(/[^\s]/g, ' ')
})

/**
 * Arbitrary for content exceeding max length (should be rejected).
 */
const overMaxLengthArb = fc.stringOf(fc.char(), { minLength: 2001, maxLength: 2500 })

/**
 * Arbitrary for a number of messages to create for history tests.
 */
const messageCountArb = fc.integer({ min: 1, max: 80 })

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 14: Message Content Validation Boundaries', () => {
  /**
   * **Validates: Requirements 6.4, 6.6, 6.9, 10.2, 10.5**
   *
   * For any message content string, the messaging endpoint SHALL:
   * - Accept strings with 1 to 2000 characters (after trimming) that contain at least
   *   1 non-whitespace character
   * - Reject strings that are empty, whitespace-only, or exceed 2000 characters
   */
  it(
    'should accept valid message content (1-2000 chars with non-whitespace)',
    async () => {
      await fc.assert(
        fc.asyncProperty(validContentArb, async (content) => {
          // Create sender (buddy) and receiver (mentee) with a portfolio context
          const { buddyUserId, menteeUserId, projectId } = await prisma.$transaction(
            async (tx) => {
              const buddy = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-valid-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddy.id,
                  fullName: 'Msg Buddy',
                  roleTitle: 'Reviewer',
                  skills: [],
                  designTools: [],
                },
              })

              const mentee = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-valid-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: mentee.id,
                  fullName: 'Msg Mentee',
                  completionPct: 50,
                },
              })
              const project = await tx.project.create({
                data: {
                  menteeId: menteeProfile.id,
                  title: 'Msg Test Project',
                  tags: [],
                  status: 'pending_feedback',
                },
              })

              return {
                buddyUserId: buddy.id,
                menteeUserId: mentee.id,
                projectId: project.id,
              }
            }
          )

          // Send message with valid content
          const req = makeSendMessageRequest(buddyUserId, 'buddy', {
            receiverId: menteeUserId,
            content,
            portfolioContextId: projectId,
          })
          const res = await messagesPOST(req)
          const body = await res.json()

          expect(res.status).toBe(201)
          expect(body.success).toBe(true)
          expect(body.data.content).toBe(content.trim())
        }),
        { numRuns: 20, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject empty string content',
    async () => {
      // Create users once for this test
      const { buddyUserId, menteeUserId, projectId } = await prisma.$transaction(
        async (tx) => {
          const buddy = await tx.user.create({
            data: {
              email: uniqueEmail('msg-empty-buddy'),
              passwordHash: 'hashed_password',
              role: 'buddy',
            },
          })
          await tx.buddyProfile.create({
            data: {
              userId: buddy.id,
              fullName: 'Empty Msg Buddy',
              roleTitle: 'Reviewer',
              skills: [],
              designTools: [],
            },
          })

          const mentee = await tx.user.create({
            data: {
              email: uniqueEmail('msg-empty-mentee'),
              passwordHash: 'hashed_password',
              role: 'mentee',
            },
          })
          const menteeProfile = await tx.profile.create({
            data: {
              userId: mentee.id,
              fullName: 'Empty Msg Mentee',
              completionPct: 50,
            },
          })
          const project = await tx.project.create({
            data: {
              menteeId: menteeProfile.id,
              title: 'Empty Msg Project',
              tags: [],
              status: 'pending_feedback',
            },
          })

          return {
            buddyUserId: buddy.id,
            menteeUserId: mentee.id,
            projectId: project.id,
          }
        }
      )

      // Send message with empty string
      const req = makeSendMessageRequest(buddyUserId, 'buddy', {
        receiverId: menteeUserId,
        content: '',
        portfolioContextId: projectId,
      })
      const res = await messagesPOST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    },
    { timeout: 60000 },
  )

  it(
    'should reject whitespace-only content',
    async () => {
      await fc.assert(
        fc.asyncProperty(whitespaceOnlyArb, async (content) => {
          const { buddyUserId, menteeUserId, projectId } = await prisma.$transaction(
            async (tx) => {
              const buddy = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-ws-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddy.id,
                  fullName: 'WS Msg Buddy',
                  roleTitle: 'Reviewer',
                  skills: [],
                  designTools: [],
                },
              })

              const mentee = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-ws-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: mentee.id,
                  fullName: 'WS Msg Mentee',
                  completionPct: 50,
                },
              })
              const project = await tx.project.create({
                data: {
                  menteeId: menteeProfile.id,
                  title: 'WS Msg Project',
                  tags: [],
                  status: 'pending_feedback',
                },
              })

              return {
                buddyUserId: buddy.id,
                menteeUserId: mentee.id,
                projectId: project.id,
              }
            }
          )

          const req = makeSendMessageRequest(buddyUserId, 'buddy', {
            receiverId: menteeUserId,
            content,
            portfolioContextId: projectId,
          })
          const res = await messagesPOST(req)
          const body = await res.json()

          expect(res.status).toBe(400)
          expect(body.success).toBe(false)
          expect(body.error.code).toBe('VALIDATION_ERROR')
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )

  it(
    'should reject content exceeding 2000 characters',
    async () => {
      await fc.assert(
        fc.asyncProperty(overMaxLengthArb, async (content) => {
          const { buddyUserId, menteeUserId, projectId } = await prisma.$transaction(
            async (tx) => {
              const buddy = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-long-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddy.id,
                  fullName: 'Long Msg Buddy',
                  roleTitle: 'Reviewer',
                  skills: [],
                  designTools: [],
                },
              })

              const mentee = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-long-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: mentee.id,
                  fullName: 'Long Msg Mentee',
                  completionPct: 50,
                },
              })
              const project = await tx.project.create({
                data: {
                  menteeId: menteeProfile.id,
                  title: 'Long Msg Project',
                  tags: [],
                  status: 'pending_feedback',
                },
              })

              return {
                buddyUserId: buddy.id,
                menteeUserId: mentee.id,
                projectId: project.id,
              }
            }
          )

          const req = makeSendMessageRequest(buddyUserId, 'buddy', {
            receiverId: menteeUserId,
            content,
            portfolioContextId: projectId,
          })
          const res = await messagesPOST(req)
          const body = await res.json()

          expect(res.status).toBe(400)
          expect(body.success).toBe(false)
          expect(body.error.code).toBe('VALIDATION_ERROR')
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})

describe('Property 15: Message History Retrieval Order and Limit', () => {
  /**
   * **Validates: Requirements 6.7, 10.4**
   *
   * For any conversation with n messages, the GET messages endpoint SHALL return
   * at most 50 messages sorted by createdAt ascending (oldest first).
   */
  it(
    'should return at most 50 messages sorted by createdAt ascending (oldest first)',
    async () => {
      await fc.assert(
        fc.asyncProperty(messageCountArb, async (messageCount) => {
          // Create conversation participants and portfolio context
          const { buddyUserId, menteeUserId, projectId } = await prisma.$transaction(
            async (tx) => {
              const buddy = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-hist-buddy'),
                  passwordHash: 'hashed_password',
                  role: 'buddy',
                },
              })
              await tx.buddyProfile.create({
                data: {
                  userId: buddy.id,
                  fullName: 'History Buddy',
                  roleTitle: 'Reviewer',
                  skills: [],
                  designTools: [],
                },
              })

              const mentee = await tx.user.create({
                data: {
                  email: uniqueEmail('msg-hist-mentee'),
                  passwordHash: 'hashed_password',
                  role: 'mentee',
                },
              })
              const menteeProfile = await tx.profile.create({
                data: {
                  userId: mentee.id,
                  fullName: 'History Mentee',
                  completionPct: 50,
                },
              })
              const project = await tx.project.create({
                data: {
                  menteeId: menteeProfile.id,
                  title: 'History Project',
                  tags: [],
                  status: 'pending_feedback',
                },
              })

              return {
                buddyUserId: buddy.id,
                menteeUserId: mentee.id,
                projectId: project.id,
              }
            }
          )

          // Create n messages with staggered timestamps
          const baseDate = new Date('2024-01-01T00:00:00Z')
          const messageData = Array.from({ length: messageCount }, (_, i) => ({
            senderId: i % 2 === 0 ? buddyUserId : menteeUserId,
            receiverId: i % 2 === 0 ? menteeUserId : buddyUserId,
            content: `Message ${i + 1}`,
            portfolioContextId: projectId,
            createdAt: new Date(baseDate.getTime() + i * 60000), // 1 minute apart
          }))

          await prisma.message.createMany({ data: messageData })

          // Call GET messages endpoint
          const req = makeGetMessagesRequest(buddyUserId, projectId)
          const res = await messagesGET(req, {
            params: Promise.resolve({ portfolioContextId: projectId }),
          })
          const body = await res.json()

          expect(res.status).toBe(200)
          expect(body.success).toBe(true)

          const messages = body.data as Array<{
            id: string
            createdAt: string
            content: string
          }>

          // Property: at most 50 messages returned
          expect(messages.length).toBeLessThanOrEqual(50)

          // Property: actual count is min(n, 50)
          expect(messages.length).toBe(Math.min(messageCount, 50))

          // Property: messages are sorted by createdAt ascending (oldest first)
          for (let i = 0; i < messages.length - 1; i++) {
            const currentTime = new Date(messages[i].createdAt).getTime()
            const nextTime = new Date(messages[i + 1].createdAt).getTime()
            expect(currentTime).toBeLessThanOrEqual(nextTime)
          }

          // When there are more than 50 messages, we should get the 50 most recent
          if (messageCount > 50) {
            // The returned messages should be the last 50 (most recent)
            const firstReturnedContent = messages[0].content
            const expectedFirstIndex = messageCount - 50
            expect(firstReturnedContent).toBe(`Message ${expectedFirstIndex + 1}`)
          }
        }),
        { numRuns: 15, endOnFailure: true },
      )
    },
    { timeout: 300000 },
  )
})
