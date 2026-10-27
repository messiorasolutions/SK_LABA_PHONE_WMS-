import BrandService from '../services/brandService';

import {
  BRAND_FETCH_START,
  BRAND_FETCH_SUCCESS,
  BRAND_FETCH_FAILURE,

  BRAND_ADD_START,
  BRAND_ADD_SUCCESS,
  BRAND_ADD_FAILURE,

  BRAND_UPDATE_START,
  BRAND_UPDATE_SUCCESS,
  BRAND_UPDATE_FAILURE,

  BRAND_DELETE_START,
  BRAND_DELETE_SUCCESS,
  BRAND_DELETE_FAILURE,

  BRAND_FIND_START,
  BRAND_FIND_SUCCESS,
  BRAND_FIND_FAILURE,
} from '../constants/brandConstants';

// ============================================================
// ERROR HANDLER (Sample Pattern)
// ============================================================

function logAndExtractError(label, err) {
  console.warn(`${label} — request failed`);

  if (err.response) {
    console.warn(`${label} — status:`, err.response.status);
    console.warn(`${label} — response body:`, JSON.stringify(err.response.data));
    console.warn(`${label} — request URL:`, err.config?.url);
    console.warn(`${label} — request payload:`, JSON.stringify(err.config?.data));

    return (
      err.response.data?.message ||
      err.response.data?.error ||
      (typeof err.response.data === 'string' ? err.response.data : null) ||
      `Server returned ${err.response.status}`
    );
  } else if (err.request) {
    console.warn(`${label} — no response received. Check API URL and network.`);
    return 'No response from server — check your network connection and API URL.';
  }

  console.warn(`${label} — setup error:`, err.message);
  return err.message || 'Something went wrong.';
}

// ============================================================
// FETCH ALL BRANDS
// ============================================================

export const fetchBrands = () => {
  return async (dispatch) => {
    dispatch({ type: BRAND_FETCH_START });

    try {
      const response = await BrandService.getBrands();
      const resBody = response.data;
      const list = Array.isArray(resBody?.data)
        ? resBody.data
        : Array.isArray(resBody)
        ? resBody
        : [];

      dispatch({
        type: BRAND_FETCH_SUCCESS,
        payload: list,
      });

      return { success: true, data: list };
    } catch (err) {
      const message = logAndExtractError('Fetch brands', err);

      dispatch({
        type: BRAND_FETCH_FAILURE,
        payload: message,
      });

      return { success: false, error: message };
    }
  };
};

// ============================================================
// ADD BRAND
// ============================================================

export const addBrand = (brandData) => {
  return async (dispatch) => {
    if (!brandData?.brand_name) {
      const message = 'Brand name is required.';
      dispatch({ type: BRAND_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: BRAND_ADD_START });

    try {
      const response = await BrandService.createBrand(brandData);
      dispatch({
        type: BRAND_ADD_SUCCESS,
        payload: response.data?.data || brandData,
      });

      dispatch(fetchBrands());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Add brand', err);
      dispatch({ type: BRAND_ADD_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

// ============================================================
// UPDATE BRAND
// ============================================================

export const updateBrand = (brandId, brandData) => {
  return async (dispatch) => {
    if (!brandId || !brandData?.brand_name) {
      const message = 'Brand ID and name are required.';
      dispatch({ type: BRAND_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: BRAND_UPDATE_START });

    try {
      const response = await BrandService.updateBrand(brandId, brandData);
      dispatch({
        type: BRAND_UPDATE_SUCCESS,
        payload: response.data?.data || brandData,
      });

      dispatch(fetchBrands());
      return { success: true, data: response.data };
    } catch (err) {
      const message = logAndExtractError('Update brand', err);
      dispatch({ type: BRAND_UPDATE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

// ============================================================
// DELETE BRAND
// ============================================================

export const deleteBrand = (brandId) => {
  return async (dispatch) => {
    if (!brandId) {
      const message = 'Brand ID is required.';
      dispatch({ type: BRAND_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }

    dispatch({ type: BRAND_DELETE_START });

    try {
      await BrandService.deleteBrand(brandId);
      dispatch({
        type: BRAND_DELETE_SUCCESS,
        payload: brandId,
      });

      dispatch(fetchBrands());
      return { success: true };
    } catch (err) {
      const message = logAndExtractError('Delete brand', err);
      dispatch({ type: BRAND_DELETE_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};

// ============================================================
// FIND BRAND BY ID
// ============================================================

export const findBrandById = (brandId) => {
  return async (dispatch) => {
    dispatch({ type: BRAND_FIND_START });

    try {
      const response = await BrandService.getBrandById(brandId);
      const data = response.data?.data || response.data;
      dispatch({
        type: BRAND_FIND_SUCCESS,
        payload: data,
      });

      return { success: true, data };
    } catch (err) {
      const message = logAndExtractError('Find brand by ID', err);
      dispatch({ type: BRAND_FIND_FAILURE, payload: message });
      return { success: false, error: message };
    }
  };
};
