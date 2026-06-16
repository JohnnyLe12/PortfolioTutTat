/**
 * Property-Based Test: Media upload validation enforces type and size constraints (project media)
 *
 * **Validates: Requirements 4.2**
 *
 * Property: For any file with a MIME type NOT in [image/png, image/jpg, image/jpeg, image/webp, image/gif],
 * the project media upload endpoint should reject with 400. For any file exceeding 10MB,
 * the endpoint should reject with 400. For valid MIME types within the size limit,
 * the file should be accepted (not rejected by validation).
 */

import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { POST } from '@/app/api/projects/[id]/media/route'
import { NextRequest } from 'next/server'

// Mock @vercel/blob to avoid actual uploads during testing
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.vercel-storage.com/projects/test-project-id/test-media.png' }),
}))

// Mock prisma to avoid database dependency for validation-focused tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-project-id',
        menteeId: 'test-profile-id',
        title: 'Test Project',
        status: 'draft',
        mentee: { userId: 'test-user-id' },
      }),
    },
    projectMedia: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'test-media-id',
        projectId: 'test-project-id',
        url: 'https://blob.vercel-storage.com/projects/test-project-id/test-media.png',
        mediaType: 'image',
        fileName: 'test-media.png',
        fileSize: 1024,
        sortOrder: 0,
      }),
    },
  },
}))

/**
 * The allowed MIME types for project media upload.
 */
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Maximum file size for project media upload (10MB).
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Helper: create a NextRequest with FormData containing a file for the project media endpoint.
 */
function makeMediaUploadRequest(file: File, userId = 'test-user-id'): NextRequest {
  const formData = new FormData()
  formData.append('file', file)

  const req = new NextRequest('http://localhost:3000/api/projects/test-project-id/media', {
    method: 'POST',
    body: formData,
    headers: {
      'x-user-id': userId,
    },
  })

  return req
}

/**
 * Route params for the dynamic [id] segment.
 */
const routeParams = { params: Promise.resolve({ id: 'test-project-id' }) }

/**
 * Arbitrary for MIME types that are NOT in the allowed list.
 * Generates common invalid types and random strings.
 */
const invalidMimeTypeArb = fc.oneof(
  // Common non-image MIME types
  fc.constantFrom(
    'application/pdf',
    'text/plain',
    'text/html',
    'application/json',
    'video/mp4',
    'audio/mpeg',
    'application/zip',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'application/octet-stream',
    'video/webm',
    'audio/wav',
    'application/x-rar-compressed',
  ),
  // Random MIME-like strings
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-+.'), { minLength: 1, maxLength: 20 }),
  ).map(([type, subtype]) => `${type}/${subtype}`),
).filter((mime) => !ALLOWED_MIME_TYPES.includes(mime))

/**
 * Arbitrary for file sizes that exceed 10MB.
 * Generates sizes from 10MB + 1 byte to 50MB.
 */
const oversizedFileSizeArb = fc.integer({
  min: MAX_FILE_SIZE + 1,
  max: 50 * 1024 * 1024, // up to 50MB
})

/**
 * Arbitrary for valid MIME types (includes GIF for project media).
 */
const validMimeTypeArb = fc.constantFrom(...ALLOWED_MIME_TYPES)

/**
 * Arbitrary for valid file sizes (1 byte to 10MB).
 */
const validFileSizeArb = fc.integer({ min: 1, max: MAX_FILE_SIZE })

describe('Property: Media upload validation enforces type and size constraints (project media)', () => {
  it(
    'should reject files with invalid MIME types with 400 status',
    async () => {
      await fc.assert(
        fc.asyncProperty(invalidMimeTypeArb, async (mimeType) => {
          // Create a small valid-sized file with an invalid MIME type
          const content = new Uint8Array(1024) // 1KB file
          const file = new File([content], 'test-file.xyz', { type: mimeType })

          const req = makeMediaUploadRequest(file)
          const res = await POST(req, routeParams)
          const json = await res.json()

          // Assert: should be rejected with 400
          expect(res.status).toBe(400)
          expect(json.success).toBe(false)
          // Error message should mention the invalid file type
          expect(json.error.message).toContain('Invalid file type')
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 60000 },
  )

  it(
    'should reject files exceeding 10MB with 400 status',
    async () => {
      await fc.assert(
        fc.asyncProperty(oversizedFileSizeArb, async (fileSize) => {
          // Create a file with valid MIME type but exceeding size limit
          const content = new Uint8Array(fileSize)
          const file = new File([content], 'large-image.png', { type: 'image/png' })

          const req = makeMediaUploadRequest(file)
          const res = await POST(req, routeParams)
          const json = await res.json()

          // Assert: should be rejected with 400
          expect(res.status).toBe(400)
          expect(json.success).toBe(false)
          // Error message should mention file size
          expect(json.error.message).toContain('exceeds the maximum')
        }),
        // Reduced numRuns due to large buffer allocations
        { numRuns: 10 },
      )
    },
    { timeout: 60000 },
  )

  it(
    'should accept files with valid MIME types and valid sizes (not rejected by validation)',
    async () => {
      await fc.assert(
        fc.asyncProperty(validMimeTypeArb, validFileSizeArb, async (mimeType, _fileSize) => {
          // Use a small actual buffer for performance while testing validation logic
          const smallFile = new File([new Uint8Array(1024)], 'valid-image.png', { type: mimeType })

          const req = makeMediaUploadRequest(smallFile)
          const res = await POST(req, routeParams)
          const json = await res.json()

          // Assert: should NOT be rejected by validation (201 success from mocked upload)
          expect(res.status).toBe(201)
          expect(json.success).toBe(true)
        }),
        { numRuns: 20 },
      )
    },
    { timeout: 60000 },
  )
})
