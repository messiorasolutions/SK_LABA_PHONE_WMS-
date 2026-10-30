import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import phoneService from '../../services/phoneService';

export default function BackInStockModal({ phone, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const phoneId = phone?.phone_id || phone?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }

    const digitsOnly = formData.phone_number.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number (7 to 15 digits).');
      return;
    }

    setLoading(true);

    try {
      await phoneService.requestBackInStock({
        phone_id: Number(phoneId),
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim() || undefined,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit notification request.');
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
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[450px] md:w-[480px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-white">Back in Stock Alert</h2>
            <p className="text-xs text-theme-textMuted">Get notified the moment it arrives</p>
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
              <h3 className="text-base font-medium text-white">Alert Registered</h3>
              <p className="text-xs text-theme-textSecondary max-w-xs mx-auto font-normal">
                You will be contacted via WhatsApp or phone as soon as new stock of{' '}
                <span className="text-white font-medium">{phone?.name}</span> is replenished in our store.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      Currently Sold Out
                    </span>
                    <h4 className="text-xs font-medium text-white truncate">{phone.name}</h4>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Your Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-theme-textSecondary mb-1.5">
                  Phone / WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +82 10-1234-5678"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.04] rounded-lg px-3.5 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
                />
              </div>

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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer text-center"
                >
                  {loading ? 'Registering Alert...' : 'Notify Me When Back in Stock'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
