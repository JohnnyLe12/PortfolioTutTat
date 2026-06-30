import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult

  const body = await req.json()
  const { email, role } = body

  if (!email || !role || !['buddy', 'company'].includes(role)) {
    return errorResponse('Email and role (buddy/company) required', 400, 'VALIDATION_ERROR')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return errorResponse('Email already registered', 409, 'CONFLICT')

  // Generate random 12-char password
  const password = crypto.randomBytes(9).toString('base64url').slice(0, 12)
  const passwordHash = await bcrypt.hash(password, 12)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash, role } })

    if (role === 'buddy') {
      await tx.buddyProfile.create({
        data: { userId: user.id, fullName: email.split('@')[0], roleTitle: '', completionPct: 0 },
      })
    } else if (role === 'company') {
      await tx.companyProfile.create({
        data: { userId: user.id, companyName: email.split('@')[0] },
      })
    }
    return user
  })

  return successResponse(
    { id: result.id, email: result.email, role: result.role, generatedPassword: password },
    201
  )
}

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const roleFilter = searchParams.get('role')
  const search = searchParams.get('search')

  const where: any = {}
  if (roleFilter && roleFilter !== 'all') where.role = roleFilter
  if (search) where.email = { contains: search, mode: 'insensitive' }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    }),
    prisma.user.count({ where }),
  ])

  return successResponse({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
}
