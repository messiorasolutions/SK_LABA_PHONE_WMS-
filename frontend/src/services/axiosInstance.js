// ============================================================
// AXIOS INSTANCE — SK LABA PHONE WMS DASHBOARD
// Handles Cookie Sessions (sk_laba_sid) & CSRF Protection
// Compliant with Authentication API Documentation (PDF)
// ============================================================

import axios from 'axios';

const isHostedDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('sklabaphone.com') ||
    (!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.hostname !== ''));

const rawBaseUrl = isHostedDomain
  ? 'https://api.sklabaphone.com'
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000');

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Automatically includes HttpOnly session cookie sk_laba_sid
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000, // 25 seconds timeout for admin dashboard operations
});

// Request interceptor: Attach Session/Bearer Token and X-CSRF-Token (PDF Section 1.3 & 8.8)
axiosInstance.interceptors.request.use(
  (config) => {
    const csrfToken = sessionStorage.getItem('csrfToken');
    const sessionToken = sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken');
    const method = (config.method || 'get').toLowerCase();

    config.headers = config.headers || {};

    // Attach Session Token as both Authorization Bearer and X-Session-Token header for bulletproof cross-domain auth
    if (sessionToken) {
      config.headers['Authorization'] = `Bearer ${sessionToken}`;
      config.headers['X-Session-Token'] = sessionToken;
    }

    // Check if endpoint is a public auth endpoint (exempt from CSRF requirement per Section 1.3)
    const isPublicAuth =
      config.url &&
      (config.url.includes('/auth/login') ||
        config.url.includes('/auth/forgot-password') ||
        config.url.includes('/auth/reset-password'));

    // CSRF header required for authenticated POST, PUT, PATCH, DELETE requests
    if (!isPublicAuth && csrfToken && ['post', 'put', 'patch', 'delete'].includes(method)) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: format error messages, handle CSRF retry & handle session expiry (PDF Section 4.3 & 8.9)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 0. Auto-retry once on timeout / network drop for GET requests (cold start absorption)
    const isTimeoutOrNetwork =
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      !error.response;

    const isGetOrSafe = !originalRequest?.method || originalRequest.method.toLowerCase() === 'get';

    if (originalRequest && isTimeoutOrNetwork && isGetOrSafe && !originalRequest._timeoutRetry) {
      originalRequest._timeoutRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return axiosInstance(originalRequest);
    }

    // 1. Check for CSRF mismatch (403 Forbidden with CSRF message) to attempt one retry (Section 4.3)
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry &&
      error.response?.data?.message?.toLowerCase().includes('csrf')
    ) {
      originalRequest._retry = true;
      try {
        const csrfRes = await axios.get(`${API_BASE_URL}/api/auth/csrf-token`, {
          withCredentials: true,
        });
        if (csrfRes.data?.csrfToken) {
          sessionStorage.setItem('csrfToken', csrfRes.data.csrfToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['X-CSRF-Token'] = csrfRes.data.csrfToken;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        // Failed to refresh CSRF, proceed with rejection
      }
    }

    // 2. Centralized 401 Session Expiry handling — verify before redirecting to avoid kicking active users out
    if (error.response?.status === 401 && originalRequest && !originalRequest._authRetry) {
      originalRequest._authRetry = true;
      const isAuthCheck =
        originalRequest.url &&
        (originalRequest.url.includes('/auth/me') || originalRequest.url.includes('/auth/login'));

      if (!isAuthCheck) {
        const sessionToken = sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken');
        try {
          // Double check if the user session is still alive before tearing down state
          const meRes = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            withCredentials: true,
            headers: sessionToken
              ? {
                  Authorization: `Bearer ${sessionToken}`,
                  'X-Session-Token': sessionToken,
                }
              : {},
          });
          if (meRes.data?.success && meRes.data?.data?.user) {
            // Session is still valid; retry the original request
            return axiosInstance(originalRequest);
          }
        } catch (authErr) {
          // Only redirect if /api/auth/me confirms session is dead
          if (authErr.response?.status === 401) {
            sessionStorage.removeItem('csrfToken');
            sessionStorage.removeItem('sessionToken');
            localStorage.removeItem('sessionToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
      }
    }

    // Format backend error message
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
