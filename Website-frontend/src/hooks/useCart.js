import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'sk_laba_cart_items';

export function getStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('sk_laba_cart_updated', { detail: { items } }));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
}

export function useCart() {
  const [cartItems, setCartItems] = useState(getStoredCart());

  const syncCart = useCallback(() => {
    setCartItems(getStoredCart());
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener('sk_laba_cart_updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('sk_laba_cart_updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, [syncCart]);

  const addToCart = useCallback((product) => {
    const current = getStoredCart();
    const itemKey = `${product.phone_id || product.id}_${product.color || 'def'}_${product.storage || 'def'}`;
    
    const existingIndex = current.findIndex(
      (item) => item.key === itemKey
    );

    let updated;
    if (existingIndex > -1) {
      updated = current.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) }
          : item
      );
    } else {
      updated = [
        ...current,
        {
          key: itemKey,
          phone_id: product.phone_id || product.id,
          name: product.name,
          brand_name: product.brand_name || '',
          color: product.color || product.selectedColor || 'Standard',
          storage: product.storage || product.selectedStorage || 'Standard',
          price: Number(product.price || product.effectivePrice || 0),
          photo: product.photo || product.image_url || '',
          quantity: product.quantity || 1,
          added_at: Date.now(),
        },
      ];
    }

    saveStoredCart(updated);
    return true;
  }, []);

  const removeFromCart = useCallback((itemKey) => {
    const current = getStoredCart();
    const updated = current.filter((item) => item.key !== itemKey);
    saveStoredCart(updated);
  }, []);

  const updateQuantity = useCallback((itemKey, delta) => {
    const current = getStoredCart();
    const updated = current
      .map((item) => {
        if (item.key === itemKey) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    saveStoredCart(updated);
  }, []);

  const clearCart = useCallback(() => {
    saveStoredCart([]);
  }, []);

  const totalCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice,
  };
}

export default useCart;

