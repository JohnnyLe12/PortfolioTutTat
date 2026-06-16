import { BuddyProfile } from '@prisma/client'

/**
 * Calculates the completion percentage for a BuddyProfile.
 *
 * Fields counted (9 total):
 * 1. fullName — string, at least 1 non-whitespace character
 * 2. roleTitle — string, at least 1 non-whitespace character
 * 3. bio — string, at least 1 non-whitespace character
 * 4. avatarUrl — string, at least 1 non-whitespace character
 * 5. major — enum, has a selected value (not null/undefined)
 * 6. skills — array, at least 1 element
 * 7. designTools — array, at least 1 element
 * 8. interests — array, at least 1 element
 * 9. socialLinks — JSON object with at least 1 valid URL (non-empty string starting with https://)
 *
 * Formula: Math.floor((filledFieldCount / 9) * 100)
 */
export function calculateBuddyCompletionPct(profile: Partial<BuddyProfile>): number {
  const socialLinks = profile.socialLinks as Record<string, string> | null | undefined

  const fields = [
    (profile.fullName?.trim().length ?? 0) > 0,
    (profile.roleTitle?.trim().length ?? 0) > 0,
    (profile.bio?.trim().length ?? 0) > 0,
    (profile.avatarUrl?.trim().length ?? 0) > 0,
    profile.major != null,
    (profile.skills?.length ?? 0) > 0,
    (profile.designTools?.length ?? 0) > 0,
    (profile.interests?.length ?? 0) > 0,
    hasSocialLink(socialLinks),
  ]

  const filledCount = fields.filter(Boolean).length
  return Math.floor((filledCount / 9) * 100)
}

/**
 * Checks if at least one social link is a valid URL (non-empty, starts with https://).
 */
function hasSocialLink(socialLinks: Record<string, string> | null | undefined): boolean {
  if (!socialLinks || typeof socialLinks !== 'object') return false

  return Object.values(socialLinks).some(
    (url) => typeof url === 'string' && url.trim().length > 0 && url.startsWith('https://')
  )
}
