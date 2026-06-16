import { z } from 'zod'
import { Major } from '@prisma/client'

export const buddyProfileCreateSchema = z.object({
  fullName: z.string().min(1).max(255).refine(s => s.trim().length > 0, {
    message: 'fullName must not be empty or whitespace-only',
  }),
  roleTitle: z.string().min(1).max(255).refine(s => s.trim().length > 0, {
    message: 'roleTitle must not be empty or whitespace-only',
  }),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().max(500).optional(),
  major: z.nativeEnum(Major).optional(),
  skills: z.array(z.string().max(100)).max(20).default([]),
  designTools: z.array(z.string().max(100)).max(20).default([]),
  interests: z.array(z.string().max(100)).max(20).default([]),
  socialLinks: z.object({
    behance: z.string().max(500).startsWith('https://').optional().or(z.literal('')),
    linkedin: z.string().max(500).startsWith('https://').optional().or(z.literal('')),
    instagram: z.string().max(500).startsWith('https://').optional().or(z.literal('')),
    github: z.string().max(500).startsWith('https://').optional().or(z.literal('')),
  }).default({}),
})

export const buddyProfileUpdateSchema = buddyProfileCreateSchema.partial()
