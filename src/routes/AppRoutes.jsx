import { Routes, Route } from "react-router-dom";

import RootLayout from "../components/layout/RootLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import RoleProtectedRoute from "../components/auth/RoleProtectedRoute";

// Pages
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import DashBoardPage from "../pages/DashBoardPage";
import CompanyDashboardPage from "../pages/CompanyDashboardPage";
import BuddyDashboardPage from "../pages/BuddyDashboardPage";
import CreateProfilePage from "../pages/CreateProfilePage";
import CreateBuddyProfilePage from "../pages/CreateBuddyProfilePage";
import CreateCompanyProfilePage from "../pages/CreateCompanyProfilePage";

import JobListingPage from "../pages/JobListingPage";
import JobDetailPage from "../pages/JobDetailPage";

import PortfolioBuilderPage from "../pages/PortfolioBuilderPage";
import PortfolioDetailPage from "../pages/PortfolioDetailPage";

import MentorFeedbackPage from "../pages/MentorFeedbackPage";
import FeedbackRequestsPage from "../pages/FeedbackRequestsPage";
import ApplicationHistoryPage from "../pages/ApplicationHistoryPage";

import BrowsePortfoliosPage from "../pages/BrowsePortfoliosPage";
import FeedbackWorkspacePage from "../pages/FeedbackWorkspacePage";
import JobCreationPage from "../pages/JobCreationPage";
import ApplicantsTrackerPage from "../pages/ApplicantsTrackerPage";
import AdvancedJobSearchPage from "../pages/AdvancedJobSearchPage";
import BuddyProfilePage from "../pages/BuddyProfilePage";
import MenteeProfilePage from "../pages/MenteeProfilePage";
import CompanyProfilePage from "../pages/CompanyProfilePage";
import SettingsPage from "../pages/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public Pages */}
        <Route index element={<LandingPage />} />

        {/* Auth (public) */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />

        {/* Protected Routes (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          {/* Profile Creation — accessible to any authenticated user */}
          <Route path="create-profile" element={<CreateProfilePage />} />

          {/* Mentee Dashboard */}
          <Route path="dashboard" element={<DashBoardPage />} />

          {/* Portfolio */}
          <Route path="portfolio-builder" element={<PortfolioBuilderPage />} />
          <Route path="portfolio/:id" element={<PortfolioDetailPage />} />

          {/* Feedback (mentee) */}
          <Route path="feedback-requests" element={<FeedbackRequestsPage />} />
          <Route path="feedback/:id" element={<MentorFeedbackPage />} />
          <Route path="feedback" element={<MentorFeedbackPage />} />

          {/* Jobs (shared) */}
          <Route path="jobs" element={<JobListingPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />

          {/* Applications (mentee) */}
          <Route path="applications" element={<ApplicationHistoryPage />} />

          {/* Buddy Profile (viewable by any authenticated user) */}
          <Route path="buddy-profile/:userId" element={<BuddyProfilePage />} />

          {/* Company Profile (viewable by any authenticated user) */}
          <Route path="company-profile/:userId" element={<CompanyProfilePage />} />

          {/* Mentee Profile (viewable by any authenticated user) */}
          <Route path="profile/:id" element={<MenteeProfilePage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Buddy-only routes (buddy + admin) */}
        <Route element={<RoleProtectedRoute allowedRoles={["buddy"]} />}>
          <Route path="create-buddy-profile" element={<CreateBuddyProfilePage />} />
          <Route path="buddy-dashboard" element={<BuddyDashboardPage />} />
          <Route path="browse-portfolios" element={<BrowsePortfoliosPage />} />
          <Route path="feedback-workspace" element={<FeedbackWorkspacePage />} />
        </Route>

        {/* Company-only routes (company + admin) */}
        <Route element={<RoleProtectedRoute allowedRoles={["company"]} />}>
          <Route path="create-company-profile" element={<CreateCompanyProfilePage />} />
          <Route path="company-dashboard" element={<CompanyDashboardPage />} />
          <Route path="job-creation" element={<JobCreationPage />} />
          <Route path="applicants-tracker" element={<ApplicantsTrackerPage />} />
        </Route>

        {/* Mentee-only routes (mentee + admin) */}
        <Route element={<RoleProtectedRoute allowedRoles={["mentee"]} />}>
          <Route path="advanced-job-search" element={<AdvancedJobSearchPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
