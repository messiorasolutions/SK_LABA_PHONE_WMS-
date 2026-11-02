import axiosInstance from './axiosInstance';

// Create Phone
export const createPhone = async (phoneData) => {
  return axiosInstance.post('/api/phones', phoneData);
};

// Fetch All Phones (filters: { brand_id, status, phone_condition, availability, search, archived, include_archived })
export const getPhones = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return axiosInstance.get('/api/phones', { params: cleanParams });
};

// Find Phone by ID
export const getPhoneById = async (phoneId) => {
  return axiosInstance.get(`/api/phones/${phoneId}`);
};

// Update Phone
export const updatePhone = async (phoneId, phoneData) => {
  return axiosInstance.put(`/api/phones/${phoneId}`, phoneData);
};

// Delete Phone
export const deletePhone = async (phoneId) => {
  return axiosInstance.delete(`/api/phones/${phoneId}`);
};

// Archive Phone (SRS MG-01)
export const archivePhone = async (phoneId) => {
  return axiosInstance.patch(`/api/phones/${phoneId}/archive`);
};

// Restore Phone (SRS MG-01)
export const restorePhone = async (phoneId, restoreStatus = 'DRAFT') => {
  return axiosInstance.patch(`/api/phones/${phoneId}/restore`, { restore_status: restoreStatus });
};

// Stock Management (SRS ST-05)
export const getStockList = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return axiosInstance.get('/api/phones/stock', { params: cleanParams });
};

export const addStock = async (phoneId, data) => {
  return axiosInstance.post(`/api/phones/${phoneId}/stock/add`, data);
};

export const removeStock = async (phoneId, data) => {
  return axiosInstance.post(`/api/phones/${phoneId}/stock/remove`, data);
};

export const markSoldOut = async (phoneId, resetQuantity = true) => {
  return axiosInstance.patch(`/api/phones/${phoneId}/stock/sold-out`, { reset_quantity: resetQuantity });
};

// Phone Comparison (SRS C-05)
export const comparePhones = async (ids) => {
  const rawIds = Array.isArray(ids) ? ids.join(',') : ids;
  return axiosInstance.get('/api/phones/compare', { params: { ids: rawIds } });
};

export default {
  createPhone,
  getPhones,
  getAllPhones: getPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
  archivePhone,
  restorePhone,
  getStockList,
  addStock,
  removeStock,
  markSoldOut,
  comparePhones,
};
