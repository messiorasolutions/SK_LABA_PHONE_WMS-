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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Automatic 1-time retry for cold-start timeouts or transient network drops
    const isTimeoutOrNetwork =
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      !error.response;

    const isGetOrSafe = !config?.method || config.method.toLowerCase() === 'get';

    if (config && isTimeoutOrNetwork && isGetOrSafe && !config.__isRetry) {
      config.__isRetry = true;
      // Wait 1.5s for the server process to finish waking up, then retry seamlessly
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return axiosInstance(config);
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
