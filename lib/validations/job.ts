import { z } from 'zod'

export const jobFilterSchema = z.object({
  type: z.enum(['all', 'internship', 'fresher', 'freelance', 'part_time', 'full_time']).optional(),
  keyword: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'internship', 'contract', 'freelance', 'temporary', 'volunteer']).optional(),
  seniorityLevel: z.enum(['internship', 'entry', 'assistant', 'mid_senior', 'director', 'executive']).optional(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  isRemote: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
