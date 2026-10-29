import axiosInstance from './axiosInstance';

// Create Phone
const createPhone = async (phoneData) => {
  return axiosInstance.post('/api/phones', phoneData);
};

// Fetch All Phones (filters: { brand_id, status, phone_condition, availability, search })
const getPhones = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  return axiosInstance.get('/api/phones', { params: cleanParams });
};

// Find Phone by ID
const getPhoneById = async (phoneId) => {
  return axiosInstance.get(`/api/phones/${phoneId}`);
};

// Update Phone
const updatePhone = async (phoneId, phoneData) => {
  return axiosInstance.put(`/api/phones/${phoneId}`, phoneData);
};

// Delete Phone
const deletePhone = async (phoneId) => {
  return axiosInstance.delete(`/api/phones/${phoneId}`);
};

export {
  createPhone,
  getPhones,
  getPhones as getAllPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
};

export default {
  createPhone,
  getPhones,
  getAllPhones: getPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
};
