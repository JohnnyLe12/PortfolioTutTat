import {
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";

import {
  Briefcase,
  LayoutDashboard,
  Folder,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";

export default function RootLayout() {
  const location = useLocation();

  const isLandingPage =
    location.pathname === "/";

  const isAuthPage =
    location.pathname === "/signup" ||
    location.pathname === "/login" ||
    location.pathname === "/create-profile";

  const isDashboardRoute =
    location.pathname.startsWith(
      "/dashboard"
    ) ||
    location.pathname.startsWith(
      "/portfolio"
    ) ||
    location.pathname.startsWith(
      "/jobs"
    ) ||
    location.pathname.startsWith(
      "/feedback"
    );

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  T
                </span>
              </div>

              <span className="text-2xl font-bold text-gray-900">
                Tút Tát
              </span>
            </Link>

            {/* MENU */}
            {!isLandingPage &&
              !isDashboardRoute && (
                <nav className="hidden md:flex items-center gap-8">
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                  >
                    Designers
                  </Link>

                  <Link
                    to="#"
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                  >
                    Companies
                  </Link>

                  <Link
                    to="#"
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                  >
                    About
                  </Link>
                </nav>
              )}

            {/* RIGHT BUTTON */}
            <div className="flex items-center gap-3">
              {isLandingPage ? (
                <>
                  <Link to="/login">
                    <button className="px-5 py-2 rounded-xl hover:bg-gray-100 transition-all font-medium">
                      Log In
                    </button>
                  </Link>

                  <Link to="/signup">
                    <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all">
                      Get Started
                    </button>
                  </Link>
                </>
              ) : !isDashboardRoute ? (
                <Link to="/dashboard">
                  <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all">
                    Dashboard
                  </button>
                </Link>
              ) : null}
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
              <SidebarLink
                to="/dashboard"
                icon={<LayoutDashboard />}
                text="Dashboard"
                active={
                  location.pathname ===
                  "/dashboard"
                }
              />

              <SidebarLink
                to="/portfolio/builder"
                icon={<Folder />}
                text="Portfolio"
                active={location.pathname.startsWith(
                  "/portfolio"
                )}
              />

              <SidebarLink
                to="/feedback"
                icon={<MessageSquare />}
                text="Feedback"
                active={
                  location.pathname ===
                  "/feedback"
                }
              />

              <SidebarLink
                to="/jobs"
                icon={<Briefcase />}
                text="Jobs"
                active={location.pathname.startsWith(
                  "/jobs"
                )}
              />

              <div className="pt-4 mt-4 border-t space-y-2">
                <SidebarLink
                  to="#"
                  icon={<Settings />}
                  text="Settings"
                />

                <SidebarLink
                  to="/"
                  icon={<LogOut />}
                  text="Logout"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold">
                      T
                    </span>
                  </div>

                  <span className="text-xl font-bold">
                    Tút Tát
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  Empowering the next generation
                  of creative professionals.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Product
                </h4>

                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Portfolio Builder</li>
                  <li>Find Jobs</li>
                  <li>Mentor Feedback</li>
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

/* SIDEBAR COMPONENT */
function SidebarLink({
  to,
  icon,
  text,
  active,
}) {
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${
          active
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <div className="w-5 h-5">
          {icon}
        </div>

        <span className="font-medium">
          {text}
        </span>
      </div>
    </Link>
  );
}