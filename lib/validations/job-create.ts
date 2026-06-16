import { z } from 'zod'
import { EmploymentType, SeniorityLevel } from '@prisma/client'

export const jobCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  openSlots: z.number().int().min(1).max(1000),
  location: z.string().max(500).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  seniorityLevel: z.nativeEnum(SeniorityLevel).optional(),
  minExperienceYears: z.number().int().min(0).max(50).optional(),
  requiredSkills: z.array(z.string().max(100)).max(20).default([]),
  salaryMin: z.number().min(0).max(999999999).optional(),
  salaryMax: z.number().min(0).max(999999999).optional(),
  salaryPeriod: z.enum(['monthly', 'yearly']).optional(),
  requiresManagement: z.boolean().default(false),
  minManagedEmployees: z.number().int().min(1).max(10000).optional(),
  category: z.string().max(100).optional(),
}).refine(
  data => !(data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax),
  { message: 'salaryMin cannot exceed salaryMax', path: ['salaryMin'] }
)
