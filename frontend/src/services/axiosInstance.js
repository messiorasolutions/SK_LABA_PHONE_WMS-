// ============================================================
// AXIOS INSTANCE — SK LABA PHONE WMS DASHBOARD
// Handles Cookie Sessions (sk_laba_sid) & CSRF Protection
// Compliant with Authentication API Documentation (PDF)
// ============================================================

import axios from 'axios';

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Automatically includes HttpOnly session cookie sk_laba_sid
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach X-CSRF-Token on state-mutating requests (PDF Section 1.3 & 8.8)
axiosInstance.interceptors.request.use(
  (config) => {
    const csrfToken = sessionStorage.getItem('csrfToken');
    const method = (config.method || 'get').toLowerCase();

    // Check if endpoint is a public auth endpoint (exempt from CSRF requirement per Section 1.3)
    const isPublicAuth =
      config.url &&
      (config.url.includes('/auth/login') ||
        config.url.includes('/auth/forgot-password') ||
        config.url.includes('/auth/reset-password'));

    // CSRF header required for authenticated POST, PUT, PATCH, DELETE requests
    if (!isPublicAuth && csrfToken && ['post', 'put', 'patch', 'delete'].includes(method)) {
      config.headers = config.headers || {};
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

    // 2. Centralized 401 Session Expiry handling (PDF Section 4.3 & Section 5)
    if (error.response?.status === 401 && originalRequest) {
      const isAuthCheck =
        originalRequest.url &&
        (originalRequest.url.includes('/auth/me') || originalRequest.url.includes('/auth/login'));

      if (!isAuthCheck) {
        sessionStorage.removeItem('csrfToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
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
