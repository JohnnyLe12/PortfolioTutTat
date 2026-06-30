import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult
  const { id } = await params
  const body = await req.json()

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) return errorResponse('Project not found', 404, 'NOT_FOUND')

  const updated = await prisma.project.update({ where: { id }, data: { status: body.status || 'draft' } })
  return successResponse(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult
  const { id } = await params

  await prisma.projectMedia.deleteMany({ where: { projectId: id } })
  await prisma.portfolioBookmark.deleteMany({ where: { projectId: id } })
  await prisma.feedbackRequest.deleteMany({ where: { projectId: id } })
  await prisma.message.deleteMany({ where: { portfolioContextId: id } })
  await prisma.project.delete({ where: { id } })
  return successResponse({ message: 'Portfolio deleted' })
}
