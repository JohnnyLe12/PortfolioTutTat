import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult
  const { id } = await params
  const body = await req.json()

  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) return errorResponse('Job not found', 404, 'NOT_FOUND')

  const updated = await prisma.job.update({ where: { id }, data: { isActive: body.isActive ?? false } })
  return successResponse(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult
  const { id } = await params

  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) return errorResponse('Job not found', 404, 'NOT_FOUND')

  await prisma.application.deleteMany({ where: { jobId: id } })
  await prisma.jobBookmark.deleteMany({ where: { jobId: id } })
  await prisma.job.delete({ where: { id } })
  return successResponse({ message: 'Job deleted' })
}
