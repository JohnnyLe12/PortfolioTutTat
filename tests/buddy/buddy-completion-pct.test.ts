/**
 * Unit Tests: calculateBuddyCompletionPct helper
 *
 * Validates: Requirement 2.4 — CompletionPct calculation
 * Formula: floor((filledFieldCount / 9) * 100)
 */

import { describe, it, expect } from 'vitest'
import { calculateBuddyCompletionPct } from '@/lib/buddy-profile'

describe('calculateBuddyCompletionPct', () => {
  it('should return 0 when no fields are filled', () => {
    const result = calculateBuddyCompletionPct({
      fullName: '',
      roleTitle: '',
      bio: null,
      avatarUrl: null,
      major: null,
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
    })
    expect(result).toBe(0)
  })

  it('should return 100 when all 9 fields are filled', () => {
    const result = calculateBuddyCompletionPct({
      fullName: 'John',
      roleTitle: 'Designer',
      bio: 'About me',
      avatarUrl: 'https://example.com/pic.jpg',
      major: 'UI_UX' as any,
      skills: ['Figma'],
      designTools: ['Sketch'],
      interests: ['Typography'],
      socialLinks: { behance: 'https://behance.net/john' },
    })
    expect(result).toBe(100)
  })

  it('should return floor(2/9 * 100) = 22 when only fullName and roleTitle are filled', () => {
    const result = calculateBuddyCompletionPct({
      fullName: 'Jane',
      roleTitle: 'Reviewer',
      bio: null,
      avatarUrl: null,
      major: null,
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
    })
    expect(result).toBe(22)
  })

  it('should not count whitespace-only strings as filled', () => {
    const result = calculateBuddyCompletionPct({
      fullName: '   ',
      roleTitle: '\t\n',
      bio: '  ',
      avatarUrl: '   ',
      major: null,
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: {},
    })
    expect(result).toBe(0)
  })

  it('should count socialLinks as filled only when at least one URL starts with https://', () => {
    // Invalid URL (no https://)
    const result1 = calculateBuddyCompletionPct({
      fullName: 'A',
      roleTitle: 'B',
      bio: null,
      avatarUrl: null,
      major: null,
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: { behance: 'http://behance.net/invalid' },
    })
    // Only fullName and roleTitle count
    expect(result1).toBe(22)

    // Valid URL
    const result2 = calculateBuddyCompletionPct({
      fullName: 'A',
      roleTitle: 'B',
      bio: null,
      avatarUrl: null,
      major: null,
      skills: [],
      designTools: [],
      interests: [],
      socialLinks: { behance: 'https://behance.net/valid' },
    })
    // fullName + roleTitle + socialLinks = 3 → floor(3/9*100) = 33
    expect(result2).toBe(33)
  })

  it('should count arrays with at least 1 element as filled', () => {
    const result = calculateBuddyCompletionPct({
      fullName: 'A',
      roleTitle: 'B',
      bio: null,
      avatarUrl: null,
      major: null,
      skills: ['one'],
      designTools: ['two'],
      interests: ['three'],
      socialLinks: {},
    })
    // fullName + roleTitle + skills + designTools + interests = 5 → floor(5/9*100) = 55
    expect(result).toBe(55)
  })

  it('should handle undefined fields gracefully', () => {
    const result = calculateBuddyCompletionPct({})
    expect(result).toBe(0)
  })
})
