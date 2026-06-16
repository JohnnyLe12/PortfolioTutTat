import { Profile } from '@prisma/client'

export function calculateCompletionPct(profile: Partial<Profile>): number {
  const socialLinks = profile.socialLinks as Record<string, string> | null
  const fields = [
    profile.fullName,
    profile.roleTitle,
    profile.bio,
    profile.avatarUrl,
    profile.major,
    (profile.skills?.length ?? 0) > 0 ? true : null,
    (profile.designTools?.length ?? 0) > 0 ? true : null,
    (profile.interests?.length ?? 0) > 0 ? true : null,
    socialLinks?.behance || socialLinks?.linkedin || socialLinks?.instagram || socialLinks?.github,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / 9) * 100)
}
