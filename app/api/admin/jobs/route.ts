import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 20

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { email: true } } },
    }),
    prisma.job.count(),
  ])

  return successResponse({ jobs, total, page, totalPages: Math.ceil(total / limit) })
}
