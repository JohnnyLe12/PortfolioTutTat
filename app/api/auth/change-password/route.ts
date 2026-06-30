import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

/**
 * POST /api/auth/change-password
 * Allows authenticated user to change their password.
 * Requires: currentPassword, newPassword (min 8 chars)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }

    let body: { currentPassword?: string; newPassword?: string }
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400, 'VALIDATION_ERROR')
    }

    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters', 400, 'VALIDATION_ERROR')
    }

    // Get user with password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, passwordHash: true },
    })

    if (!dbUser) {
      return errorResponse('User not found', 404, 'NOT_FOUND')
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!passwordMatch) {
      return errorResponse('Current password is incorrect', 401, 'UNAUTHORIZED')
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newHash },
    })

    return successResponse({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('[POST /api/auth/change-password]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
