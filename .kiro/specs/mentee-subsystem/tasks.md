# Implementation Plan: Mentee Subsystem

## Overview

Triển khai toàn bộ Mentee Subsystem cho PortfolioTutTat theo kiến trúc monorepo fullstack: Next.js App Router API Routes (backend) + React/Vite (frontend đã có sẵn). Các task được chia theo 6 nhóm chức năng: Infrastructure, Profile, Portfolio/Projects, Buddy Feedback, Job Application, và Dashboard.

Stack: TypeScript, Next.js App Router, Prisma ORM, PostgreSQL, JWT + bcrypt, Vercel Blob/Cloudinary, Vitest + fast-check.

---

## Tasks

- [x] 1. Thiết lập Infrastructure và Shared Utilities
  - [x] 1.1 Khởi tạo Next.js App Router và cấu hình monorepo
    - Tạo cấu trúc thư mục `app/api/`, `lib/`, `prisma/` tại root của project
    - Cài đặt dependencies: `next`, `typescript`, `@types/node`, `@types/react`, `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`, `zod`
    - Tạo `tsconfig.json` với path alias `@/` trỏ tới root
    - Tạo `next.config.js` với cấu hình cho monorepo (src dir là `src/` cho Vite frontend)
    - _Requirements: tất cả_

  - [x] 1.2 Tạo Prisma schema và migrate database
    - Tạo `prisma/schema.prisma` với đầy đủ models: User, Profile, Project, ProjectMedia, FeedbackRequest, Feedback, FeedbackComment, FeedbackHelpfulVote, Job, Application, JobBookmark, Notification
    - Định nghĩa tất cả enums: UserRole, Major, ProjectStatus, MediaType, FeedbackRequestStatus, JobType, ApplicationStatus
    - Chạy `prisma migrate dev --name init` để tạo migration đầu tiên
    - Tạo `lib/prisma.ts` với singleton Prisma client pattern
    - _Requirements: 1.1, 4.1, 8.4, 11.2, 14.2_

  - [x] 1.3 Tạo shared utilities: auth, response, errors
    - Tạo `lib/auth.ts` với `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` sử dụng `jsonwebtoken`
    - Tạo `lib/response.ts` với `successResponse`, `errorResponse`, `paginatedResponse`
    - Tạo `lib/errors.ts` với `AppError` class và `ErrorCodes` constants
    - _Requirements: tất cả API endpoints_

  - [x] 1.4 Tạo Zod validation schemas
    - Tạo `lib/validations/auth.ts`: `registerSchema`, `loginSchema`
    - Tạo `lib/validations/profile.ts`: `updateProfileSchema` với social link URL validation (`https://`)
    - Tạo `lib/validations/project.ts`: `createProjectSchema`, `updateProjectSchema`, `parseTags()` utility
    - Tạo `lib/validations/feedback.ts`: `createFeedbackRequestSchema`, `createFeedbackSchema`, `createCommentSchema`
    - Tạo `lib/validations/job.ts`: `jobFilterSchema`
    - Tạo `lib/validations/application.ts`: `createApplicationSchema`
    - _Requirements: 1.4, 1.5, 2.4, 4.5, 4.6, 8.1_

  - [x] 1.5 Tạo Next.js middleware bảo vệ routes
    - Tạo `middleware.ts` tại root với JWT verification cho tất cả `/api/**` routes
    - Định nghĩa `PUBLIC_ROUTES`: `/api/auth/register`, `/api/auth/login`, `/api/jobs`, `/api/projects/public`
    - Forward `x-user-id` và `x-user-role` headers tới route handlers
    - Trả về 401 cho missing/invalid/expired token
    - _Requirements: tất cả protected endpoints_

  - [x] 1.6 Thiết lập Vitest và test infrastructure
    - Cài đặt `vitest`, `fast-check`, `@vitest/coverage-v8`
    - Tạo `vitest.config.ts` với environment `node` và globals
    - Tạo `tests/setup.ts` với `beforeEach` cleanup transaction cho tất cả tables
    - Tạo `.env.test` với test database URL
    - _Requirements: Testing strategy_


- [x] 2. Authentication API
  - [x] 2.1 Implement POST /api/auth/register
    - Tạo `app/api/auth/register/route.ts`
    - Validate input với `registerSchema`, kiểm tra email uniqueness
    - Hash password với bcrypt (cost factor 12)
    - Tạo User + Profile mặc định trong Prisma transaction (`completionPct = 0`)
    - Trả về `accessToken`, `refreshToken`, user info, profileId (201)
    - _Requirements: 1.1_

  - [x] 2.2 Write property test cho Registration creates linked default profile
    - **Property 1: Registration creates a linked default profile**
    - **Validates: Requirements 1.1**
    - Dùng `fc.record` với email/password/role hợp lệ, assert profile tồn tại với `completionPct = 0` sau khi register

  - [x] 2.3 Implement POST /api/auth/login
    - Tạo `app/api/auth/login/route.ts`
    - Validate input, tìm user, so sánh password với bcrypt
    - Dùng generic error message để tránh email enumeration
    - Trả về tokens + profile info (completionPct)
    - _Requirements: 1.3_

  - [x] 2.4 Implement POST /api/auth/logout và POST /api/auth/refresh
    - Tạo `app/api/auth/logout/route.ts` (invalidate token logic)
    - Tạo `app/api/auth/refresh/route.ts` với `verifyRefreshToken` → issue new access token
    - _Requirements: Auth flow_

- [x] 3. Profile Management API
  - [x] 3.1 Implement GET và PUT /api/profiles/me
    - Tạo `app/api/profiles/me/route.ts`
    - GET: lấy profile của user đang đăng nhập từ `x-user-id` header
    - PUT: validate với `updateProfileSchema`, cập nhật profile, tính lại `completionPct` với `calculateCompletionPct()`
    - Implement `calculateCompletionPct()` trong `lib/profile.ts` (9 fields: fullName, roleTitle, bio, avatarUrl, major, skills, designTools, interests, socialLinks)
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 1.5_

  - [x] 3.2 Write property test cho Profile completion percentage
    - **Property 2: Profile completion percentage reflects filled fields**
    - **Validates: Requirements 1.5, 2.6**
    - Dùng `fc.record` với optional fields, assert `completionPct = Math.round(filledCount/9 * 100)`

  - [x] 3.3 Write property test cho Profile update round-trip
    - **Property 3: Profile update round-trip preserves data**
    - **Validates: Requirements 2.3**
    - Submit random valid profile payload, GET lại và assert data khớp chính xác

  - [x] 3.4 Write property test cho Social link URL validation
    - **Property 4: Social link URL validation rejects non-HTTPS strings**
    - **Validates: Requirements 2.4**
    - Dùng `fc.string()` không bắt đầu bằng `https://`, assert 400 response; dùng `fc.webUrl()` với `https`, assert accepted

  - [x] 3.5 Implement POST /api/profiles/me/avatar
    - Tạo `app/api/profiles/me/avatar/route.ts`
    - Parse multipart/form-data, validate MIME type (PNG/JPG/JPEG/WEBP) và size (≤ 5MB)
    - Upload lên Vercel Blob hoặc Cloudinary, cập nhật `avatarUrl` trong profile
    - Trả về 400 với mô tả lỗi rõ ràng nếu file không hợp lệ
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.6 Write property test cho Media upload validation
    - **Property 5: Media upload validation enforces type and size constraints (avatar)**
    - **Validates: Requirements 3.1, 3.2**
    - Test files ngoài allowed MIME types hoặc > 5MB bị reject với 400

  - [x] 3.7 Implement GET /api/profiles/:id và GET /api/profiles/me/stats
    - Tạo `app/api/profiles/[id]/route.ts` cho public profile view
    - Tạo `app/api/profiles/me/stats/route.ts`: aggregate tổng view_count, like_count từ projects, count applications
    - _Requirements: 2.1, 15.1_


- [x] 4. Portfolio / Project Management API
  - [x] 4.1 Implement GET list và POST /api/projects
    - Tạo `app/api/projects/route.ts`
    - GET: trả về tất cả projects của mentee đang đăng nhập (từ `x-user-id`)
    - POST: validate với `createProjectSchema`, parse tags với `parseTags()`, tạo project với `status = 'draft'`
    - _Requirements: 4.1, 4.4, 4.6, 7.1_

  - [x] 4.2 Write property test cho New project saved with status draft
    - **Property 6: New project is saved with status `draft`**
    - **Validates: Requirements 4.4**
    - Dùng `fc.record` với title hợp lệ, assert `status === 'draft'` bất kể request body có status hay không

  - [x] 4.3 Write property test cho Tag string parsing
    - **Property 7: Tag string parsing produces trimmed array**
    - **Validates: Requirements 4.6**
    - Dùng `fc.array(fc.string())`, join bằng dấu phẩy, assert `parseTags()` trả về trimmed non-empty tokens

  - [x] 4.4 Implement GET, PUT, DELETE /api/projects/:id
    - Tạo `app/api/projects/[id]/route.ts`
    - GET: kiểm tra ownership cho draft projects (403/404 nếu không phải owner)
    - PUT: validate, cập nhật title/description/tags
    - DELETE: kiểm tra active FeedbackRequests (In_Review), hiển thị cảnh báo; xóa media trên storage trước, block nếu Media_Service unavailable (503), sau đó xóa DB record
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 6.6_

  - [x] 4.5 Write property test cho Draft projects invisible to non-owners
    - **Property 8: Draft projects are invisible to non-owners**
    - **Validates: Requirements 5.5**
    - Tạo draft project với user A, request GET với user B, assert 403 hoặc 404; owner luôn nhận 200

  - [x] 4.6 Implement PATCH /api/projects/:id/status
    - Tạo `app/api/projects/[id]/status/route.ts`
    - Validate status transition (draft → public, draft → pending_feedback, etc.)
    - Khi chuyển sang public: project xuất hiện trong public listing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.7 Write property test cho Public projects appear in public listings
    - **Property 9: Public projects appear in public listings**
    - **Validates: Requirements 5.6, 6.2**
    - PATCH status sang `public`, assert project xuất hiện trong `GET /projects/public/:menteeId`

  - [x] 4.8 Implement Project Media upload và delete endpoints
    - Tạo `app/api/projects/[id]/media/route.ts` (POST upload)
    - Validate MIME type (PNG/JPG/JPEG/WEBP/GIF) và size (≤ 10MB per file)
    - Upload lên Vercel Blob/Cloudinary, lưu `ProjectMedia` record
    - Tạo `app/api/projects/[id]/media/[mediaId]/route.ts` (DELETE)
    - Tạo `app/api/projects/[id]/media/reorder/route.ts` (PATCH sort_order)
    - _Requirements: 4.2, 4.3, 5.4, 3.1, 3.2_

  - [x] 4.9 Write property test cho Media upload validation (project media)
    - **Property 5: Media upload validation enforces type and size constraints (project media)**
    - **Validates: Requirements 4.2**
    - Test files > 10MB hoặc MIME type không hợp lệ bị reject với 400/413/415

  - [x] 4.10 Implement GET /api/projects/public/:menteeId và GET /api/projects/:id/feedback-summary
    - Tạo `app/api/projects/public/[menteeId]/route.ts` (public, no auth)
    - Tạo `app/api/projects/[id]/feedback-summary/route.ts`: tính `avgRating` với 1 decimal, tổng `helpfulCount`
    - _Requirements: 5.6, 10.2, 10.3_

  - [x] 4.11 Write property test cho Feedback average rating calculation
    - **Property 12: Feedback average rating is mathematically correct**
    - **Validates: Requirements 10.2**
    - Dùng `fc.array(fc.integer({min:1, max:5}))`, assert `avgRating === round(sum/count, 1)`

- [x] 5. Checkpoint — Kiểm tra Infrastructure và Core APIs
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Buddy Feedback System API
  - [x] 6.1 Implement GET list và POST /api/feedback-requests
    - Tạo `app/api/feedback-requests/route.ts`
    - POST: validate project ownership, kiểm tra duplicate active request (Pending/In_Review) → 409 nếu tồn tại
    - Tạo FeedbackRequest với `status = 'pending'`, tự động chuyển project status sang `pending_feedback`
    - Tạo Notification cho Buddy trong cùng transaction
    - GET: trả về tất cả FeedbackRequests của mentee với project name, buddy name, date, status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.3, 9.1_

  - [x] 6.2 Write property test cho Feedback request creation sets status to pending
    - **Property 10: Feedback request creation sets status to `pending`**
    - **Validates: Requirements 8.2**
    - Dùng `fc.record` với valid project_id, assert `status === 'pending'` và correct `project_id`/`mentee_id`

  - [x] 6.3 Write property test cho Duplicate active feedback requests rejected
    - **Property 11: Duplicate active feedback requests are rejected**
    - **Validates: Requirements 8.3**
    - Tạo FeedbackRequest, thử tạo lần 2 cho cùng project, assert 409 và chỉ 1 record trong DB

  - [x] 6.4 Implement GET detail, PATCH status /api/feedback-requests/:id
    - Tạo `app/api/feedback-requests/[id]/route.ts` (GET detail)
    - Tạo `app/api/feedback-requests/[id]/status/route.ts` (PATCH: Pending → In_Review → Completed)
    - Khi status thay đổi: tạo Notification cho Mentee trong vòng 60 giây
    - Khi Completed: không tự động thay đổi project status
    - _Requirements: 8.4, 9.2, 9.3, 6.4_

  - [x] 6.5 Implement GET và POST /api/feedback-requests/:id/feedbacks
    - Tạo `app/api/feedback-requests/[id]/feedbacks/route.ts`
    - POST: Buddy tạo Feedback (rating 1-5, comment, suggestions[])
    - GET: trả về feedbacks chỉ khi FeedbackRequest status = Completed
    - _Requirements: 10.1_

  - [x] 6.6 Implement Helpful vote endpoints
    - Tạo `app/api/feedbacks/[id]/helpful/route.ts` (POST vote, DELETE unvote)
    - POST: upsert vào `FeedbackHelpfulVote`, tăng `helpfulCount` chỉ nếu chưa vote
    - Dùng `@@id([feedbackId, userId])` unique constraint để prevent duplicates
    - _Requirements: 10.4_

  - [x] 6.7 Write property test cho Helpful vote idempotence
    - **Property 13: Helpful vote is idempotent per user**
    - **Validates: Requirements 10.4**
    - Dùng `fc.integer({min:2, max:10})` cho số lần vote, assert `helpfulCount === 1` sau nhiều lần vote

  - [x] 6.8 Implement Feedback comments endpoints
    - Tạo `app/api/feedbacks/[id]/comments/route.ts` (GET list, POST create)
    - POST: validate content không rỗng, lưu FeedbackComment
    - Tạo `app/api/feedbacks/[id]/comments/[commentId]/route.ts` (DELETE)
    - _Requirements: 10.5, 10.6_


- [x] 7. Job Application System API
  - [x] 7.1 Implement GET /api/jobs với filtering và search
    - Tạo `app/api/jobs/route.ts`
    - Hỗ trợ query params: `type` (All/Internship/Fresher/Freelance/Part-time), `keyword` (search title + company name), `location`
    - Keyword search case-insensitive, trả về kết quả trong 500ms (dùng Prisma `contains` với `mode: 'insensitive'`)
    - Trả về tổng số jobs phù hợp (`total` field)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 7.2 Write property test cho Job keyword search returns only matching results
    - **Property 14: Job keyword search returns only matching results**
    - **Validates: Requirements 11.3**
    - Dùng `fc.string()` làm keyword, assert mọi job trong response đều chứa keyword trong title hoặc company name

  - [x] 7.3 Implement GET /api/jobs/recommended
    - Tạo `app/api/jobs/recommended/route.ts`
    - Lấy major của mentee từ profile, filter jobs có `required_skills` hoặc `job_type` phù hợp
    - Trả về tối đa 3 jobs; trả về empty array với message nếu không có job phù hợp
    - _Requirements: 11.6_

  - [x] 7.4 Implement GET /api/jobs/:id, POST và DELETE /api/jobs/:id/bookmark
    - Tạo `app/api/jobs/[id]/route.ts` (GET full job detail)
    - Tạo `app/api/jobs/[id]/bookmark/route.ts` (POST bookmark, DELETE unbookmark)
    - POST bookmark: upsert vào `JobBookmark`, trả về trạng thái mới
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 7.5 Implement GET /api/jobs/bookmarked
    - Tạo `app/api/jobs/bookmarked/route.ts`
    - Trả về danh sách jobs đã bookmark của mentee
    - _Requirements: 12.3_

  - [x] 7.6 Implement GET list và POST /api/applications
    - Tạo `app/api/applications/route.ts`
    - POST: validate mentee có ít nhất 1 Public project; kiểm tra duplicate (job_id + mentee_id unique) → 409
    - Tạo Application với `status = 'submitted'`, lưu `portfolioIds`
    - Tạo Notification xác nhận cho Mentee trong cùng transaction
    - GET: trả về tất cả applications với job name, company, date, portfolio, status
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1_

  - [x] 7.7 Write property test cho Duplicate job applications rejected
    - **Property 15: Duplicate job applications are rejected**
    - **Validates: Requirements 13.3**
    - Tạo application, thử tạo lần 2 cho cùng (job_id, mentee_id), assert 409 và chỉ 1 record trong DB

  - [x] 7.8 Implement GET detail và PATCH status /api/applications/:id
    - Tạo `app/api/applications/[id]/route.ts` (GET detail)
    - Tạo `app/api/applications/[id]/status/route.ts` (PATCH: Company cập nhật status)
    - Khi status thay đổi: tạo Notification cho Mentee (best-effort, không block response)
    - _Requirements: 14.2, 14.3_

- [x] 8. Notifications API
  - [x] 8.1 Implement Notifications endpoints
    - Tạo `app/api/notifications/route.ts` (GET list, max 50 items, sorted by createdAt desc)
    - Tạo `app/api/notifications/unread-count/route.ts` (GET count of `isRead = false`)
    - Tạo `app/api/notifications/read-all/route.ts` (PATCH mark all as read)
    - Tạo `app/api/notifications/[id]/read/route.ts` (PATCH mark single as read)
    - _Requirements: 9.2, 9.3, 13.5, 14.3_

- [x] 9. Checkpoint — Kiểm tra tất cả API endpoints
  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. Frontend API Client và Auth
  - [x] 10.1 Tạo API client với JWT interceptor
    - Tạo `src/lib/api.js` — fetch wrapper tự động đính kèm `Authorization: Bearer <token>` header
    - Implement token refresh logic: khi nhận 401, thử refresh token rồi retry request
    - Lưu `accessToken` và `refreshToken` trong `localStorage`
    - _Requirements: tất cả frontend API calls_

  - [x] 10.2 Cập nhật LoginPage và SignUpPage với real API calls
    - Cập nhật `src/pages/LoginPage.jsx`: gọi `POST /api/auth/login`, lưu tokens, redirect tới DashBoardPage
    - Cập nhật `src/pages/SignUpPage.jsx`: gọi `POST /api/auth/register`, redirect tới CreateProfilePage
    - Hiển thị validation errors từ API response tại trường tương ứng
    - _Requirements: 1.3, 1.4_

  - [x] 10.3 Tạo `useAuth` hook và protected route wrapper
    - Tạo `src/hooks/useAuth.js` với `user`, `login()`, `logout()`, `isAuthenticated`
    - Tạo `src/components/auth/ProtectedRoute.jsx` redirect về `/login` nếu chưa auth
    - Cập nhật `src/routes/AppRoutes.jsx` bọc các routes cần auth
    - _Requirements: tất cả protected pages_

- [x] 11. Frontend Profile Management
  - [x] 11.1 Cập nhật CreateProfilePage với API integration
    - Cập nhật `src/pages/CreateProfilePage.jsx`: gọi `PUT /api/profiles/me` khi submit
    - Validate client-side: Full Name và Role bắt buộc, hiển thị lỗi tại trường vi phạm
    - Redirect tới DashBoardPage sau khi lưu thành công
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 11.2 Tạo ProfileEditForm component và tích hợp vào DashBoardPage
    - Tạo `src/components/profile/ProfileEditForm.jsx`: form với Full Name, Bio, Major (single select), Skills, Design Tools, Interests, Social Links
    - Validate Social Links: phải bắt đầu bằng `https://`, hiển thị lỗi inline
    - Tạo `src/components/profile/SocialLinksInput.jsx` với per-field URL validation
    - Tạo `src/components/profile/CompletionBar.jsx`: progress bar + gợi ý bước tiếp theo
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 15.3_

  - [x] 11.3 Implement Avatar upload trong Profile
    - Tạo `src/components/profile/AvatarUploader.jsx`: file input, preview, loading state
    - Gọi `POST /api/profiles/me/avatar` với multipart/form-data
    - Disable nút upload trong khi đang upload (prevent duplicate)
    - Hiển thị lỗi rõ ràng nếu file sai định dạng hoặc quá 5MB
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Frontend Portfolio / Project Management
  - [x] 12.1 Cập nhật PortfolioBuilderPage với API integration
    - Cập nhật `src/pages/PortfolioBuilderPage.jsx`: gọi `POST /api/projects` khi Save
    - Tạo `src/components/project/MediaUploader.jsx`: drag-drop zone, preview grid, per-file delete
    - Validate: Project Title bắt buộc; hiển thị lỗi nếu thiếu
    - Implement Preview modal (không lưu data)
    - Redirect tới PortfolioDetailPage sau khi lưu
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 12.2 Cập nhật PortfolioDetailPage với full data và edit mode
    - Cập nhật `src/pages/PortfolioDetailPage.jsx`: hiển thị title, description, media gallery, tags, author, view/like counts, status badge
    - Tạo `src/components/project/StatusBadge.jsx` (Draft/Public/Pending_Feedback)
    - Implement edit mode: form điền sẵn dữ liệu hiện tại, gọi `PUT /api/projects/:id`
    - Implement status change buttons (Draft → Public, Request Feedback)
    - Implement delete với confirmation dialog (cảnh báo nếu có In_Review request)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.5_

  - [x] 12.3 Tạo ProjectGrid và tích hợp vào DashBoardPage
    - Tạo `src/components/project/ProjectCard.jsx`: thumbnail, title, status badge, view/like counts
    - Tạo `src/components/project/ProjectGrid.jsx`: responsive grid
    - Cập nhật `src/pages/DashBoardPage.jsx`: hiển thị 3 projects gần nhất, "View All" link
    - _Requirements: 7.1, 7.2, 7.3, 7.4_


- [x] 13. Frontend Buddy Feedback System
  - [x] 13.1 Implement Feedback Request form và tracking
    - Tạo `src/components/feedback/FeedbackRequestCard.jsx`: project name, buddy, status tag, date
    - Tạo `src/components/feedback/FeedbackStatusTag.jsx`: colored tag (Pending/In_Review/Completed)
    - Implement "Request Feedback" dialog trên PortfolioDetailPage: chọn project, nhập note
    - Gọi `POST /api/feedback-requests`, hiển thị lỗi nếu duplicate active request
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 13.2 Tạo trang danh sách Feedback Requests với filter
    - Tạo trang feedback list (route `/feedback-requests`)
    - Hiển thị tất cả FeedbackRequests với filter tabs: All, Pending, In_Review, Completed
    - Hiển thị badge thông báo trên navigation icon khi có Completed request mới
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 13.3 Cập nhật MentorFeedbackPage với full feedback detail
    - Cập nhật `src/pages/MentorFeedbackPage.jsx`: hiển thị buddy info, star rating, comment, suggestions
    - Tạo `src/components/feedback/StarRating.jsx` (1-5 stars display)
    - Tạo `src/components/feedback/HelpfulButton.jsx`: vote button, disable sau khi vote
    - Tạo `src/components/feedback/FeedbackCommentThread.jsx`: comment list + post form
    - Validate comment không rỗng trước khi submit
    - Hiển thị avgRating và tổng helpfulCount
    - Ẩn nội dung feedback nếu status chưa Completed
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 14. Frontend Job Application System
  - [x] 14.1 Cập nhật JobListingPage với API integration và filters
    - Cập nhật `src/pages/JobListingPage.jsx`: gọi `GET /api/jobs` với query params
    - Tạo `src/components/job/JobFilters.jsx`: type filter tabs + keyword search + location search
    - Debounce keyword search (500ms)
    - Tạo `src/components/job/JobCard.jsx`: title, company logo, type badge, salary, location
    - Hiển thị tổng số jobs phù hợp
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 14.2 Cập nhật JobDetailPage với apply và bookmark
    - Cập nhật `src/pages/JobDetailPage.jsx`: hiển thị full job detail
    - Tạo `src/components/job/BookmarkButton.jsx`: toggle bookmark state, gọi POST/DELETE bookmark API
    - Tạo `src/components/job/ApplicationDialog.jsx`: portfolio selector (Public projects only), confirm button
    - Gọi `POST /api/applications`, hiển thị success modal
    - Hiển thị lỗi nếu duplicate application hoặc không có Public project
    - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 13.4_

  - [x] 14.3 Tạo trang lịch sử ứng tuyển
    - Tạo trang application history (route `/applications`)
    - Hiển thị tất cả applications: job name, company, date, portfolio, status
    - Click vào application → redirect tới JobDetailPage
    - _Requirements: 14.1, 14.2, 14.4, 14.5_

- [x] 15. Frontend Dashboard và Statistics
  - [x] 15.1 Cập nhật DashBoardPage với stats, activity feed, và recommended jobs
    - Cập nhật `src/pages/DashBoardPage.jsx`: gọi `GET /api/profiles/me/stats`
    - Tạo `src/components/dashboard/StatsRow.jsx`: 3 counters (profile views, portfolio likes, applications)
    - Tạo `src/components/dashboard/RecentActivity.jsx`: max 10 items, click → navigate tới entity
    - Tạo `src/components/dashboard/RecommendedJobs.jsx`: max 3 job cards từ `GET /api/jobs/recommended`
    - Hiển thị "No recommended jobs found" nếu empty
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 11.6_

  - [x] 15.2 Write property test cho Recent activity list bounded at 10 items
    - **Property 16: Recent activity list is bounded at 10 items**
    - **Validates: Requirements 15.2**
    - Tạo > 10 activities cho mentee, assert response trả về đúng 10 items mới nhất

- [x] 16. Notification UI
  - [x] 16.1 Tạo Notification Bell và dropdown
    - Tạo `src/components/notification/NotificationBell.jsx`: icon + unread count badge, gọi `GET /api/notifications/unread-count`
    - Tạo `src/components/notification/NotificationList.jsx`: dropdown list, mark as read khi click
    - Tích hợp vào `src/components/layout/RootLayout.jsx`
    - _Requirements: 9.3, 8.5, 13.5_

- [x] 17. Final Checkpoint — End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.


---

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng **fast-check** với minimum 100 iterations mỗi test
- Unit tests và property tests bổ sung cho nhau — không thay thế
- Checkpoints đảm bảo validation tăng dần sau mỗi nhóm chức năng lớn
- Backend (Next.js App Router) và Frontend (React/Vite) nằm trong cùng monorepo
- Tất cả API routes có prefix `/api/` và được bảo vệ bởi `middleware.ts` (trừ public routes)
- Media upload cần cấu hình `BLOB_READ_WRITE_TOKEN` (Vercel Blob) hoặc `CLOUDINARY_URL`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "1.6"] },
    { "id": 3, "tasks": ["2.1", "3.1", "4.1", "6.1", "7.1", "8.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "4.2", "4.3", "6.2", "6.3", "7.2"] },
    { "id": 5, "tasks": ["2.4", "3.5", "4.4", "4.6", "6.4", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 6, "tasks": ["3.6", "3.7", "4.5", "4.7", "4.8", "6.5", "6.6", "7.7", "7.8"] },
    { "id": 7, "tasks": ["4.9", "4.10", "4.11", "6.7", "6.8"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] },
    { "id": 10, "tasks": ["11.1", "11.2", "12.1", "13.1", "14.1"] },
    { "id": 11, "tasks": ["11.3", "12.2", "12.3", "13.2", "14.2", "15.1"] },
    { "id": 12, "tasks": ["13.3", "14.3", "15.2", "16.1"] }
  ]
}
```
