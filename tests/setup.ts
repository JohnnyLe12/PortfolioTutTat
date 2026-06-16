/**
 * Vitest global test setup
 *
 * Runs before each test file. Cleans all database tables in dependency-safe
 * order (children before parents) so every test starts with a blank slate.
 *
 * Uses a single Prisma transaction for atomicity and speed.
 */

import { beforeEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Manually load .env.test to ensure DATABASE_URL is available during setup
// (vitest envFile may not be populated before setupFiles execute)
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env.test')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.test may not exist in CI — rely on real env vars
  }
}

loadEnvFile()

// Use a dedicated test client so we don't interfere with the singleton in lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

beforeEach(async () => {
  // Delete in reverse-dependency order to avoid FK constraint violations.
  // Uses sequential awaits because Prisma batch transactions ($transaction with array)
  // do NOT guarantee execution order, causing RESTRICT FK violations.
  // Skip cleanup gracefully if database is unavailable (e.g. pure validation tests)
  try {
    // Leaf tables — no children
    await prisma.feedbackHelpfulVote.deleteMany()
    await prisma.feedbackComment.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.jobBookmark.deleteMany()
    await prisma.portfolioBookmark.deleteMany()
    await prisma.message.deleteMany()

    // Mid-level tables
    await prisma.feedback.deleteMany()
    await prisma.application.deleteMany()
    await prisma.projectMedia.deleteMany()

    // Higher-level tables
    await prisma.feedbackRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.job.deleteMany()

    // Root-level tables (cascade handles profile → user, but explicit is safer)
    await prisma.buddyProfile.deleteMany()
    await prisma.companyProfile.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()
  } catch (error: any) {
    // If database is unreachable, skip cleanup — test may not need DB
    if (error?.message?.includes("Can't reach database server")) {
      return
    }
    // If FK constraint violation, try truncating all tables with CASCADE
    if (error?.message?.includes('foreign key constraint') || error?.message?.includes('RESTRICT')) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ DECLARE
            r RECORD;
          BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE "public"."' || r.tablename || '" CASCADE';
            END LOOP;
          END $$;
        `)
        return
      } catch {
        // Fall through to throw original error
      }
    }
    throw error
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Re-export the test prisma client so individual test files can import it
export { prisma }
