import {
  HERO_SET_ACTIVE_TAB,
  HERO_SET_SEARCH,
  HERO_SET_CATEGORY,
  HERO_ADD_TO_CART,
} from '../constants/heroConstants';

export const setActiveTab = (tab) => ({
  type: HERO_SET_ACTIVE_TAB,
  payload: tab,
});

export const setSearchQuery = (query) => ({
  type: HERO_SET_SEARCH,
  payload: query,
});

export const setSelectedCategory = (category) => ({
  type: HERO_SET_CATEGORY,
  payload: category,
});

export const addToCart = () => ({
  type: HERO_ADD_TO_CART,
});
