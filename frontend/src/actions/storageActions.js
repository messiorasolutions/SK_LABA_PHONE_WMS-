import StorageService from '../services/storageService';

import {
  STORAGE_FETCH_START,
  STORAGE_FETCH_SUCCESS,
  STORAGE_FETCH_FAILURE,

  STORAGE_ADD_START,
  STORAGE_ADD_SUCCESS,
  STORAGE_ADD_FAILURE,

  STORAGE_UPDATE_START,
  STORAGE_UPDATE_SUCCESS,
  STORAGE_UPDATE_FAILURE,

  STORAGE_DELETE_START,
  STORAGE_DELETE_SUCCESS,
  STORAGE_DELETE_FAILURE,

  STORAGE_FIND_START,
  STORAGE_FIND_SUCCESS,
  STORAGE_FIND_FAILURE,
} from '../constants/storageConstants';

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

export const fetchStorageOptions = () => {
  return async (dispatch) => {
    dispatch({ type: STORAGE_FETCH_START });

    try {
      const response = await StorageService.getStorageOptions();
      const resBody = response.data;
      const list = Array.isArray(resBody?.data)
        ? resBody.data
        : Array.isArray(resBody)
        ? resBody
        : [];

      dispatch({
        type: STORAGE_FETCH_SUCCESS,
        payload: list,
      });

      return { success: true, data: list };
    } catch (err) {
      const message = logAndExtractError('Fetch storage options', err);
      dispatch({ type: STORAGE_FETCH_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const addStorageOption = (storageData) => {
  return async (dispatch) => {
    if (!storageData?.storage_name || !storageData?.capacity_gb) {
      const message = 'Storage name and capacity are required.';
      dispatch({ type: STORAGE_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: STORAGE_ADD_START });

    try {
      const response = await StorageService.createStorageOption(storageData);
      dispatch({
        type: STORAGE_ADD_SUCCESS,
        payload: response.data?.data || storageData,
      });

      dispatch(fetchStorageOptions());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Add storage option', err);
      dispatch({ type: STORAGE_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const updateStorageOption = (storageId, storageData) => {
  return async (dispatch) => {
    if (!storageId || !storageData?.storage_name || !storageData?.capacity_gb) {
      const message = 'Storage ID, name and capacity are required.';
      dispatch({ type: STORAGE_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: STORAGE_UPDATE_START });

    try {
      const response = await StorageService.updateStorageOption(storageId, storageData);
      dispatch({
        type: STORAGE_UPDATE_SUCCESS,
        payload: response.data?.data || storageData,
      });

      dispatch(fetchStorageOptions());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Update storage option', err);
      dispatch({ type: STORAGE_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const deleteStorageOption = (storageId) => {
  return async (dispatch) => {
    if (!storageId) {
      const message = 'Storage ID is required.';
      dispatch({ type: STORAGE_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: STORAGE_DELETE_START });

    try {
      await StorageService.deleteStorageOption(storageId);
      dispatch({
        type: STORAGE_DELETE_SUCCESS,
        payload: storageId,
      });

      dispatch(fetchStorageOptions());
      return { success: true };
    } catch (err) {
      const message = logAndExtractError('Delete storage option', err);
      dispatch({ type: STORAGE_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const findStorageOptionById = (storageId) => {
  return async (dispatch) => {
    dispatch({ type: STORAGE_FIND_START });

    try {
      const response = await StorageService.getStorageOptionById(storageId);
      const data = response.data?.data || response.data;
      dispatch({
        type: STORAGE_FIND_SUCCESS,
        payload: data,
      });

      return { success: true, data };
    } catch (err) {
      const message = logAndExtractError('Find storage option by ID', err);
      dispatch({ type: STORAGE_FIND_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};
