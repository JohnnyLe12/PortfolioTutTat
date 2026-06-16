# Implementation Plan: Multi-Role Ecosystem

## Overview

This implementation plan extends PortfolioTutTat from a mentee-only platform into a full multi-role ecosystem supporting Mentee, Buddy, Company, and Admin roles. The plan follows an incremental approach: schema & infrastructure first, then role-specific backend services, followed by frontend pages, and finally integration wiring.

## Tasks

- [x] 1. Database schema and shared infrastructure
  - [x] 1.1 Update Prisma schema with new enums, models, and field extensions
    - Add `EmploymentType` and `SeniorityLevel` enums
    - Add `BuddyProfile`, `CompanyProfile`, `Message`, `PortfolioBookmark` models
    - Extend `Job` model with new optional fields (openSlots, employmentType, seniorityLevel, minExperienceYears, requiresManagement, minManagedEmployees, salaryPeriod, category)
    - Extend `Project` model with `isApproved` field
    - Extend `User` model with relations to BuddyProfile, CompanyProfile, MessagesSent, MessagesReceived
    - Run `npx prisma migrate dev` to generate and apply migration
    - _Requirements: 2.1, 3.1, 6.4, 8.1, 13.1_

  - [x] 1.2 Create role guard utility (`lib/role-guard.ts`)
    - Implement `requireRole(req, allowedRoles)` function that extracts `x-user-id` and `x-user-role` from request headers
    - Return `{ userId, role }` if role is in allowedRoles or role is "admin"
    - Return 403 FORBIDDEN response if role not allowed
    - Return 401 UNAUTHORIZED if headers missing or empty
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 1.3 Create Zod validation schemas
    - Create `lib/validations/buddy-profile.ts` with `buddyProfileCreateSchema` and `buddyProfileUpdateSchema`
    - Create `lib/validations/company-profile.ts` with `companyProfileCreateSchema` and `companyProfileUpdateSchema`
    - Create `lib/validations/job-create.ts` with `jobCreateSchema` (including salaryMin/Max refinement)
    - Create `lib/validations/message.ts` with `messageCreateSchema`
    - Create `lib/validations/application-status.ts` with `applicationStatusUpdateSchema`
    - _Requirements: 2.1, 2.3, 2.7, 2.9, 3.1, 3.3, 3.8, 6.4, 6.6, 6.9, 8.1, 8.6, 8.7, 8.10, 9.5_

  - [x] 1.4 Write property tests for role guard (Property 24)
    - **Property 24: Role-Based API Access Control**
    - Test that buddy/admin can access buddy endpoints, company/admin can access company endpoints
    - Test that unauthorized roles receive 403 with correct error format
    - Test that admin always gets access regardless of endpoint
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.7**

  - [x] 1.5 Write property tests for registration role assignment (Properties 1, 2)
    - **Property 1: Registration Role Assignment Round-Trip**
    - **Property 2: Invalid Role Rejection at Registration**
    - Test that valid roles are stored correctly on User record
    - Test that invalid role strings are rejected with validation error
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7, 1.8**

- [x] 2. Buddy Profile backend API
  - [x] 2.1 Implement Buddy Profile CRUD endpoints
    - Create `app/api/buddy/profile/route.ts` (POST — create BuddyProfile)
    - Create `app/api/buddy/profile/me/route.ts` (GET — get own profile, PUT — update profile)
    - Implement `calculateBuddyCompletionPct` helper function
    - Handle 409 CONFLICT when profile already exists on POST
    - Apply role guard requiring "buddy" role
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 2.2 Write property tests for BuddyProfile validation (Properties 3, 4, 5, 7)
    - **Property 3: BuddyProfile CompletionPct Calculation**
    - **Property 4: BuddyProfile Whitespace Name Rejection**
    - **Property 5: URL Format Validation (https:// prefix)**
    - **Property 7: Field Length Limit Enforcement**
    - **Validates: Requirements 2.3, 2.4, 2.6, 2.7, 2.9**

  - [x] 2.3 Write property test for BuddyProfile data round-trip (Property 6)
    - **Property 6: BuddyProfile Data Round-Trip**
    - Test that created profiles match submitted data on subsequent GET
    - **Validates: Requirements 2.2, 2.5**

- [x] 3. Company Profile backend API
  - [x] 3.1 Implement Company Profile CRUD endpoints
    - Create `app/api/company/profile/route.ts` (POST — create CompanyProfile)
    - Create `app/api/company/profile/me/route.ts` (GET — get own profile, PUT — update profile)
    - Handle teamMembers and referenceLinks as JSON arrays
    - Handle 409 CONFLICT when profile already exists on POST
    - Apply role guard requiring "company" role
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_

  - [x] 3.2 Write property tests for CompanyProfile (Properties 5, 8)
    - **Property 5: URL Format Validation (https:// prefix)** — for websiteUrl
    - **Property 8: CompanyProfile Data Round-Trip**
    - **Validates: Requirements 3.2, 3.5, 3.6, 3.8**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Auth registration extension
  - [x] 5.1 Extend registration route to support multi-role signup
    - Modify `app/api/auth/register/route.ts` to accept `role` field in body
    - Validate role is one of {mentee, buddy, company, admin}
    - Conditionally create BuddyProfile or CompanyProfile (or skip for admin) in same transaction
    - Implement admin invite code verification for admin role
    - Return appropriate redirect path based on role in response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 6. Buddy Dashboard and Browse Portfolios backend
  - [x] 6.1 Implement Buddy Dashboard stats endpoint
    - Create `app/api/buddy/dashboard/stats/route.ts`
    - Query completedReviews (FeedbackRequests with status=completed assigned to buddy)
    - Query pendingReviews (FeedbackRequests with status=pending assigned to buddy)
    - Query activeMessages (distinct conversations with messages in last 7 days)
    - Calculate helpfulRating (totalHelpfulVotes / totalFeedbacks, or 0.0)
    - Return at most 5 recent FeedbackRequests sorted by assigned date descending
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Implement Browse Portfolios endpoint
    - Create `app/api/buddy/portfolios/browse/route.ts`
    - Query projects with status=pending_feedback
    - Implement skill-match sorting (overlap between project tags and buddy skills+designTools)
    - Support filter params: tags, major (AND logic)
    - Paginate with max 20 per page
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_

  - [x] 6.3 Implement Portfolio Bookmark endpoints
    - Create `app/api/buddy/portfolios/bookmark/route.ts` (POST — create bookmark)
    - Create `app/api/buddy/portfolios/bookmark/[projectId]/route.ts` (DELETE — remove bookmark)
    - Handle 409 CONFLICT for duplicate bookmarks
    - Handle 404 for non-existent projects
    - _Requirements: 5.3, 5.4_

  - [x] 6.4 Write property tests for Browse Portfolios (Properties 11, 12, 13)
    - **Property 11: Browse Portfolios Skill-Match Sort Order**
    - **Property 12: Portfolio Bookmark Uniqueness (Idempotence)**
    - **Property 13: Portfolio Filter AND Logic**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [x] 6.5 Write property tests for Dashboard Stats (Properties 9, 10)
    - **Property 9: Buddy Dashboard Stats Correctness**
    - **Property 10: Dashboard Recent Items Limit and Sort**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 7. Buddy Feedback Workspace backend
  - [x] 7.1 Implement Feedback Workspace endpoints
    - Create `app/api/buddy/workspace/route.ts` (GET — list bookmarked portfolios with review status)
    - Create `app/api/buddy/workspace/[feedbackRequestId]/start/route.ts` (PATCH — transition to in_review)
    - Create `app/api/buddy/workspace/[feedbackRequestId]/complete/route.ts` (PATCH — transition to completed, set project.isApproved=true)
    - Validate state transitions (pending→in_review, in_review→completed)
    - Create notification for mentee on start and complete
    - _Requirements: 6.1, 6.2, 6.5, 6.8, 13.1_

  - [x] 7.2 Write property tests for FeedbackRequest state transitions (Properties 16, 17)
    - **Property 16: FeedbackRequest State Transition — Start Review**
    - **Property 17: FeedbackRequest State Transition — Complete Review**
    - **Validates: Requirements 6.2, 6.5, 6.8, 13.1**

- [x] 8. Messaging backend
  - [x] 8.1 Implement Messaging endpoints
    - Create `app/api/messages/route.ts` (POST — send message)
    - Create `app/api/messages/[portfolioContextId]/route.ts` (GET — chat history, max 50 messages, oldest first)
    - Create `app/api/messages/conversations/route.ts` (GET — list active conversations)
    - Validate message content (1-2000 chars, non-whitespace)
    - Apply role guard requiring "buddy" or "mentee"
    - _Requirements: 6.3, 6.4, 6.6, 6.7, 6.9, 10.1, 10.2, 10.4, 10.5_

  - [x] 8.2 Write property tests for Messaging (Properties 14, 15)
    - **Property 14: Message Content Validation Boundaries**
    - **Property 15: Message History Retrieval Order and Limit**
    - **Validates: Requirements 6.4, 6.6, 6.7, 6.9, 10.2, 10.4, 10.5**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Company Dashboard and Job Management backend
  - [x] 10.1 Implement Company Dashboard stats endpoint
    - Create `app/api/company/dashboard/stats/route.ts`
    - Query activeJobs (jobs with isActive=true owned by company)
    - Query totalApplications (all applications across company jobs)
    - Query newApplicantsThisWeek (applications with createdAt in last 7 days)
    - Return at most 5 recent jobs sorted by createdAt desc, each with application count
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.2 Implement Company Job CRUD endpoints
    - Create `app/api/company/jobs/route.ts` (GET — list company jobs, POST — create job with extended fields)
    - Create `app/api/company/jobs/[id]/route.ts` (PUT — update job, DELETE — delete job)
    - Validate job creation with jobCreateSchema (title, description, openSlots required; salary range consistency)
    - Set isActive=true on creation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 10.3 Implement Applicants Tracker endpoints
    - Create `app/api/company/jobs/[id]/applicants/route.ts` (GET — list applicants for a job)
    - Create `app/api/company/applications/[id]/status/route.ts` (PATCH — update application status)
    - Implement state machine validation (submitted→under_review→accepted/rejected)
    - Create notification for mentee on status change
    - Verify company owns the job before allowing status updates
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 10.4 Write property tests for Job Creation (Properties 19, 20, 21)
    - **Property 19: Job Creation Validation — Salary Range Consistency**
    - **Property 20: Job Creation — Valid Data Creates Active Job**
    - **Property 21: Job Creation — openSlots Validation**
    - **Validates: Requirements 8.5, 8.7, 8.9, 8.10**

  - [x] 10.5 Write property tests for Application Status (Property 22)
    - **Property 22: Application Status State Machine**
    - Test all valid and invalid transitions
    - **Validates: Requirements 9.5, 9.6**

  - [x] 10.6 Write property tests for Company Dashboard Stats (Property 18)
    - **Property 18: Company Dashboard Stats Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.4**

- [x] 11. Extended Job Search backend
  - [x] 11.1 Extend Job Search API with advanced filters
    - Modify `app/api/jobs/route.ts` to support new query params: keyword, category, employmentType, seniorityLevel, salaryMin, salaryMax, location, isRemote
    - Implement AND logic for all active filters
    - Create `app/api/jobs/categories/route.ts` (GET — distinct categories from active jobs)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 11.2 Write property test for Job Search Filter (Property 23)
    - **Property 23: Job Search Filter Intersection (AND Logic)**
    - **Validates: Requirements 11.2, 11.3, 11.5**

- [x] 12. Portfolio Selector for Job Applications
  - [x] 12.1 Implement portfolio selector endpoint filtering
    - Ensure job application portfolio selector only shows projects with status=public
    - Add `isApproved` badge info to response (Buddy Approved vs Unreviewed)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 12.2 Write property test for Portfolio Selector (Property 25)
    - **Property 25: Portfolio Selector Shows Only Public Portfolios**
    - **Validates: Requirements 13.4**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Frontend - Auth and Profile Creation pages
  - [x] 14.1 Extend SignUpPage with role selection step
    - Add role selection UI step before email/password form (four options: Mentee, Buddy, Company, Admin)
    - Only allow single role selection
    - Show inline validation error if no role selected on submit
    - Redirect to appropriate profile creation page based on role after successful registration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 14.2 Create BuddyProfile creation page
    - Create `CreateBuddyProfilePage` with form fields: Full Name, Role Title, Bio, Avatar URL, Major, Skills, Design Tools, Interests, Social Links
    - Implement client-side validation matching Zod schema
    - Show completion percentage indicator
    - Redirect to edit page if profile already exists
    - On success, redirect to Buddy Dashboard
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8_

  - [x] 14.3 Create CompanyProfile creation page
    - Create `CreateCompanyProfilePage` with four sections: About, Team, Jobs, Metadata
    - Implement team member add/edit/delete functionality
    - Implement reference links management
    - On success, redirect to Company Dashboard
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 15. Frontend - Buddy pages
  - [x] 15.1 Create Buddy Dashboard page
    - Create `BuddyDashboardPage` displaying four stat cards (completed reviews, pending reviews, active messages, helpful rating)
    - Show recent 5 feedback requests list with project name, status, and date
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 15.2 Create Browse Portfolios page
    - Create `BrowsePortfoliosPage` with paginated portfolio grid (max 20 per page)
    - Show project title, truncated description (150 chars), tags, mentee name, date
    - Implement filter sidebar: tags filter, major filter (AND logic)
    - Implement bookmark button with optimistic UI update
    - Show empty state when no portfolios match
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 15.3 Create Feedback Workspace page
    - Create `FeedbackWorkspacePage` showing bookmarked portfolios with review status
    - Implement "Start Review" action (transitions to In_Review)
    - Implement "Complete Review" action (transitions to Completed)
    - Embed ChatPanel component for active reviews (In_Review state)
    - Paginate workspace items (max 20 per page)
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.8_

  - [x] 15.4 Create ChatPanel component
    - Create reusable `ChatPanel` component for 1-on-1 messaging
    - Display message history (max 50 messages, oldest first)
    - Implement message input with validation (1-2000 chars, non-empty)
    - Show error states for failed sends with message preservation
    - Support "load more" for older messages
    - _Requirements: 6.3, 6.4, 6.6, 6.7, 6.9_

- [-] 16. Frontend - Company pages
  - [x] 16.1 Create Company Dashboard page
    - Create `CompanyDashboardPage` displaying three stat cards (active jobs, total applications, new applicants this week)
    - Show recent 5 jobs list with title and application count
    - Show empty state when no jobs exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 16.2 Create Job Creation page
    - Create `JobCreationPage` with full form: Title, Description, Salary Range, Open Slots, Location, Employment Type dropdown, Seniority Level dropdown, Min Experience, Required Skills multi-input, Management Requirements toggle
    - Show "Minimum Managed Employees" field conditionally on toggle
    - Implement client-side validation matching jobCreateSchema
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10_

  - [x] 16.3 Create Applicants Tracker page
    - Create `ApplicantsTrackerPage` showing jobs with applicant counts
    - Show applicant list per job (name, date, status, portfolio link)
    - Implement status update dropdown with valid transitions only
    - Show error when invalid transition attempted
    - Show empty state for jobs with no applicants
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 17. Frontend - Mentee enhancements
  - [x] 17.1 Create Advanced Job Search page
    - Create `AdvancedJobSearchPage` with three-tier layout: search bar, category quick tags, advanced filters panel
    - Implement keyword search (min 2 chars, debounced)
    - Implement category quick tags (single select, toggle behavior)
    - Implement advanced filters: Location, Employment Type (multi-select), Seniority Level (multi-select), Salary Range slider, Remote checkbox
    - Implement "Clear All Filters" button
    - Show result count and empty state
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 17.2 Integrate Mentee Chat in Feedback tracking
    - Add ChatPanel component to Mentee's feedback request tracking page
    - Show chat only when FeedbackRequest is in In_Review state
    - Hide chat and show status when not In_Review
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 17.3 Update Portfolio Selector in Job Application
    - Filter portfolio list to only show projects with status=public
    - Add badge "Buddy Approved" for portfolios with isApproved=true
    - Add badge "Unreviewed" for portfolios with isApproved=false
    - _Requirements: 13.2, 13.3, 13.4_

- [x] 18. Frontend routing and role-based navigation
  - [x] 18.1 Add new protected routes and role-based redirects
    - Add routes: create-buddy-profile, create-company-profile, buddy-dashboard, browse-portfolios, feedback-workspace, job-creation, applicants-tracker, advanced-job-search
    - Implement route guards checking user role for buddy and company pages
    - Update navigation/sidebar to show role-appropriate menu items
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 12.1, 12.2_

- [-] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript, Next.js App Router, Prisma, Vitest + fast-check
- All backend endpoints follow existing patterns in `lib/response.ts` for error formatting
- Frontend uses React + Vite + Tailwind CSS + shadcn/ui + Radix UI + Lucide icons + react-router-dom

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1", "3.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["6.4", "6.5", "7.1", "8.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "10.1", "10.2", "10.3"] },
    { "id": 6, "tasks": ["10.4", "10.5", "10.6", "11.1"] },
    { "id": 7, "tasks": ["11.2", "12.1"] },
    { "id": 8, "tasks": ["12.2", "14.1", "14.2", "14.3"] },
    { "id": 9, "tasks": ["15.1", "15.2", "15.3", "15.4", "16.1", "16.2", "16.3"] },
    { "id": 10, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 11, "tasks": ["18.1"] }
  ]
}
```
