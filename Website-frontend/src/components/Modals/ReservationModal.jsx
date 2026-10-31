import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ShoppingBag, HardDrive, Palette, Calendar, Phone, Mail, User, FileText } from 'lucide-react';
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

  // Parse colour options from phone
  let colourOptions = [];
  if (Array.isArray(phone?.colour_options)) {
    colourOptions = phone.colour_options.map((c) => (typeof c === 'string' ? c : c?.name || c?.colour || String(c)));
  } else if (typeof phone?.colour_options === 'string') {
    try {
      const parsed = JSON.parse(phone.colour_options);
      if (Array.isArray(parsed)) {
        colourOptions = parsed.map((c) => (typeof c === 'string' ? c : c?.name || c?.colour || String(c)));
      } else {
        colourOptions = phone.colour_options.split(',').map((c) => c.trim()).filter(Boolean);
      }
    } catch {
      colourOptions = phone.colour_options.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }

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
            setAvailableStorages(matched.length > 0 ? matched : allOptions);
            if (phone?.selectedStorageId && phoneStorageIds.includes(Number(phone.selectedStorageId))) {
              setSelectedStorageId(Number(phone.selectedStorageId));
            } else if (matched.length > 0) {
              setSelectedStorageId(Number(matched[0].storage_id));
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
    }

    // Set initial colour if passed or default to first
    if (phone?.selectedColor && colourOptions.includes(phone.selectedColor)) {
      setSelectedColour(phone.selectedColor);
    } else if (colourOptions.length > 0) {
      setSelectedColour(colourOptions[0]);
    }

    return () => {
      isMounted = false;
    };
  }, [phoneId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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

      const payload = {
        customer_name: cleanName,
        phone_number: cleanPhone,
        email: cleanEmail || undefined,
        phone_id: Number(phoneId),
        ...(Object.keys(selected_options).length > 0 ? { selected_options } : {}),
        preferred_collection_date: formData.preferred_collection_date,
        customer_note: cleanNote || undefined,
      };

      const res = await createReservation(payload);
      setSubmittedData({
        ...payload,
        storageName: availableStorages.find((s) => Number(s.storage_id) === Number(selectedStorageId))?.storage_name,
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
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[500px] md:w-[540px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Reserve Phone</h2>
              <p className="text-[11px] text-theme-textMuted">Hold item for in-store pickup (SRS C-09)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">Reservation Submitted</h3>
                {submittedData?.reservation_id && (
                  <span className="text-xs font-mono text-theme-textMuted mt-0.5 block">
                    Ref ID: #{submittedData.reservation_id}
                  </span>
                )}
              </div>

              {/* Exact SRS Confirmation Copy */}
              <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl text-left space-y-2">
                <p className="text-sm text-emerald-300 font-semibold text-center">
                  &ldquo;Your request is received. The shop will confirm.&rdquo;
                </p>
                <div className="pt-2 border-t border-emerald-500/20 text-xs text-theme-textSecondary space-y-1">
                  <div className="flex justify-between">
                    <span className="text-theme-textMuted">Reserved Item:</span>
                    <span className="text-white font-medium">{phone?.name}</span>
                  </div>
                  {submittedData?.storageName && (
                    <div className="flex justify-between">
                      <span className="text-theme-textMuted">Storage:</span>
                      <span className="text-white font-medium">{submittedData.storageName}</span>
                    </div>
                  )}
                  {submittedData?.selected_options?.colour && (
                    <div className="flex justify-between">
                      <span className="text-theme-textMuted">Colour:</span>
                      <span className="text-white font-medium">{submittedData.selected_options.colour}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-theme-textMuted">Preferred Date:</span>
                    <span className="text-white font-medium">{submittedData?.preferred_collection_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-textMuted">Contact:</span>
                    <span className="text-white font-mono">{submittedData?.phone_number}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-theme-textMuted leading-relaxed">
                Our staff will review your reservation and contact you via phone/WhatsApp to confirm collection time.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Phone Summary Banner */}
              {phone && (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-theme-border rounded-xl p-3">
                  <div className="w-14 h-14 bg-[#080D1A] rounded-lg p-1.5 flex items-center justify-center shrink-0 border border-white/5">
                    {phone.photos?.[0] || phone.main_photo ? (
                      <img
                        src={phone.photos?.[0] || phone.main_photo}
                        alt={phone.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-theme-textMuted font-mono">SK LABA</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-textMuted block">
                      {phone.brand_name || 'Selected Device'}
                    </span>
                    <h4 className="text-xs font-semibold text-white truncate">{phone.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-theme-textSecondary">
                      <span className="font-semibold text-blue-400">
                        ${Number(phone.effectivePrice || phone.price || 0).toLocaleString()}
                      </span>
                      {phone.phone_condition && (
                        <span className="text-theme-textMuted">• {phone.phone_condition}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Colour Selection (if phone has colour options) */}
              {colourOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-theme-textMuted" />
                    <span>Choose Colour</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {colourOptions.map((colour) => {
                      const isSelected = selectedColour === colour;
                      return (
                        <button
                          key={colour}
                          type="button"
                          onClick={() => setSelectedColour(colour)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                              : 'bg-white/[0.02] border-theme-border text-theme-textSecondary hover:text-white hover:border-white/20'
                          }`}
                        >
                          {colour}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Storage Selection (if phone has storage options) */}
              {availableStorages.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-theme-textMuted" />
                    <span>Choose Storage</span>
                  </label>
                  <select
                    value={selectedStorageId || ''}
                    onChange={(e) => setSelectedStorageId(Number(e.target.value))}
                    className="w-full bg-[#080D1A] border border-theme-border hover:border-white/20 focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none transition-all cursor-pointer"
                  >
                    {availableStorages.map((storage) => (
                      <option key={storage.storage_id} value={storage.storage_id}>
                        {storage.storage_name || `${storage.capacity_gb} GB`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-theme-textMuted" />
                  <span>Full Name <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Perera"
                  maxLength={150}
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-theme-border hover:border-white/20 focus:border-blue-500 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-theme-textMuted" />
                  <span>Phone / WhatsApp Number <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +82 10-1234-5678 or +94 77 123 4567"
                  maxLength={25}
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-white/[0.02] border border-theme-border hover:border-white/20 focus:border-blue-500 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
                <span className="text-[10px] text-theme-textMuted mt-1 block">
                  7 to 15 digits. We will reach you to confirm your reservation.
                </span>
              </div>

              {/* Email Address (Optional) */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-theme-textMuted" />
                  <span>Email Address <span className="text-theme-textMuted text-[10px]">(Optional)</span></span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  maxLength={255}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/[0.02] border border-theme-border hover:border-white/20 focus:border-blue-500 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              {/* Preferred Collection Date */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-theme-textMuted" />
                    <span>Preferred Collection Date <span className="text-red-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-theme-textMuted">YYYY-MM-DD</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={formData.preferred_collection_date}
                  onChange={(e) =>
                    setFormData({ ...formData, preferred_collection_date: e.target.value })
                  }
                  className="w-full bg-white/[0.02] border border-theme-border hover:border-white/20 focus:border-blue-500 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>

              {/* Customer Note */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-theme-textSecondary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-theme-textMuted" />
                    <span>Note to Shop <span className="text-theme-textMuted text-[10px]">(Optional)</span></span>
                  </label>
                  <span className="text-[10px] text-theme-textMuted">
                    {formData.customer_note.length}/2000
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={2000}
                  placeholder="Special requests, preferred collection hours, etc."
                  value={formData.customer_note}
                  onChange={(e) => setFormData({ ...formData, customer_note: e.target.value })}
                  className="w-full bg-white/[0.02] border border-theme-border hover:border-white/20 focus:border-blue-500 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Reservation...</span>
                    </>
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
    </div>
  );
}
