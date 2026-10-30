import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, MessageCircle, Send } from 'lucide-react';
import { createInquiry } from '../../services/inquiryService';
import { STORE_INFO } from '../../constants/siteConfig';

export default function InquiryModal({ phone, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    message: phone ? `Hi, I am interested in ${phone.name} and would like more information.` : '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const phoneId = phone?.phone_id || phone?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation matching backend inquiryValidation.js & API Documentation
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }
    if (trimmedName.length > 150) {
      setError('Name cannot exceed 150 characters.');
      return;
    }

    const digitsOnly = formData.phone_number.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number containing 7 to 15 digits.');
      return;
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage || trimmedMessage.length < 5) {
      setError('Please enter a message of at least 5 characters.');
      return;
    }
    if (trimmedMessage.length > 3000) {
      setError('Message cannot exceed 3000 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: trimmedName,
        phone_number: formData.phone_number.trim(),
        message: trimmedMessage,
        phone_id: phoneId ? Number(phoneId) : null,
      };

      await createInquiry(payload);
      setSuccess(true);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit inquiry. Please try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const cleanNumber = (STORE_INFO.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello SK LABA PHONE! I have an inquiry about ${phone ? phone.name : 'smartphones'}.\nName: ${formData.name || 'Customer'}`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
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
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[480px] md:w-[520px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-sky-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {phone ? 'Product Inquiry' : 'Customer Inquiry'}
              </h2>
              <p className="text-xs text-theme-textMuted">We typically reply within minutes</p>
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
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Inquiry Received!</h3>
              <p className="text-xs text-theme-textSecondary max-w-xs mx-auto leading-relaxed">
                Thank you for contacting SK LABA PHONE. Our team has received your message regarding{' '}
                <span className="text-white font-semibold">{phone?.name || 'our products'}</span> and will reach out to you shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-theme-accent hover:bg-theme-accentHover text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Phone Summary Banner */}
              {phone ? (
                <div className="flex items-center gap-3 bg-theme-surface/50 border border-theme-border rounded-xl p-3">
                  <div className="w-14 h-14 bg-[#080D1A] rounded-lg p-1.5 flex items-center justify-center shrink-0 border border-theme-border">
                    {phone.photos?.[0] || phone.main_photo ? (
                      <img
                        src={phone.photos?.[0] || phone.main_photo}
                        alt={phone.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-theme-textMuted font-mono">PHONE</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-accent">
                      Inquiring About
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{phone.name}</h4>
                    <span className="text-xs font-semibold text-sky-400">
                      ${Number(phone.price || phone.regular_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sky-300 text-xs">
                  Have a question about our stock, islandwide delivery, or custom orders? Send us a message below!
                </div>
              )}

              {error && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5">
                  Your Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Kamal Perera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-theme-input/70 border border-theme-border hover:border-theme-borderMedium focus:border-theme-accent rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-theme-textSecondary mb-1.5">
                  Phone / WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={25}
                  placeholder="e.g. +94 77 123 4567 or +82 10 1234 5678"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-theme-input/70 border border-theme-border hover:border-theme-borderMedium focus:border-theme-accent rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all shadow-inner font-mono"
                />
                <span className="text-[10px] text-theme-textMuted mt-1 block">
                  Must be 7 to 15 digits (spaces, dashes, or + are allowed)
                </span>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-theme-textSecondary">
                    Message / Question <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-theme-textMuted">
                    {formData.message.length}/3000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  placeholder="Ask about warranty, color options, trade-in, or payment methods..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-theme-input/70 border border-theme-border hover:border-theme-borderMedium focus:border-theme-accent rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-theme-accent hover:bg-theme-accentHover text-white text-xs font-semibold transition-all cursor-pointer text-center shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {loading ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                </button>

                <div className="flex items-center justify-between text-xs text-theme-textMuted pt-1 border-t border-theme-border/60">
                  <span>Need an instant reply?</span>
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
