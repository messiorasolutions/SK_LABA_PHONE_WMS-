import PhoneService from '../services/phoneService';

import {
  PHONE_FETCH_START,
  PHONE_FETCH_SUCCESS,
  PHONE_FETCH_FAILURE,

  PHONE_ADD_START,
  PHONE_ADD_SUCCESS,
  PHONE_ADD_FAILURE,

  PHONE_UPDATE_START,
  PHONE_UPDATE_SUCCESS,
  PHONE_UPDATE_FAILURE,

  PHONE_DELETE_START,
  PHONE_DELETE_SUCCESS,
  PHONE_DELETE_FAILURE,

  PHONE_FIND_START,
  PHONE_FIND_SUCCESS,
  PHONE_FIND_FAILURE,
} from '../constants/phoneConstants';

function logAndExtractError(label, err) {
  console.warn(`${label} — request failed`);

  if (err.response) {
    return (
      err.response.data?.message ||
      err.response.data?.error ||
      (typeof err.response.data === 'string' ? err.response.data : null) ||
      `Server returned ${err.response.status}`
    );
  } else if (err.request) {
    return 'No response from server — check your network connection and API URL.';
  }

  return err.message || 'Something went wrong.';
}

export const fetchPhones = (filters = {}) => {
  return async (dispatch) => {
    dispatch({ type: PHONE_FETCH_START });

    try {
      const response = await PhoneService.getPhones(filters);
      const resBody = response.data;
      const list = Array.isArray(resBody?.data)
        ? resBody.data
        : Array.isArray(resBody)
        ? resBody
        : [];

      dispatch({
        type: PHONE_FETCH_SUCCESS,
        payload: list,
      });

      return { success: true, data: list };
    } catch (err) {
      const message = logAndExtractError('Fetch phones', err);
      dispatch({ type: PHONE_FETCH_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const addPhone = (phoneData) => {
  return async (dispatch) => {
    if (!phoneData?.name || !phoneData?.brand_id || !phoneData?.price) {
      const message = 'Phone name, brand and price are required.';
      dispatch({ type: PHONE_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: PHONE_ADD_START });

    try {
      const response = await PhoneService.createPhone(phoneData);
      dispatch({
        type: PHONE_ADD_SUCCESS,
        payload: response.data?.data || phoneData,
      });

      dispatch(fetchPhones());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Add phone', err);
      dispatch({ type: PHONE_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const updatePhone = (phoneId, phoneData) => {
  return async (dispatch) => {
    if (!phoneId) {
      const message = 'Phone ID is required.';
      dispatch({ type: PHONE_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: PHONE_UPDATE_START });

    try {
      const response = await PhoneService.updatePhone(phoneId, phoneData);
      dispatch({
        type: PHONE_UPDATE_SUCCESS,
        payload: response.data?.data || phoneData,
      });

      dispatch(fetchPhones());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Update phone', err);
      dispatch({ type: PHONE_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const deletePhone = (phoneId) => {
  return async (dispatch) => {
    if (!phoneId) {
      const message = 'Phone ID is required.';
      dispatch({ type: PHONE_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: PHONE_DELETE_START });

    try {
      await PhoneService.deletePhone(phoneId);
      dispatch({
        type: PHONE_DELETE_SUCCESS,
        payload: phoneId,
      });

      dispatch(fetchPhones());
      return { success: true };
    } catch (err) {
      const message = logAndExtractError('Delete phone', err);
      dispatch({ type: PHONE_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const findPhoneById = (phoneId) => {
  return async (dispatch) => {
    dispatch({ type: PHONE_FIND_START });

    try {
      const response = await PhoneService.getPhoneById(phoneId);
      const data = response.data?.data || response.data;
      dispatch({
        type: PHONE_FIND_SUCCESS,
        payload: data,
      });

      return { success: true, data };
    } catch (err) {
      const message = logAndExtractError('Find phone by ID', err);
      dispatch({ type: PHONE_FIND_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};
