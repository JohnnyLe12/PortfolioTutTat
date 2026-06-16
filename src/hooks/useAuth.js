import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, setTokens, clearTokens, apiPost } from '../lib/api';

/**
 * Authentication hook providing user state and auth actions.
 * - user: parsed user object from localStorage
 * - isAuthenticated: true if accessToken exists
 * - login(email, password): authenticates and stores session
 * - logout(): clears session and redirects to /login
 */
export default function useAuth() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!getAccessToken();

  const login = useCallback(async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });

    // Store tokens
    const { accessToken, refreshToken, user: userData } = data.data || data;
    setTokens(accessToken, refreshToken);

    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return data;
  }, []);

  const logout = useCallback(async () => {
    // Best-effort logout call — don't block on failure
    try {
      await apiPost('/auth/logout', {});
    } catch {
      // Ignore errors
    }

    // Clear local session
    clearTokens();
    localStorage.removeItem('user');
    setUser(null);

    navigate('/login');
  }, [navigate]);

  return { user, isAuthenticated, login, logout };
}
