import { useState, useEffect, useCallback } from 'react';
import {
  getFavoriteIds,
  toggleFavoriteId,
  removeFavoriteId,
  getCompareIds,
  toggleCompareId,
  removeCompareId,
  clearCompareIds,
} from '../utils/storageHelpers';

export function useFavoritesAndCompare() {
  const [favoriteIds, setFavoriteIds] = useState(getFavoriteIds);
  const [compareIds, setCompareIds] = useState(getCompareIds);

  useEffect(() => {
    const handleFavChange = () => setFavoriteIds(getFavoriteIds());
    const handleCompChange = () => setCompareIds(getCompareIds());

    window.addEventListener('sk_laba_favorites_changed', handleFavChange);
    window.addEventListener('sk_laba_compare_changed', handleCompChange);

    return () => {
      window.removeEventListener('sk_laba_favorites_changed', handleFavChange);
      window.removeEventListener('sk_laba_compare_changed', handleCompChange);
    };
  }, []);

  const toggleFavorite = useCallback((id) => {
    return toggleFavoriteId(id);
  }, []);

  const removeFavorite = useCallback((id) => {
    return removeFavoriteId(id);
  }, []);

  const toggleCompare = useCallback((id) => {
    return toggleCompareId(id);
  }, []);

  const removeCompare = useCallback((id) => {
    return removeCompareId(id);
  }, []);

  const clearCompare = useCallback(() => {
    return clearCompareIds();
  }, []);

  return {
    favoriteIds,
    compareIds,
    isFavorite: (id) => favoriteIds.includes(Number(id)),
    isInCompare: (id) => compareIds.includes(Number(id)),
    toggleFavorite,
    removeFavorite,
    toggleCompare,
    removeCompare,
    clearCompare,
  };
}

export default useFavoritesAndCompare;

