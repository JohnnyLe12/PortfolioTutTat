import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUser } from '@/lib/auth-guard'

/**
 * DELETE /api/auth/delete-account
 * Permanently deletes the authenticated user's account and all related data.
 * Due to cascade deletes in the schema, this removes:
 * - Profile (and its projects, feedback requests, applications, bookmarks)
 * - BuddyProfile (and portfolio bookmarks)
 * - CompanyProfile
 * - Jobs posted
 * - Messages sent/received
 * - Notifications
 * - Feedback comments and helpful votes
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const { userId } = user

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!existingUser) {
      return errorResponse('User not found', 404, 'NOT_FOUND')
    }

    // Delete in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete messages (not cascade from User in schema, uses relation only)
      await tx.message.deleteMany({ where: { senderId: userId } })
      await tx.message.deleteMany({ where: { receiverId: userId } })

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } })

      // Delete feedback comments authored by this user
      await tx.feedbackComment.deleteMany({ where: { authorId: userId } })

      // Delete feedback helpful votes by this user
      await tx.feedbackHelpfulVote.deleteMany({ where: { userId } })

      // Delete jobs posted by this user (company role)
      // First delete applications and bookmarks on those jobs
      const jobs = await tx.job.findMany({ where: { companyId: userId }, select: { id: true } })
      if (jobs.length > 0) {
        const jobIds = jobs.map(j => j.id)
        await tx.application.deleteMany({ where: { jobId: { in: jobIds } } })
        await tx.jobBookmark.deleteMany({ where: { jobId: { in: jobIds } } })
        await tx.job.deleteMany({ where: { companyId: userId } })
      }

      // Delete BuddyProfile and its bookmarks
      const buddyProfile = await tx.buddyProfile.findUnique({ where: { userId }, select: { id: true } })
      if (buddyProfile) {
        await tx.portfolioBookmark.deleteMany({ where: { buddyId: buddyProfile.id } })
        await tx.buddyProfile.delete({ where: { userId } })
      }

      // Delete CompanyProfile
      await tx.companyProfile.deleteMany({ where: { userId } })

      // Delete Profile and cascaded data (projects, feedback requests, etc.)
      const profile = await tx.profile.findUnique({ where: { userId }, select: { id: true } })
      if (profile) {
        // Delete feedbacks given by this profile (as buddy reviewer)
        await tx.feedback.deleteMany({ where: { buddyId: profile.id } })

        // Delete applications by this profile
        await tx.application.deleteMany({ where: { menteeId: profile.id } })

        // Delete job bookmarks by this profile
        await tx.jobBookmark.deleteMany({ where: { menteeId: profile.id } })

        // Nullify feedback requests where this profile is buddy
        await tx.feedbackRequest.updateMany({
          where: { buddyId: profile.id },
          data: { buddyId: null },
        })

        // Delete feedback requests where this profile is mentee
        // First delete child feedbacks, comments, votes on those requests
        const menteeRequests = await tx.feedbackRequest.findMany({
          where: { menteeId: profile.id },
          select: { id: true },
        })
        if (menteeRequests.length > 0) {
          const requestIds = menteeRequests.map(r => r.id)
          // Delete feedbacks on these requests
          const feedbacks = await tx.feedback.findMany({
            where: { feedbackRequestId: { in: requestIds } },
            select: { id: true },
          })
          if (feedbacks.length > 0) {
            const feedbackIds = feedbacks.map(f => f.id)
            await tx.feedbackComment.deleteMany({ where: { feedbackId: { in: feedbackIds } } })
            await tx.feedbackHelpfulVote.deleteMany({ where: { feedbackId: { in: feedbackIds } } })
            await tx.feedback.deleteMany({ where: { id: { in: feedbackIds } } })
          }
          await tx.feedbackRequest.deleteMany({ where: { menteeId: profile.id } })
        }

        // Delete projects and their media, messages, bookmarks, feedback requests
        const projects = await tx.project.findMany({
          where: { menteeId: profile.id },
          select: { id: true },
        })
        if (projects.length > 0) {
          const projectIds = projects.map(p => p.id)
          await tx.projectMedia.deleteMany({ where: { projectId: { in: projectIds } } })
          await tx.portfolioBookmark.deleteMany({ where: { projectId: { in: projectIds } } })
          await tx.message.deleteMany({ where: { portfolioContextId: { in: projectIds } } })
          // FeedbackRequests on these projects (from other mentees) - unlikely but safe
          const projectFRs = await tx.feedbackRequest.findMany({
            where: { projectId: { in: projectIds } },
            select: { id: true },
          })
          if (projectFRs.length > 0) {
            const frIds = projectFRs.map(r => r.id)
            const fbs = await tx.feedback.findMany({ where: { feedbackRequestId: { in: frIds } }, select: { id: true } })
            if (fbs.length > 0) {
              const fbIds = fbs.map(f => f.id)
              await tx.feedbackComment.deleteMany({ where: { feedbackId: { in: fbIds } } })
              await tx.feedbackHelpfulVote.deleteMany({ where: { feedbackId: { in: fbIds } } })
              await tx.feedback.deleteMany({ where: { id: { in: fbIds } } })
            }
            await tx.feedbackRequest.deleteMany({ where: { projectId: { in: projectIds } } })
          }
          await tx.project.deleteMany({ where: { menteeId: profile.id } })
        }

        // Now safe to delete the profile
        await tx.profile.delete({ where: { userId } })
      }

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return successResponse({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/auth/delete-account]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
