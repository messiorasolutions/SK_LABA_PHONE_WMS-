
import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const sellRequestService = {
  getSellRequests: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.sellRequests.base, { params });
    return response.data;
  },

  getSellRequestById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.sellRequests.byId(id));
    return response.data;
  },

  updateSellRequestStatus: async (id, payload) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.sellRequests.status(id), payload);
    return response.data;
  },

  assignSellRequest: async (id, assigned_to_user_id) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.sellRequests.assign(id), {
      assigned_to_user_id,
    });
    return response.data;
  },

  getSellRequestPhotoBlob: async (id, filename) => {
    const response = await axiosInstance.get(API_ENDPOINTS.sellRequests.photo(id, filename), {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default sellRequestService;
