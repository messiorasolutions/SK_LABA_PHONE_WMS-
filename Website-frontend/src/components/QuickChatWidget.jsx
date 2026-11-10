import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  PhoneCall,
  MessageSquareText,
} from 'lucide-react';
import { useShopInfo } from '../context/ShopInfoContext';

function WhatsAppSvg({ className = 'w-5 h-5 fill-current' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const STORAGE_KEY = 'sk_laba_quick_chat_position_v1';
const BUTTON_SIZE = 56;
const PADDING = 16;

const getDefaultPosition = () => {
  if (typeof window === 'undefined') return { x: 100, y: 100 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.max(PADDING, w - BUTTON_SIZE - 24),
    y: Math.max(PADDING, h - BUTTON_SIZE - 24),
  };
};

const getInitialPosition = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
          x: Math.min(Math.max(PADDING, parsed.x), Math.max(PADDING, w - BUTTON_SIZE - PADDING)),
          y: Math.min(Math.max(PADDING, parsed.y), Math.max(PADDING, h - BUTTON_SIZE - PADDING)),
        };
      }
    }
  } catch (e) {
    // fallback
  }
  return getDefaultPosition();
};

export default function QuickChatWidget({ activePhone = null, onOpenInquiry, onNavigateToContact }) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const widgetRef = useRef(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
    currentPos: position,
  });

  // Keep ref up to date
  useEffect(() => {
    dragRef.current.currentPos = position;
  }, [position]);

  // Adjust position if window is resized
  useEffect(() => {
    function handleResize() {
      setPosition((prev) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
          x: Math.min(Math.max(PADDING, prev.x), Math.max(PADDING, w - BUTTON_SIZE - PADDING)),
          y: Math.min(Math.max(PADDING, prev.y), Math.max(PADDING, h - BUTTON_SIZE - PADDING)),
        };
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drop-up when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Dragging handlers (Mouse & Touch)
  const handlePointerDown = (clientX, clientY) => {
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.startPosX = dragRef.current.currentPos.x;
    dragRef.current.startPosY = dragRef.current.currentPos.y;
    dragRef.current.hasMoved = false;

    const onPointerMove = (e) => {
      const curX = e.touches ? e.touches[0].clientX : e.clientX;
      const curY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = curX - dragRef.current.startX;
      const dy = curY - dragRef.current.startY;

      if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const newX = Math.min(Math.max(PADDING, dragRef.current.startPosX + dx), w - BUTTON_SIZE - PADDING);
        const newY = Math.min(Math.max(PADDING, dragRef.current.startPosY + dy), h - BUTTON_SIZE - PADDING);

        const newPos = { x: newX, y: newY };
        dragRef.current.currentPos = newPos;
        setPosition(newPos);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (dragRef.current.hasMoved) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dragRef.current.currentPos));
        } catch (e) {
          // ignore
        }
        setTimeout(() => setIsDragging(false), 50);
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  const onMouseDown = (e) => {
    // Only drag with main mouse button
    if (e.button !== 0) return;
    handlePointerDown(e.clientX, e.clientY);
  };

  const onTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMainButtonClick = () => {
    // If was dragging, do not toggle the popup
    if (dragRef.current.hasMoved) return;
    setIsOpen((prev) => !prev);
  };

  // Generate WhatsApp message based on context (Phone view vs. General site view)
  const generateWhatsAppMessage = () => {
    if (activePhone) {
      const pName = activePhone.name || 'Smartphone';
      const pStorage = activePhone.selectedStorage || '';
      const pColor = activePhone.selectedColor || '';
      const price = activePhone.price || activePhone.effectivePrice || activePhone.offer_price || activePhone.regular_price;
      const formattedPrice = price ? `$${Number(price).toLocaleString()}` : '';

      const lines = [
        `*Hello! I am interested in this phone from your website:*`,
        ``,
        `*Model:* ${pName}`,
        pStorage ? `*Storage:* ${pStorage}` : null,
        pColor ? `*Color:* ${pColor}` : null,
        formattedPrice ? `*Price:* ${formattedPrice}` : null,
        (!activePhone?.is_marketplace && activePhone?.source !== "MARKETPLACE" && activePhone?.product_source !== "MARKETPLACE" && activePhone?.warranty) ? `*Warranty:* ${activePhone.warranty}` : null,
        activePhone.phone_condition ? `*Condition:* ${activePhone.phone_condition}` : null,
        `🔗 Link: ${window.location.href}`,
        ``,
        `Could you please provide me with more details and availability about this phone? Thank you!`
      ].filter(Boolean).join('\n');

      return lines;
    }

    // Default message specified by the user
    return `Hello! I found your business through your website and would like to know more about your services. Could you please provide me with some information?`;
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    const url = getWhatsAppUrl(message);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleContactFormClick = () => {
    if (typeof onNavigateToContact === 'function') {
      onNavigateToContact();
    } else {
      window.location.hash = '#contact';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const handleCallClick = () => {
    const rawNumber = shopInfo?.phone || '+82 10-5892-7482';
    window.location.href = `tel:${rawNumber}`;
    setIsOpen(false);
  };

  // Smart placement for popup depending on screen quadrant
  const isTopHalf = position.y < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const isLeftHalf = position.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);

  const dropDirectionClass = isTopHalf ? 'top-full mt-3' : 'bottom-full mb-3';
  const dropAlignClass = isLeftHalf ? 'left-0' : 'right-0';

  return (
    <div
      ref={widgetRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 select-none"
    >
      {/* Drop-up/Drop-down Connection Methods Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Quick Connection Options"
          className={`absolute ${dropDirectionClass} ${dropAlignClass} w-[260px] sm:w-[280px] bg-[#0A0F1E]/95 backdrop-blur-2xl border border-[#1E293B] rounded-2xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in fade-in duration-200 text-white`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#161F30]">
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">How can we help?</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activePhone
                  ? `Inquiring about ${activePhone.name}`
                  : 'Connect with our team instantly:'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connection Methods List */}
          <div className="space-y-1.5">
            {/* 1. WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0D1627] hover:bg-[#121A2C] border border-[#161F30] hover:border-[#25D366]/50 transition-all duration-150 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform shadow-[0_2px_10px_rgba(37,211,102,0.35)]">
                <WhatsAppSvg className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-white group-hover:text-[#25D366] transition-colors">
                Chat on WhatsApp
              </span>
            </button>

            {/* 2. Contact Us Form Button */}
            <button
              type="button"
              onClick={handleContactFormClick}
              className="w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0D1627] hover:bg-[#121A2C] border border-[#161F30] hover:border-blue-500/40 transition-all duration-150 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 group-hover:scale-105 transition-transform">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                Contact Us Form
              </span>
            </button>

            {/* 3. Direct Phone Call Button */}
            <button
              type="button"
              onClick={handleCallClick}
              className="w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0D1627] hover:bg-[#121A2C] border border-[#161F30] hover:border-amber-500/40 transition-all duration-150 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                Direct Phone Call
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button - Draggable & WhatsApp Green */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={`touch-none select-none transition-transform duration-100 ${
          isDragging ? 'cursor-grabbing scale-105 opacity-90' : 'cursor-grab hover:scale-105'
        }`}
        title="Click to open or drag to reposition"
      >
        <button
          type="button"
          onClick={handleMainButtonClick}
          className={`flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 ${
            isOpen
              ? 'bg-[#121A2C] text-white rotate-90 border border-[#1E293B] shadow-[0_8px_30px_rgba(0,0,0,0.7)]'
              : 'bg-[#25D366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.55)] hover:shadow-[0_6px_32px_rgba(37,211,102,0.75)]'
          }`}
          aria-label={isOpen ? 'Close chat options' : 'Chat on WhatsApp & Support (drag to move)'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform" />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-white pointer-events-none">
              <WhatsAppSvg className="w-full h-full fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
