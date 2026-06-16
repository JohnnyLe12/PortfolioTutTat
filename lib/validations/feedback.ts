import { z } from 'zod'

export const createFeedbackRequestSchema = z.object({
  projectId: z.string().uuid(),
  note: z.string().max(2000).optional(),
})

export const createFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  suggestions: z.array(z.string()).optional().default([]),
})

export const createCommentSchema = z.object({
  content: z.string().min(1),
})
