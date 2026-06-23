import {
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";

import { useState, useEffect, useMemo } from "react";

import {
  Briefcase,
  LayoutDashboard,
  Folder,
  MessageSquare,
  Settings,
  LogOut,
  Search,
  Users,
  BookOpen,
  PlusCircle,
  ClipboardList,
} from "lucide-react";

import { apiGet, getAccessToken } from "../../lib/api";
import NotificationBell from "../notification/NotificationBell";
import { useLanguage } from "../../contexts/LanguageContext";

export default function RootLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const [feedbackUnreadCount, setFeedbackUnreadCount] = useState(0);

  const isLandingPage =
    location.pathname === "/";

  const isAuthPage =
    location.pathname === "/signup" ||
    location.pathname === "/login" ||
    location.pathname === "/create-profile" ||
    location.pathname === "/create-buddy-profile" ||
    location.pathname === "/create-company-profile";

  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/portfolio") ||
    location.pathname.startsWith("/jobs") ||
    location.pathname.startsWith("/feedback") ||
    location.pathname.startsWith("/applications") ||
    location.pathname.startsWith("/buddy-dashboard") ||
    location.pathname.startsWith("/browse-portfolios") ||
    location.pathname.startsWith("/company-dashboard") ||
    location.pathname.startsWith("/job-creation") ||
    location.pathname.startsWith("/applicants-tracker") ||
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/buddy-profile");
    location.pathname.startsWith("/advanced-job-search");

  // Get current user role from localStorage
  const userRole = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      return user?.role || null;
    } catch {
      return null;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isDashboardRoute && getAccessToken()) {
      fetchFeedbackUnreadCount();
    }
  }, [isDashboardRoute, location.pathname]);

  async function fetchFeedbackUnreadCount() {
    try {
      const result = await apiGet("/notifications/unread-count");
      setFeedbackUnreadCount(result.data?.count || 0);
    } catch {
      // Silently fail — badge is non-critical
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      {!isAuthPage && (
        <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <div className="h-11 flex items-center justify-center">
                <img src="/logo2beg.png" alt="Logo TÚT TÁT" className="h-full w-auto object-contain" />
              </div>
            </Link>

            {/* RIGHT BUTTON */}
            <div className="flex items-center gap-3">
              {isLandingPage ? (
                <>
                  <Link to="/login">
                    <button className="px-5 py-2 rounded-xl hover:bg-gray-100 transition-all font-medium">
                      Đăng Nhập
                    </button>
                  </Link>

                  <Link to="/signup">
                    <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all">
                      Đăng Ký
                    </button>
                  </Link>
                </>
              ) : isDashboardRoute ? (
                <NotificationBell />
              ) : (
                <Link to={(() => {
                  try {
                    const stored = localStorage.getItem('user');
                    const u = stored ? JSON.parse(stored) : null;
                    if (u?.role === 'buddy') return '/buddy-dashboard';
                    if (u?.role === 'company') return '/company-dashboard';
                    return '/dashboard';
                  } catch { return '/dashboard'; }
                })()}>
                  <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all">
                    Dashboard
                  </button>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* CONTENT */}
      <div className="flex">
        {/* SIDEBAR */}
        {isDashboardRoute && (
          <aside className="hidden lg:block w-64 min-h-screen bg-white border-r sticky top-16">
            <nav className="p-6 space-y-2">
              <RoleSidebar
                role={userRole}
                pathname={location.pathname}
                feedbackUnreadCount={feedbackUnreadCount}
                t={t}
              />

              <div className="pt-4 mt-4 border-t space-y-2">
                <SidebarLink
                  to="/settings"
                  icon={<Settings />}
                  text={t("nav.settings")}
                />

                <SidebarLink
                  to="/"
                  icon={<LogOut />}
                  text={t("nav.logout")}
                />
              </div>
            </nav>
          </aside>
        )}

        {/* PAGE */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* FOOTER */}
      {isLandingPage && (
        <footer className="bg-white border-t mt-20">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-13 flex items-center justify-center">
                    <img src="/logo2beg.png" alt="Logo TÚT TÁT" className="h-full w-auto object-contain" />
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Trao quyền cho thế hệ chuyên gia sáng tạo tương lai.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Product
                </h4>

                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Portfolio</li>
                  <li>Buddy Feedback</li>
                  <li>Find Jobs</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Company
                </h4>

                <ul className="space-y-2 text-sm text-gray-600">
                  <li>About</li>
                  <li>Careers</li>
                  <li>Contact</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Legal
                </h4>

                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Privacy</li>
                  <li>Terms</li>
                </ul>
              </div>
            </div>

            <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
              © 2026 Tút Tát. All rights
              reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/* ROLE-BASED SIDEBAR */
function RoleSidebar({ role, pathname, feedbackUnreadCount, t }) {
  switch (role) {
    case 'buddy':
      return <BuddySidebar pathname={pathname} t={t} />;
    case 'company':
      return <CompanySidebar pathname={pathname} t={t} />;
    case 'admin':
      return <AdminSidebar pathname={pathname} feedbackUnreadCount={feedbackUnreadCount} t={t} />;
    case 'mentee':
    default:
      return <MenteeSidebar pathname={pathname} feedbackUnreadCount={feedbackUnreadCount} t={t} />;
  }
}

/* MENTEE SIDEBAR */
function MenteeSidebar({ pathname, feedbackUnreadCount, t }) {
  return (
    <>
      <SidebarLink
        to="/dashboard"
        icon={<LayoutDashboard />}
        text={t("nav.dashboard")}
        active={pathname === "/dashboard"}
      />

      <SidebarLink
        to="/portfolio-builder"
        icon={<Folder />}
        text={t("nav.portfolio")}
        active={pathname.startsWith("/portfolio")}
      />

      <SidebarLink
        to="/feedback-requests"
        icon={<MessageSquare />}
        text={t("nav.feedback")}
        active={pathname.startsWith("/feedback")}
      />

      <SidebarLink
        to="/jobs"
        icon={<Briefcase />}
        text={t("nav.jobs")}
        active={pathname === "/jobs" || pathname.startsWith("/jobs/")}
      />

      <SidebarLink
        to="/applications"
        icon={<ClipboardList />}
        text={t("nav.applications")}
        active={pathname === "/applications"}
      />
    </>
  );
}

/* BUDDY SIDEBAR */
function BuddySidebar({ pathname, t }) {
  return (
    <>
      <SidebarLink
        to="/buddy-dashboard"
        icon={<LayoutDashboard />}
        text={t("nav.dashboard")}
        active={pathname === "/buddy-dashboard"}
      />

      <SidebarLink
        to="/browse-portfolios"
        icon={<BookOpen />}
        text={t("nav.browsePortfolios")}
        active={pathname === "/browse-portfolios"}
      />

      <SidebarLink
        to="/feedback-workspace"
        icon={<MessageSquare />}
        text={t("nav.feedbackWorkspace")}
        active={pathname === "/feedback-workspace"}
      />
    </>
  );
}

/* COMPANY SIDEBAR */
function CompanySidebar({ pathname, t }) {
  return (
    <>
      <SidebarLink
        to="/company-dashboard"
        icon={<LayoutDashboard />}
        text={t("nav.dashboard")}
        active={pathname === "/company-dashboard"}
      />

      <SidebarLink
        to="/job-creation"
        icon={<PlusCircle />}
        text="Create Job"
        active={pathname === "/job-creation"}
      />

      <SidebarLink
        to="/applicants-tracker"
        icon={<Users />}
        text="Applicants"
        active={pathname === "/applicants-tracker"}
      />
    </>
  );
}

/* ADMIN SIDEBAR — shows all navigation items */
function AdminSidebar({ pathname, feedbackUnreadCount, t }) {
  return (
    <>
      <SidebarLink
        to="/dashboard"
        icon={<LayoutDashboard />}
        text={t("nav.dashboard")}
        active={pathname === "/dashboard"}
      />

      <SidebarLink
        to="/buddy-dashboard"
        icon={<LayoutDashboard />}
        text="Buddy Dashboard"
        active={pathname === "/buddy-dashboard"}
      />

      <SidebarLink
        to="/company-dashboard"
        icon={<LayoutDashboard />}
        text="Company Dashboard"
        active={pathname === "/company-dashboard"}
      />

      <SidebarLink
        to="/portfolio-builder"
        icon={<Folder />}
        text={t("nav.portfolio")}
        active={pathname.startsWith("/portfolio")}
      />

      <SidebarLink
        to="/browse-portfolios"
        icon={<BookOpen />}
        text={t("nav.browsePortfolios")}
        active={pathname === "/browse-portfolios"}
      />

      <SidebarLink
        to="/feedback-workspace"
        icon={<MessageSquare />}
        text={t("nav.feedbackWorkspace")}
        active={pathname === "/feedback-workspace"}
      />

      <SidebarLink
        to="/feedback-requests"
        icon={<MessageSquare />}
        text={t("nav.feedback")}
        active={pathname.startsWith("/feedback-requests")}
      />

      <SidebarLink
        to="/jobs"
        icon={<Briefcase />}
        text={t("nav.jobs")}
        active={pathname === "/jobs" || pathname.startsWith("/jobs/")}
      />

      <SidebarLink
        to="/job-creation"
        icon={<PlusCircle />}
        text="Create Job"
        active={pathname === "/job-creation"}
      />

      <SidebarLink
        to="/applicants-tracker"
        icon={<Users />}
        text="Applicants"
        active={pathname === "/applicants-tracker"}
      />

      <SidebarLink
        to="/advanced-job-search"
        icon={<Search />}
        text="Advanced Search"
        active={pathname === "/advanced-job-search"}
      />

      <SidebarLink
        to="/applications"
        icon={<ClipboardList />}
        text={t("nav.applications")}
        active={pathname === "/applications"}
      />
    </>
  );
}

/* SIDEBAR COMPONENT */
function SidebarLink({
  to,
  icon,
  text,
  active,
  badge,
}) {
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${active
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-600 hover:bg-gray-100"
          }`}
      >
        <div className="w-5 h-5 relative">
          {icon}
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>

        <span className="font-medium">
          {text}
        </span>
      </div>
    </Link>
  );
}
