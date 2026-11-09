import axiosInstance from './axiosInstance';

export const getShopInfo = async () => {
  const response = await axiosInstance.get('/api/shop-info');
  return response.data?.data;
};

export default {
  getShopInfo,
};

