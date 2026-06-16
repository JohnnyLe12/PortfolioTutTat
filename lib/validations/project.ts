import { z } from 'zod'

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  tags: z.string().optional(),   // comma-separated, parsed server-side
  status: z.enum(['draft', 'public', 'pending_feedback']).default('draft'),
})

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  tags: z.string().optional(),
})

export const updateProjectStatusSchema = z.object({
  status: z.enum(['draft', 'public', 'pending_feedback']),
})

/**
 * Valid status transitions for projects:
 * - draft → public (publish project)
 * - draft → pending_feedback (request feedback)
 * - pending_feedback → public (publish after feedback)
 * - pending_feedback → draft (take back to draft)
 * - public → draft (unpublish)
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['public', 'pending_feedback'],
  pending_feedback: ['public', 'draft'],
  public: ['draft'],
}

// Tags parsing utility
export function parseTags(raw?: string): string[] {
  if (!raw) return []
  return raw.split(',').map(t => t.trim()).filter(Boolean)
}
