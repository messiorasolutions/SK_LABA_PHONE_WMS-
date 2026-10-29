// ============================================================
// INQUIRY SERVICE — SK LABA PHONE WMS (PDF 1)
// Dashboard Inquiries Management & Status Updates
// ============================================================

import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const inquiryService = {
  /**
   * PDF 1 API 2: List Inquiries with Filters & Pagination
   */
  getInquiries: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.inquiries.base, { params });
    return response.data;
  },

  /**
   * PDF 1 API 3: Get Inquiry Details
   */
  getInquiryById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.inquiries.byId(id));
    return response.data;
  },

  /**
   * PDF 1 API 4: Update Inquiry Status & Staff Assignment
   * Body: { status: 'New' | 'In Progress' | 'Contacted' | 'Closed', assigned_to_user_id?: number | null }
   */
  updateInquiryStatus: async (id, payload) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.inquiries.status(id), payload);
    return response.data;
  },
};

export default inquiryService;
