import React, { useEffect } from 'react';
import { X, Trash2, ShoppingCart, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export default function CartModal({
  isOpen,
  onClose,
  onCheckout,
}) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalCount, totalPrice } = useCart();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close cart"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[500px] md:w-[540px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-theme-accent/15 flex items-center justify-center text-theme-accent">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Shopping Cart</h2>
              <p className="text-[11px] text-theme-textMuted">
                {totalCount} item{totalCount === 1 ? '' : 's'} selected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 [scrollbar-width:thin]">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-theme-textMuted mb-4">
                <ShoppingCart className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Your cart is empty</h3>
              <p className="text-xs text-theme-textMuted max-w-xs mb-5">
                Add your favorite smartphones with preferred color and storage options.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.hash = '#smartphones';
                }}
                className="px-4 py-2 rounded-lg bg-theme-accent hover:bg-blue-600 text-white text-xs font-medium transition-colors cursor-pointer shadow"
              >
                Browse Smartphones
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl border border-theme-border bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-3.5 items-center"
                >
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-lg bg-[#080D1A] border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-theme-textMuted font-bold">
                        {item.name?.charAt(0) || 'P'}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-medium text-white truncate leading-tight">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-theme-textSecondary">
                            {item.color}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-theme-textSecondary font-mono">
                            {item.storage}
                          </span>
                        </div>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        className="p-1 rounded text-theme-textMuted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price and Quantity row */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, -1)}
                          className="w-6 h-6 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-semibold text-white px-1.5">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, 1)}
                          className="w-6 h-6 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-white tracking-tight">
                          ${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-theme-textMuted">
                            ${Number(item.price).toFixed(2)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with totals and action buttons */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-theme-border bg-theme-surface/95 backdrop-blur-md shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-textMuted">Total ({totalCount} items):</span>
              <span className="text-base font-semibold text-white tracking-tight">
                ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={clearCart}
                className="py-2.5 px-3 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Clear Cart
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onCheckout) {
                    onCheckout(cartItems);
                  }
                }}
                className="py-2.5 px-3 rounded-lg bg-theme-accent hover:bg-blue-600 border border-blue-500/30 text-white text-xs font-medium shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>Proceed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

