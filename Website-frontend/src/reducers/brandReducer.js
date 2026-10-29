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

const initialState = {
  list: [],
  loading: false,
  adding: false,
  updating: false,
  deleting: false,
  selected: null,
  error: null,
};

export default function brandReducer(state = initialState, action) {
  switch (action.type) {
    case BRAND_FETCH_START:
      return { ...state, loading: true, error: null };
    case BRAND_FETCH_SUCCESS:
      return { ...state, loading: false, list: action.payload };
    case BRAND_FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case BRAND_ADD_START:
      return { ...state, adding: true, error: null };
    case BRAND_ADD_SUCCESS:
      return { ...state, adding: false };
    case BRAND_ADD_FAILURE:
      return { ...state, adding: false, error: action.payload };

    case BRAND_UPDATE_START:
      return { ...state, updating: true, error: null };
    case BRAND_UPDATE_SUCCESS:
      return { ...state, updating: false };
    case BRAND_UPDATE_FAILURE:
      return { ...state, updating: false, error: action.payload };

    case BRAND_DELETE_START:
      return { ...state, deleting: true, error: null };
    case BRAND_DELETE_SUCCESS:
      return { ...state, deleting: false };
    case BRAND_DELETE_FAILURE:
      return { ...state, deleting: false, error: action.payload };

    case BRAND_FIND_START:
      return { ...state, loading: true, error: null };
    case BRAND_FIND_SUCCESS:
      return { ...state, loading: false, selected: action.payload };
    case BRAND_FIND_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}
