const API_BASE_URL = '/api';

// ─── Token Management ─────────────────────────────────────────────────────────

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ─── Token Refresh Logic ──────────────────────────────────────────────────────

let refreshPromise = null;

async function refreshAccessToken() {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    const newAccessToken = result.data?.accessToken;

    if (!newAccessToken) {
      throw new Error('No access token in refresh response');
    }

    localStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ─── Fetch Wrapper ────────────────────────────────────────────────────────────

/**
 * Fetch wrapper that automatically attaches JWT Authorization header
 * and handles token refresh on 401 responses.
 *
 * @param {string} endpoint - API endpoint path (e.g., '/profiles/me')
 * @param {RequestInit} [options={}] - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});

  // Attach Authorization header if token exists (skip for multipart/form-data)
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Set Content-Type to JSON if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401: attempt token refresh and retry
  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      // Create fresh headers with new token for retry
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      if (options.body && !(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...options, headers: retryHeaders });
    } catch {
      // Refresh failed — clear tokens and redirect to login
      clearTokens();
      window.location.href = '/login';
      return response;
    }
  }

  return response;
}

// ─── Convenience Methods ──────────────────────────────────────────────────────

/**
 * GET request helper
 * @param {string} endpoint
 * @param {object} [params] - Query parameters
 * @returns {Promise<any>} - Parsed JSON response data
 */
export async function apiGet(endpoint, params) {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url = `${endpoint}?${qs}`;
  }

  const response = await apiFetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed', error.code);
  }
  return response.json();
}

/**
 * POST request helper
 * @param {string} endpoint
 * @param {object|FormData} body
 * @returns {Promise<any>} - Parsed JSON response data
 */
export async function apiPost(endpoint, body) {
  const isFormData = body instanceof FormData;
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed', error.code);
  }
  return response.json();
}

/**
 * PUT request helper
 * @param {string} endpoint
 * @param {object} body
 * @returns {Promise<any>} - Parsed JSON response data
 */
export async function apiPut(endpoint, body) {
  const response = await apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed', error.code);
  }
  return response.json();
}

/**
 * PATCH request helper
 * @param {string} endpoint
 * @param {object} body
 * @returns {Promise<any>} - Parsed JSON response data
 */
export async function apiPatch(endpoint, body) {
  const response = await apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed', error.code);
  }
  return response.json();
}

/**
 * DELETE request helper
 * @param {string} endpoint
 * @returns {Promise<any>} - Parsed JSON response data
 */
export async function apiDelete(endpoint) {
  const response = await apiFetch(endpoint, { method: 'DELETE' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed', error.code);
  }
  return response.json();
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
