import axiosInstance from './axiosInstance';

export const getOffers = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return axiosInstance.get('/api/offers', { params: cleanParams });
};

export const getOfferById = async (offerId) => {
  return axiosInstance.get(`/api/offers/${offerId}`);
};

export const createOffer = async (offerData) => {
  return axiosInstance.post('/api/offers', offerData);
};

export const updateOffer = async (offerId, offerData) => {
  return axiosInstance.put(`/api/offers/${offerId}`, offerData);
};

export const deleteOffer = async (offerId) => {
  return axiosInstance.delete(`/api/offers/${offerId}`);
};

export const getActiveOffers = async () => {
  return axiosInstance.get('/api/offers/active');
};

export default {
  getOffers,
  getAllOffers: getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  getActiveOffers,
};
