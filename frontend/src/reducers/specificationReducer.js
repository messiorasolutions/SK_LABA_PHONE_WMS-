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

const initialState = {
  list: [],
  loading: false,
  adding: false,
  updating: false,
  deleting: false,
  selected: null,
  error: null,
};

export default function specificationReducer(state = initialState, action) {
  switch (action.type) {
    case SPECIFICATION_FETCH_START:
      return { ...state, loading: true, error: null };
    case SPECIFICATION_FETCH_SUCCESS:
      return { ...state, loading: false, list: action.payload };
    case SPECIFICATION_FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case SPECIFICATION_ADD_START:
      return { ...state, adding: true, error: null };
    case SPECIFICATION_ADD_SUCCESS:
      return { ...state, adding: false };
    case SPECIFICATION_ADD_FAILURE:
      return { ...state, adding: false, error: action.payload };

    case SPECIFICATION_UPDATE_START:
      return { ...state, updating: true, error: null };
    case SPECIFICATION_UPDATE_SUCCESS:
      return { ...state, updating: false };
    case SPECIFICATION_UPDATE_FAILURE:
      return { ...state, updating: false, error: action.payload };

    case SPECIFICATION_DELETE_START:
      return { ...state, deleting: true, error: null };
    case SPECIFICATION_DELETE_SUCCESS:
      return { ...state, deleting: false };
    case SPECIFICATION_DELETE_FAILURE:
      return { ...state, deleting: false, error: action.payload };

    case SPECIFICATION_FIND_START:
      return { ...state, loading: true, error: null };
    case SPECIFICATION_FIND_SUCCESS:
      return { ...state, loading: false, selected: action.payload };
    case SPECIFICATION_FIND_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}
