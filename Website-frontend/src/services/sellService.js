import axios from 'axios';
import { API_BASE_URL } from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const submitSellRequest = async (formData) => {
  const baseUrl = API_BASE_URL || 'http://localhost:5000';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}${API_ENDPOINTS.sellRequests.base}`;

  const response = await axios.post(endpoint, formData);
  return response.data;
};

export default {
  submitSellRequest,
};
