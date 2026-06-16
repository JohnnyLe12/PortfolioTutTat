import { z } from 'zod'

export const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  portfolioIds: z.array(z.string().uuid()).min(1),
})
