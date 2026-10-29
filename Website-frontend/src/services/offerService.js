import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Fetch all active promotional offers (C-12)
 */
export const getActiveOffers = async () => {
  return axiosInstance.get(API_ENDPOINTS.offers.active);
};

export default {
  getActiveOffers,
};

