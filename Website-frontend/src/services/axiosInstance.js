import axios from 'axios';

// Detect whether running in production / hosted domain (e.g. sklabaphone.com) or local dev
const isHostedDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('sklabaphone.com') ||
    (!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.hostname !== ''));

const rawBaseUrl = isHostedDomain
  ? (import.meta.env.VITE_HOSTED_API_BASE_URL || 'https://api.sklabaphone.com')
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000');

export const API_BASE_URL = (rawBaseUrl || 'https://api.sklabaphone.com').replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
