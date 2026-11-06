import axiosInstance from './axiosInstance';

const GiveawayService = {
  getGiveaways: (params = {}) => {
    return axiosInstance.get('/api/giveaways', { params });
  },

  getDashboardOverview: () => {
    return axiosInstance.get('/api/giveaways/overview');
  },

  getGiveawayById: (id) => {
    return axiosInstance.get(`/api/giveaways/${id}`);
  },

  createGiveaway: (data) => {
    return axiosInstance.post('/api/giveaways', data);
  },

  updateGiveaway: (id, data) => {
    return axiosInstance.put(`/api/giveaways/${id}`, data);
  },

  deleteGiveaway: (id) => {
    return axiosInstance.delete(`/api/giveaways/${id}`);
  },

  extendEndDate: (id, endDate) => {
    return axiosInstance.patch(`/api/giveaways/${id}/extend`, { end_date: endDate });
  },

  manuallyClose: (id) => {
    return axiosInstance.patch(`/api/giveaways/${id}/close`);
  },

  publishWinners: (id, winners) => {
    return axiosInstance.post(`/api/giveaways/${id}/winners`, { winners });
  },
};

export default GiveawayService;

