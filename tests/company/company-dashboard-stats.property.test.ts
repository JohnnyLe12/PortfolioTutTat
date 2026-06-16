/**
 * Property-Based Tests: Company Dashboard Stats (Property 18)
 *
 * **Validates: Requirements 7.1, 7.2, 7.4**
 *
 * Property 18: Company Dashboard Stats Correctness
 *
 * For any company with a set of jobs and applications, the dashboard stats endpoint SHALL return:
 * - `activeJobs` equal to count of jobs with isActive=true
 * - `totalApplications` equal to count of all applications across all company jobs
 * - `newApplicantsThisWeek` equal to count of applications with createdAt within the last 7 days
 * - The recent jobs list SHALL contain at most 5 jobs sorted by createdAt desc, each with its correct application count
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../setup'
import { GET } from '@/app/api/company/dashboard/stats/route'
import { NextRequest } from 'next/server'

// ─── Helpers ───────────────────────────────────────────────────────────────────

let iterCounter = 0

function uniqueEmail(prefix: string): string {
  iterCounter++
  return `${prefix}-${Date.now()}-${iterCounter}@test.com`
}

function makeRequest(userId: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/company/dashboard/stats', {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-role': 'company',
    },
  })
}

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Number of active jobs to create */
const activeJobsCountArb = fc.integer({ min: 0, max: 5 })

/** Number of inactive jobs to create */
const inactiveJobsCountArb = fc.integer({ min: 0, max: 3 })

/** Number of recent applications (within last 7 days) per job */
const recentAppsPerJobArb = fc.integer({ min: 0, max: 3 })

/** Number of old applications (older than 7 days) per job */
const oldAppsPerJobArb = fc.integer({ min: 0, max: 2 })

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 18a: Company Dashboard Stats Correctness', () => {
  /**
   * **Validates: Requirements 7.1, 7.2, 7.4**
   *
   * For any company with a set of active/inactive jobs and recent/old applications,
   * the dashboard stats endpoint SHALL return correct counts for:
   * - activeJobs
   * - totalApplications
   * - newApplicantsThisWeek
   */
  it(
    'should return correct activeJobs, totalApplications, and newApplicantsThisWeek',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          activeJobsCountArb,
          inactiveJobsCountArb,
          recentAppsPerJobArb,
          oldAppsPerJobArb,
          async (numActiveJobs, numInactiveJobs, recentAppsPerJob, oldAppsPerJob) => {
            const {
              companyUserId,
              expectedActiveJobs,
              expectedTotalApplications,
              expectedNewApplicantsThisWeek,
            } = await prisma.$transaction(async (tx) => {
              // Create company user
              const companyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('dash-company'),
                  passwordHash: 'hashed_password',
                  role: 'company',
                },
              })

              const totalJobs = numActiveJobs + numInactiveJobs
              let totalApps = 0
              let recentApps = 0

              // Create active jobs
              for (let i = 0; i < numActiveJobs; i++) {
                const job = await tx.job.create({
                  data: {
                    companyId: companyUser.id,
                    title: `Active Job ${iterCounter++}`,
                    jobType: 'full_time',
                    isActive: true,
                  },
                })

                // Create recent applications for this job
                for (let r = 0; r < recentAppsPerJob; r++) {
                  const menteeUser = await tx.user.create({
                    data: {
                      email: uniqueEmail(`mentee-active-recent-${i}-${r}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  const menteeProfile = await tx.profile.create({
                    data: {
                      userId: menteeUser.id,
                      fullName: `Mentee AR ${i}-${r}`,
                      completionPct: 50,
                    },
                  })
                  await tx.application.create({
                    data: {
                      jobId: job.id,
                      menteeId: menteeProfile.id,
                      portfolioIds: [],
                      status: 'submitted',
                      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    },
                  })
                  totalApps++
                  recentApps++
                }

                // Create old applications for this job
                for (let o = 0; o < oldAppsPerJob; o++) {
                  const menteeUser = await tx.user.create({
                    data: {
                      email: uniqueEmail(`mentee-active-old-${i}-${o}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  const menteeProfile = await tx.profile.create({
                    data: {
                      userId: menteeUser.id,
                      fullName: `Mentee AO ${i}-${o}`,
                      completionPct: 50,
                    },
                  })
                  await tx.application.create({
                    data: {
                      jobId: job.id,
                      menteeId: menteeProfile.id,
                      portfolioIds: [],
                      status: 'submitted',
                      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                    },
                  })
                  totalApps++
                }
              }

              // Create inactive jobs
              for (let i = 0; i < numInactiveJobs; i++) {
                const job = await tx.job.create({
                  data: {
                    companyId: companyUser.id,
                    title: `Inactive Job ${iterCounter++}`,
                    jobType: 'full_time',
                    isActive: false,
                  },
                })

                // Create recent applications for inactive jobs (still count towards totalApplications and newApplicantsThisWeek)
                for (let r = 0; r < recentAppsPerJob; r++) {
                  const menteeUser = await tx.user.create({
                    data: {
                      email: uniqueEmail(`mentee-inactive-recent-${i}-${r}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  const menteeProfile = await tx.profile.create({
                    data: {
                      userId: menteeUser.id,
                      fullName: `Mentee IR ${i}-${r}`,
                      completionPct: 50,
                    },
                  })
                  await tx.application.create({
                    data: {
                      jobId: job.id,
                      menteeId: menteeProfile.id,
                      portfolioIds: [],
                      status: 'submitted',
                      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    },
                  })
                  totalApps++
                  recentApps++
                }

                // Create old applications for inactive jobs
                for (let o = 0; o < oldAppsPerJob; o++) {
                  const menteeUser = await tx.user.create({
                    data: {
                      email: uniqueEmail(`mentee-inactive-old-${i}-${o}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  const menteeProfile = await tx.profile.create({
                    data: {
                      userId: menteeUser.id,
                      fullName: `Mentee IO ${i}-${o}`,
                      completionPct: 50,
                    },
                  })
                  await tx.application.create({
                    data: {
                      jobId: job.id,
                      menteeId: menteeProfile.id,
                      portfolioIds: [],
                      status: 'submitted',
                      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    },
                  })
                  totalApps++
                }
              }

              return {
                companyUserId: companyUser.id,
                expectedActiveJobs: numActiveJobs,
                expectedTotalApplications: totalApps,
                expectedNewApplicantsThisWeek: recentApps,
              }
            }, { timeout: 60000 })

            // Call the dashboard stats endpoint
            const req = makeRequest(companyUserId)
            const res = await GET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const data = body.data

            // Property: activeJobs equals count of jobs with isActive=true
            expect(data.activeJobs).toBe(expectedActiveJobs)

            // Property: totalApplications equals count of all applications across all company jobs
            expect(data.totalApplications).toBe(expectedTotalApplications)

            // Property: newApplicantsThisWeek equals count of applications within last 7 days
            expect(data.newApplicantsThisWeek).toBe(expectedNewApplicantsThisWeek)
          },
        ),
        { numRuns: 15, endOnFailure: true, timeout: 300000 },
      )
    },
    { timeout: 360000 },
  )
})

describe('Property 18b: Recent Jobs Limit and Sort', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * The recent jobs list SHALL contain at most 5 jobs sorted by createdAt desc,
   * each with its correct application count.
   */
  it(
    'should return at most 5 recent jobs sorted by createdAt desc with correct applicationCount',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 8 }), // total jobs to create
          recentAppsPerJobArb,
          async (numJobs, appsPerJob) => {
            const { companyUserId, jobData } = await prisma.$transaction(async (tx) => {
              // Create company user
              const companyUser = await tx.user.create({
                data: {
                  email: uniqueEmail('dash-limit-company'),
                  passwordHash: 'hashed_password',
                  role: 'company',
                },
              })

              // Create jobs with staggered createdAt dates
              const baseDate = new Date('2024-06-01T00:00:00Z')
              const jobs: Array<{ id: string; title: string; createdAt: Date; appCount: number }> = []

              for (let i = 0; i < numJobs; i++) {
                const jobCreatedAt = new Date(baseDate.getTime() + i * 60000) // 1 minute apart
                const job = await tx.job.create({
                  data: {
                    companyId: companyUser.id,
                    title: `Limit Job ${i} - ${iterCounter++}`,
                    jobType: 'full_time',
                    isActive: i % 2 === 0, // mix of active/inactive
                    createdAt: jobCreatedAt,
                  },
                })

                // Create applications for this job
                let appCount = 0
                for (let a = 0; a < appsPerJob; a++) {
                  const menteeUser = await tx.user.create({
                    data: {
                      email: uniqueEmail(`mentee-limit-${i}-${a}`),
                      passwordHash: 'hashed_password',
                      role: 'mentee',
                    },
                  })
                  const menteeProfile = await tx.profile.create({
                    data: {
                      userId: menteeUser.id,
                      fullName: `Mentee L ${i}-${a}`,
                      completionPct: 50,
                    },
                  })
                  await tx.application.create({
                    data: {
                      jobId: job.id,
                      menteeId: menteeProfile.id,
                      portfolioIds: [],
                      status: 'submitted',
                    },
                  })
                  appCount++
                }

                jobs.push({
                  id: job.id,
                  title: job.title,
                  createdAt: jobCreatedAt,
                  appCount,
                })
              }

              return {
                companyUserId: companyUser.id,
                jobData: jobs,
              }
            }, { timeout: 60000 })

            // Call the dashboard stats endpoint
            const req = makeRequest(companyUserId)
            const res = await GET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const recentJobs = body.data.recentJobs as Array<{
              id: string
              title: string
              createdAt: string
              applicationCount: number
            }>

            // Property: at most 5 jobs returned
            expect(recentJobs.length).toBeLessThanOrEqual(5)

            // Property: exactly min(numJobs, 5) jobs returned
            expect(recentJobs.length).toBe(Math.min(numJobs, 5))

            // Property: jobs are sorted by createdAt descending
            for (let i = 0; i < recentJobs.length - 1; i++) {
              const currentDate = new Date(recentJobs[i].createdAt).getTime()
              const nextDate = new Date(recentJobs[i + 1].createdAt).getTime()
              expect(currentDate).toBeGreaterThanOrEqual(nextDate)
            }

            // Property: the returned jobs are the most recent ones
            if (numJobs > 0) {
              // Sort all jobs by createdAt descending and take top 5
              const sortedJobs = [...jobData].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              )
              const expectedTopJobs = sortedJobs.slice(0, 5)

              // Verify the most recent returned job matches
              expect(recentJobs[0].id).toBe(expectedTopJobs[0].id)
            }

            // Property: each returned job has the correct application count
            for (const returnedJob of recentJobs) {
              const matchingJob = jobData.find((j) => j.id === returnedJob.id)
              expect(matchingJob).toBeDefined()
              expect(returnedJob.applicationCount).toBe(matchingJob!.appCount)
            }
          },
        ),
        { numRuns: 15, endOnFailure: true, timeout: 300000 },
      )
    },
    { timeout: 360000 },
  )
})
