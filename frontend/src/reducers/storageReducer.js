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

const initialState = {
  list: [],
  loading: false,
  adding: false,
  updating: false,
  deleting: false,
  selected: null,
  error: null,
};

export default function storageReducer(state = initialState, action) {
  switch (action.type) {
    case STORAGE_FETCH_START:
      return { ...state, loading: true, error: null };
    case STORAGE_FETCH_SUCCESS:
      return { ...state, loading: false, list: action.payload };
    case STORAGE_FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case STORAGE_ADD_START:
      return { ...state, adding: true, error: null };
    case STORAGE_ADD_SUCCESS:
      return { ...state, adding: false };
    case STORAGE_ADD_FAILURE:
      return { ...state, adding: false, error: action.payload };

    case STORAGE_UPDATE_START:
      return { ...state, updating: true, error: null };
    case STORAGE_UPDATE_SUCCESS:
      return { ...state, updating: false };
    case STORAGE_UPDATE_FAILURE:
      return { ...state, updating: false, error: action.payload };

    case STORAGE_DELETE_START:
      return { ...state, deleting: true, error: null };
    case STORAGE_DELETE_SUCCESS:
      return { ...state, deleting: false };
    case STORAGE_DELETE_FAILURE:
      return { ...state, deleting: false, error: action.payload };

    case STORAGE_FIND_START:
      return { ...state, loading: true, error: null };
    case STORAGE_FIND_SUCCESS:
      return { ...state, loading: false, selected: action.payload };
    case STORAGE_FIND_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}
