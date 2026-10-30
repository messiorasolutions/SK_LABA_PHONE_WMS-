import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Submit a customer inquiry (C-08)
 * @param {Object} inquiryData { name, phone_number, message, phone_id }
 */
export const createInquiry = async (inquiryData) => {
  return axiosInstance.post(API_ENDPOINTS.inquiries.base, inquiryData);
};

export default {
  createInquiry,
};

