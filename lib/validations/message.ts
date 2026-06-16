import { z } from 'zod'

export const messageCreateSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000).refine(s => s.trim().length > 0, {
    message: 'content must not be empty or whitespace-only',
  }),
  portfolioContextId: z.string().uuid(),
})
