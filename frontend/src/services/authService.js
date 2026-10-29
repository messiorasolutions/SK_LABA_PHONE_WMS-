// ============================================================
// AUTH SERVICE — SK LABA PHONE WMS (PDF 2)
// Handles Login, Session Validation, Logout & Password Reset
// ============================================================

import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const authService = {
  /**
   * API 1: Dashboard User Login (POST /api/auth/login)
   * Public endpoint, rate-limited to 5 attempts per 15 min per IP
   */
  login: async (email, password) => {
    const response = await axiosInstance.post(API_ENDPOINTS.auth.login, {
      email,
      password,
    });
    return response.data;
  },

  /**
   * API 2: Get Current User Profile (GET /api/auth/me)
   * Validates active session cookie and returns user details
   */
  getMe: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.auth.me);
    return response.data;
  },

  /**
   * API 3: User Logout (POST /api/auth/logout)
   * Invalidates server-side session and clears sk_laba_sid cookie
   */
  logout: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.auth.logout, {});
    return response.data;
  },

  /**
   * API 4: Get Session CSRF Token (GET /api/auth/csrf-token)
   * Restores CSRF token after hard refresh
   */
  getCsrfToken: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.auth.csrfToken);
    return response.data;
  },

  /**
   * API 5: Forgot Password (POST /api/auth/forgot-password)
   * Request password reset link. Generic response returned.
   */
  forgotPassword: async (email) => {
    const response = await axiosInstance.post(API_ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  },

  /**
   * API 6: Reset Password (POST /api/auth/reset-password)
   * Consumes single-use reset token and sets new password
   */
  resetPassword: async (token, newPassword) => {
    const response = await axiosInstance.post(API_ENDPOINTS.auth.resetPassword, {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
