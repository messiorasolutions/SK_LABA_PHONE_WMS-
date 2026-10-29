import {
  HERO_SET_ACTIVE_TAB,
  HERO_SET_SEARCH,
  HERO_SET_CATEGORY,
  HERO_ADD_TO_CART,
} from '../constants/heroConstants';

const initialState = {
  activeTab: 'Home',
  searchQuery: '',
  selectedCategory: null,
  cartCount: 0,
};

export default function heroReducer(state = initialState, action) {
  switch (action.type) {
    case HERO_SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload,
      };

    case HERO_SET_SEARCH:
      return {
        ...state,
        searchQuery: action.payload,
      };

    case HERO_SET_CATEGORY:
      return {
        ...state,
        selectedCategory:
          state.selectedCategory === action.payload ? null : action.payload,
      };

    case HERO_ADD_TO_CART:
      return {
        ...state,
        cartCount: state.cartCount + 1,
      };

    default:
      return state;
  }
}
