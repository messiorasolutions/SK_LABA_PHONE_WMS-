import axiosInstance from './axiosInstance';

export const getGiveaways = (params = {}) => {
  return axiosInstance.get('/api/giveaways', { params });
};

export const getGiveawayById = (id) => {
  return axiosInstance.get(`/api/giveaways/${id}`);
};

export default {
  getGiveaways,
  getGiveawayById,
};

