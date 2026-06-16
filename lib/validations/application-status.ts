import { z } from 'zod'

export const applicationStatusUpdateSchema = z.object({
  status: z.enum(['under_review', 'accepted', 'rejected']),
})
