import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Submit Back-in-Stock Notification Request (Public customer access)
 * @param {Object} payload { phone_id, customer_name, phone_number, email, notes }
 */
export const createBackInStockRequest = async (payload) => {
  return axiosInstance.post(API_ENDPOINTS.backInStockRequests.base, payload);
};

export default {
  createBackInStockRequest,
};
