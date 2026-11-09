import axiosInstance from './axiosInstance';

export const getShopInfo = async () => {
  const response = await axiosInstance.get('/api/shop-info');
  return response.data?.data;
};

export const updateShopInfo = async (payload) => {
  const response = await axiosInstance.put('/api/shop-info', payload);
  return response.data;
};

export default {
  getShopInfo,
  updateShopInfo,
};

