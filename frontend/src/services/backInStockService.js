// ============================================================
// BACK-IN-STOCK REQUEST SERVICE — SK LABA PHONE WMS
// Dashboard Request Management & Stock Alerts (Admin & Staff)
// ============================================================

import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const backInStockService = {
  /**
   * API 2: Grouped Requests by Phone (Aggregated View)
   * @param {Object} params { page, limit, search, status }
   */
  getGroupedRequests: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.backInStockRequests.grouped, { params });
    return response.data;
  },

  /**
   * API 3: Get Waiting Customers for a Specific Phone
   * @param {number|string} phoneId
   * @param {Object} params { status }
   */
  getWaitingCustomersForPhone: async (phoneId, params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.backInStockRequests.byPhoneId(phoneId), { params });
    return response.data;
  },

  /**
   * API 4: Paginated List of All Requests (Flat List with Filters)
   * @param {Object} params { page, limit, status, phone_id, search }
   */
  getAllRequests: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.backInStockRequests.base, { params });
    return response.data;
  },

  /**
   * API 5: Get Individual Request Details
   * @param {number|string} id
   */
  getRequestById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.backInStockRequests.byId(id));
    return response.data;
  },

  /**
   * API 6: Mark Request as Contacted
   * @param {number|string} id
   * @param {string} status 'Contacted'
   */
  markAsContacted: async (id, status = 'Contacted') => {
    const response = await axiosInstance.patch(API_ENDPOINTS.backInStockRequests.status(id), { status });
    return response.data;
  },

  /**
   * API 7: Assign Request to a Staff Member
   * @param {number|string} id
   * @param {number} assigned_to_user_id
   */
  assignRequest: async (id, assigned_to_user_id) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.backInStockRequests.assign(id), { assigned_to_user_id });
    return response.data;
  },
};

export default backInStockService;
