import { z } from 'zod'

export const companyProfileCreateSchema = z.object({
  companyName: z.string().min(1).max(255).refine(s => s.trim().length > 0, {
    message: 'companyName must not be empty or whitespace-only',
  }),
  summary: z.string().max(5000).optional(),
  productsServices: z.string().max(5000).optional(),
  websiteUrl: z.string().max(500).startsWith('https://').optional().or(z.literal('')),
  hrContactEmail: z.string().email().max(255).optional().or(z.literal('')),
  hrContactPhone: z.string().max(50).optional(),
  teamMembers: z.array(z.object({
    name: z.string().min(1).max(255),
    role: z.string().min(1).max(255),
    avatarUrl: z.string().max(500).optional(),
  })).default([]),
  employeeCount: z.string().max(50).optional(),
  officeAddress: z.string().max(500).optional(),
  referenceLinks: z.array(z.object({
    url: z.string().url().max(500),
    label: z.string().min(1).max(255),
  })).default([]),
})

export const companyProfileUpdateSchema = companyProfileCreateSchema.partial()
