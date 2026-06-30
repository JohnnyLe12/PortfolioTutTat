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
  const status = searchParams.get('status') || 'public'

  const where: any = {}
  if (status !== 'all') where.status = status

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        mentee: { select: { fullName: true, userId: true } },
        media: { take: 1, select: { url: true } },
      },
    }),
    prisma.project.count({ where }),
  ])

  return successResponse({ projects, total, page, totalPages: Math.ceil(total / limit) })
}
