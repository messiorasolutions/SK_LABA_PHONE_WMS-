// ============================================================
// USER SERVICE — SK LABA PHONE WMS (PDF 2 Section 8)
// Admin-only User & Role Management APIs
// ============================================================

import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const userService = {
  /**
   * API 8.3: List Users (GET /api/users)
   * ADMIN only. Supports pagination, search, role, and is_active filters.
   */
  getUsers: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.users.base, { params });
    return response.data;
  },

  /**
   * API 8.4: Get User Details (GET /api/users/:id)
   * ADMIN only.
   */
  getUserById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.users.byId(id));
    return response.data;
  },

  /**
   * API 8.5: Create User (POST /api/users)
   * ADMIN only + CSRF.
   * Body: { display_name, email, password, role, is_active }
   */
  createUser: async (userData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.users.base, userData);
    return response.data;
  },

  /**
   * API 8.6: Update User Profile or Role (PATCH /api/users/:id)
   * ADMIN only + CSRF.
   * Body: { display_name?, role? }
   */
  updateUser: async (id, updateData) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.users.byId(id), updateData);
    return response.data;
  },

  /**
   * API 8.7: Activate or Deactivate User (PATCH /api/users/:id/status)
   * ADMIN only + CSRF.
   * Body: { is_active: boolean }
   */
  updateUserStatus: async (id, isActive) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.users.status(id), {
      is_active: isActive,
    });
    return response.data;
  },
};

export default userService;
