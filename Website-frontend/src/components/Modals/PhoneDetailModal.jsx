import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Tag,
  MessageCircle,
  PhoneCall,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Gift,
  Check,
} from 'lucide-react';
import whatsappIcon from '../../assets/icons/whatsappicon.png';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { useShopInfo } from '../../context/ShopInfoContext';
import phoneService from '../../services/phoneService';
import storageService from '../../services/storageService';
import { getActiveOffers } from '../../services/offerService';
import FormattedDescription from '../Common/FormattedDescription';
import { resolveImageUrl } from '../../utils/imageHelper';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { useTranslation } from 'react-i18next';

function SimilarPhoneCard({ simPhone, onSelectPhone }) {
  const { formatKrw } = useCurrencyConverter();
  const generalPhotos = React.useMemo(() => {
    if (Array.isArray(simPhone?.photos) && simPhone.photos.length > 0) return simPhone.photos;
    if (Array.isArray(simPhone?.photo_urls) && simPhone.photo_urls.length > 0) return simPhone.photo_urls;
    if (simPhone?.main_photo) return [simPhone.main_photo];
    if (typeof simPhone?.photos === 'string' && simPhone.photos.trim().startsWith('[')) {
      try {
        return JSON.parse(simPhone.photos);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [simPhone]);

  const parsedColors = React.useMemo(() => {
    let raw = simPhone?.colour_options;
    if (!raw) return [];
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } else {
        raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(raw)) return [];

    return raw.map((c, i) => {
      if (typeof c === 'string') {
        const fallbackPhoto = generalPhotos[i] || generalPhotos[0] || '';
        return {
          id: `color_${i}`,
          name: c,
          color_code: '#475569',
          photos: fallbackPhoto ? [fallbackPhoto] : [],
        };
      }
      return {
        id: `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#475569',
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [simPhone, generalPhotos]);

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];
  const displayedPhoto =
    activeColor?.photos?.[0] ||
    generalPhotos[selectedColorIdx] ||
    generalPhotos[0] ||
    simPhone.main_photo ||
    '';

  return (
    <div
      onClick={() => {
        if (onSelectPhone) onSelectPhone(simPhone);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="bg-black hover:bg-neutral-950 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-sm hover:scale-[1.01]"
    >
      <div className="relative aspect-[4/5] w-full bg-transparent rounded-xl mb-3 flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
        {displayedPhoto ? (
          <img
            src={resolveImageUrl(displayedPhoto)}
            alt={simPhone.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
          />
        ) : (
          <span className="text-xs text-slate-400">SK LABA</span>
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xs sm:text-sm font-normal text-white truncate group-hover:text-slate-200 transition-colors">
          {simPhone.name}
        </h3>
        <p className="text-xs font-normal text-slate-300">
          {formatKrw(simPhone.price)}
        </p>

        {/* Small phone color thumbnail boxes just like in reference image */}
        {parsedColors.length > 0 && (
          <div
            className="flex items-center justify-center gap-1.5 pt-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {parsedColors.slice(0, 4).map((color, idx) => {
              const isSelected = selectedColorIdx === idx;
              const colorPhoto =
                color.photos?.[0] ||
                generalPhotos[idx] ||
                generalPhotos[0] ||
                '';

              return (
                <button
                  key={color.id || idx}
                  type="button"
                  title={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorIdx(idx);
                  }}
                  onMouseEnter={() => setSelectedColorIdx(idx)}
                  className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg p-0.5 border overflow-hidden transition-all duration-200 cursor-pointer flex items-center justify-center bg-black/60 ${
                    isSelected
                      ? 'border-white ring-1 ring-white/50 shadow-md scale-105'
                      : 'border-white/15 hover:border-white/40 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {colorPhoto ? (
                    <img
                      src={resolveImageUrl(colorPhoto)}
                      alt={color.name}
                      className="w-full h-full object-cover object-center rounded-[6px]"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="w-full h-full rounded-[6px]"
                      style={{ backgroundColor: color.color_code || '#475569' }}
                    />
                  )}
                </button>
              );
            })}
            {parsedColors.length > 4 && (
              <span className="text-[10px] text-slate-400 font-normal pl-0.5 select-none">
                +{parsedColors.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhoneDetailModal({
  phone: initialPhone,
  allPhones = [],
  onClose,
  onOpenReserve,
  onOpenInquiry,
  onOpenSell,
  onOpenNotifyBackInStock,
  onSelectPhone,
}) {
  const [phone, setPhone] = useState(initialPhone);

  useEffect(() => {
    // Immediately show newly selected phone's card data
    setPhone(initialPhone);
    setActivePhotoIdx(0);

    const pid = initialPhone?.phone_id || initialPhone?.id;
    if (pid && (!initialPhone?.description || !initialPhone?.free_accessories)) {
      phoneService
        .getPhoneById(pid)
        .then((res) => {
          const full = res.data?.data || res.data;
          if (full) {
            setPhone((prev) => ({
              ...full,
              ...prev,
              description: full.description || prev?.description,
              free_accessories: full.free_accessories || prev?.free_accessories,
              specifications: full.specifications || prev?.specifications,
              colour_options: full.colour_options || prev?.colour_options,
              storage_options: full.storage_options || prev?.storage_options,
            }));
          }
        })
        .catch(() => {});
    }

    if (pid) {
      getActiveOffers()
        .then((res) => {
          const offers = res.data?.data || res.data || [];
          if (!Array.isArray(offers) || offers.length === 0) return;
          const pidStr = String(pid);
          const pNameLower = (initialPhone?.name || '').toLowerCase();
          const match = offers.find((o) => {
            if (Array.isArray(o.phone_ids) && o.phone_ids.some((id) => String(id) === pidStr)) return true;
            if (Array.isArray(o.phones) && o.phones.some((ph) => String(ph.phone_id || ph.id) === pidStr)) return true;
            const combined = ((o.title || '') + ' ' + (o.description || '')).toLowerCase();
            return pNameLower && combined.includes(pNameLower);
          });
          if (match) {
            const regPrice = Number(initialPhone?.price || initialPhone?.regular_price || match.regular_price || 0);
            const offPrice = Number(match.offer_price || 0);
            const savings = regPrice > offPrice ? regPrice - offPrice : Number(match.discount_amount || 0);
            const discountPct =
              regPrice > 0 && savings > 0
                ? Math.round((savings / regPrice) * 100)
                : Number(match.discount_percentage || 0);
            setPhone((prev) => ({
              ...prev,
              offer_price: offPrice,
              regular_price: regPrice,
              active_offer: {
                has_active_offer: true,
                offer_id: match.offer_id,
                offer_title: match.title,
                offer_price: offPrice,
                regular_price: regPrice,
                discount_percentage: discountPct,
                savings: savings,
              },
            }));
          }
        })
        .catch(() => {});
    }
    if (!pid) return;

    let isCurrent = true;

    // Fetch full phone details and gallery URLs
    phoneService
      .getPhoneById(pid, { photos: 'url' })
      .then((res) => {
        if (!isCurrent) return; // Discard stale responses
        const full = res.data?.data || res.data;
        if (full) {
          setPhone((prev) => ({ ...prev, ...full }));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch full phone details:', err);
      });

    return () => {
      isCurrent = false; // Protect against race conditions
    };
  }, [initialPhone?.phone_id, initialPhone?.id]);
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
  const { t } = useTranslation();
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare } = useFavoritesAndCompare();
  const { convertKrwToLkr, formatKrw, formatKrwParts, formatLkr } = useCurrencyConverter();

  const phoneId = phone?.phone_id || phone?.id;
  const favorited = isFavorite(phoneId);
  const inComparison = isInCompare(phoneId);

  // Parse Free Accessories
  const freeAccessories = React.useMemo(() => {
    let raw = phone?.free_accessories || phone?.accessory_ids || phone?.accessory_names;
    if (!raw) return [];
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        try {
          raw = JSON.parse(raw);
        } catch {
          raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } else {
        raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') return item.name || item.specification_name || String(item);
          return String(item);
        })
        .filter(Boolean);
    }
    return [];
  }, [phone?.free_accessories, phone?.accessory_ids, phone?.accessory_names]);

  // Fallback general photos from phone record
  const generalPhotos = React.useMemo(() => {
    if (Array.isArray(phone?.photos) && phone.photos.length > 0) return phone.photos;
    if (phone?.main_photo) return [phone.main_photo];
    if (typeof phone?.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return [];
  }, [phone]);

  // Parse color options with per-color photos (Fallback gracefully for legacy string arrays)
  const parsedColors = React.useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = raw.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        {
          id: 'default',
          name: 'Standard',
          color_name: 'Standard',
          color_code: '#3B82F6',
          photos: generalPhotos,
          quantity: Number(phone?.current_stock ?? phone?.stock ?? 0),
        },
      ];
    }

    return raw.map((c, i) => {
      if (typeof c === 'string') {
        const fallbackPhoto = generalPhotos[i] || generalPhotos[0] || '';
        return {
          id: `color_${i}`,
          name: c,
          color_name: c,
          color_code: '#374151',
          photos: fallbackPhoto ? [fallbackPhoto] : [],
          quantity: i === 0 ? Number(phone?.current_stock ?? phone?.stock ?? 0) : 0,
        };
      }
      return {
        id: `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#374151',
        quantity:
          typeof c.quantity === 'number'
            ? c.quantity
            : i === 0
              ? Number(phone?.current_stock ?? phone?.stock ?? 0)
              : 0,
        storage_quantities: c.storage_quantities || {},
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [phone, generalPhotos]);

  // Auto-select the first added color by default (index 0 or initialColorIdx)
  const [selectedColorIdx, setSelectedColorIdx] = useState(
    typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0
  );
  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];

  // Collect ALL photos belonging to this phone (general photos, photos array, legacy color photos, main photo)
  const allPhonePhotos = React.useMemo(() => {
    const list = [];
    const addUnique = (url) => {
      if (url && typeof url === 'string' && !list.includes(url)) {
        list.push(url);
      }
    };
    if (Array.isArray(phone?.photos)) {
      phone.photos.forEach(addUnique);
    } else if (typeof phone?.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed)) parsed.forEach(addUnique);
      } catch (e) {}
    }
    if (Array.isArray(phone?.colour_options)) {
      phone.colour_options.forEach((c) => {
        if (Array.isArray(c?.photos)) c.photos.forEach(addUnique);
      });
    } else if (typeof phone?.colour_options === 'string' && phone.colour_options.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.colour_options);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (Array.isArray(c?.photos)) c.photos.forEach(addUnique);
          });
        }
      } catch (e) {}
    }
    if (phone?.main_photo) {
      addUnique(phone.main_photo);
    }
    return list;
  }, [phone]);

  const photos = allPhonePhotos.length > 0 ? allPhonePhotos : generalPhotos;

  const [activePhotoIdx, setActivePhotoIdx] = useState(
    typeof phone.initialPhotoIdx === 'number'
      ? phone.initialPhotoIdx
      : (typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0)
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reset to initial photo when phone changes
  useEffect(() => {
    setSelectedColorIdx(
      typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0
    );
    setActivePhotoIdx(
      typeof phone.initialPhotoIdx === 'number'
        ? phone.initialPhotoIdx
        : (typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0)
    );
  }, [phoneId, phone.initialPhotoIdx, phone.initialColorIdx]);

  // Handle color change: updates color and loads that color's photos
  const handleSelectColor = (idx) => {
    setSelectedColorIdx(idx);
    setActivePhotoIdx(0);
  };

  const selectedColor = activeColor?.name || 'Default';

  const handlePrevPhoto = (e) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  // Mobile Touch Swipe Handling
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40; // minimum swipe distance in px
    if (diff > threshold) {
      handleNextPhoto();
    } else if (diff < -threshold) {
      handlePrevPhoto();
    }
  };

  // Lightbox Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const isDraggingPanRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const bottomThumbnailsRef = useRef(null);

  // Reset zoom and pan when photo changes or lightbox closes
  useEffect(() => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  }, [activePhotoIdx, isLightboxOpen]);

  // Auto-scroll the active thumbnail to the center of the bottom carousel
  useEffect(() => {
    if (isLightboxOpen && bottomThumbnailsRef.current) {
      const activeEl = bottomThumbnailsRef.current.children[activePhotoIdx];
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [activePhotoIdx, isLightboxOpen]);

  const toggleZoom = (e) => {
    e?.stopPropagation();
    setZoomScale((prev) => {
      if (prev === 1) return 2.2;
      if (prev === 2.2) return 3.2;
      return 1;
    });
    setPanPos({ x: 0, y: 0 });
  };

  const lightboxStageRef = useRef(null);

  // Prevent browser viewport pinch-zooming the page while inside the lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const stageEl = lightboxStageRef.current;
    if (!stageEl) return;

    const preventPageZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        // Prevent default browser viewport page-zoom
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    stageEl.addEventListener('touchstart', preventPageZoom, { passive: false });
    stageEl.addEventListener('touchmove', preventPageZoom, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      stageEl.removeEventListener('touchstart', preventPageZoom);
      stageEl.removeEventListener('touchmove', preventPageZoom);
    };
  }, [isLightboxOpen]);

  // Lightbox Touch Swipe & Pinch-to-Zoom Handling
  const lightboxTouchStartRef = useRef({ x: 0, y: 0 });
  const lightboxTouchEndRef = useRef({ x: 0, y: 0 });
  const lastTapTimeRef = useRef(0);
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(1);

  const handleLightboxTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = zoomScale;
      return;
    }

    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        toggleZoom();
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      lightboxTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lightboxTouchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      if (zoomScale > 1) {
        isDraggingPanRef.current = true;
        panStartRef.current = {
          x: e.touches[0].clientX - panPos.x,
          y: e.touches[0].clientY - panPos.y,
        };
      }
    }
  };

  const handleLightboxTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchStartDistRef.current > 0) {
        const factor = dist / pinchStartDistRef.current;
        const newScale = Math.min(Math.max(pinchStartScaleRef.current * factor, 1), 4);
        setZoomScale(newScale);
      }
      return;
    }

    if (e.touches.length === 1) {
      lightboxTouchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      if (zoomScale > 1 && isDraggingPanRef.current) {
        setPanPos({
          x: e.touches[0].clientX - panStartRef.current.x,
          y: e.touches[0].clientY - panStartRef.current.y,
        });
      }
    }
  };

  const handleLightboxTouchEnd = () => {
    pinchStartDistRef.current = 0;
    isDraggingPanRef.current = false;

    if (zoomScale === 1) {
      const diffX = lightboxTouchStartRef.current.x - lightboxTouchEndRef.current.x;
      const diffY = Math.abs(lightboxTouchStartRef.current.y - lightboxTouchEndRef.current.y);
      const threshold = 40;
      if (Math.abs(diffX) > threshold && diffY < 80) {
        if (diffX > 0) {
          handleNextPhoto();
        } else {
          handlePrevPhoto();
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, isLightboxOpen]);

  // Load system storage options as a fallback dictionary
  const [systemStorages, setSystemStorages] = useState([]);

  useEffect(() => {
    storageService
      .getStorageOptions()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSystemStorages(Array.isArray(data) ? data : []);
      })
      .catch(() => { });
  }, []);

  // Storage options
  const phoneStorageOptions = React.useMemo(() => {
    if (Array.isArray(phone?.storage_options) && phone.storage_options.length > 0) {
      return phone.storage_options;
    }
    if (Array.isArray(phone?.storage_names) && phone.storage_names.length > 0) {
      return phone.storage_names.map((name, i) => ({
        storage_id: i + 1,
        storage_name: name,
      }));
    }
    if (Array.isArray(phone?.storage_ids) && phone.storage_ids.length > 0) {
      return phone.storage_ids.map((id) => {
        const matched = systemStorages.find((s) => Number(s.storage_id) === Number(id));
        return {
          storage_id: id,
          storage_name: matched ? matched.storage_name : (typeof id === 'string' && id.includes('GB') ? id : 'Standard'),
        };
      });
    }
    return [{ storage_id: 'default', storage_name: 'Standard' }];
  }, [phone, systemStorages]);

  const [selectedStorage, setSelectedStorage] = useState(
    phoneStorageOptions[0]?.storage_name || 'Standard'
  );

  useEffect(() => {
    if (phoneStorageOptions.length > 0) {
      setSelectedStorage(phoneStorageOptions[0].storage_name);
    }
  }, [phoneStorageOptions]);

  const reserveVariantLabel =
    phoneStorageOptions.length > 1 && selectedStorage && selectedStorage !== 'Standard'
      ? selectedStorage
      : null;

  const [installmentsData, setInstallmentsData] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (phone?.installment_enabled && phoneId) {
      setLoadingInstallments(true);
      phoneService
        .getPhoneInstallments(phoneId)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setInstallmentsData(res.data.data);
          }
        })
        .catch(() => { })
        .finally(() => setLoadingInstallments(false));
    } else {
      setInstallmentsData(null);
    }
  }, [phoneId, phone?.installment_enabled]);

  if (!phone) return null;

  const isMarketplace = Boolean(
    phone.is_marketplace ||
    phone.source === 'MARKETPLACE' ||
    phone.product_source === 'MARKETPLACE'
  );

  const availability = (phone.availability || 'IN_STOCK').toUpperCase();
  const currentStock = Number(phone.current_stock ?? phone.stock ?? 0);
  // Marketplace phones do not check inventory stock; single seller listing
  const isSoldOut = isMarketplace ? false : (availability === 'SOLD_OUT' || (availability !== 'COMING_SOON' && currentStock === 0));
  const activeColorQty = typeof activeColor?.quantity === 'number' ? activeColor.quantity : currentStock;

  // Selected variant stock (Color + Storage)
  let variantStock = activeColorQty;
  if (activeColor?.storage_quantities && typeof activeColor.storage_quantities[selectedStorage] === 'number') {
    variantStock = activeColor.storage_quantities[selectedStorage];
  } else if (phoneStorageOptions.length === 1 && typeof activeColor?.quantity === 'number') {
    variantStock = activeColor.quantity;
  }
  const isVariantSoldOut = isMarketplace ? false : (isSoldOut || (availability !== 'COMING_SOON' && variantStock === 0));

  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

  const directPhoneUrl = React.useMemo(() => {
    const pId = phone?.phone_id || phone?.id;
    if (!pId) return window.location.href;
    return `${window.location.origin}/#smartphones?phone=${pId}`;
  }, [phone]);

  const handleWhatsApp = () => {
    const colorStr = selectedColor && selectedColor !== 'Default' ? selectedColor : (activeColor?.name || '');
    const storageStr = selectedStorage && selectedStorage !== 'Standard' ? selectedStorage : (phoneStorageOptions[0]?.storage_name || '');
    const priceStr = `${formatKrw(effectivePrice)} (${formatLkr(convertKrwToLkr(effectivePrice))})`;

    const lines = [
      `*Hello! I am interested in this phone from your website:*`,
      ``,
      `*Model:* ${phone.name || 'Smartphone'}`,
      storageStr ? `*Storage:* ${storageStr}` : null,
      colorStr ? `*Color:* ${colorStr}` : null,
      `*Price:* ${priceStr}`,
      (!isMarketplace && phone.warranty) ? `*Warranty:* ${phone.warranty}` : null,
      phone.phone_condition ? `*Condition:* ${phone.phone_condition}` : null,
      `🔗 Link: ${directPhoneUrl}`,
      ``,
      `Could you please provide me with more details and availability about this phone? Thank you!`
    ].filter(Boolean).join('\n');

    window.open(getWhatsAppUrl(lines), '_blank');
  };

  const handleReserveViaWhatsApp = () => {
    const colorStr = selectedColor && selectedColor !== 'Default' ? selectedColor : (activeColor?.name || '');
    const storageStr = selectedStorage && selectedStorage !== 'Standard' ? selectedStorage : (phoneStorageOptions[0]?.storage_name || '');
    const priceStr = `${formatKrw(effectivePrice)} (${formatLkr(convertKrwToLkr(effectivePrice))})`;

    const lines = [
      `*Hello! I would like to reserve this phone:*`,
      ``,
      `*Model:* ${phone.name || 'Smartphone'}`,
      storageStr ? `*Storage:* ${storageStr}` : null,
      colorStr ? `*Color:* ${colorStr}` : null,
      `*Price:* ${priceStr}`,
      (!isMarketplace && phone.warranty) ? `*Warranty:* ${phone.warranty}` : null,
      phone.phone_condition ? `*Condition:* ${phone.phone_condition}` : null,
      `🔗 Link: ${directPhoneUrl}`,
      ``,
      `I would like to reserve this phone. Could you please guide me on how to proceed with the reservation? Thank you!`
    ].filter(Boolean).join('\n');

    window.open(getWhatsAppUrl(lines), '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${shopInfo.phone}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directPhoneUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const candidateSimilar = allPhones.filter((p) => {
    const pId = p.phone_id || p.id;
    return pId !== phoneId;
  });

  let similarPhones = candidateSimilar
    .filter((p) => {
      const sameBrand = (p.brand_name || '').toLowerCase() === (phone.brand_name || '').toLowerCase();
      const diffPrice = Math.abs(Number(p.price || 0) - regularPrice);
      return sameBrand || diffPrice <= 400;
    })
    .slice(0, 4);

  if (similarPhones.length < 4 && candidateSimilar.length > similarPhones.length) {
    const existingIds = new Set(similarPhones.map((p) => p.phone_id || p.id));
    const extras = candidateSimilar.filter((p) => !existingIds.has(p.phone_id || p.id)).slice(0, 4 - similarPhones.length);
    similarPhones = [...similarPhones, ...extras];
  }

  return (
    <div className="w-full min-h-screen bg-black text-white pt-5 sm:pt-8 pb-16 sm:pb-24 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header / Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-white text-xs font-normal transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm group"
              title="Back to Smartphones"
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">{isMarketplace ? 'Back to Marketplace' : t('details.backToSmartphones')}</span>
            </button>

            <span className="text-white/30 hidden sm:inline">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-normal uppercase tracking-wider text-slate-300">
                {phone.brand_name || 'Smartphone'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Share Link & Preview"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(phoneId)}
              className="p-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-slate-300 transition-colors cursor-pointer"
              title="Save to Favourites"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'text-rose-400 fill-rose-400/80' : 'text-slate-300'}`} />
            </button>
          </div>
        </div>

        {/* Main Grid: Gallery on left, Purchase Info on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Photo Gallery Column (Left: lg:col-span-6) */}
          <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                {/* Thumbnails (Left side of Main Image: Column 1 fills first with up to 6 images, then Column 2 fills with up to 12) - Hidden on mobile */}
                {photos.length > 1 && (
                  <div className="hidden sm:flex gap-2 shrink-0 overflow-x-auto sm:overflow-y-auto max-h-[380px] sm:max-h-[440px] p-0.5 [scrollbar-width:none]">
                    {/* Column 1 (Photos 1 to 6) */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {photos.slice(0, 6).map((photoUrl, colIdx) => {
                        const globalIdx = colIdx;
                        const isPhotoSelected = activePhotoIdx === globalIdx;
                        return (
                          <button
                            key={globalIdx}
                            type="button"
                            onClick={() => setActivePhotoIdx(globalIdx)}
                            className={`relative w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-xl p-[1px] shrink-0 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden ${
                              isPhotoSelected
                                ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md scale-105 ring-1 ring-white/10'
                                : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-70 hover:opacity-100 hover:scale-102'
                            }`}
                            title={`View photo ${globalIdx + 1}`}
                          >
                            <div className="w-full h-full bg-neutral-950 rounded-[10px] p-0.5 flex items-center justify-center overflow-hidden">
                              <img
                                src={resolveImageUrl(photoUrl)}
                                alt={`${phone.name} photo ${globalIdx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Column 2 (Photos 7 to 12: only rendered if more than 6 photos exist) */}
                    {photos.length > 6 && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {photos.slice(6, 12).map((photoUrl, colIdx) => {
                          const globalIdx = colIdx + 6;
                          const isPhotoSelected = activePhotoIdx === globalIdx;
                          return (
                            <button
                              key={globalIdx}
                              type="button"
                              onClick={() => setActivePhotoIdx(globalIdx)}
                              className={`relative w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-xl p-[1px] shrink-0 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden ${
                                isPhotoSelected
                                  ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md scale-105 ring-1 ring-white/10'
                                  : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-70 hover:opacity-100 hover:scale-102'
                              }`}
                              title={`View photo ${globalIdx + 1}`}
                            >
                              <div className="w-full h-full bg-neutral-950 rounded-[10px] p-0.5 flex items-center justify-center overflow-hidden">
                                <img
                                  src={resolveImageUrl(photoUrl)}
                                  alt={`${phone.name} photo ${globalIdx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Image Box */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative aspect-[4/3] max-h-[360px] sm:max-h-[400px] flex-1 bg-neutral-950 rounded-2xl p-6 sm:p-8 flex items-center justify-center overflow-hidden group select-none touch-pan-y"
                >
                  {/* Swap Buttons (< 1 / 6 >) - Hidden on mobile, visible on desktop */}
                  {photos.length > 1 && (
                    <div className="hidden sm:flex absolute top-3.5 right-3.5 z-20 items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 select-none">
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        className="p-0.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        title="Previous image"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      <span className="text-xs text-white font-mono px-1">
                        {photos.length > 0 ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="p-0.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        title="Next image"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {/* Indicator Dots at bottom of image for mobile view */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex sm:hidden items-center justify-center gap-1.5 pointer-events-auto">
                      {photos.map((_, dotIdx) => {
                        const isCurrent = activePhotoIdx === dotIdx;
                        return (
                          <button
                            key={dotIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoIdx(dotIdx);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isCurrent
                                ? 'w-5 bg-white shadow-sm'
                                : 'w-1.5 bg-white/30'
                            }`}
                            aria-label={`Go to photo ${dotIdx + 1}`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {photos[activePhotoIdx] ? (
                    <img
                      src={resolveImageUrl(photos[activePhotoIdx])}
                      alt={`${phone.name} photo ${activePhotoIdx + 1}`}
                      onClick={() => setIsLightboxOpen(true)}
                      className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover:scale-105 cursor-pointer"
                      title="Click to enlarge photo"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span className="text-xs">SK LABA PHONE</span>
                    </div>
                  )}

                  {/* Offer tag */}
                  {hasOffer && (
                    <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-black/80 backdrop-blur-md text-amber-300 text-xs font-normal tracking-wide shadow-sm">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Right Column: Title, Pricing, Storage, Purchase, Quick Contact, Warranty & Description, Installments */}
          <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-start space-y-5">
            <div>
              {/* Title & Price */}
              <div className="flex flex-wrap items-baseline gap-x-8 sm:gap-x-10 gap-y-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-normal text-white leading-snug">
                  {phone.name}
                </h1>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xl sm:text-2xl font-normal text-white tracking-tight flex items-baseline gap-1">
                      <span>{formatKrwParts(effectivePrice).number}</span>
                      <span className="text-xs sm:text-sm font-normal text-slate-300">
                        {formatKrwParts(effectivePrice).unit}
                      </span>
                    </span>
                    {hasOffer && (
                      <span className="text-xs sm:text-sm text-slate-400 line-through font-normal flex items-baseline gap-0.5">
                        <span>{formatKrwParts(regularPrice).number}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          {formatKrwParts(regularPrice).unit}
                        </span>
                      </span>
                    )}
                  </div>
                  {effectivePrice > 0 && (
                    <div className="text-xs sm:text-sm text-white font-normal tracking-tight mt-0.5">
                      {formatLkr(convertKrwToLkr(effectivePrice))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Status under title in clean white letters (no highlighted color) */}
              {!isMarketplace && (
                <div className="text-sm font-normal text-white mb-4 tracking-wide">
                  {isVariantSoldOut ? t('details.outOfStock') : t('details.inStock')}
                </div>
              )}

              {hasOffer && (
                <p className="text-xs text-slate-300 -mt-2 mb-4 font-normal">
                  Promotional offer active. Save ${savings.toFixed(2)} with SK LABA.
                </p>
              )}


              {/* Options: Storage (only shown when multiple storage options exist) */}
              {phoneStorageOptions.length > 1 && (
                <div className="mb-8 sm:mb-9">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-normal uppercase tracking-wider text-slate-400 mb-4">
                    <span>{t('details.selectedStorage')}:</span>
                    <span className="text-white font-medium tracking-normal">{selectedStorage}</span>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 sm:gap-6 md:gap-8 pl-1 sm:pl-2">
                    {phoneStorageOptions.map((s) => {
                      const isSelected = selectedStorage === s.storage_name;
                      let storageQty = 0;
                      if (
                        activeColor?.storage_quantities &&
                        typeof activeColor.storage_quantities[s.storage_name] === 'number'
                      ) {
                        storageQty = activeColor.storage_quantities[s.storage_name];
                      } else if (phoneStorageOptions.length === 1 && typeof activeColor?.quantity === 'number') {
                        storageQty = activeColor.quantity;
                      } else {
                        storageQty = typeof activeColor?.quantity === 'number'
                          ? activeColor.quantity
                          : Number(phone.current_stock ?? 0);
                      }
                      const isStorageInStock = storageQty > 0;

                      return (
                        <div
                          key={s.storage_id || s.storage_name}
                          onClick={() => setSelectedStorage(s.storage_name)}
                          className="flex flex-col items-center cursor-pointer group/storageOption w-20 sm:w-24 md:w-28 text-center"
                        >
                          <div
                            className={`w-full max-w-[88px] sm:max-w-[96px] rounded-xl p-[1px] transition-all duration-300 flex items-center justify-center ${isSelected
                                ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md shadow-black/80 scale-105 ring-1 ring-white/10'
                                : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                          >
                            <div className={`w-full h-full py-2.5 px-3.5 rounded-[11px] text-center flex items-center justify-center ${isSelected ? 'bg-black/90' : 'bg-black'
                              }`}>
                              <span
                                className={`text-xs sm:text-sm font-normal tracking-wide transition-colors ${isSelected
                                    ? 'text-white font-medium'
                                    : 'text-slate-300 group-hover/storageOption:text-white'
                                  }`}
                              >
                                {s.storage_name}
                              </span>
                            </div>
                          </div>

                          {!isMarketplace && (
                            <span className={`text-[11px] font-normal mt-1.5 text-center leading-none w-full truncate ${isStorageInStock ? 'text-slate-400' : 'text-neutral-500'}`}>
                              {isStorageInStock ? t('details.inStock') : t('details.outOfStock')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


            </div>

            {/* Action Buttons: Reserve / Notify and Reserve via WhatsApp */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col gap-2.5 items-start">
                {isVariantSoldOut ? (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenNotifyBackInStock &&
                      onOpenNotifyBackInStock({
                        ...phone,
                        color_name: selectedColor,
                        storage_name: selectedStorage,
                      })
                    }
                    className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-950/80 via-zinc-600/70 to-blue-950/80 hover:from-red-900/80 hover:via-zinc-500 hover:to-blue-900/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50 group cursor-pointer"
                  >
                    <span className="w-full h-full py-2.5 px-5 rounded-full bg-black group-hover:bg-neutral-950 text-slate-300 group-hover:text-white font-normal text-xs sm:text-sm transition-colors text-center truncate flex items-center justify-center">
                      Notify When Available
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenReserve &&
                      onOpenReserve({
                        ...phone,
                        selectedColor,
                        selectedStorage,
                        effectivePrice,
                      })
                    }
                    className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-950/80 via-zinc-600/70 to-blue-950/80 hover:from-red-900/80 hover:via-zinc-500 hover:to-blue-900/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50 group cursor-pointer"
                    title={reserveVariantLabel ? `${t('details.reserve')} (${reserveVariantLabel})` : t('details.reserve')}
                  >
                    <span className="w-full h-full py-2.5 px-5 rounded-full bg-black group-hover:bg-neutral-950 text-white font-normal text-xs sm:text-sm transition-colors text-center truncate flex items-center justify-center">
                      <span className="truncate">{reserveVariantLabel ? `${t('details.reserve')} (${reserveVariantLabel})` : t('details.reserve')}</span>
                    </span>
                  </button>
                )}

                {/* Reserve via WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleReserveViaWhatsApp}
                  className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-950/80 via-zinc-600/70 to-blue-950/80 hover:from-red-900/80 hover:via-zinc-500 hover:to-blue-900/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50 group cursor-pointer"
                  title="Reserve via WhatsApp"
                >
                  <span className="w-full h-full py-2.5 px-5 rounded-full bg-black group-hover:bg-neutral-950 text-white font-normal text-xs sm:text-sm transition-colors flex items-center justify-center gap-2">
                    <img src={whatsappIcon} alt="" className="w-4 h-4 object-contain" />
                    <span>{t('details.reserveViaWhatsApp', 'Reserve via WhatsApp')}</span>
                  </span>
                </button>
              </div>

              {/* Device Condition & Hardware Specs (Battery Health, Housing, Display Size) */}
              {(phone.battery_health || phone.is_genuine_battery !== undefined || phone.is_original_housing !== undefined || phone.display_size) && (
                <div className="py-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                  {/* Battery Health & Condition: Genuine Battery | 80% */}
                  {(phone.battery_health || phone.is_genuine_battery !== undefined) && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal">Battery:</span>
                      <span className="text-white font-medium">
                        {(() => {
                          const status = phone.is_genuine_battery !== false ? 'Genuine Battery' : 'Battery Replaced';
                          if (phone.battery_health) {
                            const raw = String(phone.battery_health).trim();
                            const val = raw.endsWith('%') ? raw : `${raw}%`;
                            return `${status} | ${val}`;
                          }
                          return status;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Original Phone Housing */}
                  {phone.is_original_housing !== undefined && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-slate-400 font-normal">Housing:</span>
                      <span className="text-white font-medium">
                        {phone.is_original_housing !== false ? 'Original Phone Housing' : 'Housing Replaced'}
                      </span>
                    </div>
                  )}

                  {/* Display Size under Housing */}
                  {phone.display_size && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-slate-400 font-normal">Display Size:</span>
                      <span className="text-white font-medium">{phone.display_size}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Free Accessories Included (placed after specs, before Quick Contact) */}
              {freeAccessories.length > 0 && (
                <div className="bg-neutral-950 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                  <div>
                    <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">
                      Free Accessories Included
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {freeAccessories.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs sm:text-sm"
                      >
                        <div className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                        <span className="truncate font-normal text-white">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description & Overview Section (placed after free accessories, before Quick Contact) */}
              {(phone.description || phone.condition_description) && (
                <div className="bg-neutral-950 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {isMarketplace ? "Seller's Description & Notes" : t('details.descriptionOverview')}
                  </h2>
                  <div className="text-slate-200 font-normal leading-relaxed text-xs sm:text-sm">
                    <FormattedDescription content={phone.condition_description || phone.description} />
                  </div>
                </div>
              )}

              {/* Quick Contact: WhatsApp, Call Shop */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300 uppercase tracking-wider font-normal">
                  {t('details.quickContact')}:
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 overflow-hidden p-1.5"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCall}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                    title="Call Shop Direct"
                    aria-label="Call Shop Direct"
                  >
                    <PhoneCall className="w-4 h-4 text-slate-200" />
                  </button>
                </div>
              </div>

              {copiedLink && (
                <p className="text-center text-xs text-white font-normal animate-in fade-in">
                  Link copied to clipboard
                </p>
              )}

              {/* Warranty Section (under Quick Contact) */}
              {!isMarketplace && phone.warranty && (
                <div className="bg-neutral-950 border border-white/10 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs sm:text-sm mt-3">
                  <span className="text-slate-400 uppercase tracking-wider text-xs">
                    {t('details.warranty')}:
                  </span>
                  <span className="text-white font-medium">
                    {phone.warranty}
                  </span>
                </div>
              )}

              {/* Available Instalment Plans */}
              {Boolean(phone.installment_enabled) && (
                <div className="bg-black rounded-2xl p-4 mt-4">
                  <div className="mb-2.5">
                    <h2 className="text-xs font-normal uppercase tracking-wider text-slate-300">
                      {t('details.installmentPlans')}
                    </h2>
                  </div>

                  {loadingInstallments ? (
                    <div className="text-xs text-slate-300 py-1 font-normal">
                      Loading flexible instalment plans...
                    </div>
                  ) : installmentsData?.plans && installmentsData.plans.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 mt-1">
                      {installmentsData.plans.map((plan, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-xl bg-neutral-950 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-normal text-white truncate">
                              {plan.provider_name || 'Instalment Plan'}
                            </span>
                            <span className="text-xs font-normal text-white shrink-0">
                              {formatKrw(plan.monthly_payment)}/mo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-normal mt-0.5">
                            {plan.number_of_months} Months • Total: {formatKrw(plan.total_payable)}
                          </p>
                          {plan.terms && (
                            <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-white/5 font-normal leading-relaxed break-words whitespace-normal">
                              {plan.terms}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-normal">
                      Instalment payment options available upon store collection or checkout.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Phones Section at the bottom */}
        {similarPhones.length > 0 && (
          <div className="pt-10 mt-10 pb-12 sm:pb-16 border-t border-white/10">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-sm sm:text-base font-normal uppercase tracking-wider text-white">
                {isSoldOut ? 'Similar Available Phones' : t('details.similarSmartphones')}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
              {similarPhones.map((simPhone) => (
                <SimilarPhoneCard
                  key={simPhone.phone_id || simPhone.id}
                  simPhone={simPhone}
                  onSelectPhone={onSelectPhone}
                />
              ))}
            </div>
          </div>
        )}
      {/* ENLARGED PHOTO VIEWER (LIGHTBOX) */}
      {isLightboxOpen && photos[activePhotoIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 shrink-0 z-20">
            <span className="text-sm font-semibold text-white truncate max-w-[65%]">
              {phone.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleZoom}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                title={zoomScale > 1 ? 'Reset Zoom' : 'Zoom In'}
              >
                {zoomScale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                <span className="font-mono text-[11px]">{Math.round(zoomScale * 100)}%</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Large Image Stage (Swipable, Zoomable with zoom button or pinch) */}
          <div
            ref={lightboxStageRef}
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-2 sm:p-4 touch-none select-none overscroll-none"
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <div
              className="relative flex items-center justify-center transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={resolveImageUrl(photos[activePhotoIdx])}
                alt={`${phone.name} enlarged`}
                className="w-auto h-auto max-w-[88vw] max-h-[62vh] sm:max-h-[72vh] object-contain drop-shadow-2xl rounded-2xl select-none"
                draggable={false}
              />
            </div>

            {/* Floating Zoom Indicator Pill (shown only when zoomed in) */}
            {zoomScale > 1 && (
              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setPanPos({ x: 0, y: 0 });
                }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-mono select-none flex items-center gap-1.5 shadow-lg cursor-pointer hover:bg-black"
                title="Tap to reset zoom"
              >
                <span>{Math.round(zoomScale * 100)}%</span>
                <span className="text-[10px] text-slate-300">• Tap to reset</span>
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Carousel (5-image perspective view) */}
          {photos.length > 1 && (
            <div className="relative py-3 border-t border-white/10 bg-black/80 shrink-0 z-20 overflow-hidden">
              <div
                ref={bottomThumbnailsRef}
                className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto px-4 py-2 [scrollbar-width:none] scroll-smooth"
              >
                {photos.map((photoUrl, idx) => {
                  const dist = Math.abs(idx - activePhotoIdx);
                  // Dynamic perspective sizing and transparency: 5 images clearly visible
                  let sizeClasses = 'w-8 h-8 sm:w-9 sm:h-9 scale-75 opacity-20 border-transparent';
                  if (dist === 0) {
                    // Center image: biggest, full opacity, highlighted
                    sizeClasses = 'w-14 h-14 sm:w-16 sm:h-16 scale-105 sm:scale-110 opacity-100 border-2 border-white ring-2 ring-white/50 shadow-2xl z-30';
                  } else if (dist === 1) {
                    // Immediate 2 images (left and right): slightly smaller, 80% opacity
                    sizeClasses = 'w-11 h-11 sm:w-13 sm:h-13 scale-95 sm:scale-100 opacity-80 border border-white/40 shadow-lg z-20';
                  } else if (dist === 2) {
                    // Outer 2 images (left and right): smaller, 40% opacity (transparency)
                    sizeClasses = 'w-9 h-9 sm:w-10 sm:h-10 scale-85 opacity-40 border border-white/20 z-10';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx(idx);
                      }}
                      className={`relative rounded-xl overflow-hidden shrink-0 transition-all duration-300 cursor-pointer flex items-center justify-center bg-neutral-900 ${sizeClasses}`}
                      title={`Photo ${idx + 1}`}
                    >
                      <img
                        src={resolveImageUrl(photoUrl)}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}
