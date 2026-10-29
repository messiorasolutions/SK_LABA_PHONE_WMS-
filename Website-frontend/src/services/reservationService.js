import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Submit a customer reservation request (C-09)
 * @param {Object} reservationData { customer_name, phone_number, email, phone_id, selected_options, preferred_collection_date, customer_note }
 */
export const createReservation = async (reservationData) => {
  return axiosInstance.post(API_ENDPOINTS.reservations.base, reservationData);
};

export default {
  createReservation,
};

