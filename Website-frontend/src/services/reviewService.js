import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const reviewService = {
  getApprovedReviews: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.reviews.base, { params });
    return response.data;
  },

  submitReview: async (reviewData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.reviews.base, reviewData);
    return response.data;
  },
};

export default reviewService;
