import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  roleTitle: z.string().max(255).optional(),
  bio: z.string().max(2000).optional(),
  major: z.enum(['Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design']).optional(),
  skills: z.array(z.string()).optional(),
  designTools: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.object({
    behance:   z.string().url().startsWith('https://').optional().or(z.literal('')),
    linkedin:  z.string().url().startsWith('https://').optional().or(z.literal('')),
    instagram: z.string().url().startsWith('https://').optional().or(z.literal('')),
    github:    z.string().url().startsWith('https://').optional().or(z.literal('')),
  }).optional(),
})
