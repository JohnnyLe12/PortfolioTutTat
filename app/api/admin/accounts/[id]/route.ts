import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { requireRole } from '@/lib/role-guard'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(req, ['admin'])
  if (authResult instanceof Response) return authResult
  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
  if (!user) return errorResponse('User not found', 404, 'NOT_FOUND')
  if (user.role === 'admin') return errorResponse('Cannot delete admin accounts', 403, 'FORBIDDEN')

  // Clean up related data before deleting user
  await prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } })
  await prisma.notification.deleteMany({ where: { userId: id } })
  await prisma.feedbackComment.deleteMany({ where: { authorId: id } })
  await prisma.feedbackHelpfulVote.deleteMany({ where: { userId: id } })

  const buddyProfile = await prisma.buddyProfile.findUnique({ where: { userId: id }, select: { id: true } })
  if (buddyProfile) {
    await prisma.portfolioBookmark.deleteMany({ where: { buddyId: buddyProfile.id } })
    await prisma.buddyProfile.delete({ where: { userId: id } })
  }
  await prisma.companyProfile.deleteMany({ where: { userId: id } })

  const profile = await prisma.profile.findUnique({ where: { userId: id }, select: { id: true } })
  if (profile) {
    await prisma.feedback.deleteMany({ where: { buddyId: profile.id } })
    await prisma.application.deleteMany({ where: { menteeId: profile.id } })
    await prisma.jobBookmark.deleteMany({ where: { menteeId: profile.id } })
    await prisma.feedbackRequest.updateMany({ where: { buddyId: profile.id }, data: { buddyId: null } })

    const requests = await prisma.feedbackRequest.findMany({ where: { menteeId: profile.id }, select: { id: true } })
    if (requests.length > 0) {
      const rIds = requests.map((r) => r.id)
      const fbs = await prisma.feedback.findMany({ where: { feedbackRequestId: { in: rIds } }, select: { id: true } })
      if (fbs.length > 0) {
        const fbIds = fbs.map((f) => f.id)
        await prisma.feedbackComment.deleteMany({ where: { feedbackId: { in: fbIds } } })
        await prisma.feedbackHelpfulVote.deleteMany({ where: { feedbackId: { in: fbIds } } })
        await prisma.feedback.deleteMany({ where: { id: { in: fbIds } } })
      }
      await prisma.feedbackRequest.deleteMany({ where: { menteeId: profile.id } })
    }

    const projects = await prisma.project.findMany({ where: { menteeId: profile.id }, select: { id: true } })
    if (projects.length > 0) {
      const pIds = projects.map((p) => p.id)
      await prisma.projectMedia.deleteMany({ where: { projectId: { in: pIds } } })
      await prisma.portfolioBookmark.deleteMany({ where: { projectId: { in: pIds } } })
      await prisma.message.deleteMany({ where: { portfolioContextId: { in: pIds } } })
      await prisma.project.deleteMany({ where: { menteeId: profile.id } })
    }
    await prisma.profile.delete({ where: { userId: id } })
  }

  const jobs = await prisma.job.findMany({ where: { companyId: id }, select: { id: true } })
  if (jobs.length > 0) {
    const jIds = jobs.map((j) => j.id)
    await prisma.application.deleteMany({ where: { jobId: { in: jIds } } })
    await prisma.jobBookmark.deleteMany({ where: { jobId: { in: jIds } } })
    await prisma.job.deleteMany({ where: { companyId: id } })
  }

  await prisma.user.delete({ where: { id } })
  return successResponse({ message: 'Account deleted' })
}
