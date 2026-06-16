# Design Document — Mentee Subsystem

## Overview

Mentee Subsystem là phân hệ cốt lõi của **PortfolioTutTat**, một nền tảng web hỗ trợ sinh viên ngành thiết kế xây dựng portfolio chuyên nghiệp, nhận phản hồi từ Buddy/Mentor, và kết nối với cơ hội việc làm.

Hệ thống được xây dựng theo kiến trúc **monorepo fullstack** với:
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (đã có sẵn)
- **Backend**: Next.js App Router API Routes (chạy trên Vercel Serverless Functions)
- **Database**: PostgreSQL (Neon/Supabase) thông qua Prisma ORM
- **Auth**: JWT (access token) + bcrypt password hashing
- **Media**: Vercel Blob hoặc Cloudinary cho file upload

Lý do chọn Next.js App Router thay vì Express:
- Deploy trực tiếp lên Vercel, không cần server riêng
- API Routes nằm cùng repo với frontend (monorepo, một lần deploy)
- File-based routing giảm boilerplate
- Edge Runtime support cho latency thấp hơn ở các route đơn giản

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React + Vite + Tailwind CSS + shadcn/ui                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Pages   │ │Components│ │  Hooks   │ │  API Client      │   │
│  │(React    │ │(UI/Layout│ │(useAuth, │ │(fetch wrapper,   │   │
│  │ Router)  │ │ Feature) │ │useProfile│ │ JWT interceptor) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS REST (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VERCEL SERVERLESS FUNCTIONS                   │
│              Next.js App Router — /app/api/**                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  /auth       │  │  /profiles   │  │  /projects           │  │
│  │  register    │  │  me (GET/PUT)│  │  CRUD + status patch │  │
│  │  login       │  │  avatar      │  │  media upload/delete │  │
│  │  logout      │  │  stats       │  │  public listing      │  │
│  │  refresh     │  └──────────────┘  └──────────────────────┘  │
│  └──────────────┘                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │/feedback-    │  │  /jobs       │  │  /notifications      │  │
│  │ requests     │  │  list/detail │  │  list/read/count     │  │
│  │/feedbacks    │  │  recommended │  └──────────────────────┘  │
│  │ comments     │  │  bookmark    │                             │
│  │ helpful      │  │/applications │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              /lib — Shared Utilities                     │   │
│  │  prisma.ts (singleton)  │  auth.ts (JWT sign/verify)    │   │
│  │  validations/ (Zod)     │  errors.ts (AppError class)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  middleware.ts — JWT verification, route protection             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma Client (TCP/TLS)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL (Neon / Supabase)                       │
│  users, profiles, projects, project_media, feedback_requests,   │
│  feedbacks, feedback_comments, feedback_helpful_votes,          │
│  jobs, applications, job_bookmarks, notifications               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Media Storage (Vercel Blob / Cloudinary)           │
│  Avatar images, Project media (PNG/JPG/WEBP/GIF)                │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser Request
    │
    ▼
middleware.ts
    │── Public route? ──► Pass through
    │
    └── Protected route?
            │
            ▼
        Extract JWT from Authorization header
            │── Invalid/missing ──► 401 Unauthorized
            │
            └── Valid ──► Attach { userId, role } to request headers
                                │
                                ▼
                        Route Handler (route.ts)
                                │
                                ▼
                        Zod validation of body/params
                                │── Invalid ──► 400 Bad Request
                                │
                                └── Valid ──► Business logic
                                                │
                                                ▼
                                        Prisma query
                                                │
                                                ▼
                                        JSON Response
```

---

## Components and Interfaces

### Project Structure

```
/                               ← Next.js project root (monorepo)
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── refresh/route.ts
│   │   ├── profiles/
│   │   │   ├── me/
│   │   │   │   ├── route.ts          (GET, PUT)
│   │   │   │   ├── avatar/route.ts   (POST)
│   │   │   │   └── stats/route.ts    (GET)
│   │   │   └── [id]/route.ts         (GET public profile)
│   │   ├── projects/
│   │   │   ├── route.ts              (GET list, POST create)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          (GET, PUT, DELETE)
│   │   │   │   ├── status/route.ts   (PATCH)
│   │   │   │   ├── media/
│   │   │   │   │   ├── route.ts      (POST upload)
│   │   │   │   │   ├── [mediaId]/route.ts (DELETE)
│   │   │   │   │   └── reorder/route.ts   (PATCH)
│   │   │   │   └── feedback-summary/route.ts (GET)
│   │   │   └── public/[menteeId]/route.ts    (GET public projects)
│   │   ├── feedback-requests/
│   │   │   ├── route.ts              (GET list, POST create)
│   │   │   └── [id]/
│   │   │       ├── route.ts          (GET detail)
│   │   │       ├── status/route.ts   (PATCH)
│   │   │       └── feedbacks/route.ts (GET list, POST create)
│   │   ├── feedbacks/
│   │   │   └── [id]/
│   │   │       ├── helpful/route.ts  (POST, DELETE)
│   │   │       └── comments/
│   │   │           ├── route.ts      (GET, POST)
│   │   │           └── [commentId]/route.ts (DELETE)
│   │   ├── jobs/
│   │   │   ├── route.ts              (GET list)
│   │   │   ├── recommended/route.ts  (GET)
│   │   │   ├── bookmarked/route.ts   (GET)
│   │   │   └── [id]/
│   │   │       ├── route.ts          (GET detail)
│   │   │       └── bookmark/route.ts (POST, DELETE)
│   │   ├── applications/
│   │   │   ├── route.ts              (GET list, POST create)
│   │   │   └── [id]/
│   │   │       ├── route.ts          (GET detail)
│   │   │       └── status/route.ts   (PATCH)
│   │   └── notifications/
│   │       ├── route.ts              (GET list)
│   │       ├── unread-count/route.ts (GET)
│   │       ├── read-all/route.ts     (PATCH)
│   │       └── [id]/read/route.ts    (PATCH)
│   └── layout.tsx
├── lib/
│   ├── prisma.ts                     (Prisma client singleton)
│   ├── auth.ts                       (JWT sign/verify utilities)
│   ├── errors.ts                     (AppError class, error codes)
│   ├── response.ts                   (Standardized JSON response helpers)
│   └── validations/
│       ├── auth.ts                   (Zod schemas for register/login)
│       ├── profile.ts
│       ├── project.ts
│       ├── feedback.ts
│       ├── job.ts
│       └── application.ts
├── middleware.ts                     (Next.js middleware — JWT guard)
├── prisma/
│   └── schema.prisma
└── src/                              ← Existing React/Vite frontend
    ├── components/
    ├── pages/
    └── ...
```

### Shared Library Interfaces

**`lib/prisma.ts`** — Singleton Prisma client (prevents connection pool exhaustion in serverless):
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['query', 'error', 'warn'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**`lib/auth.ts`** — JWT utilities:
```typescript
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  role: 'mentee' | 'buddy' | 'company' | 'admin'
  iat?: number
  exp?: number
}

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string
export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string
export function verifyAccessToken(token: string): JWTPayload
export function verifyRefreshToken(token: string): JWTPayload
```

**`lib/response.ts`** — Standardized response helpers:
```typescript
export function successResponse<T>(data: T, status = 200): NextResponse
export function errorResponse(message: string, status: number, code?: string): NextResponse
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): NextResponse
```

**`lib/errors.ts`** — Application error class:
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) { super(message) }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  MEDIA_SERVICE_UNAVAILABLE: 'MEDIA_SERVICE_UNAVAILABLE',
} as const
```

### Frontend Component Architecture

```
src/components/
├── layout/
│   └── RootLayout.jsx          (existing — Navbar, Outlet)
├── ui/                         (existing shadcn/ui primitives)
│   └── ...
├── auth/
│   ├── LoginForm.jsx
│   └── SignUpForm.jsx
├── profile/
│   ├── ProfileCard.jsx         (avatar, name, major, completion bar)
│   ├── ProfileEditForm.jsx     (full edit form with validation)
│   ├── CompletionBar.jsx       (progress bar + next step hint)
│   └── SocialLinksInput.jsx    (URL validation per field)
├── project/
│   ├── ProjectCard.jsx         (thumbnail, title, status badge, stats)
│   ├── ProjectGrid.jsx         (responsive grid of ProjectCards)
│   ├── ProjectForm.jsx         (create/edit form with tag input)
│   ├── MediaUploader.jsx       (drag-drop zone, preview, delete)
│   ├── MediaPreview.jsx        (image grid with remove buttons)
│   └── StatusBadge.jsx         (Draft/Public/Pending_Feedback chip)
├── feedback/
│   ├── FeedbackRequestCard.jsx (project name, buddy, status, date)
│   ├── FeedbackStatusTag.jsx   (colored tag: Pending/In_Review/Completed)
│   ├── FeedbackDetail.jsx      (rating stars, comment, suggestions)
│   ├── FeedbackCommentThread.jsx
│   ├── HelpfulButton.jsx       (vote button with disabled state)
│   └── StarRating.jsx          (1-5 star display)
├── job/
│   ├── JobCard.jsx             (title, company logo, type badge, salary)
│   ├── JobFilters.jsx          (type filter tabs + search inputs)
│   ├── ApplicationDialog.jsx   (portfolio selector + confirm)
│   └── BookmarkButton.jsx      (toggle bookmark state)
├── notification/
│   ├── NotificationBell.jsx    (icon + unread count badge)
│   └── NotificationList.jsx    (dropdown list of notifications)
└── dashboard/
    ├── StatsRow.jsx            (views, likes, applications counters)
    ├── RecentActivity.jsx      (max 10 activity items)
    └── RecommendedJobs.jsx     (max 3 job cards)
```

**Key component contracts:**

```typescript
// ProjectCard props
interface ProjectCardProps {
  id: string
  title: string
  thumbnailUrl?: string
  status: 'draft' | 'public' | 'pending_feedback'
  viewCount: number
  likeCount: number
  tags: string[]
  onClick?: () => void
}

// FeedbackStatusTag props
interface FeedbackStatusTagProps {
  status: 'pending' | 'in_review' | 'completed'
}

// MediaUploader props
interface MediaUploaderProps {
  projectId?: string
  maxFiles?: number          // default: 10
  maxSizeMB?: number         // default: 10
  acceptedTypes?: string[]   // default: ['image/png','image/jpg','image/jpeg','image/webp','image/gif']
  onUploadComplete: (urls: string[]) => void
  onError: (message: string) => void
}
```

---

## Data Models

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  mentee
  buddy
  company
  admin
}

enum Major {
  Graphic_Design
  UI_UX
  Multimedia
  Motion_Design
}

enum ProjectStatus {
  draft
  public
  pending_feedback
}

enum MediaType {
  image
  video
}

enum FeedbackRequestStatus {
  pending
  in_review
  completed
}

enum JobType {
  internship
  fresher
  freelance
  part_time
  full_time
}

enum ApplicationStatus {
  submitted
  under_review
  accepted
  rejected
}

// ─── Models ───────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  role         UserRole
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  profile              Profile?
  jobsPosted           Job[]
  feedbackComments     FeedbackComment[]
  feedbackHelpfulVotes FeedbackHelpfulVote[]
  notifications        Notification[]

  @@map("users")
}

model Profile {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @unique @map("user_id") @db.Uuid
  fullName      String   @map("full_name") @db.VarChar(255)
  roleTitle     String?  @map("role_title") @db.VarChar(255)
  bio           String?  @db.Text
  avatarUrl     String?  @map("avatar_url") @db.VarChar(500)
  major         Major?
  skills        String[]
  designTools   String[] @map("design_tools")
  interests     String[]
  socialLinks   Json     @default("{}") @map("social_links")
  completionPct Int      @default(0) @map("completion_pct") @db.SmallInt
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user                  User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects              Project[]
  feedbackRequestsSent  FeedbackRequest[]  @relation("MenteeFeedbackRequests")
  feedbackRequestsBuddy FeedbackRequest[]  @relation("BuddyFeedbackRequests")
  feedbacksGiven        Feedback[]
  applications          Application[]
  jobBookmarks          JobBookmark[]

  @@map("profiles")
}

model Project {
  id          String        @id @default(uuid()) @db.Uuid
  menteeId    String        @map("mentee_id") @db.Uuid
  title       String        @db.VarChar(255)
  description String?       @db.Text
  tags        String[]
  status      ProjectStatus @default(draft)
  viewCount   Int           @default(0) @map("view_count")
  likeCount   Int           @default(0) @map("like_count")
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  mentee           Profile           @relation(fields: [menteeId], references: [id], onDelete: Cascade)
  media            ProjectMedia[]
  feedbackRequests FeedbackRequest[]

  @@map("projects")
}

model ProjectMedia {
  id         String    @id @default(uuid()) @db.Uuid
  projectId  String    @map("project_id") @db.Uuid
  url        String    @db.VarChar(500)
  mediaType  MediaType @map("media_type")
  fileName   String?   @map("file_name") @db.VarChar(255)
  fileSize   Int?      @map("file_size")
  sortOrder  Int       @default(0) @map("sort_order") @db.SmallInt
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_media")
}

model FeedbackRequest {
  id        String                @id @default(uuid()) @db.Uuid
  projectId String                @map("project_id") @db.Uuid
  menteeId  String                @map("mentee_id") @db.Uuid
  buddyId   String?               @map("buddy_id") @db.Uuid
  note      String?               @db.Text
  status    FeedbackRequestStatus @default(pending)
  createdAt DateTime              @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime              @updatedAt @map("updated_at") @db.Timestamptz

  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  mentee    Profile    @relation("MenteeFeedbackRequests", fields: [menteeId], references: [id])
  buddy     Profile?   @relation("BuddyFeedbackRequests", fields: [buddyId], references: [id])
  feedbacks Feedback[]

  @@map("feedback_requests")
}

model Feedback {
  id                String   @id @default(uuid()) @db.Uuid
  feedbackRequestId String   @map("feedback_request_id") @db.Uuid
  buddyId           String   @map("buddy_id") @db.Uuid
  rating            Int      @db.SmallInt
  comment           String   @db.Text
  suggestions       String[]
  helpfulCount      Int      @default(0) @map("helpful_count")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  feedbackRequest FeedbackRequest       @relation(fields: [feedbackRequestId], references: [id], onDelete: Cascade)
  buddy           Profile               @relation(fields: [buddyId], references: [id])
  comments        FeedbackComment[]
  helpfulVotes    FeedbackHelpfulVote[]

  @@map("feedbacks")
}

model FeedbackComment {
  id         String   @id @default(uuid()) @db.Uuid
  feedbackId String   @map("feedback_id") @db.Uuid
  authorId   String   @map("author_id") @db.Uuid
  content    String   @db.Text
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  feedback Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id])

  @@map("feedback_comments")
}

model FeedbackHelpfulVote {
  feedbackId String   @map("feedback_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  feedback Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([feedbackId, userId])
  @@map("feedback_helpful_votes")
}

model Job {
  id              String   @id @default(uuid()) @db.Uuid
  companyId       String   @map("company_id") @db.Uuid
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  responsibilities String[]
  requirements    String[]
  requiredSkills  String[] @map("required_skills")
  jobType         JobType  @map("job_type")
  location        String?  @db.VarChar(255)
  isRemote        Boolean  @default(false) @map("is_remote")
  salaryMin       Int?     @map("salary_min")
  salaryMax       Int?     @map("salary_max")
  salaryCurrency  String   @default("USD") @map("salary_currency") @db.VarChar(10)
  experienceLevel String   @default("entry") @map("experience_level") @db.VarChar(20)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  company      User          @relation(fields: [companyId], references: [id])
  applications Application[]
  bookmarks    JobBookmark[]

  @@map("jobs")
}

model Application {
  id           String            @id @default(uuid()) @db.Uuid
  jobId        String            @map("job_id") @db.Uuid
  menteeId     String            @map("mentee_id") @db.Uuid
  portfolioIds String[]          @map("portfolio_ids") @db.Uuid
  status       ApplicationStatus @default(submitted)
  createdAt    DateTime          @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime          @updatedAt @map("updated_at") @db.Timestamptz

  job    Job     @relation(fields: [jobId], references: [id], onDelete: Cascade)
  mentee Profile @relation(fields: [menteeId], references: [id])

  @@unique([jobId, menteeId])
  @@map("applications")
}

model JobBookmark {
  jobId     String   @map("job_id") @db.Uuid
  menteeId  String   @map("mentee_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  job    Job     @relation(fields: [jobId], references: [id], onDelete: Cascade)
  mentee Profile @relation(fields: [menteeId], references: [id], onDelete: Cascade)

  @@id([jobId, menteeId])
  @@map("job_bookmarks")
}

model Notification {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  type       String   @db.VarChar(50)
  title      String   @db.VarChar(255)
  body       String?  @db.Text
  entityType String?  @map("entity_type") @db.VarChar(50)
  entityId   String?  @map("entity_id") @db.Uuid
  isRead     Boolean  @default(false) @map("is_read")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

### Profile Completion Calculation

Completion percentage is computed server-side whenever a profile is updated:

```typescript
function calculateCompletionPct(profile: Partial<Profile>): number {
  const fields = [
    profile.fullName,
    profile.roleTitle,
    profile.bio,
    profile.avatarUrl,
    profile.major,
    profile.skills?.length,
    profile.designTools?.length,
    profile.interests?.length,
    (profile.socialLinks as Record<string, string>)?.behance ||
    (profile.socialLinks as Record<string, string>)?.linkedin,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}
```

### Zod Validation Schemas

**`lib/validations/auth.ts`**:
```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['mentee', 'buddy', 'company']),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
```

**`lib/validations/profile.ts`**:
```typescript
export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  roleTitle: z.string().max(255).optional(),
  bio: z.string().max(2000).optional(),
  major: z.enum(['Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design']).optional(),
  skills: z.array(z.string()).optional(),
  designTools: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.object({
    behance:   z.string().url().startsWith('https://').optional().or(z.literal('')),
    linkedin:  z.string().url().startsWith('https://').optional().or(z.literal('')),
    instagram: z.string().url().startsWith('https://').optional().or(z.literal('')),
    github:    z.string().url().startsWith('https://').optional().or(z.literal('')),
  }).optional(),
})
```

**`lib/validations/project.ts`**:
```typescript
export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  tags: z.string().optional(),   // comma-separated, parsed server-side
  status: z.enum(['draft', 'public', 'pending_feedback']).default('draft'),
})

// Tags parsing utility
export function parseTags(raw?: string): string[] {
  if (!raw) return []
  return raw.split(',').map(t => t.trim()).filter(Boolean)
}
```

---

## Authentication API — Detailed Implementation

### `POST /api/auth/register`

**Request body:**
```json
{ "email": "user@example.com", "password": "securepass123", "role": "mentee" }
```

**Implementation (`app/api/auth/register/route.ts`):**
```typescript
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate input
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR')
    }
    const { email, password, role } = parsed.data

    // 2. Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return errorResponse('Email already registered', 409, 'CONFLICT')
    }

    // 3. Hash password (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12)

    // 4. Create user + default profile in a transaction
    const { user, profile } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, role: role as any },
      })
      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          fullName: email.split('@')[0],  // placeholder until profile setup
          completionPct: 0,
        },
      })
      return { user, profile }
    })

    // 5. Issue tokens
    const payload = { userId: user.id, role: user.role }
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return successResponse({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      profileId: profile.id,
    }, 201)

  } catch (err) {
    console.error('[register]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "email": "user@example.com", "role": "mentee" },
    "profileId": "uuid"
  }
}
```

**Error responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Invalid email, password < 8 chars, invalid role |
| 409 | CONFLICT | Email already registered |
| 500 | INTERNAL_ERROR | Database or unexpected error |

### `POST /api/auth/login`

**Request body:**
```json
{ "email": "user@example.com", "password": "securepass123" }
```

**Implementation (`app/api/auth/login/route.ts`):**
```typescript
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate input
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR')
    }
    const { email, password } = parsed.data

    // 2. Find user — use generic error to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return errorResponse('Invalid email or password', 401, 'UNAUTHORIZED')
    }

    // 3. Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401, 'UNAUTHORIZED')
    }

    // 4. Fetch profile id for frontend routing
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, completionPct: true },
    })

    // 5. Issue tokens
    const payload = { userId: user.id, role: user.role }
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return successResponse({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    })

  } catch (err) {
    console.error('[login]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "email": "user@example.com", "role": "mentee" },
    "profile": { "id": "uuid", "completionPct": 0 }
  }
}
```

**Error responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Malformed email or empty password |
| 401 | UNAUTHORIZED | Email not found or wrong password |
| 500 | INTERNAL_ERROR | Database or unexpected error |

### `lib/auth.ts` — Full Implementation

```typescript
import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_EXPIRY  = '15m'
const REFRESH_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  role: 'mentee' | 'buddy' | 'company' | 'admin'
  iat?: number
  exp?: number
}

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
}

export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload
}
```

### `middleware.ts` — Route Protection

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/jobs',
  '/api/projects/public',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  // Only protect /api/** routes
  if (!pathname.startsWith('/api/')) return NextResponse.next()

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  try {
    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)

    // Forward user context to route handlers via headers
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
```

### `POST /api/auth/refresh`

```typescript
export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()
    if (!refreshToken) return errorResponse('Refresh token required', 400, 'VALIDATION_ERROR')

    const payload = verifyRefreshToken(refreshToken)
    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role })

    return successResponse({ accessToken: newAccessToken })
  } catch {
    return errorResponse('Invalid or expired refresh token', 401, 'UNAUTHORIZED')
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates a linked default profile

*For any* valid registration input (email, password, role), after a successful registration call, a profile record SHALL exist in the database linked to the new user's ID with `completionPct = 0`.

**Validates: Requirements 1.1**

---

### Property 2: Profile completion percentage reflects filled fields

*For any* profile state with a random subset of optional fields filled, the stored `completionPct` SHALL equal `Math.round((filledFieldCount / totalFieldCount) * 100)`, and SHALL be updated every time the profile is modified.

**Validates: Requirements 1.5, 2.6**

---

### Property 3: Profile update round-trip preserves data

*For any* valid profile update payload (random fullName, bio, skills, designTools, interests, socialLinks), after `PUT /profiles/me`, a subsequent `GET /profiles/me` SHALL return data that exactly matches the submitted values.

**Validates: Requirements 2.3**

---

### Property 4: Social link URL validation rejects non-HTTPS strings

*For any* string that does not begin with `https://`, submitting it as a social link value SHALL be rejected with a 400 validation error and no profile data SHALL be saved. Conversely, *for any* well-formed `https://` URL, it SHALL be accepted.

**Validates: Requirements 2.4**

---

### Property 5: Media upload validation enforces type and size constraints

*For any* file upload to avatar or project media endpoints, files with MIME types outside the allowed set (PNG, JPG, JPEG, WEBP for avatar; + GIF for project media) or exceeding the size limit (5 MB avatar, 10 MB project media) SHALL be rejected with a 400 error. Files within constraints SHALL be accepted and return a public URL.

**Validates: Requirements 3.1, 3.2, 4.2**

---

### Property 6: New project is saved with status `draft`

*For any* valid project creation payload (non-empty title, optional description and tags), after `POST /projects`, the created project SHALL have `status = 'draft'` regardless of any status value in the request body.

**Validates: Requirements 4.4**

---

### Property 7: Tag string parsing produces trimmed array

*For any* comma-separated tag string submitted during project creation or update, the saved `tags` array SHALL contain exactly the non-empty, whitespace-trimmed individual tokens from that string, with no duplicates introduced by the parsing step.

**Validates: Requirements 4.6**

---

### Property 8: Draft projects are invisible to non-owners

*For any* project with `status = 'draft'`, a request to view that project by any user other than the owning mentee SHALL receive a 403 or 404 response. The owning mentee SHALL always receive a 200 response for their own draft projects.

**Validates: Requirements 5.5**

---

### Property 9: Public projects appear in public listings

*For any* project whose status is set to `public` via `PATCH /projects/:id/status`, that project SHALL subsequently appear in the response of `GET /projects/public/:menteeId` for that mentee.

**Validates: Requirements 5.6, 6.2**

---

### Property 10: Feedback request creation sets status to `pending`

*For any* valid feedback request payload (valid project_id owned by the requesting mentee, optional note), after `POST /feedback-requests`, the created record SHALL have `status = 'pending'` and reference the correct `project_id` and `mentee_id`.

**Validates: Requirements 8.2**

---

### Property 11: Duplicate active feedback requests are rejected

*For any* project that already has a feedback request with status `pending` or `in_review`, a second `POST /feedback-requests` for the same project by the same mentee SHALL be rejected with a 409 error and no new record SHALL be created.

**Validates: Requirements 8.3**

---

### Property 12: Feedback average rating is mathematically correct

*For any* set of feedback records for a project, the `avgRating` returned by `GET /projects/:id/feedback-summary` SHALL equal `round(sum(ratings) / count(ratings), 1)` with one decimal place of precision.

**Validates: Requirements 10.2**

---

### Property 13: Helpful vote is idempotent per user

*For any* feedback and any user, calling `POST /feedbacks/:id/helpful` more than once from the same user SHALL NOT increase `helpfulCount` beyond 1 for that user. The total `helpfulCount` SHALL equal the number of distinct users who have voted.

**Validates: Requirements 10.4**

---

### Property 14: Job keyword search returns only matching results

*For any* keyword search query against the jobs endpoint, every job in the response SHALL contain the keyword (case-insensitive) in either its `title` or the associated company name. No job lacking the keyword in both fields SHALL appear in the results.

**Validates: Requirements 11.3**

---

### Property 15: Duplicate job applications are rejected

*For any* (job_id, mentee_id) pair where an application already exists, a second `POST /applications` with the same pair SHALL be rejected with a 409 error and the database SHALL contain exactly one application for that pair.

**Validates: Requirements 13.3**

---

### Property 16: Recent activity list is bounded at 10 items

*For any* mentee with more than 10 recorded activities, the dashboard activity endpoint SHALL return at most 10 items, and those items SHALL be the 10 most recent by timestamp.

**Validates: Requirements 15.2**

---

## Error Handling

### Error Response Format

All API errors follow a consistent JSON envelope:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

`details` is only present for validation errors (400).

### HTTP Status Code Conventions

| Status | When |
|--------|------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no body) |
| 400 | Validation error (Zod parse failure, business rule violation) |
| 401 | Missing, invalid, or expired JWT |
| 403 | Authenticated but not authorized (e.g., editing another user's project) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate application, duplicate feedback request) |
| 413 | File too large (media upload) |
| 415 | Unsupported media type (file upload) |
| 500 | Unexpected server error |
| 503 | External service unavailable (Media_Service down during project delete) |

### Error Handling Pattern in Route Handlers

```typescript
export async function POST(req: NextRequest) {
  try {
    // ... handler logic
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.message, err.statusCode, err.code)
    }
    // Prisma unique constraint violation
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return errorResponse('Resource already exists', 409, 'CONFLICT')
      }
    }
    console.error('[route]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
```

### Media Service Unavailability

Per Requirement 6.6, if the media service is unavailable during project deletion, the operation is blocked:

```typescript
async function deleteProjectWithMedia(projectId: string) {
  const media = await prisma.projectMedia.findMany({ where: { projectId } })

  // Attempt media deletion first — block if service is down
  for (const file of media) {
    try {
      await mediaService.delete(file.url)
    } catch (err) {
      throw new AppError(
        'Media service unavailable. Project deletion blocked until media can be cleaned up.',
        503,
        'MEDIA_SERVICE_UNAVAILABLE'
      )
    }
  }

  // Only delete DB record after all media is cleaned up
  await prisma.project.delete({ where: { id: projectId } })
}
```

### Notification Delivery

Notifications are created synchronously within the same request transaction to guarantee delivery within 60 seconds (Requirements 8.5, 9.2, 13.5, 14.3):

```typescript
// After creating a feedback request
await prisma.notification.create({
  data: {
    userId: buddyUserId,
    type: 'feedback_request_received',
    title: 'New feedback request',
    body: `${menteeName} has requested feedback on "${projectTitle}"`,
    entityType: 'feedback_request',
    entityId: feedbackRequest.id,
  },
})
```

For async delivery (e.g., email), a background job queue (Vercel Cron or a queue service) can be added later without changing the API contract.

---

## Testing Strategy

### Overview

The testing strategy uses a dual approach:
- **Unit / example-based tests** for specific behaviors, edge cases, and error conditions
- **Property-based tests** for universal correctness properties across randomized inputs

Property-based testing library: **[fast-check](https://fast-check.dev/)** (TypeScript-native, works with Vitest/Jest).

Test runner: **Vitest** (already compatible with the Vite-based project).

### Unit Tests

Focus areas:
- `calculateCompletionPct()` — specific examples with known field counts
- `parseTags()` — specific comma-separated strings including edge cases (empty string, extra spaces, trailing comma)
- Auth utilities — `signAccessToken` / `verifyAccessToken` round-trip with known payloads
- Zod validation schemas — valid and invalid inputs for each schema
- Route handlers — mocked Prisma, test 400/401/403/404/409 responses with concrete inputs
- Middleware — valid token passes through, missing/expired token returns 401

### Property-Based Tests

Each property test runs a minimum of **100 iterations** via fast-check's `fc.assert`.

```typescript
// Example: Property 7 — Tag string parsing
// Feature: mentee-subsystem, Property 7: Tag string parsing produces trimmed array
import * as fc from 'fast-check'
import { parseTags } from '@/lib/validations/project'

test('parseTags: comma-separated string round-trips to trimmed array', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1 }).filter(s => !s.includes(','))),
      (tags) => {
        const raw = tags.join(', ')
        const result = parseTags(raw)
        const expected = tags.map(t => t.trim()).filter(Boolean)
        expect(result).toEqual(expected)
      }
    ),
    { numRuns: 100 }
  )
})
```

```typescript
// Example: Property 2 — Profile completion percentage
// Feature: mentee-subsystem, Property 2: Profile completion percentage reflects filled fields
test('calculateCompletionPct: percentage matches filled field ratio', () => {
  fc.assert(
    fc.property(
      fc.record({
        fullName:    fc.option(fc.string({ minLength: 1 })),
        roleTitle:   fc.option(fc.string({ minLength: 1 })),
        bio:         fc.option(fc.string({ minLength: 1 })),
        avatarUrl:   fc.option(fc.webUrl()),
        major:       fc.option(fc.constantFrom('Graphic_Design', 'UI_UX', 'Multimedia', 'Motion_Design')),
        skills:      fc.option(fc.array(fc.string(), { minLength: 1 })),
        designTools: fc.option(fc.array(fc.string(), { minLength: 1 })),
        interests:   fc.option(fc.array(fc.string(), { minLength: 1 })),
        socialLinks: fc.option(fc.record({ behance: fc.webUrl() })),
      }),
      (profile) => {
        const pct = calculateCompletionPct(profile)
        expect(pct).toBeGreaterThanOrEqual(0)
        expect(pct).toBeLessThanOrEqual(100)
        expect(Number.isInteger(pct)).toBe(true)
      }
    ),
    { numRuns: 100 }
  )
})
```

```typescript
// Example: Property 13 — Helpful vote idempotence (integration, with test DB)
// Feature: mentee-subsystem, Property 13: Helpful vote is idempotent per user
test('helpful vote: voting twice does not double-count', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 10 }),  // number of vote attempts
      async (attempts) => {
        const { feedbackId, userId } = await setupTestFeedback()
        for (let i = 0; i < attempts; i++) {
          await voteHelpful(feedbackId, userId).catch(() => {})
        }
        const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } })
        expect(feedback!.helpfulCount).toBe(1)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Property Test Tag Format

Each property test file includes a comment header:
```typescript
// Feature: mentee-subsystem, Property N: <property_text>
```

### Integration Tests

For behaviors involving external services or full request/response cycles:

- `POST /api/auth/register` — end-to-end with test database: verify user + profile created
- `POST /api/auth/login` — correct credentials return tokens; wrong credentials return 401
- `PATCH /api/projects/:id/status` — status transitions update DB and affect public listing
- `POST /api/feedback-requests` — duplicate prevention with active request
- `POST /api/applications` — duplicate prevention with `@@unique([jobId, menteeId])`
- Media upload — file type/size validation with real multipart requests

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

```typescript
// tests/setup.ts — test database setup
import { prisma } from '@/lib/prisma'

beforeEach(async () => {
  // Clean test data between tests
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.application.deleteMany(),
    prisma.jobBookmark.deleteMany(),
    prisma.feedbackHelpfulVote.deleteMany(),
    prisma.feedbackComment.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.feedbackRequest.deleteMany(),
    prisma.projectMedia.deleteMany(),
    prisma.project.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### Environment Variables Required

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<random 64-char string>
BLOB_READ_WRITE_TOKEN=<Vercel Blob token>   # or CLOUDINARY_URL
```
