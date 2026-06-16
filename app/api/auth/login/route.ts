import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR')
    }

    const { email, password } = parsed.data

    // Use generic error to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return errorResponse('Invalid email or password', 401, 'UNAUTHORIZED')
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401, 'UNAUTHORIZED')
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, completionPct: true },
    })

    const payload = { userId: user.id, role: user.role }
    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)

    return successResponse({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    })
  } catch (err) {
    console.error('[login]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
