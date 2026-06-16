/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create a proper localStorage mock since jsdom env may not be applied
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', {
  value: { location: { href: '' } },
  writable: true,
});

// Must import AFTER mocking localStorage/window since the module references them
const {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  ApiError,
} = await import('./api.js');

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client - Token Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('setTokens stores both tokens in localStorage', () => {
    setTokens('access123', 'refresh456');
    expect(localStorage.getItem('accessToken')).toBe('access123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh456');
  });

  it('getAccessToken retrieves token from localStorage', () => {
    localStorage.setItem('accessToken', 'my-token');
    expect(getAccessToken()).toBe('my-token');
  });

  it('getRefreshToken retrieves token from localStorage', () => {
    localStorage.setItem('refreshToken', 'my-refresh');
    expect(getRefreshToken()).toBe('my-refresh');
  });

  it('clearTokens removes both tokens from localStorage', () => {
    setTokens('a', 'b');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('API Client - apiFetch', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockFetch.mockReset();
    window.location = { href: '' };
  });

  it('attaches Authorization header when access token exists', async () => {
    setTokens('test-token', 'refresh-token');
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await apiFetch('/profiles/me');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = new Headers(options.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('does not attach Authorization header when no token', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await apiFetch('/profiles/me');

    const [, options] = mockFetch.mock.calls[0];
    const headers = new Headers(options.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('sets Content-Type to application/json for non-FormData body', async () => {
    setTokens('token', 'refresh');
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = new Headers(options.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('does not set Content-Type for FormData body', async () => {
    setTokens('token', 'refresh');
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.png');

    await apiFetch('/profiles/me/avatar', {
      method: 'POST',
      body: formData,
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = new Headers(options.headers);
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('attempts token refresh on 401 and retries request', async () => {
    setTokens('expired-token', 'valid-refresh');

    // First call returns 401
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'new-token' } }), { status: 200 })
    );
    // Retry call succeeds
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));

    const response = await apiFetch('/profiles/me');

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Verify the new token is stored
    expect(localStorage.getItem('accessToken')).toBe('new-token');
  });

  it('clears tokens and redirects to /login when refresh fails', async () => {
    setTokens('expired', 'invalid-refresh');

    // First call returns 401
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    // Refresh call fails
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));

    await apiFetch('/profiles/me');

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('clears tokens and redirects when no refresh token available', async () => {
    localStorage.setItem('accessToken', 'expired');
    // No refreshToken in localStorage

    // First call returns 401
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));

    await apiFetch('/profiles/me');

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});

describe('API Client - Convenience Methods', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockFetch.mockReset();
    setTokens('token', 'refresh');
  });

  it('apiGet parses JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { id: '1' } }), { status: 200 })
    );

    const result = await apiGet('/profiles/me');
    expect(result).toEqual({ success: true, data: { id: '1' } });
  });

  it('apiGet appends query params to URL', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
    );

    await apiGet('/jobs', { type: 'internship', keyword: 'design' });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/jobs?');
    expect(url).toContain('type=internship');
    expect(url).toContain('keyword=design');
  });

  it('apiGet skips undefined/null/empty params', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
    );

    await apiGet('/jobs', { type: 'internship', keyword: '', location: null });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('type=internship');
    expect(url).not.toContain('keyword');
    expect(url).not.toContain('location');
  });

  it('apiPost sends JSON body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { id: 'new' } }), { status: 201 })
    );

    const result = await apiPost('/projects', { title: 'My Project' });

    expect(result.data.id).toBe('new');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ title: 'My Project' });
  });

  it('apiPost handles FormData', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { url: 'blob://...' } }), { status: 200 })
    );

    const formData = new FormData();
    formData.append('file', new Blob(['img']), 'avatar.png');

    await apiPost('/profiles/me/avatar', formData);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBe(formData);
  });

  it('apiPut sends PUT request with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await apiPut('/profiles/me', { fullName: 'Updated' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('PUT');
  });

  it('apiPatch sends PATCH request', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await apiPatch('/projects/123/status', { status: 'public' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('PATCH');
  });

  it('apiDelete sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await apiDelete('/projects/123');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('DELETE');
  });

  it('convenience methods throw ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not found', code: 'NOT_FOUND' }), { status: 404 })
    );

    await expect(apiGet('/projects/nonexistent')).rejects.toThrow(ApiError);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Forbidden', code: 'FORBIDDEN' }), { status: 403 })
    );

    try {
      await apiGet('/projects/other');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('Forbidden');
    }
  });
});
