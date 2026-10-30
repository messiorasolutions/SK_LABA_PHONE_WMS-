import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

// Create Phone
const createPhone = async (phoneData) => {
  return axiosInstance.post(API_ENDPOINTS.phones.base, phoneData);
};

// Fetch All Phones (filters: { brand_id, status, phone_condition, availability, search, price_min, price_max })
const getPhones = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return axiosInstance.get(API_ENDPOINTS.phones.base, { params: cleanParams });
};

// Find Phone by ID
const getPhoneById = async (phoneId) => {
  return axiosInstance.get(API_ENDPOINTS.phones.byId(phoneId));
};

// Update Phone
const updatePhone = async (phoneId, phoneData) => {
  return axiosInstance.put(API_ENDPOINTS.phones.byId(phoneId), phoneData);
};

// Delete Phone
const deletePhone = async (phoneId) => {
  return axiosInstance.delete(API_ENDPOINTS.phones.byId(phoneId));
};

// Compare Phones (C-05: 2 or 3 phone IDs)
const comparePhones = async (ids) => {
  const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
  return axiosInstance.get(API_ENDPOINTS.phones.compare, {
    params: { ids: idsParam },
  });
};

// Live details for saved favorites (C-06)
const getFavorites = async (ids) => {
  const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
  return axiosInstance.get(API_ENDPOINTS.phones.favorites, {
    params: { ids: idsParam },
  });
};

// Get Installment plans for a phone (C-03)
const getPhoneInstallments = async (phoneId) => {
  return axiosInstance.get(API_ENDPOINTS.phones.installments(phoneId));
};

// Check active offer for a phone (C-02 & C-03)
const getPhoneOffer = async (phoneId) => {
  return axiosInstance.get(API_ENDPOINTS.phones.offer(phoneId));
};

export {
  createPhone,
  getPhones,
  getPhones as getAllPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
  comparePhones,
  getFavorites,
  getPhoneInstallments,
  getPhoneOffer,
};

export default {
  createPhone,
  getPhones,
  getAllPhones: getPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
  comparePhones,
  getFavorites,
  getPhoneInstallments,
  getPhoneOffer,
};
