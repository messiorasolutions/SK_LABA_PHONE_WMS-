import React, { useState } from 'react';
import { X, AlertCircle, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { createBackInStockRequest } from '../../services/backInStockService';
import { STORE_INFO } from '../../constants/siteConfig';

export default function BackInStockModal({ phone, onClose }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const phoneId = phone?.phone_id || phone?.id;

  const isPhoneSoldOut =
    (phone?.availability || '').toUpperCase() === 'SOLD_OUT' ||
    Number(phone?.current_stock ?? phone?.stock ?? 0) <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.customer_name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Name cannot exceed 100 characters.');
      return;
    }

    const digitsOnly = formData.phone_number.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone or WhatsApp number (7 to 15 digits).');
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    const trimmedNotes = formData.notes.trim();
    if (trimmedNotes.length > 500) {
      setError('Notes cannot exceed 500 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone_id: Number(phoneId),
        customer_name: trimmedName,
        phone_number: formData.phone_number.trim(),
        email: trimmedEmail || undefined,
        notes: trimmedNotes || undefined,
      };

      const res = await createBackInStockRequest(payload);
      setSubmittedData(res.data?.data || payload);
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      if (status === 429) {
        setError('Too many requests submitted from your network. Please try again after 15 minutes.');
      } else if (status === 400 && apiMsg) {
        setError(apiMsg);
      } else {
        setError(apiMsg || err.message || 'Failed to submit notification request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const whatsappPhone = STORE_INFO.whatsapp || '+821058927482';
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hi SK LABA PHONE, I would like to inquire about stock for ${phone?.name || 'this phone'}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[480px] md:w-[520px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Back-in-Stock Alert</h2>
            <p className="text-[11px] text-theme-textMuted">Get notified instantly when stock arrives</p>
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
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
          {success ? (
            <div className="py-8 sm:py-10 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white tracking-tight">Notification Alert Set!</h3>
                {submittedData?.request_id && (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                    Ref ID: {submittedData.request_id}
                  </span>
                )}
              </div>

              {/* Confirmation Details Card */}
              <div className="p-5 sm:p-6 border border-emerald-500/25 bg-emerald-500/[0.04] rounded-2xl text-left space-y-4 shadow-xl shadow-black/40">
                <p className="text-sm sm:text-base text-emerald-300 font-semibold text-center pb-3 border-b border-emerald-500/20">
                  &ldquo;You will be notified when this phone is back in stock.&rdquo;
                </p>

                <div className="text-xs sm:text-sm divide-y divide-white/[0.07]">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-medium">Device:</span>
                    <span className="text-white font-semibold text-right max-w-[60%] truncate">{phone?.name}</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-medium">Customer:</span>
                    <span className="text-white font-semibold">{submittedData?.customer_name}</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-slate-400 font-medium">Contact:</span>
                    <span className="text-white font-mono font-semibold">{submittedData?.phone_number}</span>
                  </div>

                  {submittedData?.notes && (
                    <div className="flex items-start justify-between py-2.5">
                      <span className="text-slate-400 font-medium">Notes:</span>
                      <span className="text-white text-right max-w-[60%] text-xs font-normal">{submittedData.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                Our sales team will contact you via WhatsApp or Phone as soon as fresh warehouse stock is checked in.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-6 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 text-white text-sm font-medium shadow-sm transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sold Out Device Summary Card */}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {isPhoneSoldOut ? 'Sold Out' : 'Option Out of Stock'}
                      </span>
                      {phone.brand_name && (
                        <span className="text-[10px] text-theme-textMuted uppercase font-medium">
                          {phone.brand_name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate mt-1">{phone.name}</h4>
                    {(phone.color_name || phone.storage_name) && (
                      <p className="text-[11px] text-sky-400 mt-0.5">
                        Selected: {[phone.storage_name, phone.color_name].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 border border-rose-500/30 bg-rose-500/10 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold"
                    >
                      Ask on WhatsApp instead &rarr;
                    </a>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-white/[0.03] border border-theme-border hover:border-white/20 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone / WhatsApp Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-white/[0.03] border border-theme-border hover:border-white/20 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/[0.03] border border-theme-border hover:border-white/20 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              {/* Specific Notes (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preference or Notes <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white/[0.03] border border-theme-border hover:border-white/20 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
                />
                <div className="text-right mt-1">
                  <span className="text-[10px] text-slate-500">
                    {formData.notes.length}/500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Notify Me When Available</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                By submitting, you agree to receive an SMS, Call, or WhatsApp alert as soon as this item is restocked. No deposit required.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
