import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse } from '@/lib/response'

const REDIRECT_PATHS: Record<string, string> = {
  mentee: '/create-profile',
  buddy: '/create-buddy-profile',
  company: '/create-company-profile',
  admin: '/admin-dashboard',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR')
    }

    const { email, password, role, inviteCode } = parsed.data

    // Admin invite code verification
    if (role === 'admin') {
      const expectedCode = process.env.ADMIN_INVITE_CODE
      if (!expectedCode || inviteCode !== expectedCode) {
        return errorResponse('Invalid or missing admin invite code', 403, 'FORBIDDEN')
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return errorResponse('Email already registered', 409, 'CONFLICT')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, role },
      })

      let profileId: string | null = null

      if (role === 'mentee') {
        const profile = await tx.profile.create({
          data: {
            userId: user.id,
            fullName: email.split('@')[0],
            completionPct: 0,
          },
        })
        profileId = profile.id
      } else if (role === 'buddy') {
        const buddyProfile = await tx.buddyProfile.create({
          data: {
            userId: user.id,
            fullName: email.split('@')[0],
            roleTitle: '',
            completionPct: 0,
          },
        })
        profileId = buddyProfile.id
      } else if (role === 'company') {
        const companyProfile = await tx.companyProfile.create({
          data: {
            userId: user.id,
            companyName: email.split('@')[0],
          },
        })
        profileId = companyProfile.id
      }
      // admin: skip profile creation entirely

      return { user, profileId }
    })

    const payload = { userId: result.user.id, role: result.user.role }
    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
        profileId: result.profileId,
        redirectPath: REDIRECT_PATHS[role],
      },
      201
    )
  } catch (err) {
    console.error('[register]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
