import SpecificationService from '../services/specificationService';

import {
  SPECIFICATION_FETCH_START,
  SPECIFICATION_FETCH_SUCCESS,
  SPECIFICATION_FETCH_FAILURE,

  SPECIFICATION_ADD_START,
  SPECIFICATION_ADD_SUCCESS,
  SPECIFICATION_ADD_FAILURE,

  SPECIFICATION_UPDATE_START,
  SPECIFICATION_UPDATE_SUCCESS,
  SPECIFICATION_UPDATE_FAILURE,

  SPECIFICATION_DELETE_START,
  SPECIFICATION_DELETE_SUCCESS,
  SPECIFICATION_DELETE_FAILURE,

  SPECIFICATION_FIND_START,
  SPECIFICATION_FIND_SUCCESS,
  SPECIFICATION_FIND_FAILURE,
} from '../constants/specificationConstants';

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

export const fetchSpecifications = (type = '') => {
  return async (dispatch) => {
    dispatch({ type: SPECIFICATION_FETCH_START });

    try {
      const response = await SpecificationService.getSpecifications(type);
      const resBody = response.data;
      const list = Array.isArray(resBody?.data)
        ? resBody.data
        : Array.isArray(resBody)
        ? resBody
        : [];

      dispatch({
        type: SPECIFICATION_FETCH_SUCCESS,
        payload: list,
      });

      return { success: true, data: list };
    } catch (err) {
      const message = logAndExtractError('Fetch specifications', err);
      dispatch({ type: SPECIFICATION_FETCH_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const addSpecification = (specData) => {
  return async (dispatch) => {
    if (!specData?.specification_name) {
      const message = 'Specification name is required.';
      dispatch({ type: SPECIFICATION_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: SPECIFICATION_ADD_START });

    try {
      const response = await SpecificationService.createSpecification(specData);
      dispatch({
        type: SPECIFICATION_ADD_SUCCESS,
        payload: response.data?.data || specData,
      });

      dispatch(fetchSpecifications());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Add specification', err);
      dispatch({ type: SPECIFICATION_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const updateSpecification = (specId, specData) => {
  return async (dispatch) => {
    if (!specId || !specData?.specification_name) {
      const message = 'Specification ID and name are required.';
      dispatch({ type: SPECIFICATION_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: SPECIFICATION_UPDATE_START });

    try {
      const response = await SpecificationService.updateSpecification(specId, specData);
      dispatch({
        type: SPECIFICATION_UPDATE_SUCCESS,
        payload: response.data?.data || specData,
      });

      dispatch(fetchSpecifications());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Update specification', err);
      dispatch({ type: SPECIFICATION_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const deleteSpecification = (specId) => {
  return async (dispatch) => {
    if (!specId) {
      const message = 'Specification ID is required.';
      dispatch({ type: SPECIFICATION_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: SPECIFICATION_DELETE_START });

    try {
      await SpecificationService.deleteSpecification(specId);
      dispatch({
        type: SPECIFICATION_DELETE_SUCCESS,
        payload: specId,
      });

      dispatch(fetchSpecifications());
      return { success: true };
    } catch (err) {
      const message = logAndExtractError('Delete specification', err);
      dispatch({ type: SPECIFICATION_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

export const findSpecificationById = (specId) => {
  return async (dispatch) => {
    dispatch({ type: SPECIFICATION_FIND_START });

    try {
      const response = await SpecificationService.getSpecificationById(specId);
      const data = response.data?.data || response.data;
      dispatch({
        type: SPECIFICATION_FIND_SUCCESS,
        payload: data,
      });

      return { success: true, data };
    } catch (err) {
      const message = logAndExtractError('Find specification by ID', err);
      dispatch({ type: SPECIFICATION_FIND_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};
