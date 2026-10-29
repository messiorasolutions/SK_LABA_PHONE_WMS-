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

const initialState = {
  list: [],
  loading: false,
  adding: false,
  updating: false,
  deleting: false,
  selected: null,
  error: null,
};

export default function phoneReducer(state = initialState, action) {
  switch (action.type) {
    case PHONE_FETCH_START:
      return { ...state, loading: true, error: null };
    case PHONE_FETCH_SUCCESS:
      return { ...state, loading: false, list: action.payload };
    case PHONE_FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case PHONE_ADD_START:
      return { ...state, adding: true, error: null };
    case PHONE_ADD_SUCCESS:
      return { ...state, adding: false };
    case PHONE_ADD_FAILURE:
      return { ...state, adding: false, error: action.payload };

    case PHONE_UPDATE_START:
      return { ...state, updating: true, error: null };
    case PHONE_UPDATE_SUCCESS:
      return { ...state, updating: false };
    case PHONE_UPDATE_FAILURE:
      return { ...state, updating: false, error: action.payload };

    case PHONE_DELETE_START:
      return { ...state, deleting: true, error: null };
    case PHONE_DELETE_SUCCESS:
      return { ...state, deleting: false };
    case PHONE_DELETE_FAILURE:
      return { ...state, deleting: false, error: action.payload };

    case PHONE_FIND_START:
      return { ...state, loading: true, error: null };
    case PHONE_FIND_SUCCESS:
      return { ...state, loading: false, selected: action.payload };
    case PHONE_FIND_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}
