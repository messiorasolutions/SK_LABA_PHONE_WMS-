import {
  HERO_SET_ACTIVE_TAB,
  HERO_SET_SEARCH,
  HERO_SET_CATEGORY,
  HERO_ADD_TO_CART,
} from '../constants/heroConstants';

const getInitialActiveTab = () => {
  if (typeof window === 'undefined') return 'Home';
  const hash = (window.location.hash || '').toLowerCase();
  const pathname = (window.location.pathname || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();

  if (
    hash.startsWith('#smartphones') ||
    hash.includes('phone=') ||
    hash.includes('phoneid=') ||
    search.includes('phone=') ||
    search.includes('phoneid=') ||
    pathname === '/smartphones'
  ) {
    return 'Smartphones';
  } else if (hash.startsWith('#marketplace') || pathname === '/marketplace') {
    return 'Marketplace';
  } else if (hash.startsWith('#sell-your-phone') || pathname === '/sell-your-phone') {
    return 'SellYourPhone';
  } else if (hash.startsWith('#giveaways') || pathname === '/giveaways') {
    return 'Giveaways';
  } else if (hash.startsWith('#contact') || pathname === '/contact') {
    return 'Contact Us';
  }
  return 'Home';
};

const initialState = {
  activeTab: getInitialActiveTab(),
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
