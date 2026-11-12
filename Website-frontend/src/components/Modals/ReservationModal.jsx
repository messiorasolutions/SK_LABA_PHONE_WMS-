import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  HardDrive,
  Palette,
  Calendar,
  Phone,
  Mail,
  User,
  FileText,
  Truck,
  MapPin,
  Building,
} from 'lucide-react';
import { createReservation } from '../../services/reservationService';
import { getStorageOptions } from '../../services/storageService';

export default function ReservationModal({ phone, onClose }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    preferred_collection_date: '',
    customer_note: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    address: '',
    city: '',
    postal_code: '',
    delivery_phone: '',
    delivery_notes: '',
  });

  // Phone Options State
  const [availableStorages, setAvailableStorages] = useState([]);
  const [selectedStorageId, setSelectedStorageId] = useState(null);
  const [selectedColour, setSelectedColour] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const phoneId = phone?.phone_id || phone?.id;

  // Minimum date is today (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Parse all colour options from phone record
  const parsedAllColors = React.useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = raw.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(raw)) return [];

    return raw.map((c, i) => {
      if (typeof c === 'string') {
        const totalStock = Number(phone?.current_stock ?? phone?.stock ?? 0);
        return {
          id: `color_${i}`,
          name: c,
          color_name: c,
          color_code: '#4B5563',
          quantity: totalStock,
          storage_quantities: {},
          photos: [],
        };
      }
      return {
        id: c.id || `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#4B5563',
        quantity:
          typeof c.quantity === 'number'
            ? c.quantity
            : (c.quantity !== undefined && c.quantity !== null && !isNaN(Number(c.quantity)))
              ? Number(c.quantity)
              : Number(phone?.current_stock ?? phone?.stock ?? 0),
        storage_quantities: c.storage_quantities || {},
        photos: Array.isArray(c.photos) ? c.photos : [],
      };
    });
  }, [phone?.colour_options, phone?.current_stock, phone?.stock]);

  // Filter out of stock colours (only keep in-stock variants for reservation)
  const inStockColors = React.useMemo(() => {
    return parsedAllColors.filter((col) => {
      // 1. If storage_quantities has entries, check if any storage has positive stock
      if (
        col.storage_quantities &&
        typeof col.storage_quantities === 'object' &&
        Object.keys(col.storage_quantities).length > 0
      ) {
        const qtys = Object.values(col.storage_quantities)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (qtys.length > 0) {
          return qtys.some((q) => q > 0);
        }
      }

      // 2. Otherwise check col.quantity
      if (typeof col.quantity === 'number') {
        return col.quantity > 0;
      }

      // 3. Fallback to phone current_stock
      const totalStock = Number(phone?.current_stock ?? phone?.stock ?? 0);
      return totalStock > 0;
    });
  }, [parsedAllColors, phone?.current_stock, phone?.stock]);

  // Colour string names: If a colour was already selected when clicking Reserve, ONLY show that colour
  const colourOptions = React.useMemo(() => {
    if (phone?.selectedColor) {
      const targetColor = String(phone.selectedColor).trim().toLowerCase();
      const matched = inStockColors.find(
        (c) =>
          (c.name && c.name.trim().toLowerCase() === targetColor) ||
          (c.color_name && c.color_name.trim().toLowerCase() === targetColor)
      );
      if (matched) {
        return [matched.name];
      }
      return [phone.selectedColor];
    }
    return inStockColors.map((c) => c.name);
  }, [inStockColors, phone?.selectedColor]);

  // Active colour object based on current selectedColour
  const activeColorObj = React.useMemo(() => {
    if (!selectedColour) return inStockColors[0] || null;
    return (
      inStockColors.find(
        (c) =>
          c.name?.toLowerCase() === selectedColour?.toLowerCase() ||
          c.color_name?.toLowerCase() === selectedColour?.toLowerCase()
      ) || inStockColors[0] || null
    );
  }, [inStockColors, selectedColour]);

  // Active photo based on selected colour or phone photos
  const activePhonePhoto =
    activeColorObj?.photos?.[0] ||
    phone?.photos?.[0] ||
    phone?.main_photo ||
    '';

  // Overall phone availability check
  const availability = (phone?.availability || 'IN_STOCK').toUpperCase();
  const currentStock = Number(phone?.current_stock ?? phone?.stock ?? 0);
  const isPhoneSoldOut =
    availability === 'SOLD_OUT' ||
    (availability !== 'COMING_SOON' && currentStock === 0) ||
    (parsedAllColors.length > 0 && inStockColors.length === 0);

  // Load and match storage options for this phone (C-09)
  useEffect(() => {
    let isMounted = true;
    const phoneStorageIds = Array.isArray(phone?.storage_ids)
      ? phone.storage_ids.map(Number).filter((n) => !isNaN(n))
      : [];

    if (phoneStorageIds.length > 0) {
      getStorageOptions()
        .then((res) => {
          if (!isMounted) return;
          const allOptions = res?.data?.data || res?.data || [];
          if (Array.isArray(allOptions)) {
            const matched = allOptions.filter((opt) =>
              phoneStorageIds.includes(Number(opt.storage_id))
            );
            const storages = matched.length > 0 ? matched : allOptions;
            setAvailableStorages(storages);

            let initialOpt = null;
            if (phone?.selectedStorage) {
              initialOpt = storages.find(
                (s) =>
                  s.storage_name === phone.selectedStorage ||
                  s.storage_name?.toLowerCase() === phone.selectedStorage?.toLowerCase() ||
                  (s.capacity_gb && `${s.capacity_gb}GB`.toLowerCase() === phone.selectedStorage?.replace(/\s+/g, '').toLowerCase())
              );
            }
            if (!initialOpt && phone?.selectedStorageId) {
              initialOpt = storages.find(
                (s) => Number(s.storage_id) === Number(phone.selectedStorageId)
              );
            }
            if (!initialOpt && storages.length > 0) {
              initialOpt = storages[0];
            }
            if (initialOpt) {
              setSelectedStorageId(Number(initialOpt.storage_id));
            }
          }
        })
        .catch(() => {
          // If storage options API fails, fallback to simple IDs
          if (isMounted) {
            setAvailableStorages(
              phoneStorageIds.map((id) => ({ storage_id: id, storage_name: `Option #${id}` }))
            );
            setSelectedStorageId(phoneStorageIds[0]);
          }
        });
    } else if (Array.isArray(phone?.storage_options) && phone.storage_options.length > 0) {
      setAvailableStorages(phone.storage_options);
      setSelectedStorageId(phone.storage_options[0]?.storage_id || 1);
    } else if (Array.isArray(phone?.storage_names) && phone.storage_names.length > 0) {
      const derived = phone.storage_names.map((name, i) => ({
        storage_id: i + 1,
        storage_name: name,
      }));
      setAvailableStorages(derived);
      setSelectedStorageId(1);
    }

    return () => {
      isMounted = false;
    };
  }, [phoneId]);

  // Set initial colour if passed and in stock, or default to first in-stock colour
  useEffect(() => {
    if (phone?.selectedColor && colourOptions.includes(phone.selectedColor)) {
      setSelectedColour(phone.selectedColor);
    } else if (colourOptions.length > 0) {
      setSelectedColour(colourOptions[0]);
    } else {
      setSelectedColour('');
    }
  }, [phoneId, phone?.selectedColor, colourOptions]);

  // Filter storages: If a storage was already selected when clicking Reserve, ONLY show that selected storage
  const displayedStorages = React.useMemo(() => {
    // 1. If phone has a pre-selected storage from detail page
    if (phone?.selectedStorage || phone?.selectedStorageId) {
      const targetName = phone?.selectedStorage ? String(phone.selectedStorage).trim().toLowerCase() : '';
      const targetCap = targetName ? targetName.replace(/\D/g, '') : '';

      const matched = availableStorages.find((s) => {
        if (phone?.selectedStorageId && Number(s.storage_id) === Number(phone.selectedStorageId)) {
          return true;
        }
        const sName = (s.storage_name || '').trim().toLowerCase();
        const sCap = String(s.capacity_gb || '').trim();
        return (
          (targetName && (sName === targetName || sName.replace(/\s+/g, '') === targetName.replace(/\s+/g, ''))) ||
          (targetCap && (sCap === targetCap || sName.replace(/\s+/g, '') === `${targetCap}gb`))
        );
      });

      if (matched) {
        return [matched];
      }

      if (phone?.selectedStorageId && availableStorages.length > 0) {
        const byId = availableStorages.find((s) => Number(s.storage_id) === Number(phone.selectedStorageId));
        if (byId) return [byId];
      }

      if (phone?.selectedStorage) {
        return [
          {
            storage_id: phone.selectedStorageId || (targetCap ? Number(targetCap) : 1),
            storage_name: phone.selectedStorage,
            capacity_gb: targetCap ? Number(targetCap) : undefined,
          },
        ];
      }
    }

    if (!availableStorages || availableStorages.length === 0) return [];

    if (
      activeColorObj?.storage_quantities &&
      typeof activeColorObj.storage_quantities === 'object' &&
      Object.keys(activeColorObj.storage_quantities).length > 0
    ) {
      const filtered = availableStorages.filter((storage) => {
        const name = storage.storage_name;
        const capName = storage.capacity_gb ? `${storage.capacity_gb}GB` : '';
        const qty =
          activeColorObj.storage_quantities[name] ??
          (capName ? activeColorObj.storage_quantities[capName] : undefined);
        if (qty !== undefined) {
          return Number(qty) > 0;
        }
        return true;
      });
      return filtered.length > 0 ? filtered : availableStorages;
    }

    return availableStorages;
  }, [availableStorages, activeColorObj, phone?.selectedStorage, phone?.selectedStorageId]);

  // Keep selectedStorageId pointing to the displayed storage
  useEffect(() => {
    if (displayedStorages.length > 0) {
      const currentExists = displayedStorages.some(
        (s) => Number(s.storage_id) === Number(selectedStorageId)
      );
      if (!currentExists) {
        setSelectedStorageId(Number(displayedStorages[0].storage_id));
      }
    }
  }, [displayedStorages, selectedStorageId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isPhoneSoldOut) {
      setError('This device is currently out of stock and cannot be reserved.');
      return;
    }

    // Validation matching backend reservationValidation.js
    const cleanName = formData.customer_name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }
    if (cleanName.length > 150) {
      setError('Full name cannot exceed 150 characters.');
      return;
    }

    const cleanPhone = formData.phone_number.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number containing 7 to 15 digits.');
      return;
    }

    const cleanEmail = formData.email.trim();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (cleanEmail.length > 255 || !emailRegex.test(cleanEmail)) {
        setError('Please provide a valid email address.');
        return;
      }
    }

    if (!formData.preferred_collection_date) {
      setError('Please choose a preferred collection date.');
      return;
    }

    if (formData.preferred_collection_date < todayStr) {
      setError('Preferred collection date cannot be in the past.');
      return;
    }

    const cleanNote = formData.customer_note.trim();
    if (cleanNote.length > 2000) {
      setError('Customer note cannot exceed 2000 characters.');
      return;
    }

    setLoading(true);

    try {
      // Build selected_options strictly adhering to API schema
      const selected_options = {};
      if (selectedStorageId) {
        selected_options.storage_id = Number(selectedStorageId);
      }
      if (selectedColour && selectedColour.trim().length > 0) {
        selected_options.colour = selectedColour.trim();
      }

      const hasDeliveryDetails = Boolean(
        deliveryData.address.trim() ||
        deliveryData.city.trim() ||
        deliveryData.postal_code.trim() ||
        deliveryData.delivery_phone.trim() ||
        deliveryData.delivery_notes.trim()
      );

      const payload = {
        customer_name: cleanName,
        phone_number: cleanPhone,
        email: cleanEmail || undefined,
        phone_id: Number(phoneId),
        ...(Object.keys(selected_options).length > 0 ? { selected_options } : {}),
        ...(hasDeliveryDetails
          ? {
              delivery_details: {
                address: deliveryData.address.trim() || null,
                city: deliveryData.city.trim() || null,
                postal_code: deliveryData.postal_code.trim() || null,
                delivery_phone: deliveryData.delivery_phone.trim() || null,
                delivery_notes: deliveryData.delivery_notes.trim() || null,
              },
            }
          : {}),
        preferred_collection_date: formData.preferred_collection_date,
        customer_note: cleanNote || undefined,
      };

      const res = await createReservation(payload);
      setSubmittedData({
        ...payload,
        delivery_details: payload.delivery_details || null,
        storageName: displayedStorages.find((s) => Number(s.storage_id) === Number(selectedStorageId))?.storage_name || availableStorages.find((s) => Number(s.storage_id) === Number(selectedStorageId))?.storage_name,
        reservation_id: res?.data?.data?.reservation_id || res?.data?.reservation_id,
      });
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError('Too many reservation requests. Please wait a few minutes and try again.');
      } else {
        setError(err.message || 'Failed to submit reservation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[720px] md:w-[860px] lg:w-[940px] max-w-full bg-[#0A0F1E] border-l border-white/10 shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header / Selected Device Card */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-[#0A0F1E]/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between gap-3.5 sm:gap-4">
            {/* Phone Summary Info */}
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] md:w-[64px] md:h-[64px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-black/80 border border-white/15 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/70 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] pointer-events-none" />
                {activePhonePhoto ? (
                  <img
                    src={activePhonePhoto}
                    alt={phone?.name}
                    className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-[10px] text-theme-textMuted font-mono">SK LABA</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                {/* Brand & Condition */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    {phone?.brand_name || 'Smartphone'}
                  </span>
                  {phone?.phone_condition && (
                    <span className="px-2 py-0.5 rounded-md border border-white/20 bg-white/[0.06] text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-slate-300">
                      {phone.phone_condition}
                    </span>
                  )}
                </div>

                {/* Device Title */}
                <h3 className="text-sm sm:text-base font-semibold text-white truncate tracking-tight leading-snug">
                  {phone?.name}
                </h3>

                {/* Price & Variant Specs */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    ${Number(phone?.effectivePrice || phone?.price || 0).toLocaleString()}
                  </span>

                  {(selectedColour || phone?.selectedStorage || displayedStorages[0]?.storage_name) && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-neutral-600">•</span>
                      {selectedColour && (
                        <span className="text-slate-300 font-normal">
                          {selectedColour}
                        </span>
                      )}
                      {(phone?.selectedStorage || displayedStorages[0]?.storage_name) && (
                        <>
                          <span className="text-neutral-600">/</span>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-white font-mono text-[10px] font-medium">
                            {phone?.selectedStorage || displayedStorages[0]?.storage_name}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body & Footer */}
        {success ? (
          <div className="overflow-y-auto px-5 sm:px-6 py-8 flex-1 flex flex-col justify-center">
            <div className="max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300 w-full">
              <div className="space-y-1.5">
                <h3 className="text-xl font-normal text-white tracking-tight">Reservation Submitted</h3>
                {submittedData?.reservation_id && (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300 font-normal">
                    Ref ID: {submittedData.reservation_id}
                  </span>
                )}
              </div>

              {/* Exact SRS Confirmation Card */}
              <div className="p-5 sm:p-6 border border-white/15 bg-black/40 rounded-2xl text-left space-y-4 shadow-xl shadow-black/40">
                <p className="text-sm sm:text-base text-slate-200 font-normal text-center pb-3 border-b border-white/10">
                  &ldquo;Your request is received. The shop will confirm.&rdquo;
                </p>
                <div className="text-xs sm:text-sm divide-y divide-white/[0.07]">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-normal">Reserved Item:</span>
                    <span className="text-white font-normal text-right max-w-[60%] truncate">{phone?.name}</span>
                  </div>
                  {submittedData?.storageName && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-slate-400 font-normal">Storage:</span>
                      <span className="text-white font-normal">{submittedData.storageName}</span>
                    </div>
                  )}
                  {submittedData?.selected_options?.colour && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-slate-400 font-normal">Colour:</span>
                      <span className="text-white font-normal">{submittedData.selected_options.colour}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-normal">Preferred Date:</span>
                    <span className="text-white font-normal">{submittedData?.preferred_collection_date}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-normal">Contact:</span>
                    <span className="text-white font-mono font-normal">{submittedData?.phone_number}</span>
                  </div>
                  {submittedData?.delivery_details?.address && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-slate-400 font-normal">Delivery Address:</span>
                      <span className="text-white font-normal text-right max-w-[60%] truncate">
                        {submittedData.delivery_details.address}
                        {submittedData.delivery_details.city ? `, ${submittedData.delivery_details.city}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-normal">
                Our staff will review your reservation and contact you via phone/WhatsApp to confirm collection time.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-6 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 text-white text-xs font-normal shadow-sm transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Fields Content */}
            <div className="overflow-y-auto px-5 sm:px-6 pt-3.5 pb-3 sm:pt-4 sm:pb-3 flex-1 min-h-0">
              {isPhoneSoldOut && (
                <div className="p-2.5 mb-2.5 border border-amber-500/30 bg-amber-950/20 rounded-xl text-xs text-amber-300 flex items-start gap-2 animate-in fade-in font-normal shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>This phone is currently out of stock. You cannot submit a reservation request at this time.</span>
                </div>
              )}

              {error && (
                <div className="p-2.5 mb-2.5 border border-red-500/30 bg-red-950/20 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-in fade-in font-normal shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Responsive 2-Column Layout: Left (Customer & Date), Right (Delivery Details) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* ── Left Column: Customer & Collection Info ── */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                      Customer & Collection
                    </span>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      placeholder="e.g. John Doe"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone / WhatsApp Number <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={25}
                      placeholder="e.g. +94 77 123 4567"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                    />
                  </div>

                  {/* Email Address (Optional) */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address <span className="text-theme-textMuted text-[11px] font-normal">(Optional)</span></span>
                    </label>
                    <input
                      type="email"
                      maxLength={255}
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                    />
                  </div>

                  {/* Preferred Collection Date */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Preferred Collection Date <span className="text-red-400">*</span></span>
                      </span>
                      <span className="text-[10px] text-theme-textMuted font-normal">DD-MM-YYYY</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={formData.preferred_collection_date}
                      onChange={(e) =>
                        setFormData({ ...formData, preferred_collection_date: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all [color-scheme:dark] font-normal min-w-0"
                    />
                  </div>

                  {/* Customer Note */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Note to Shop <span className="text-theme-textMuted text-[11px] font-normal">(Optional)</span></span>
                      </label>
                      <span className="text-[10px] text-theme-textMuted font-normal">
                        {formData.customer_note.length}/2000
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      placeholder="Any special requests or instructions..."
                      value={formData.customer_note}
                      onChange={(e) => setFormData({ ...formData, customer_note: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all resize-none font-normal"
                    />
                  </div>
                </div>

                {/* ── Right Column: Delivery Details ── */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="pb-1.5 border-b border-white/10">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                      Delivery Details
                    </span>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delivery Address <span className="text-theme-textMuted text-[11px] font-normal">(Optional)</span></span>
                    </label>
                    <input
                      type="text"
                      maxLength={255}
                      placeholder="House / Building No, Street Name"
                      value={deliveryData.address}
                      onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                    />
                  </div>

                  {/* City & Postal Code (in 2 sub-cols) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>City / Town</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        placeholder="e.g. Colombo, Kandy"
                        value={deliveryData.city}
                        onChange={(e) => setDeliveryData({ ...deliveryData, city: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-200 mb-1">
                        <span>Postal Code <span className="text-theme-textMuted text-[10px] font-normal">(Optional)</span></span>
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        placeholder="e.g. 00100"
                        value={deliveryData.postal_code}
                        onChange={(e) => setDeliveryData({ ...deliveryData, postal_code: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                      />
                    </div>
                  </div>

                  {/* Alternate / Delivery Contact Number */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Alternate / Delivery Contact <span className="text-theme-textMuted text-[11px] font-normal">(Optional)</span></span>
                    </label>
                    <input
                      type="tel"
                      maxLength={25}
                      placeholder="Secondary contact phone for courier"
                      value={deliveryData.delivery_phone}
                      onChange={(e) => setDeliveryData({ ...deliveryData, delivery_phone: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 sm:py-2 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all font-normal"
                    />
                  </div>

                  {/* Delivery Instructions / Landmark */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Delivery Instructions <span className="text-theme-textMuted text-[11px] font-normal">(Optional)</span></span>
                      </label>
                      <span className="text-[10px] text-theme-textMuted font-normal">
                        {deliveryData.delivery_notes.length}/500
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      placeholder="e.g. Nearby landmark, preferred delivery time window..."
                      value={deliveryData.delivery_notes}
                      onChange={(e) => setDeliveryData({ ...deliveryData, delivery_notes: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-lg px-3.5 py-1.5 text-base sm:text-[13px] text-white placeholder-neutral-500 focus:outline-none transition-all resize-none font-normal"
                    />
                  </div>

                  {/* Delivery Charges Information */}
                  <div className="rounded-xl bg-sky-950/30 border border-sky-500/25 p-3 sm:p-3.5 space-y-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sky-400 font-medium text-xs">
                      <Truck className="w-4 h-4 shrink-0 text-sky-400" />
                      <span className="tracking-wide">Delivery Charges</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      Payment will be completed after contacting the customer through WhatsApp.
                    </p>
                    <p className="text-xs text-emerald-400 leading-relaxed font-normal flex items-start gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>Free delivery within South Korea. Shipping costs to Sri Lanka depend on the price of the phone.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Bottom Submit Button Bar */}
            <div className="px-5 sm:px-6 pt-3 pb-11 sm:pb-12 border-t border-white/10 bg-[#0A0F1E] shrink-0">
              <button
                type="submit"
                disabled={loading || isPhoneSoldOut}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Reservation...</span>
                  </>
                ) : isPhoneSoldOut ? (
                  <span>Out of Stock</span>
                ) : (
                  <span>Confirm Reservation Request</span>
                )}
              </button>
              <p className="text-center text-[10px] text-theme-textMuted mt-2 font-normal">
                No payment required now. The shop will contact you to verify and hold the phone.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
