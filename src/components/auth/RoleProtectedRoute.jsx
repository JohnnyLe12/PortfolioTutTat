import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../../lib/api';

/**
 * Route guard that checks both authentication and user role.
 * Redirects unauthenticated users to /login.
 * Redirects users without the required role to their role-appropriate dashboard.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Roles permitted to access these routes.
 *   "admin" always has access to all routes regardless of allowedRoles.
 */
export default function RoleProtectedRoute({ allowedRoles = [] }) {
  const isAuthenticated = !!getAccessToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get user from localStorage to check role
  let user = null;
  try {
    const stored = localStorage.getItem('user');
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  // Admin always has access to all pages
  if (userRole === 'admin') {
    return <Outlet />;
  }

  // Check if user's role is in the allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to role-appropriate dashboard
    return <Navigate to={getRoleDashboard(userRole)} replace />;
  }

  return <Outlet />;
}

/**
 * Returns the appropriate dashboard path for a given role.
 */
function getRoleDashboard(role) {
  switch (role) {
    case 'buddy':
      return '/buddy-dashboard';
    case 'company':
      return '/company-dashboard';
    case 'mentee':
      return '/dashboard';
    case 'admin':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
