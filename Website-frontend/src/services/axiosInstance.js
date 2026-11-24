import axios from 'axios';

// Detect whether running in production / hosted domain (e.g. sklabaphone.com) or local dev
const isHostedDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('sklabaphone.com') ||
    (!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.hostname !== ''));

const rawBaseUrl = isHostedDomain
  ? ((typeof import.meta !== 'undefined' && import.meta?.env?.VITE_HOSTED_API_BASE_URL) || 'https://api.sklabaphone.com')
  : ((typeof import.meta !== 'undefined' && (import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL)) || 'http://localhost:5000');



export const API_BASE_URL = (rawBaseUrl || 'https://api.sklabaphone.com').replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Standard 15 seconds timeout
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData || (config.data && typeof config.data.append === 'function')) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track in-flight retry requests to prevent duplicate retries of identical in-flight requests
const inFlightRetries = new Set();

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) {
      return Promise.reject(error);
    }

    const isGet = !config.method || config.method.toUpperCase() === 'GET';
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      Boolean(error.message && error.message.toLowerCase().includes('timeout'));

    // Rule: NEVER retry on timeout/ECONNABORTED
    if (isTimeout) {
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      return Promise.reject(error);
    }

    // Rule: At most ONE retry, only for network errors / 5xx on idempotent GETs
    // Never while the same request is in flight
    if (!config.__isRetry && isGet) {
      const is5xx = Boolean(error.response && error.response.status >= 500 && error.response.status < 600);
      const isNetworkError = !error.response && !isTimeout;

      if (isNetworkError || is5xx) {
        const reqKey = `${config.method?.toUpperCase() || 'GET'}:${config.url || ''}:${JSON.stringify(config.params || {})}`;

        if (!inFlightRetries.has(reqKey)) {
          inFlightRetries.add(reqKey);
          config.__isRetry = true;
          try {
            // 1 s backoff
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await axiosInstance(config);
          } finally {
            inFlightRetries.delete(reqKey);
          }
        }
      }
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
