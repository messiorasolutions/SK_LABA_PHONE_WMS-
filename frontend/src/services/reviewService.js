import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const reviewService = {
  getAdminReviews: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.reviews.base, { params });
    return response.data;
  },

  getReviewById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.reviews.byId(id));
    return response.data;
  },

  moderateReview: async (id, status) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.reviews.status(id), { status });
    return response.data;
  },
};

export default reviewService;
