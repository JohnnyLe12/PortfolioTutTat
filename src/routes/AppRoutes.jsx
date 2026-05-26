import { Routes, Route } from "react-router-dom";

import RootLayout from "../components/layout/RootLayout";

// Pages
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import DashBoardPage from "../pages/DashBoardPage";
import CompanyDashboardPage from "../pages/CompanyDashboardPage";
import CreateProfilePage from "../pages/CreateProfilePage";

import JobListingPage from "../pages/JobListingPage";
import JobDetailPage from "../pages/JobDetailPage";

import PortfolioBuilderPage from "../pages/PortfolioBuilderPage";
import PortfolioDetailPage from "../pages/PortfolioDetailPage";

import MentorFeedbackPage from "../pages/MentorFeedbackPage";

import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Main Pages */}
        <Route index element={<LandingPage />} />

        {/* Auth */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />

        {/* Profile */}
        <Route path="create-profile" element={<CreateProfilePage />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<DashBoardPage />} />
        <Route
          path="company-dashboard"
          element={<CompanyDashboardPage />}
        />

        {/* Jobs */}
        <Route path="jobs" element={<JobListingPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />

        {/* Portfolio */}
        <Route
          path="portfolio-builder"
          element={<PortfolioBuilderPage />}
        />
        <Route
          path="portfolio/:id"
          element={<PortfolioDetailPage />}
        />

        {/* Feedback */}
        <Route path="feedback" element={<MentorFeedbackPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}