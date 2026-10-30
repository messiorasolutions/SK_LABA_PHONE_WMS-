import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { createReservation } from '../../services/reservationService';

export default function ReservationModal({ phone, onClose }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    preferred_collection_date: '',
    customer_note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const phoneId = phone?.phone_id || phone?.id;

  // Minimum date is today
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation matching backend reservationValidation.js
    if (!formData.customer_name.trim() || formData.customer_name.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }

    const digitsOnly = formData.phone_number.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number containing 7 to 15 digits.');
      return;
    }

    if (!formData.preferred_collection_date) {
      setError('Please choose a preferred collection date.');
      return;
    }

    setLoading(true);

    try {
      const selectedOptions = {
        color: phone?.selectedColor || 'Default',
        storage: phone?.selectedStorage || 'Standard',
      };

      const payload = {
        customer_name: formData.customer_name.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim() || undefined,
        phone_id: Number(phoneId),
        selected_options: selectedOptions,
        preferred_collection_date: formData.preferred_collection_date,
        customer_note: formData.customer_note.trim() || undefined,
      };

      await createReservation(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop (left area) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[500px] md:w-[540px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-white">Reserve Phone</h2>
            <p className="text-xs text-theme-textMuted">Hold item for in-store pickup</p>
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
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-white">Reservation Submitted</h3>
              {/* SRS C-09 exact wording: 'Your request is received. The shop will confirm.' */}
              <div className="p-4 border border-theme-border rounded-lg bg-transparent">
                <p className="text-sm text-white font-medium">
                  Your request is received. The shop will confirm.
                </p>
                <p className="text-xs text-theme-textSecondary mt-2">
                  Reserved Item: <span className="text-white font-medium">{phone?.name}</span>
                  <br />
                  Preferred Collection:{' '}
                  <span className="text-white font-medium">{formData.preferred_collection_date}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Phone Summary Banner */}
              {phone && (
                <div className="flex items-center gap-3 bg-transparent border border-theme-border rounded-lg p-3">
                  <div className="w-12 h-12 bg-[#080D1A] rounded p-1 flex items-center justify-center shrink-0">
                    {phone.photos?.[0] || phone.main_photo ? (
                      <img
                        src={phone.photos?.[0] || phone.main_photo}
                        alt={phone.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-theme-textMuted">SK LABA</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-normal uppercase tracking-wider text-theme-textMuted">
                      Reserving
                    </span>
                    <h4 className="text-xs font-medium text-white truncate">{phone.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-theme-textSecondary">
                      <span>${Number(phone.effectivePrice || phone.price || 0).toLocaleString()}</span>
                      {phone.selectedColor && (
                        <span>• Color: {phone.selectedColor}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Namal Rajapaksa"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Phone / WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +82 10-5892-7482"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Email Address <span className="text-theme-textMuted">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              {/* Preferred Collection Date */}
              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5 flex items-center justify-between">
                  <span>Preferred Collection Date <span className="text-red-400">*</span></span>
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
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Note to Shop <span className="text-theme-textMuted">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, preferred collection time, etc."
                  value={formData.customer_note}
                  onChange={(e) => setFormData({ ...formData, customer_note: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer text-center"
                >
                  {loading ? 'Submitting Reservation...' : 'Confirm Reservation Request'}
                </button>
                <p className="text-center text-[11px] text-theme-textMuted mt-2 font-normal">
                  No payment required now. Stock will be held for pickup confirmation.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
