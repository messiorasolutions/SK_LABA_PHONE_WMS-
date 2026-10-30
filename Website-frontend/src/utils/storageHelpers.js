// ============================================================
// LOCAL STORAGE HELPERS FOR FAVORITES (C-06) & COMPARE (C-05)
// Saves items in the customer's browser without requiring login
// ============================================================

const FAVORITES_KEY = 'sk_laba_favorite_ids';
const COMPARE_KEY = 'sk_laba_compare_ids';

// ------------------------------------------------------------
// FAVORITES (SRS C-06)
// ------------------------------------------------------------
export const getFavoriteIds = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter((id) => !isNaN(id) && id > 0) : [];
  } catch (e) {
    console.error('Failed to load favorites from localStorage', e);
    return [];
  }
};

export const isPhoneFavorite = (phoneId) => {
  const ids = getFavoriteIds();
  return ids.includes(Number(phoneId));
};

export const toggleFavoriteId = (phoneId) => {
  const numericId = Number(phoneId);
  const ids = getFavoriteIds();
  let updated;
  let added = false;

  if (ids.includes(numericId)) {
    updated = ids.filter((id) => id !== numericId);
  } else {
    updated = [...ids, numericId];
    added = true;
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sk_laba_favorites_changed'));
  } catch (e) {
    console.error('Failed to save favorites to localStorage', e);
  }

  return { added, ids: updated };
};

export const removeFavoriteId = (phoneId) => {
  const numericId = Number(phoneId);
  const ids = getFavoriteIds();
  const updated = ids.filter((id) => id !== numericId);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sk_laba_favorites_changed'));
  } catch (e) {
    console.error('Failed to remove favorite from localStorage', e);
  }
  return updated;
};

// ------------------------------------------------------------
// COMPARE (SRS C-05: 2 to 3 phones side-by-side)
// ------------------------------------------------------------
export const getCompareIds = () => {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter((id) => !isNaN(id) && id > 0) : [];
  } catch (e) {
    console.error('Failed to load compare phones from localStorage', e);
    return [];
  }
};

export const isPhoneInCompare = (phoneId) => {
  const ids = getCompareIds();
  return ids.includes(Number(phoneId));
};

export const toggleCompareId = (phoneId) => {
  const numericId = Number(phoneId);
  const ids = getCompareIds();
  let updated;
  let added = false;
  let error = null;

  if (ids.includes(numericId)) {
    updated = ids.filter((id) => id !== numericId);
  } else {
    if (ids.length >= 3) {
      return {
        success: false,
        added: false,
        ids,
        error: 'You can compare a maximum of 3 phones at a time. Remove one to add this.',
      };
    }
    updated = [...ids, numericId];
    added = true;
  }

  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sk_laba_compare_changed'));
  } catch (e) {
    console.error('Failed to save compare to localStorage', e);
  }

  return { success: true, added, ids: updated, error };
};

export const removeCompareId = (phoneId) => {
  const numericId = Number(phoneId);
  const ids = getCompareIds();
  const updated = ids.filter((id) => id !== numericId);
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sk_laba_compare_changed'));
  } catch (e) {
    console.error('Failed to remove compare ID from localStorage', e);
  }
  return updated;
};

export const clearCompareIds = () => {
  try {
    localStorage.removeItem(COMPARE_KEY);
    window.dispatchEvent(new Event('sk_laba_compare_changed'));
  } catch (e) {
    console.error('Failed to clear compare IDs from localStorage', e);
  }
  return [];
};

