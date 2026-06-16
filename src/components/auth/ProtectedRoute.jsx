import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../../lib/api';

/**
 * Route wrapper that redirects unauthenticated users to /login.
 * Uses <Outlet /> to render nested child routes when authenticated.
 */
export default function ProtectedRoute() {
  const isAuthenticated = !!getAccessToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
