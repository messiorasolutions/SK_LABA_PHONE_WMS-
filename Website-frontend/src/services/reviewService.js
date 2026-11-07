import axiosInstance from './axiosInstance.js';
import { API_ENDPOINTS } from '../constants/apiEndpoints.js';
import { createServiceCache } from './cacheHelper.js';

// In-memory cache for approved reviews (3-minute TTL)
const reviewsCache = createServiceCache({ ttlMs: 3 * 60 * 1000 });

export const reviewService = {
  getApprovedReviews: async (params = {}, options = {}) => {
    const forceRefresh = typeof options === 'boolean'
      ? options
      : Boolean(options?.forceRefresh || params?.forceRefresh);

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([k, v]) => k !== 'forceRefresh' && v !== '' && v !== null && v !== undefined)
    );

    return reviewsCache.execute(
      cleanParams,
      async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.reviews.base, { params: cleanParams });
        return response.data;
      },
      forceRefresh
    );
  },

  submitReview: async (reviewData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.reviews.base, reviewData);
    reviewsCache.clear(); // Invalidate reviews cache on new submission
    return response.data;
  },

  clearReviewsCache: () => {
    reviewsCache.clear();
  },
};

export const getApprovedReviews = reviewService.getApprovedReviews;
export const submitReview = reviewService.submitReview;
export const clearReviewsCache = reviewService.clearReviewsCache;
export { reviewsCache };

export default reviewService;
